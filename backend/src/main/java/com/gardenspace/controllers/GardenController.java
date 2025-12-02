package com.gardenspace.controllers;

import com.gardenspace.models.Garden;
import com.gardenspace.services.GardenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gardens")
@RequiredArgsConstructor
public class GardenController {
    
    private final GardenService gardenService;
    
    @GetMapping
    public List<Garden> getAllGardens() {
        return gardenService.getAllGardens();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Garden> getGardenById(@PathVariable UUID id) {
        return gardenService.getGardenById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/available")
    public List<Garden> getAvailableGardens() {
        return gardenService.getAvailableGardens();
    }
    
    @GetMapping("/search")
    public List<Garden> searchGardens(@RequestParam String query) {
        return gardenService.searchGardens(query);
    }
    
    @GetMapping("/owner/{ownerId}")
    public List<Garden> getGardensByOwner(@PathVariable UUID ownerId) {
        return gardenService.getGardensByOwner(ownerId);
    }
    
    @PostMapping
    public Garden createGarden(@RequestBody Garden garden) {
        return gardenService.createGarden(garden);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Garden> updateGarden(@PathVariable UUID id, @RequestBody Garden garden) {
        return gardenService.updateGarden(id, garden)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGarden(@PathVariable UUID id) {
        if (gardenService.deleteGarden(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
