package com.medapp.config;

import com.medapp.model.Admin;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        createAdminUser();
    }
    
    private void createAdminUser() {
        String adminEmail = "Admin@remedgo.com";
        
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            Admin adminUser = new Admin();
            adminUser.setEmail(adminEmail);
            adminUser.setPassword(passwordEncoder.encode("Admin@123"));
            adminUser.setName("System Administrator");
            adminUser.setRole(Admin.Role.ADMIN);
            adminUser.setActive(true);
            adminUser.setIsApproved(true);
            
            Admin savedAdmin = userRepository.save(adminUser);
            logger.info("Admin user created successfully with ID: {}", savedAdmin.getId());
        } else {
            logger.info("Admin user already exists");
        }
    }
} 