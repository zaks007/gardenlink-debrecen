package com.gardenspace.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gardenspace.models.Booking;
import com.gardenspace.services.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    private Booking testBooking;
    private UUID bookingId;
    private UUID userId;
    private UUID gardenId;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        userId = UUID.randomUUID();
        gardenId = UUID.randomUUID();

        testBooking = new Booking();
        testBooking.setId(bookingId);
        testBooking.setUserId(userId);
        testBooking.setGardenId(gardenId);
        testBooking.setStartDate(LocalDate.now());
        testBooking.setEndDate(LocalDate.now().plusMonths(3));
        testBooking.setDurationMonths(3);
        testBooking.setTotalPrice(new BigDecimal("15000"));
        testBooking.setStatus("pending");
    }

    @Test
    void getAllBookings_ReturnsListWithCorrectData() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(Arrays.asList(testBooking));

        MvcResult result = mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("pending");
        assertThat(responseBody).contains("15000");
        assertThat(responseBody).contains(bookingId.toString());
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void getBookingById_WhenExists_ReturnsAllBookingDetails() throws Exception {
        when(bookingService.getBookingById(bookingId)).thenReturn(Optional.of(testBooking));

        MvcResult result = mockMvc.perform(get("/api/bookings/{id}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"))
                .andExpect(jsonPath("$.durationMonths").value(3))
                .andExpect(jsonPath("$.totalPrice").value(15000))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains(userId.toString());
        assertThat(result.getResponse().getContentAsString()).contains(gardenId.toString());
    }

    @Test
    void getBookingsByUser_ReturnsUserBookings() throws Exception {
        when(bookingService.getBookingsByUser(userId)).thenReturn(Arrays.asList(testBooking));

        MvcResult result = mockMvc.perform(get("/api/bookings/user/{userId}", userId))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains(bookingId.toString());
        assertThat(result.getResponse().getContentAsString()).contains("pending");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void confirmBooking_UpdatesStatusAndPaymentMethod() throws Exception {
        Booking confirmedBooking = new Booking();
        confirmedBooking.setId(bookingId);
        confirmedBooking.setStatus("confirmed");
        confirmedBooking.setPaymentMethod("card_1234");

        when(bookingService.confirmBooking(eq(bookingId), eq("card_1234")))
                .thenReturn(Optional.of(confirmedBooking));

        MvcResult result = mockMvc.perform(patch("/api/bookings/{id}/confirm", bookingId)
                        .param("paymentMethod", "card_1234"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("confirmed"))
                .andExpect(jsonPath("$.paymentMethod").value("card_1234"))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("confirmed");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("pending");
    }

    @Test
    void cancelBooking_UpdatesStatusToCancelled() throws Exception {
        Booking cancelledBooking = new Booking();
        cancelledBooking.setId(bookingId);
        cancelledBooking.setStatus("cancelled");

        when(bookingService.cancelBooking(bookingId)).thenReturn(Optional.of(cancelledBooking));

        MvcResult result = mockMvc.perform(patch("/api/bookings/{id}/cancel", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelled"))
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains("cancelled");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void createBooking_ValidInput_ReturnsCreatedBooking() throws Exception {
        when(bookingService.createBooking(any(Booking.class))).thenReturn(testBooking);

        String bookingJson = objectMapper.writeValueAsString(testBooking);

        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingJson))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).contains(bookingId.toString());
        assertThat(result.getResponse().getContentAsString()).contains("15000");
        assertThat(result.getResponse().getContentType()).contains("application/json");
    }
}
