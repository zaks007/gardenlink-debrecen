package com.gardenspace.services;

import com.gardenspace.models.Booking;
import com.gardenspace.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public Optional<Booking> getBookingById(UUID id) {
        return bookingRepository.findById(id);
    }
    
    public List<Booking> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserId(userId);
    }
    
    public List<Booking> getBookingsByGarden(UUID gardenId) {
        return bookingRepository.findByGardenId(gardenId);
    }
    
    public Booking createBooking(Booking booking) {
        return bookingRepository.save(booking);
    }
    
    public Optional<Booking> updateBookingStatus(UUID id, String status) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus(status);
            return bookingRepository.save(booking);
        });
    }
    
    public Optional<Booking> confirmBooking(UUID id, String paymentMethod) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("confirmed");
            booking.setPaymentMethod(paymentMethod);
            return bookingRepository.save(booking);
        });
    }
    
    public Optional<Booking> cancelBooking(UUID id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("cancelled");
            return bookingRepository.save(booking);
        });
    }
    
    public boolean deleteBooking(UUID id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
