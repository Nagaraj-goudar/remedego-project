package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.Inventory;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class InventoryController {
    private static final Logger logger = LoggerFactory.getLogger(InventoryController.class);
    
    @Autowired
    private InventoryService inventoryService;
    @Autowired
    private UserRepository userRepository;

    // DTO for frontend
    public static class InventoryDTO {
        public String id;
        public String medicineId;
        public String medicineName;
        public String manufacturer;
        public String dosageForm;
        public String strength;
        public Integer stockQuantity;
        public Integer lowStockThreshold;
        public String expiryDate;
        public String lastUpdated;
        public boolean isLowStock;

        public InventoryDTO(Inventory i) {
            this.id = i.getId() != null ? i.getId().toString() : "";
            this.medicineId = i.getMedicine().getId() != null ? i.getMedicine().getId().toString() : "";
            this.medicineName = i.getMedicine().getName();
            this.manufacturer = i.getMedicine().getManufacturer();
            this.dosageForm = i.getMedicine().getDosageForm();
            this.strength = i.getMedicine().getStrength();
            this.stockQuantity = i.getStockQuantity();
            this.lowStockThreshold = i.getLowStockThreshold();
            this.expiryDate = i.getExpiryDate() != null ? i.getExpiryDate().toString() : "";
            this.lastUpdated = i.getLastUpdated() != null ? i.getLastUpdated().toString() : "";
            this.isLowStock = i.isLowStock();
        }
    }

    // Pharmacist-only endpoints
    @GetMapping("/my-stock")
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> getMyInventory(@AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting inventory for user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can access inventory"));
            }
            
            List<Inventory> inventory = inventoryService.getInventoryByPharmacist(user);
            List<InventoryDTO> dtos = inventory.stream()
                .map(InventoryDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} inventory items for pharmacist", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Inventory retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get inventory: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryDTO>>> getLowStockItems(@AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Getting low stock items for user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can access inventory"));
            }
            
            List<Inventory> lowStockItems = inventoryService.getLowStockItemsByPharmacist(user);
            List<InventoryDTO> dtos = lowStockItems.stream()
                .map(InventoryDTO::new)
                .collect(Collectors.toList());
            
            logger.info("Found {} low stock items for pharmacist", dtos.size());
            return ResponseEntity.ok(ApiResponse.success(dtos, "Low stock items retrieved successfully"));
        } catch (Exception e) {
            logger.error("Failed to get low stock items: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<InventoryDTO>> addMedicineToInventory(
            @RequestBody AddInventoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Adding medicine to inventory request from user: {}", userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can add medicines to inventory"));
            }
            
            Inventory inventoryDetails = new Inventory();
            inventoryDetails.setStockQuantity(request.stockQuantity);
            inventoryDetails.setLowStockThreshold(request.lowStockThreshold);
            
            // Parse expiry date if provided
            if (request.expiryDate != null && !request.expiryDate.trim().isEmpty()) {
                try {
                    LocalDate expiryDate = LocalDate.parse(request.expiryDate);
                    inventoryDetails.setExpiryDate(expiryDate);
                } catch (Exception e) {
                    logger.warn("Invalid expiry date format: {}", request.expiryDate);
                    // Continue without expiry date
                }
            }
            
            Inventory added = inventoryService.addMedicineToInventory(request.medicineId, user.getId(), inventoryDetails);
            logger.info("Medicine added to inventory successfully");
            return ResponseEntity.ok(ApiResponse.success(new InventoryDTO(added), "Medicine added to inventory successfully"));
        } catch (Exception e) {
            logger.error("Failed to add medicine to inventory: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryDTO>> updateInventory(
            @PathVariable Long id,
            @RequestBody UpdateInventoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("Updating inventory {} request from user: {}", id, userDetails.getUsername());
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            if (user.getRole() != User.Role.PHARMACIST) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only pharmacists can update inventory"));
            }
            
            Inventory inventoryDetails = new Inventory();
            inventoryDetails.setStockQuantity(request.stockQuantity);
            inventoryDetails.setLowStockThreshold(request.lowStockThreshold);
            
            // Parse expiry date if provided
            if (request.expiryDate != null && !request.expiryDate.trim().isEmpty()) {
                try {
                    LocalDate expiryDate = LocalDate.parse(request.expiryDate);
                    inventoryDetails.setExpiryDate(expiryDate);
                } catch (Exception e) {
                    logger.warn("Invalid expiry date format: {}", request.expiryDate);
                    // Continue without expiry date
                }
            }
            
            Inventory updated = inventoryService.updateInventory(id, inventoryDetails);
            logger.info("Inventory updated successfully");
            return ResponseEntity.ok(ApiResponse.success(new InventoryDTO(updated), "Inventory updated successfully"));
        } catch (Exception e) {
            logger.error("Failed to update inventory: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // Request DTOs
    public static class AddInventoryRequest {
        public Long medicineId;
        public Integer stockQuantity;
        public Integer lowStockThreshold;
        public String expiryDate;
    }

    public static class UpdateInventoryRequest {
        public Integer stockQuantity;
        public Integer lowStockThreshold;
        public String expiryDate;
    }
} 