package com.medapp.repository;

import com.medapp.model.RefillRequestMedicine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefillRequestMedicineRepository extends JpaRepository<RefillRequestMedicine, Long> {
}