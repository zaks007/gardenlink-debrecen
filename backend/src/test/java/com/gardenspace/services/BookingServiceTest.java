package com.gardenspace.services;

import com.gardenspace.models.Booking;
import com.gardenspace.repositories.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
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
    void getAllBookings_ShouldReturnAllBookings() {
        List<Booking> bookings = Arrays.asList(testBooking);
        when(bookingRepository.findAll()).thenReturn(bookings);

        List<Booking> result = bookingService.getAllBookings();

        assertEquals(1, result.size());
        assertEquals("pending", result.get(0).getStatus());
    }

    @Test
    void getBookingsByUser_ShouldReturnUserBookings() {
        List<Booking> bookings = Arrays.asList(testBooking);
        when(bookingRepository.findByUserId(userId)).thenReturn(bookings);

        List<Booking> result = bookingService.getBookingsByUser(userId);

        assertEquals(1, result.size());
        assertEquals(userId, result.get(0).getUserId());
    }

    @Test
    void confirmBooking_ShouldUpdateStatusAndPaymentMethod() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        Optional<Booking> result = bookingService.confirmBooking(bookingId, "card_1234");

        assertTrue(result.isPresent());
        assertEquals("confirmed", result.get().getStatus());
        assertEquals("card_1234", result.get().getPaymentMethod());
    }

    @Test
    void cancelBooking_ShouldUpdateStatusToCancelled() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        Optional<Booking> result = bookingService.cancelBooking(bookingId);

        assertTrue(result.isPresent());
        assertEquals("cancelled", result.get().getStatus());
    }

    @Test
    void createBooking_ShouldSaveAndReturnBooking() {
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        Booking result = bookingService.createBooking(testBooking);

        assertNotNull(result);
        assertEquals(3, result.getDurationMonths());
        verify(bookingRepository, times(1)).save(testBooking);
    }
}
