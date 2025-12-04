package com.gardenspace.services;

import com.gardenspace.models.Garden;
import com.gardenspace.repositories.GardenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GardenServiceTest {

    @Mock
    private GardenRepository gardenRepository;

    @InjectMocks
    private GardenService gardenService;

    private Garden testGarden;
    private UUID gardenId;

    @BeforeEach
    void setUp() {
        gardenId = UUID.randomUUID();
        testGarden = new Garden();
        testGarden.setId(gardenId);
        testGarden.setName("Test Garden");
        testGarden.setDescription("A beautiful test garden");
        testGarden.setAddress("123 Garden St, Debrecen");
        testGarden.setTotalPlots(10);
        testGarden.setAvailablePlots(5);
        testGarden.setBasePricePerMonth(new BigDecimal("5000"));
    }

    @Test
    void getAllGardens_ShouldReturnAllGardens() {
        List<Garden> gardens = Arrays.asList(testGarden);
        when(gardenRepository.findAll()).thenReturn(gardens);

        List<Garden> result = gardenService.getAllGardens();

        assertEquals(1, result.size());
        assertEquals("Test Garden", result.get(0).getName());
        verify(gardenRepository, times(1)).findAll();
    }

    @Test
    void getGardenById_WhenExists_ShouldReturnGarden() {
        when(gardenRepository.findById(gardenId)).thenReturn(Optional.of(testGarden));

        Optional<Garden> result = gardenService.getGardenById(gardenId);

        assertTrue(result.isPresent());
        assertEquals("Test Garden", result.get().getName());
    }

    @Test
    void getGardenById_WhenNotExists_ShouldReturnEmpty() {
        UUID nonExistentId = UUID.randomUUID();
        when(gardenRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        Optional<Garden> result = gardenService.getGardenById(nonExistentId);

        assertFalse(result.isPresent());
    }

    @Test
    void createGarden_ShouldSaveAndReturnGarden() {
        when(gardenRepository.save(any(Garden.class))).thenReturn(testGarden);

        Garden result = gardenService.createGarden(testGarden);

        assertNotNull(result);
        assertEquals("Test Garden", result.getName());
        verify(gardenRepository, times(1)).save(testGarden);
    }

    @Test
    void deleteGarden_WhenExists_ShouldReturnTrue() {
        when(gardenRepository.existsById(gardenId)).thenReturn(true);
        doNothing().when(gardenRepository).deleteById(gardenId);

        boolean result = gardenService.deleteGarden(gardenId);

        assertTrue(result);
        verify(gardenRepository, times(1)).deleteById(gardenId);
    }

    @Test
    void deleteGarden_WhenNotExists_ShouldReturnFalse() {
        UUID nonExistentId = UUID.randomUUID();
        when(gardenRepository.existsById(nonExistentId)).thenReturn(false);

        boolean result = gardenService.deleteGarden(nonExistentId);

        assertFalse(result);
        verify(gardenRepository, never()).deleteById(any());
    }
}
