package com.medapp.controller;

import com.medapp.dto.ApiResponse;
import com.medapp.model.PrescriptionTracking;
import com.medapp.service.TrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class TrackingController {
    @Autowired private TrackingService trackingService;

    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('PATIENT','PHARMACIST','ADMIN')")
    public ResponseEntity<ApiResponse<List<PrescriptionTracking>>> getHistory(@PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success(trackingService.history(prescriptionId), "Tracking history"));
    }

    @GetMapping(path = "/subscribe/{prescriptionId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable Long prescriptionId) {
        return trackingService.subscribe(prescriptionId);
    }

    @PostMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionTracking>> record(@PathVariable Long prescriptionId,
                                                                    @RequestBody Map<String, String> body) {
        PrescriptionTracking.Status status = PrescriptionTracking.Status.valueOf(body.get("status"));
        String notes = body.getOrDefault("notes", null);
        return ResponseEntity.ok(ApiResponse.success(trackingService.record(prescriptionId, status, notes), "Recorded"));
    }

    // Patient marks delivered
    @PostMapping("/{prescriptionId}/delivered")
    @PreAuthorize("hasAnyRole('PATIENT','ADMIN')")
    public ResponseEntity<ApiResponse<PrescriptionTracking>> delivered(@PathVariable Long prescriptionId) {
        return ResponseEntity.ok(ApiResponse.success(trackingService.record(prescriptionId, PrescriptionTracking.Status.DELIVERED, null), "Delivered"));
    }
}


