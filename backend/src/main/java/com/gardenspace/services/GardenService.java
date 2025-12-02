package com.gardenspace.services;

import com.gardenspace.models.Garden;
import com.gardenspace.repositories.GardenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GardenService {
    
    private final GardenRepository gardenRepository;
    
    public List<Garden> getAllGardens() {
        return gardenRepository.findAll();
    }
    
    public Optional<Garden> getGardenById(UUID id) {
        return gardenRepository.findById(id);
    }
    
    public List<Garden> getGardensByOwner(UUID ownerId) {
        return gardenRepository.findByOwnerId(ownerId);
    }
    
    public List<Garden> getAvailableGardens() {
        return gardenRepository.findByAvailablePlotsGreaterThan(0);
    }
    
    public List<Garden> searchGardens(String query) {
        return gardenRepository.findByNameContainingIgnoreCase(query);
    }
    
    public Garden createGarden(Garden garden) {
        return gardenRepository.save(garden);
    }
    
    public Optional<Garden> updateGarden(UUID id, Garden gardenDetails) {
        return gardenRepository.findById(id).map(garden -> {
            garden.setName(gardenDetails.getName());
            garden.setDescription(gardenDetails.getDescription());
            garden.setAddress(gardenDetails.getAddress());
            garden.setLatitude(gardenDetails.getLatitude());
            garden.setLongitude(gardenDetails.getLongitude());
            garden.setTotalPlots(gardenDetails.getTotalPlots());
            garden.setAvailablePlots(gardenDetails.getAvailablePlots());
            garden.setBasePricePerMonth(gardenDetails.getBasePricePerMonth());
            garden.setSizeSqm(gardenDetails.getSizeSqm());
            garden.setAmenities(gardenDetails.getAmenities());
            garden.setImages(gardenDetails.getImages());
            return gardenRepository.save(garden);
        });
    }
    
    public boolean deleteGarden(UUID id) {
        if (gardenRepository.existsById(id)) {
            gardenRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
