package com.medapp.service;

import com.medapp.model.*;
import com.medapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medapp.model.PrescriptionTracking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RefillRequestService {
    private static final Logger logger = LoggerFactory.getLogger(RefillRequestService.class);

    @Autowired
    private RefillRequestRepository refillRequestRepository;
    
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    
    @Autowired
    private PatientRepository patientRepository;
    
    @Autowired
    private InventoryRepository inventoryRepository;
    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RefillRequestMedicineRepository refillRequestMedicineRepository;
    @Autowired
    private TrackingService trackingService;

    /**
     * Patient requests a refill for an approved prescription
     */
    public RefillRequest requestRefill(Long prescriptionId, String patientEmail,
                                       String line1, String line2, String city, String state,
                                       String pincode, String phone) {
        logger.info("Processing refill request for prescription {} by patient {}", prescriptionId, patientEmail);
        
        // Find patient
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        if (user.getRole() != User.Role.PATIENT) {
            throw new RuntimeException("Only patients can request refills");
        }
        
        Patient patient = (Patient) user;
        
        // Find prescription
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        
        // Validate prescription belongs to patient
        if (!prescription.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Prescription does not belong to this patient");
        }
        
        // Validate prescription is approved
        if (prescription.getStatus() != Prescription.Status.APPROVED) {
            throw new RuntimeException("Only approved prescriptions can be refilled");
        }
        
        // Check if there's already ANY refill request for this prescription (enforce one-time only)
        boolean hasExistingRequest = refillRequestRepository.existsByPrescriptionAndPatient(prescription, patient);
        
        if (hasExistingRequest) {
            throw new RuntimeException("You can only request a refill once per prescription");
        }
        
        // Validate delivery address
        if (line1 == null || line1.trim().isEmpty()) throw new RuntimeException("Address Line 1 is required");
        if (city == null || city.trim().isEmpty()) throw new RuntimeException("City is required");
        if (state == null || state.trim().isEmpty()) throw new RuntimeException("State is required");
        if (pincode == null || !pincode.matches("^\\d{6}$")) throw new RuntimeException("Pincode must be 6 digits");
        if (phone == null || !phone.matches("^\\d{10}$")) throw new RuntimeException("Phone must be 10 digits");

        // Create refill request
        RefillRequest refillRequest = new RefillRequest();
        refillRequest.setPrescription(prescription);
        refillRequest.setPatient(patient);
        refillRequest.setStatus(RefillRequest.Status.PENDING);
        refillRequest.setDeliveryAddressLine1(line1.trim());
        refillRequest.setDeliveryAddressLine2(line2 != null ? line2.trim() : null);
        refillRequest.setDeliveryCity(city.trim());
        refillRequest.setDeliveryState(state.trim());
        refillRequest.setDeliveryPincode(pincode);
        refillRequest.setDeliveryPhone(phone);
        
        RefillRequest saved = refillRequestRepository.save(refillRequest);
        logger.info("Refill request created successfully with ID: {}", saved.getId());
        try { trackingService.record(prescription.getId(), PrescriptionTracking.Status.REFILL_REQUESTED, null); } catch (Exception ignore) {}
        
        // TODO: Send notification to patient: "Refill request sent to pharmacist"
        
        return saved;
    }

    /**
     * Get all refill requests for a patient
     */
    public List<RefillRequest> getRefillRequestsForPatient(String patientEmail) {
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        if (user.getRole() != User.Role.PATIENT) {
            throw new RuntimeException("Only patients can view their refill requests");
        }
        
        Patient patient = (Patient) user;
        return refillRequestRepository.findByPatientOrderByRequestedAtDesc(patient);
    }

    /**
     * Get all pending refill requests (for pharmacists)
     */
    public List<RefillRequest> getPendingRefillRequests() {
        return refillRequestRepository.findPendingRefillRequests();
    }

    /**
     * Pharmacist approves a refill request
     */
    public RefillRequest approveRefillRequest(Long refillRequestId, String pharmacistEmail) {
        logger.info("Approving refill request {} by pharmacist {}", refillRequestId, pharmacistEmail);
        
        // Find pharmacist
        User user = userRepository.findByEmail(pharmacistEmail)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found"));
        
        if (user.getRole() != User.Role.PHARMACIST) {
            throw new RuntimeException("Only pharmacists can approve refill requests");
        }
        
        // Find refill request
        RefillRequest refillRequest = refillRequestRepository.findById(refillRequestId)
                .orElseThrow(() -> new RuntimeException("Refill request not found"));
        
        // Validate request is pending
        if (refillRequest.getStatus() != RefillRequest.Status.PENDING) {
            throw new RuntimeException("Only pending refill requests can be approved");
        }
        
        // Update status
        refillRequest.setStatus(RefillRequest.Status.APPROVED);
        refillRequest.setPharmacist(user);
        refillRequest.setActionedAt(LocalDateTime.now());
        
        RefillRequest saved = refillRequestRepository.save(refillRequest);
        logger.info("Refill request {} approved successfully", refillRequestId);
        
        // TODO: Send notification to patient: "Your refill request has been approved"
        try { trackingService.record(refillRequest.getPrescription().getId(), PrescriptionTracking.Status.REFILL_APPROVED, null); } catch (Exception ignore) {}
        
        return saved;
    }

    /**
     * Pharmacist rejects a refill request
     */
    public RefillRequest rejectRefillRequest(Long refillRequestId, String pharmacistEmail, String rejectionReason) {
        logger.info("Rejecting refill request {} by pharmacist {}", refillRequestId, pharmacistEmail);
        
        // Find pharmacist
        User user = userRepository.findByEmail(pharmacistEmail)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found"));
        
        if (user.getRole() != User.Role.PHARMACIST) {
            throw new RuntimeException("Only pharmacists can reject refill requests");
        }
        
        // Find refill request
        RefillRequest refillRequest = refillRequestRepository.findById(refillRequestId)
                .orElseThrow(() -> new RuntimeException("Refill request not found"));
        
        // Validate request is pending
        if (refillRequest.getStatus() != RefillRequest.Status.PENDING) {
            throw new RuntimeException("Only pending refill requests can be rejected");
        }
        
        // Update status
        refillRequest.setStatus(RefillRequest.Status.REJECTED);
        refillRequest.setPharmacist(user);
        refillRequest.setReasonForRejection(rejectionReason);
        refillRequest.setActionedAt(LocalDateTime.now());
        
        RefillRequest saved = refillRequestRepository.save(refillRequest);
        logger.info("Refill request {} rejected successfully", refillRequestId);
        
        // TODO: Send notification to patient: "Your refill request has been rejected"
        
        return saved;
    }

    /**
     * Pharmacist fills a refill request with medicines
     */
    public List<String> fillRefillRequest(Long refillRequestId, String pharmacistEmail, List<MedicineFillItem> items) {
        logger.info("Filling refill request {} by pharmacist {}", refillRequestId, pharmacistEmail);
        User pharmacist = userRepository.findByEmail(pharmacistEmail)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found"));
        if (pharmacist.getRole() != User.Role.PHARMACIST) {
            throw new RuntimeException("Only pharmacists can fill refill requests");
        }
        RefillRequest refillRequest = refillRequestRepository.findById(refillRequestId)
                .orElseThrow(() -> new RuntimeException("Refill request not found"));
        if (refillRequest.getStatus() != RefillRequest.Status.APPROVED) {
            throw new RuntimeException("Only approved refill requests can be filled");
        }
        // Validate and deduct inventory
        List<String> lowStockAlerts = new java.util.ArrayList<>();
        for (MedicineFillItem item : items) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineId()));
            Inventory inventory = inventoryRepository.findByMedicineIdAndPharmacistId(item.getMedicineId(), pharmacist.getId())
                .orElseThrow(() -> new RuntimeException("Inventory not found for medicine: " + medicine.getName()));
            if (inventory.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for medicine: " + medicine.getName());
            }
            inventory.setStockQuantity(inventory.getStockQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);
            // Insert into refill_request_medicines
            RefillRequestMedicine rrm = new RefillRequestMedicine();
            rrm.setRefillRequest(refillRequest);
            rrm.setMedicine(medicine);
            rrm.setQuantity(item.getQuantity());
            refillRequestMedicineRepository.save(rrm);
            // Check for low stock
            if (inventory.getStockQuantity() <= inventory.getLowStockThreshold()) {
                lowStockAlerts.add(medicine.getName());
            }
        }
        refillRequest.setStatus(RefillRequest.Status.FILLED);
        refillRequestRepository.save(refillRequest);
        return lowStockAlerts;
    }

    public static class MedicineFillItem {
        private Long medicineId;
        private int quantity;
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    /**
     * Get refill request by ID
     */
    public RefillRequest getRefillRequestById(Long id) {
        return refillRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refill request not found"));
    }

    public List<RefillRequest> getRefillRequestsByStatus(String status) {
        try {
            RefillRequest.Status enumStatus = RefillRequest.Status.valueOf(status);
            return refillRequestRepository.findByStatusOrderByRequestedAtDesc(enumStatus);
        } catch (Exception e) {
            logger.error("Invalid status value for refill request: {}", status);
            throw new RuntimeException("Invalid status value: " + status);
        }
    }
}