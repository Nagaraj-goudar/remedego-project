package com.medapp.repository;

import com.medapp.model.RefillReminder;
import com.medapp.model.Patient;
import com.medapp.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefillReminderRepository extends JpaRepository<RefillReminder, Long> {
    List<RefillReminder> findByPatient(Patient patient);
    List<RefillReminder> findByPrescription(Prescription prescription);
    
    List<RefillReminder> findByPatientId(Long patientId);
    
    List<RefillReminder> findByReminderDateAndIsEnabledAndSmsSent(
        LocalDate reminderDate, boolean isEnabled, boolean smsSent);
    
    long countByIsEnabled(boolean isEnabled);
    
    long countByReminderDateAndIsEnabledAndSmsSent(
        LocalDate reminderDate, boolean isEnabled, boolean smsSent);
    
    @Query("SELECT COUNT(r) FROM RefillReminder r WHERE r.smsSentAt BETWEEN :startDate AND :endDate")
    long countBySmsSentAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    Optional<RefillReminder> findTopByPrescriptionAndPatientOrderByCreatedAtDesc(
            Prescription prescription,
            Patient patient
    );
}


