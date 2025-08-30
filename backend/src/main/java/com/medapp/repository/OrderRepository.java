package com.medapp.repository;

import com.medapp.model.Order;
import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Delete all orders by patient
     */
    @Modifying
    @Query("DELETE FROM Order o WHERE o.patient = :user")
    void deleteByPatient(@Param("user") User user);
} 