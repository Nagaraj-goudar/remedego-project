package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.Medicine;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class MedicineController {
    private static final Logger logger = LoggerFactory.getLogger(MedicineController.class);
    
    @Autowired
    private MedicineService medicineService;
    @Autowired
    private UserRepository userRepository;

    // DTO for frontend
    public static class MedicineDTO {
        public String id;
        public String name;
        public String manufacturer;
        public String dosageForm;
        public String strength;
        public String description;
        public boolean isActive;
        public String createdAt;
        public String updatedAt;

        public MedicineDTO(Medicine m) {
            this.id = m.getId() != null ? m.getId().toString() : "";
            this.name = m.getName();
            this.manufacturer = m.getManufacturer();
            this.dosageForm = m.getDosageForm();
            this.strength = m.getStrength();
            this.description = m.getDescription();
            this.isActive = m.isActive();
            this.createdAt = m.getCreatedAt() != null ? m.getCreatedAt().toString() : "";
            this.updatedAt = m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : "";
        }
    }

    // Admin-only endpoints
    @PostMapping
    public ResponseEntity<ApiResponse<MedicineDTO>> createMedicine(
            @RequestBody Medicine medicine,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Creating medicine request from user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only admins can create medicines"));
            }
            
            Medicine created = medicineService.createMedicine(medicine);
            logger.info("Medicine created successfully: {}", created.getName());
            return ResponseEntity.ok(ApiResponse.success(new MedicineDTO(created), "Medicine created successfully"));
        } catch (Exception e) {
            logger.error("Failed to create medicine: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateMedicine(
            @PathVariable Long id,
            @RequestBody Medicine medicineDetails,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Updating medicine {} request from user: {}", id, userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only admins can update medicines"));
            }
            
            Medicine updated = medicineService.updateMedicine(id, medicineDetails);
            logger.info("Medicine updated successfully: {}", updated.getName());
            return ResponseEntity.ok(ApiResponse.success(new MedicineDTO(updated), "Medicine updated successfully"));
        } catch (Exception e) {
            logger.error("Failed to update medicine: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Deleting medicine {} request from user: {}", id, userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only admins can delete medicines"));
            }
            
            medicineService.deleteMedicine(id);
            logger.info("Medicine deleted successfully");
            return ResponseEntity.ok(ApiResponse.success(null, "Medicine deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete medicine: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Read-only endpoints (accessible by admins and pharmacists)
    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getAllMedicines(@AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting all medicines request from user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only admins and pharmacists can view medicines"));
            }
            
            List<Medicine> medicines = medicineService.getAllMedicines();
            List<MedicineDTO> dtos = medicines.stream()
                .map(MedicineDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} medicines", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Medicines retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get medicines: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> getMedicineById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting medicine {} request from user: {}", id, userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only admins and pharmacists can view medicines"));
            }
            
            Medicine medicine = medicineService.getMedicineById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
            
            logger.info("Medicine retrieved successfully: {}", medicine.getName());
            return ResponseEntity.ok(ApiResponse.success(new MedicineDTO(medicine), "Medicine retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get medicine: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
} 