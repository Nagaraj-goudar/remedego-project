package com.medapp.service;

import com.medapp.model.Medicine;
import com.medapp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;

@Service
public class MedicineService {
    private static final Logger logger = LoggerFactory.getLogger(MedicineService.class);
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    public List<Medicine> getAllMedicines() {
        logger.info("Fetching all medicines");
        return medicineRepository.findAll();
    }
    
    public Optional<Medicine> getMedicineById(Long id) {
        logger.info("Fetching medicine with ID: {}", id);
        return medicineRepository.findById(id);
    }
    
    public Medicine createMedicine(Medicine medicine) {
        logger.info("Creating new medicine: {}", medicine.getName());
        
        if (medicineRepository.existsByName(medicine.getName())) {
            throw new RuntimeException("Medicine with name '" + medicine.getName() + "' already exists");
        }
        
        Medicine savedMedicine = medicineRepository.save(medicine);
        logger.info("Medicine created successfully with ID: {}", savedMedicine.getId());
        return savedMedicine;
    }
    
    public Medicine updateMedicine(Long id, Medicine medicineDetails) {
        logger.info("Updating medicine with ID: {}", id);
        
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));
        
        // Check if name is being changed and if it conflicts with existing medicine
        if (medicineDetails.getName() != null && !medicine.getName().equals(medicineDetails.getName()) && 
            medicineRepository.existsByName(medicineDetails.getName())) {
            throw new RuntimeException("Medicine with name '" + medicineDetails.getName() + "' already exists");
        }
        
        // Only update fields that are not null
        if (medicineDetails.getName() != null) {
            medicine.setName(medicineDetails.getName());
        }
        if (medicineDetails.getManufacturer() != null) {
            medicine.setManufacturer(medicineDetails.getManufacturer());
        }
        if (medicineDetails.getDosageForm() != null) {
            medicine.setDosageForm(medicineDetails.getDosageForm());
        }
        if (medicineDetails.getStrength() != null) {
            medicine.setStrength(medicineDetails.getStrength());
        }
        if (medicineDetails.getDescription() != null) {
            medicine.setDescription(medicineDetails.getDescription());
        }
        // isActive is a boolean primitive, so we don't need null check
        // The field will be updated if provided in the request
        
        Medicine updatedMedicine = medicineRepository.save(medicine);
        logger.info("Medicine updated successfully");
        return updatedMedicine;
    }
    
    public void deleteMedicine(Long id) {
        logger.info("Deleting medicine with ID: {}", id);
        
        if (!medicineRepository.existsById(id)) {
            throw new RuntimeException("Medicine not found with ID: " + id);
        }
        
        medicineRepository.deleteById(id);
        logger.info("Medicine deleted successfully");
    }
    
    public List<Medicine> searchMedicines(String query) {
        logger.info("Searching medicines with query: {}", query);
        return medicineRepository.findByNameContainingIgnoreCase(query);
    }
} 