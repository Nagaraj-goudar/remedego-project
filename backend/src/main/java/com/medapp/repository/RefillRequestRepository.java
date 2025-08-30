package com.medapp.repository;

import com.medapp.model.RefillRequest;
import com.medapp.model.Patient;
import com.medapp.model.Prescription;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefillRequestRepository extends JpaRepository<RefillRequest, Long> {
    
    List<RefillRequest> findByPatientOrderByRequestedAtDesc(Patient patient);
    
    List<RefillRequest> findByStatusOrderByRequestedAtDesc(RefillRequest.Status status);
    
    @Query("SELECT r FROM RefillRequest r WHERE r.status = 'PENDING' ORDER BY r.requestedAt ASC")
    List<RefillRequest> findPendingRefillRequests();
    
    Optional<RefillRequest> findByPrescriptionAndPatientAndStatus(
            Prescription prescription, 
            Patient patient, 
            RefillRequest.Status status
    );
    
    boolean existsByPrescriptionAndPatientAndStatus(
            Prescription prescription, 
            Patient patient, 
            RefillRequest.Status status
    );
    
    boolean existsByPrescriptionAndPatient(
            Prescription prescription, 
            Patient patient
    );
    
    /**
     * Delete all refill requests by patient
     */
    @Modifying
    @Query("DELETE FROM RefillRequest r WHERE r.patient = :user")
    void deleteByPatient(@Param("user") User user);
    
    /**
     * Delete all refill requests by pharmacist
     */
    @Modifying
    @Query("DELETE FROM RefillRequest r WHERE r.pharmacist = :user")
    void deleteByPharmacist(@Param("user") User user);
    
    /**
     * Delete all refill requests involving a user (as patient or pharmacist)
     */
    @Modifying
    @Query("DELETE FROM RefillRequest r WHERE r.patient = :user OR r.pharmacist = :user")
    void deleteAllRefillRequestsInvolvingUser(@Param("user") User user);

    /**
     * Set pharmacist to NULL for all refill requests assigned to the given user.
     * This avoids foreign key violations when deleting a pharmacist account
     * if the DB constraint isn't configured with ON DELETE SET NULL.
     */
    @Modifying
    @Query("UPDATE RefillRequest r SET r.pharmacist = NULL WHERE r.pharmacist = :user")
    void unsetPharmacistForUser(@Param("user") User user);

    @Query("SELECT r FROM RefillRequest r WHERE r.prescription.id = :prescriptionId AND r.status IN :statuses ORDER BY r.requestedAt DESC")
    List<RefillRequest> findLatestByPrescriptionIdAndStatuses(@Param("prescriptionId") Long prescriptionId,
                                                              @Param("statuses") List<RefillRequest.Status> statuses);
    
    List<RefillRequest> findByPrescriptionOrderByRequestedAtDesc(Prescription prescription);
}