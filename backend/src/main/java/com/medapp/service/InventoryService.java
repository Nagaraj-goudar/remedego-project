package com.medapp.service;

import com.medapp.model.Inventory;
import com.medapp.model.Medicine;
import com.medapp.model.User;
import com.medapp.repository.InventoryRepository;
import com.medapp.repository.MedicineRepository;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {
    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);
    
    @Autowired
    private InventoryRepository inventoryRepository;
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<Inventory> getInventoryByPharmacist(User pharmacist) {
        logger.info("Fetching inventory for pharmacist: {}", pharmacist.getEmail());
        return inventoryRepository.findByPharmacist(pharmacist);
    }
    
    public List<Inventory> getLowStockItemsByPharmacist(User pharmacist) {
        logger.info("Fetching low stock items for pharmacist: {}", pharmacist.getEmail());
        return inventoryRepository.findLowStockItemsByPharmacist(pharmacist);
    }
    
    public List<Inventory> getExpiringItemsByPharmacist(User pharmacist) {
        logger.info("Fetching expiring items for pharmacist: {}", pharmacist.getEmail());
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        return inventoryRepository.findExpiringItemsByPharmacist(pharmacist, thirtyDaysFromNow);
    }
    
    public Inventory addMedicineToInventory(Long medicineId, Long pharmacistId, Inventory inventoryDetails) {
        logger.info("Adding medicine {} to inventory for pharmacist {}", medicineId, pharmacistId);
        
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));
        
        User pharmacist = userRepository.findById(pharmacistId)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found with ID: " + pharmacistId));
        
        // Check if this medicine is already in the pharmacist's inventory
        if (inventoryRepository.existsByMedicineIdAndPharmacistId(medicineId, pharmacistId)) {
            throw new RuntimeException("Medicine is already in the pharmacist's inventory");
        }
        
        Inventory inventory = new Inventory();
        inventory.setMedicine(medicine);
        inventory.setPharmacist(pharmacist);
        inventory.setStockQuantity(inventoryDetails.getStockQuantity());
        inventory.setLowStockThreshold(inventoryDetails.getLowStockThreshold());
        inventory.setExpiryDate(inventoryDetails.getExpiryDate());
        
        Inventory savedInventory = inventoryRepository.save(inventory);
        logger.info("Medicine added to inventory successfully with ID: {}", savedInventory.getId());
        return savedInventory;
    }
    
    public Inventory updateInventory(Long inventoryId, Inventory inventoryDetails) {
        logger.info("Updating inventory with ID: {}", inventoryId);
        
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found with ID: " + inventoryId));
        
        inventory.setStockQuantity(inventoryDetails.getStockQuantity());
        inventory.setLowStockThreshold(inventoryDetails.getLowStockThreshold());
        inventory.setExpiryDate(inventoryDetails.getExpiryDate());
        
        Inventory updatedInventory = inventoryRepository.save(inventory);
        logger.info("Inventory updated successfully");
        return updatedInventory;
    }
    
    public Optional<Inventory> getInventoryById(Long id) {
        logger.info("Fetching inventory with ID: {}", id);
        return inventoryRepository.findById(id);
    }
    
    public void deleteInventory(Long id) {
        logger.info("Deleting inventory with ID: {}", id);
        
        if (!inventoryRepository.existsById(id)) {
            throw new RuntimeException("Inventory not found with ID: " + id);
        }
        
        inventoryRepository.deleteById(id);
        logger.info("Inventory deleted successfully");
    }
} 