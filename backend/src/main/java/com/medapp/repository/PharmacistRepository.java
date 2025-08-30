package com.medapp.repository;

import com.medapp.model.Pharmacist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PharmacistRepository extends JpaRepository<Pharmacist, Long> {
    Optional<Pharmacist> findByLicenseNumber(String licenseNumber);
} 