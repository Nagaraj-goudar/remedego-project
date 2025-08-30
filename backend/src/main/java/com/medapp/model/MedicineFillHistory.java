package com.medapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicine_fill_history")
public class MedicineFillHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pharmacist_id")
    private User pharmacist;

    @OneToMany(mappedBy = "history", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FilledMedicine> filledMedicines = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.FILLED;

    @Column(name = "fill_date", updatable = false)
    private LocalDateTime fillDate;

    public enum Status { FILLED, DISPATCHED }

    @PrePersist
    protected void onCreate() {
        fillDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public User getPharmacist() { return pharmacist; }
    public void setPharmacist(User pharmacist) { this.pharmacist = pharmacist; }
    public List<FilledMedicine> getFilledMedicines() { return filledMedicines; }
    public void setFilledMedicines(List<FilledMedicine> filledMedicines) { this.filledMedicines = filledMedicines; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getFillDate() { return fillDate; }
    public void setFillDate(LocalDateTime fillDate) { this.fillDate = fillDate; }
}


