package com.medapp.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    @Autowired
    private CustomUserDetailsService userDetailsService;
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/debug-user/**", "/api/auth/create-test-user", "/api/auth/create-admin", "/api/auth/verify-pharmacist/**", "/api/auth/fix-user-password", "/api/auth/test-register", "/api/auth/test-forgot-password").permitAll()
                .requestMatchers("/uploads/**", "/backend/uploads/**").permitAll() // Allow public access to uploaded files
                .requestMatchers("/api/prescriptions/file/**", "/api/prescriptions/test-file-access").permitAll() // Allow public access to file serving endpoints
                .requestMatchers("/files/**").permitAll() // Allow public access to new file controller
                .requestMatchers("/favicon.ico", "/robots.txt", "/sitemap.xml").permitAll() // Allow public access to common static files
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/update-password").authenticated()
                .requestMatchers("/api/auth/profile-photo").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Only admins can access admin endpoints
                .requestMatchers("/api/pharmacist/**").hasRole("PHARMACIST") // Pharmacist APIs
                .requestMatchers("/api/patient/**").hasRole("PATIENT") // Patient APIs
                .requestMatchers("/api/refills/**").hasRole("PHARMACIST") // Refill endpoints for pharmacists
                .requestMatchers("/api/reminders/**").hasAnyRole("PATIENT","PHARMACIST","ADMIN") // Reminder endpoints
                // SSE cannot send Authorization headers, so allow subscribe endpoint publicly; others still require auth
                .requestMatchers("/api/tracking/subscribe/**").permitAll()
                .requestMatchers("/api/tracking/**").hasAnyRole("PATIENT","PHARMACIST","ADMIN") // history + write
                .requestMatchers("/api/medicines/**").hasAnyRole("ADMIN", "PHARMACIST") // Allow admins and pharmacists to access medicines
                .requestMatchers("/api/inventory/**").hasRole("PHARMACIST") // Only pharmacists can access inventory
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
} 