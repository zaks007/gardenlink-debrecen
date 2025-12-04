package com.gardenspace.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "gardens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Garden {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String address;
    
    @Column(name = "total_plots", nullable = false)
    private Integer totalPlots = 1;
    
    @Column(name = "available_plots", nullable = false)
    private Integer availablePlots = 1;
    
    @Column(name = "base_price_per_month", nullable = false)
    private BigDecimal basePricePerMonth;
    
    @Column(name = "size_sqm")
    private BigDecimal sizeSqm;
    
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;
    
    @ElementCollection
    @CollectionTable(name = "garden_amenities", joinColumns = @JoinColumn(name = "garden_id"))
    @Column(name = "amenity")
    private List<String> amenities;
    
    @ElementCollection
    @CollectionTable(name = "garden_images", joinColumns = @JoinColumn(name = "garden_id"))
    @Column(name = "image_url")
    private List<String> images;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
