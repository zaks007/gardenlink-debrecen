package com.gardenspace.services;

import com.gardenspace.models.User;
import com.gardenspace.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public User createUser(User user) {
        return userRepository.save(user);
    }
    
    public Optional<User> updateUser(UUID id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getFullName() != null) {
                user.setFullName(userDetails.getFullName());
            }
            if (userDetails.getAvatarUrl() != null) {
                user.setAvatarUrl(userDetails.getAvatarUrl());
            }
            return userRepository.save(user);
        });
    }
}
