package com.gardenspace.services;

import com.gardenspace.dto.AuthRequest;
import com.gardenspace.dto.AuthResponse;
import com.gardenspace.dto.RegisterRequest;
import com.gardenspace.models.User;
import com.gardenspace.repositories.UserRepository;
import com.gardenspace.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole("admin".equalsIgnoreCase(request.getRole()) 
            ? User.UserRole.ADMIN 
            : User.UserRole.USER);
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.from(token, user);
    }
    
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid login credentials"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid login credentials");
        }
        
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.from(token, user);
    }
    
    public Optional<AuthResponse> getCurrentUser(String token) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            if (!jwtUtil.validateToken(token)) {
                return Optional.empty();
            }
            
            UUID userId = jwtUtil.getUserIdFromToken(token);
            return userRepository.findById(userId)
                    .map(user -> AuthResponse.from(token, user));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
