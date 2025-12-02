package com.gardenspace.repositories;

import com.gardenspace.models.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    
    List<Booking> findByUserId(UUID userId);
    
    List<Booking> findByGardenId(UUID gardenId);
    
    List<Booking> findByUserIdAndStatus(UUID userId, String status);
    
    List<Booking> findByGardenIdAndStatus(UUID gardenId, String status);
}
