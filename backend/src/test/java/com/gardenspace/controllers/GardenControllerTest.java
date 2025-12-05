package com.gardenspace.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gardenspace.models.Garden;
import com.gardenspace.services.GardenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GardenController.class)
class GardenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
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
        testGarden.setAddress("123 Garden Street, Debrecen");
        testGarden.setTotalPlots(10);
        testGarden.setAvailablePlots(8);
        testGarden.setBasePricePerMonth(new BigDecimal("5000"));
    }

    @Test
    void getAllGardens_ReturnsListAndCorrectContentType() throws Exception {
        when(gardenService.getAllGardens()).thenReturn(Arrays.asList(testGarden));

        MvcResult result = mockMvc.perform(get("/api/gardens"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("Test Garden");
        assertThat(responseBody).contains("123 Garden Street");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void getGardenById_WhenExists_ReturnsGardenWithAllFields() throws Exception {
        when(gardenService.getGardenById(gardenId)).thenReturn(Optional.of(testGarden));

        MvcResult result = mockMvc.perform(get("/api/gardens/{id}", gardenId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Garden"))
                .andExpect(jsonPath("$.description").value("A beautiful test garden"))
                .andExpect(jsonPath("$.totalPlots").value(10))
                .andReturn();

        assertThat(result.getResponse().getContentType()).contains("application/json");
        assertThat(result.getResponse().getContentAsString()).contains(gardenId.toString());
    }

    @Test
    void getGardenById_WhenNotExists_Returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(gardenService.getGardenById(nonExistentId)).thenReturn(Optional.empty());

        MvcResult result = mockMvc.perform(get("/api/gardens/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(404);
        assertThat(result.getResponse().getContentAsString()).isEmpty();
    }

    @Test
    void createGarden_ValidInput_ReturnsCreatedGarden() throws Exception {
        when(gardenService.createGarden(any(Garden.class))).thenReturn(testGarden);

        String gardenJson = objectMapper.writeValueAsString(testGarden);

        MvcResult result = mockMvc.perform(post("/api/gardens")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gardenJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Garden"))
                .andExpect(jsonPath("$.availablePlots").value(8))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).isNotEmpty();
        assertThat(responseBody).contains("5000");
    }

    @Test
    void searchGardens_ReturnsMatchingResults() throws Exception {
        when(gardenService.searchGardens("Debrecen")).thenReturn(Arrays.asList(testGarden));

        MvcResult result = mockMvc.perform(get("/api/gardens/search")
                        .param("query", "Debrecen"))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("Test Garden");
        assertThat(result.getResponse().getContentAsString()).contains("Debrecen");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void deleteGarden_WhenExists_ReturnsNoContent() throws Exception {
        when(gardenService.deleteGarden(gardenId)).thenReturn(true);

        MvcResult result = mockMvc.perform(delete("/api/gardens/{id}", gardenId))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(204);
        assertThat(result.getResponse().getContentAsString()).isEmpty();
    }
}
