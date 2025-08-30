package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.MedicineFillHistory;
import com.medapp.model.Patient;
import com.medapp.model.User;
import com.medapp.repository.PatientRepository;
import com.medapp.repository.UserRepository;
import com.medapp.repository.MedicineFillHistoryRepository;
import com.medapp.repository.RefillReminderRepository;
import com.medapp.model.RefillReminder;
import com.medapp.service.PrescriptionService;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HistoryController {
    @Autowired private MedicineFillHistoryRepository historyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private RefillReminderRepository reminderRepository;
    @Autowired private PrescriptionService prescriptionService;

    public static class FilledMedicineDTO {
        public String medicineName;
        public int timesPerDay;
        public int days;
        public int totalNeeded;
    }

    public static class MedicineFillHistoryDTO {
        public String id;
        public String prescriptionId;
        public String prescriptionImageUrl;
        public String patientId;
        public String patientName;
        public String pharmacistId;
        public String pharmacistName;
        public String fillDate;
        public String status;
        public String refillReminderDate; // nullable string
        public java.util.List<FilledMedicineDTO> filledMedicines;
    }

    @GetMapping("/patient/{id}")
    @PreAuthorize("hasRole('PATIENT') or hasRole('PHARMACIST') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineFillHistoryDTO>>> getPatientHistory(@PathVariable Long id) {
        Patient patient = patientRepository.findById(id).orElseThrow();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<MedicineFillHistoryDTO> dtos = historyRepository.findByPatientOrderByFillDateDesc(patient)
                .stream()
                .map(h -> {
                    MedicineFillHistoryDTO dto = new MedicineFillHistoryDTO();
                    dto.id = h.getId().toString();
                    dto.prescriptionId = h.getPrescription().getId().toString();
                    // Generate a public file URL so the frontend can open it directly
                    dto.prescriptionImageUrl = prescriptionService.generateFileUrl(h.getPrescription());
                    dto.patientId = h.getPatient().getId().toString();
                    dto.patientName = h.getPatient().getName();
                    dto.pharmacistId = h.getPharmacist() != null ? h.getPharmacist().getId().toString() : null;
                    dto.pharmacistName = h.getPharmacist() != null ? h.getPharmacist().getName() : "";
                    dto.fillDate = h.getFillDate() != null ? h.getFillDate().format(formatter) : null;
                    dto.status = h.getStatus().name();
                    // reminder
                    dto.refillReminderDate = reminderRepository
                            .findTopByPrescriptionAndPatientOrderByCreatedAtDesc(h.getPrescription(), h.getPatient())
                            .map(r -> r.getReminderDate().toString())
                            .orElse(null);
                    // medicines
                    dto.filledMedicines = h.getFilledMedicines().stream().map(fm -> {
                        FilledMedicineDTO m = new FilledMedicineDTO();
                        m.medicineName = fm.getMedicineName();
                        m.timesPerDay = fm.getTimesPerDay();
                        m.days = fm.getDays();
                        m.totalNeeded = fm.getTotalNeeded();
                        return m;
                    }).collect(Collectors.toList());
                    return dto;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "History retrieved"));
    }

    @GetMapping("/pharmacist/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MedicineFillHistoryDTO>>> getPharmacistHistory(@PathVariable Long id) {
        User pharmacist = userRepository.findById(id).orElseThrow();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<MedicineFillHistoryDTO> dtos = historyRepository.findByPharmacistOrderByFillDateDesc(pharmacist)
                .stream()
                .map(h -> {
                    MedicineFillHistoryDTO dto = new MedicineFillHistoryDTO();
                    dto.id = h.getId().toString();
                    dto.prescriptionId = h.getPrescription().getId().toString();
                    dto.prescriptionImageUrl = prescriptionService.generateFileUrl(h.getPrescription());
                    dto.patientId = h.getPatient().getId().toString();
                    dto.patientName = h.getPatient().getName();
                    dto.pharmacistId = h.getPharmacist() != null ? h.getPharmacist().getId().toString() : null;
                    dto.pharmacistName = h.getPharmacist() != null ? h.getPharmacist().getName() : "";
                    dto.fillDate = h.getFillDate() != null ? h.getFillDate().format(formatter) : null;
                    dto.status = h.getStatus().name();
                    dto.refillReminderDate = reminderRepository
                            .findTopByPrescriptionAndPatientOrderByCreatedAtDesc(h.getPrescription(), h.getPatient())
                            .map(r -> r.getReminderDate().toString())
                            .orElse(null);
                    dto.filledMedicines = h.getFilledMedicines().stream().map(fm -> {
                        FilledMedicineDTO m = new FilledMedicineDTO();
                        m.medicineName = fm.getMedicineName();
                        m.timesPerDay = fm.getTimesPerDay();
                        m.days = fm.getDays();
                        m.totalNeeded = fm.getTotalNeeded();
                        return m;
                    }).collect(Collectors.toList());
                    return dto;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "History retrieved"));
    }
}


