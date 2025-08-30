package com.medapp.repository;

import com.medapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    
    // Find pharmacists by role and verification status
    List<User> findByRoleAndIsVerifiedOrderByCreatedAtDesc(User.Role role, boolean isVerified);
    
    // Find all pharmacists by role
    List<User> findByRoleOrderByCreatedAtDesc(User.Role role);
} 