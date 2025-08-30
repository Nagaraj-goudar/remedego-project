package com.medapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "filled_medicines")
public class FilledMedicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "history_id")
    @JsonIgnore
    private MedicineFillHistory history;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName;

    @Column(name = "times_per_day", nullable = false)
    private int timesPerDay;

    @Column(nullable = false)
    private int days;

    @Column(name = "total_needed", nullable = false)
    private int totalNeeded;

    @Column(name = "stock_before", nullable = false)
    private int stockBefore;

    @Column(name = "stock_after", nullable = false)
    private int stockAfter;

    public Long getId() { return id; }
    public MedicineFillHistory getHistory() { return history; }
    public void setHistory(MedicineFillHistory history) { this.history = history; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }
    public int getTimesPerDay() { return timesPerDay; }
    public void setTimesPerDay(int timesPerDay) { this.timesPerDay = timesPerDay; }
    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }
    public int getTotalNeeded() { return totalNeeded; }
    public void setTotalNeeded(int totalNeeded) { this.totalNeeded = totalNeeded; }
    public int getStockBefore() { return stockBefore; }
    public void setStockBefore(int stockBefore) { this.stockBefore = stockBefore; }
    public int getStockAfter() { return stockAfter; }
    public void setStockAfter(int stockAfter) { this.stockAfter = stockAfter; }
}


