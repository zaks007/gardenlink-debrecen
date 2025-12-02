package com.gardenspace.repositories;

import com.gardenspace.models.Garden;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GardenRepository extends JpaRepository<Garden, UUID> {
    
    List<Garden> findByOwnerId(UUID ownerId);
    
    List<Garden> findByAvailablePlotsGreaterThan(Integer minPlots);
    
    List<Garden> findByNameContainingIgnoreCase(String name);
}
