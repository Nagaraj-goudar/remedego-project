package com.medapp.service;

import com.medapp.model.Order;
import com.medapp.model.Patient;
import com.medapp.model.Prescription;
import com.medapp.model.User;
import com.medapp.repository.OrderRepository;
import com.medapp.repository.PatientRepository;
import com.medapp.repository.PrescriptionRepository;
import com.medapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PrescriptionRepository prescriptionRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private UserRepository userRepository;

    public Order createOrder(Long prescriptionId, String patientEmail, double totalAmount) {
        User user = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != User.Role.PATIENT) {
            throw new RuntimeException("Only patients can create orders");
        }
        Patient patient = patientRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        Order order = new Order();
        order.setPatient(patient);
        order.setPrescription(prescription);
        order.setStatus(Order.Status.PENDING);
        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    public List<Order> getOrdersForUser(User user) {
        if (user.getRole() == User.Role.PATIENT) {
            return orderRepository.findAll().stream()
                    .filter(o -> o.getPatient().getId().equals(user.getId()))
                    .toList();
        } else if (user.getRole() == User.Role.PHARMACIST) {
            return orderRepository.findAll();
        } else {
            throw new RuntimeException("Unauthorized");
        }
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Order updateOrderStatus(Long id, Order.Status status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }
} 