package com.medapp.service;

import com.medapp.model.Patient;
import com.medapp.model.Prescription;
import com.medapp.model.User;
import com.medapp.repository.PatientRepository;
import com.medapp.repository.PrescriptionRepository;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@Service
public class PrescriptionService {
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionService.class);
    private static final String UPLOAD_DIR = "uploads";

    @Value("${server.port:8080}")
    private String serverPort;

    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private UserRepository userRepository;

    public Prescription uploadPrescription(String patientEmail, MultipartFile file) throws IOException {
        logger.info("Uploading prescription for patient: {}", patientEmail);
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.PATIENT) {
            throw new RuntimeException("Only patients can upload prescriptions");
        }
        Patient patient = patientRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        // Validate file type
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }
        
        String ext = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
        if (!ext.matches("\\.(jpg|jpeg|png|pdf|gif)$")) {
            throw new RuntimeException("Invalid file type. Only JPG, PNG, PDF, and GIF files are allowed.");
        }
        
        // Generate unique filename
        String filename = "presc_" + System.currentTimeMillis() + ext;
        
        // Create upload directory in the current working directory
        Path uploadPath = Paths.get(System.getProperty("user.dir"), UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            logger.info("Created upload directory: {}", uploadPath);
        }
        
        // Also ensure the backend/uploads directory exists for compatibility
        Path backendUploadPath = Paths.get(System.getProperty("user.dir"), "backend", UPLOAD_DIR);
        if (!Files.exists(backendUploadPath)) {
            Files.createDirectories(backendUploadPath);
            logger.info("Created backend upload directory: {}", backendUploadPath);
        }
        
        Path filePath = uploadPath.resolve(filename);
        Path backendFilePath = backendUploadPath.resolve(filename);
        logger.info("Saving file to: {}", filePath);
        
        // Save the file to both locations for compatibility
        try {
            file.transferTo(filePath.toFile());
            // Also save a copy to backend/uploads for compatibility
            Files.copy(filePath, backendFilePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            logger.info("File saved successfully: {}", filename);
        } catch (IOException e) {
            logger.error("Failed to save file: {}", filename, e);
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }

        // Save prescription record with relative path for URL generation
        Prescription prescription = new Prescription();
        prescription.setPatient(patient);
        prescription.setImageUrl(filename); // Store just the filename, not the full path
        prescription.setStatus(Prescription.Status.PENDING);
        
        try {
            Prescription saved = prescriptionRepository.save(prescription);
            logger.info("Prescription uploaded successfully with ID: {} and filename: {}", saved.getId(), filename);
            return saved;
        } catch (Exception e) {
            // If database save fails, delete the uploaded file from both locations
            try {
                Files.deleteIfExists(filePath);
                Files.deleteIfExists(backendFilePath);
                logger.info("Deleted files after database save failure: {}", filename);
            } catch (IOException deleteException) {
                logger.warn("Failed to delete files after database save failure: {}", filename, deleteException);
            }
            throw new RuntimeException("Failed to save prescription record: " + e.getMessage());
        }
    }

    /**
     * Generate a public URL for a prescription file
     */
    public String generateFileUrl(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return null;
        }
        // Remove any absolute path and just use the filename
        String cleanFilename = filename.contains("/") ? filename.substring(filename.lastIndexOf("/") + 1) : filename;
        cleanFilename = cleanFilename.contains("\\") ? cleanFilename.substring(cleanFilename.lastIndexOf("\\") + 1) : cleanFilename;
        
        // Don't encode the filename as it might cause issues with file access
        // The filename should already be safe from the upload process
        
        // Use the new file controller endpoint for better reliability
        String fileUrl = String.format("http://localhost:%s/files/uploads/%s", serverPort, cleanFilename);
        logger.info("Generated file URL: {} for filename: {}", fileUrl, cleanFilename);
        return fileUrl;
    }

    /**
     * Generate a public URL for a prescription
     */
    public String generateFileUrl(Prescription prescription) {
        return generateFileUrl(prescription.getImageUrl());
    }

    public List<Prescription> getPrescriptionsForPatient(User user) {
        logger.info("Getting prescriptions for patient: {}", user.getEmail());
        if (user.getRole() != User.Role.PATIENT) {
            throw new RuntimeException("Only patients can access their prescriptions");
        }
        List<Prescription> prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(user.getId());
        logger.info("Found {} prescriptions for patient {}", prescriptions.size(), user.getEmail());
        return prescriptions;
    }

    public List<Prescription> getPendingPrescriptions() {
        logger.info("Getting all pending prescriptions");
        List<Prescription> prescriptions = prescriptionRepository.findByStatusOrderByCreatedAtAsc(Prescription.Status.PENDING);
        logger.info("Found {} pending prescriptions", prescriptions.size());
        return prescriptions;
    }

    public List<Prescription> getPrescriptionsForUser(User user) {
        logger.info("Getting prescriptions for user: {} with role: {}", user.getEmail(), user.getRole());
        if (user.getRole() == User.Role.PATIENT) {
            return getPrescriptionsForPatient(user);
        } else if (user.getRole() == User.Role.PHARMACIST) {
            return prescriptionRepository.findAllByOrderByCreatedAtDesc();
        } else {
            throw new RuntimeException("Unauthorized");
        }
    }

    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found with ID: " + id));
    }

    public Prescription updatePrescriptionStatus(Long id, Prescription.Status status, String notes) {
        logger.info("Updating prescription {} status to {} with notes: {}", id, status, notes);
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        prescription.setStatus(status);
        prescription.setNotes(notes);
        Prescription updated = prescriptionRepository.save(prescription);
        logger.info("Prescription {} status updated successfully", id);
        return updated;
    }
} 