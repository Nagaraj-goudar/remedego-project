package com.medapp.repository;

import com.medapp.model.MedicineFillHistory;
import com.medapp.model.Patient;
import com.medapp.model.Prescription;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineFillHistoryRepository extends JpaRepository<MedicineFillHistory, Long> {
    List<MedicineFillHistory> findByPatientOrderByFillDateDesc(Patient patient);
    List<MedicineFillHistory> findByPharmacistOrderByFillDateDesc(User pharmacist);
    List<MedicineFillHistory> findByPrescriptionOrderByFillDateDesc(Prescription prescription);
    List<MedicineFillHistory> findByPrescriptionAndStatus(Prescription prescription, MedicineFillHistory.Status status);
}


