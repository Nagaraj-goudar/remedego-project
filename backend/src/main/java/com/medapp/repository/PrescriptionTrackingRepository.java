package com.medapp.repository;

import com.medapp.model.Prescription;
import com.medapp.model.PrescriptionTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionTrackingRepository extends JpaRepository<PrescriptionTracking, Long> {
    List<PrescriptionTracking> findByPrescriptionOrderByCreatedAtAsc(Prescription prescription);
}


