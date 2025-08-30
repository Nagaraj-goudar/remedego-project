package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.*;
import com.medapp.repository.*;
import com.medapp.service.RefillRequestService;
import com.medapp.service.RefillReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.medapp.service.TrackingService;
import com.medapp.model.PrescriptionTracking;

import java.util.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RefillController {
    @Autowired private RefillRequestRepository refillRequestRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PrescriptionRepository prescriptionRepository;
    @Autowired private MedicineFillHistoryRepository historyRepository;
    @Autowired private TrackingService trackingService;
    @Autowired private RefillReminderService refillReminderService;

    public static class RefillDetailDTO {
        public String prescriptionId;
        public String patientId;
        public String patientName;
        public String prescriptionImageUrl;
        public List<Item> items = new ArrayList<>();
        public static class Item {
            public Long medicineId;
            public String medicineName;
            public int stock;
        }
    }

    @GetMapping("/refills/{id}")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RefillDetailDTO>> getRefillDetails(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        RefillRequest rr = refillRequestRepository.findById(id).orElseThrow();
        Prescription p = rr.getPrescription();
        RefillDetailDTO dto = new RefillDetailDTO();
        dto.prescriptionId = p.getId().toString();
        dto.patientId = p.getPatient().getId().toString();
        dto.patientName = p.getPatient().getName();
        dto.prescriptionImageUrl = p.getImageUrl();
        // Provide stock per medicine available for pharmacist
        User pharmacist = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        for (Medicine m : medicineRepository.findAll()) {
            Inventory inv = inventoryRepository.findByMedicineIdAndPharmacistId(m.getId(), pharmacist.getId()).orElse(null);
            if (inv != null) {
                RefillDetailDTO.Item it = new RefillDetailDTO.Item();
                it.medicineId = m.getId();
                it.medicineName = m.getName();
                it.stock = inv.getStockQuantity();
                dto.items.add(it);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(dto, "Refill details"));
    }

    public static class FilledItemInput {
        public Long medicineId;
        public boolean morning;
        public boolean afternoon;
        public boolean night;
        public int days;
    }
    
    public static class FillRequest {
        public List<FilledItemInput> items;
        public boolean enableReminders = true;
    }

    @PostMapping("/refills/{id}/fill")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> fillRefill(@PathVariable Long id,
            @RequestBody FillRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        RefillRequest rr = refillRequestRepository.findById(id).orElseThrow();
        if (rr.getStatus() != RefillRequest.Status.APPROVED) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only approved requests can be filled"));
        }
        User pharmacist = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        if (pharmacist.getRole() != User.Role.PHARMACIST) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can fill"));
        }
        // Track filling started
        try { trackingService.record(rr.getPrescription().getId(), PrescriptionTracking.Status.FILLING, null); } catch (Exception ignore) {}
        MedicineFillHistory history = new MedicineFillHistory();
        history.setPrescription(rr.getPrescription());
        history.setPatient(rr.getPatient());
        history.setPharmacist(pharmacist);
        List<FilledMedicine> filled = new ArrayList<>();

        // Stock validation pass
        for (FilledItemInput input : request.items) {
            int timesPerDay = (input.morning ? 1 : 0) + (input.afternoon ? 1 : 0) + (input.night ? 1 : 0);
            if (timesPerDay == 0 || input.days <= 0) continue;
            int totalNeeded = timesPerDay * input.days;
            Inventory inv = inventoryRepository.findByMedicineIdAndPharmacistId(input.medicineId, pharmacist.getId())
                    .orElseThrow(() -> new RuntimeException("Inventory not found for medicineId=" + input.medicineId));
            if (inv.getStockQuantity() < totalNeeded) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Insufficient stock for medicineId=" + input.medicineId));
            }
        }
        // Apply stock updates and create history rows
        for (FilledItemInput input : request.items) {
            int timesPerDay = (input.morning ? 1 : 0) + (input.afternoon ? 1 : 0) + (input.night ? 1 : 0);
            if (timesPerDay == 0 || input.days <= 0) continue;
            int totalNeeded = timesPerDay * input.days;
            Inventory inv = inventoryRepository.findByMedicineIdAndPharmacistId(input.medicineId, pharmacist.getId()).orElseThrow();
            Medicine medicine = medicineRepository.findById(input.medicineId).orElseThrow();
            int before = inv.getStockQuantity();
            inv.setStockQuantity(before - totalNeeded);
            inventoryRepository.save(inv);
            FilledMedicine fm = new FilledMedicine();
            fm.setHistory(history);
            fm.setMedicine(medicine);
            fm.setMedicineName(medicine.getName());
            fm.setTimesPerDay(timesPerDay);
            fm.setDays(input.days);
            fm.setTotalNeeded(totalNeeded);
            fm.setStockBefore(before);
            fm.setStockAfter(before - totalNeeded);
            filled.add(fm);
        }
        history.setFilledMedicines(filled);
        historyRepository.save(history);
        rr.setStatus(RefillRequest.Status.FILLED);
        refillRequestRepository.save(rr);
        try { trackingService.record(rr.getPrescription().getId(), PrescriptionTracking.Status.FILLED, null); } catch (Exception ignore) {}
        
        // Calculate days until refill
        int maxDays = filled.stream().mapToInt(FilledMedicine::getDays).max().orElse(0);
        String refillDate = maxDays >= 7 ? LocalDate.now().plusDays(maxDays - 3).toString() : null;

        // Create reminder only when total days >= 7 and pharmacist opted in
        if (request.enableReminders && maxDays >= 7) {
            try {
                refillReminderService.createRefillReminder(rr.getPrescription(), rr.getPatient(), maxDays);
            } catch (Exception e) {
                // Log error but don't fail the fill operation
                System.err.println("Failed to create refill reminder: " + e.getMessage());
            }
        }
        
        // Send Email notification to patient (always send, but with or without reminder date)
        try {
            if (request.enableReminders && maxDays >= 7 && refillDate != null) {
                refillReminderService.sendMedicineFilledNotification(rr.getPrescription(), rr.getPatient(), filled, refillDate);
            } else {
                // Send without reminder date
                refillReminderService.sendMedicineFilledNotification(rr.getPrescription(), rr.getPatient(), filled, "Reminders disabled");
            }
        } catch (Exception e) {
            // Log error but don't fail the fill operation
            System.err.println("Failed to send medicine filled Email: " + e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Medicines filled successfully", "Filled"));
    }

    // Pharmacist marks a filled prescription as dispatched
    @PostMapping("/refills/{id}/dispatch")
    @PreAuthorize("hasRole('PHARMACIST') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> dispatchRefill(@PathVariable Long id) {
        // Accept either a refill request id or a prescription id and resolve the latest approved/filled request
        RefillRequest rr = refillRequestRepository.findById(id).orElse(null);
        if (rr == null) {
            // Treat id as prescription id and find latest request in APPROVED/FILLED
            List<RefillRequest> matches = refillRequestRepository.findLatestByPrescriptionIdAndStatuses(id,
                java.util.Arrays.asList(RefillRequest.Status.FILLED, RefillRequest.Status.APPROVED, RefillRequest.Status.DISPATCHED));
            if (!matches.isEmpty()) {
                rr = matches.get(0);
            }
        }
        if (rr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Could not find matching refill request"));
        }
        if (rr.getStatus() != RefillRequest.Status.FILLED && rr.getStatus() != RefillRequest.Status.APPROVED) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only filled or approved requests can be dispatched"));
        }
        
        // If already dispatched, return success
        if (rr.getStatus() == RefillRequest.Status.DISPATCHED) {
            return ResponseEntity.ok(ApiResponse.success("Refill dispatched", "Dispatched"));
        }

        // Update refill request status
        rr.setStatus(RefillRequest.Status.DISPATCHED);
        refillRequestRepository.save(rr);
        
        // Update fill history status to DISPATCHED
        List<MedicineFillHistory> histories = historyRepository.findByPrescriptionAndStatus(
            rr.getPrescription(), MedicineFillHistory.Status.FILLED);
        for (MedicineFillHistory history : histories) {
            history.setStatus(MedicineFillHistory.Status.DISPATCHED);
            historyRepository.save(history);
        }
        
        // Record tracking
        try { trackingService.record(rr.getPrescription().getId(), PrescriptionTracking.Status.DISPATCHED, null); } catch (Exception ignore) {}
        
        // Send Email notification to patient
        try {
            refillReminderService.sendMedicineDispatchedNotification(rr.getPrescription(), rr.getPatient());
        } catch (Exception e) {
            // Log error but don't fail the dispatch operation
            System.err.println("Failed to send medicine dispatched Email: " + e.getMessage());
        }
        
        return ResponseEntity.ok(ApiResponse.success("Refill dispatched", "Dispatched"));
    }
}


