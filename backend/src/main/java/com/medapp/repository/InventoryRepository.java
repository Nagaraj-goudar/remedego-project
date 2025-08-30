package com.medapp.repository;

import com.medapp.model.Inventory;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByPharmacist(User pharmacist);
    
    @Query("SELECT i FROM Inventory i WHERE i.pharmacist = :pharmacist AND i.stockQuantity <= i.lowStockThreshold")
    List<Inventory> findLowStockItemsByPharmacist(@Param("pharmacist") User pharmacist);
    
    @Query("SELECT i FROM Inventory i WHERE i.pharmacist = :pharmacist AND i.expiryDate <= :date")
    List<Inventory> findExpiringItemsByPharmacist(@Param("pharmacist") User pharmacist, @Param("date") LocalDate date);
    
    @Query("SELECT i FROM Inventory i WHERE i.medicine.id = :medicineId AND i.pharmacist.id = :pharmacistId")
    Optional<Inventory> findByMedicineIdAndPharmacistId(@Param("medicineId") Long medicineId, @Param("pharmacistId") Long pharmacistId);
    
    @Query("SELECT COUNT(i) > 0 FROM Inventory i WHERE i.medicine.id = :medicineId AND i.pharmacist.id = :pharmacistId")
    boolean existsByMedicineIdAndPharmacistId(@Param("medicineId") Long medicineId, @Param("pharmacistId") Long pharmacistId);
    
    /**
     * Delete all inventory by pharmacist
     */
    @Modifying
    @Query("DELETE FROM Inventory i WHERE i.pharmacist = :user")
    void deleteByPharmacist(@Param("user") User user);
} 