package com.medapp.service;

import com.medapp.model.Prescription;
import com.medapp.model.PrescriptionTracking;
import com.medapp.repository.PrescriptionRepository;
import com.medapp.repository.PrescriptionTrackingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TrackingService {
    @Autowired private PrescriptionRepository prescriptionRepository;
    @Autowired private PrescriptionTrackingRepository trackingRepository;

    private final Map<Long, SseEmitter> prescriptionEmitters = new ConcurrentHashMap<>();

    public PrescriptionTracking record(Long prescriptionId, PrescriptionTracking.Status status, String notes) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId).orElseThrow();
        PrescriptionTracking t = new PrescriptionTracking();
        t.setPrescription(prescription);
        t.setStatus(status);
        t.setNotes(notes);
        PrescriptionTracking saved = trackingRepository.save(t);
        // broadcast
        SseEmitter emitter = prescriptionEmitters.get(prescriptionId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("tracking").data(saved));
            } catch (IOException ignored) {}
        }
        return saved;
    }

    public List<PrescriptionTracking> history(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId).orElseThrow();
        List<PrescriptionTracking> list = trackingRepository.findByPrescriptionOrderByCreatedAtAsc(prescription);
        if (list.isEmpty()) {
            // Bootstrap minimal history so the timeline is not empty for legacy data
            record(prescriptionId, PrescriptionTracking.Status.UPLOADED, null);
            // Best-effort additional point if already approved
            try {
                if (prescription.getStatus() == com.medapp.model.Prescription.Status.APPROVED) {
                    record(prescriptionId, PrescriptionTracking.Status.APPROVED, null);
                }
            } catch (Exception ignored) {}
            list = trackingRepository.findByPrescriptionOrderByCreatedAtAsc(prescription);
        }
        return list;
    }

    public SseEmitter subscribe(Long prescriptionId) {
        SseEmitter emitter = new SseEmitter(0L);
        prescriptionEmitters.put(prescriptionId, emitter);
        emitter.onCompletion(() -> prescriptionEmitters.remove(prescriptionId));
        emitter.onTimeout(() -> prescriptionEmitters.remove(prescriptionId));
        return emitter;
    }
}


