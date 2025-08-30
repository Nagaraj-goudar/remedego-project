package com.medapp.controller;

import com.medapp.model.Order;
import com.medapp.model.User;
import com.medapp.repository.UserRepository;
import com.medapp.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long prescriptionId = Long.valueOf(body.get("prescriptionId").toString());
        double totalAmount = Double.parseDouble(body.get("totalAmount").toString());
        Order order = orderService.createOrder(prescriptionId, userDetails.getUsername(), totalAmount);
        return ResponseEntity.ok(order);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getOrders(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(orderService.getOrdersForUser(user));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Order.Status status = Order.Status.valueOf(body.get("status"));
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
} 