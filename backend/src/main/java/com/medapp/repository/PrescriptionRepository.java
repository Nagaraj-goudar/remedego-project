package com.medapp.repository;

import com.medapp.model.Prescription;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    
    // Find prescriptions by patient ID, ordered by creation date (newest first)
    @Query("SELECT p FROM Prescription p WHERE p.patient.id = :patientId ORDER BY p.createdAt DESC")
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") Long patientId);
    
    // Find prescriptions by status, ordered by creation date (oldest first for pending)
    @Query("SELECT p FROM Prescription p WHERE p.status = :status ORDER BY p.createdAt ASC")
    List<Prescription> findByStatusOrderByCreatedAtAsc(@Param("status") Prescription.Status status);
    
    // Find all prescriptions ordered by creation date (newest first)
    @Query("SELECT p FROM Prescription p ORDER BY p.createdAt DESC")
    List<Prescription> findAllByOrderByCreatedAtDesc();
    
    // Find prescriptions by status
    List<Prescription> findByStatus(Prescription.Status status);
    
    /**
     * Delete all prescriptions by patient
     */
    @Modifying
    @Query("DELETE FROM Prescription p WHERE p.patient = :user")
    void deleteByPatient(@Param("user") User user);
} 