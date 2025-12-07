package com.gardenspace.dto;

import com.gardenspace.models.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;
    
    @Data
    @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String email;
        private String fullName;
        private String role;
        private String avatarUrl;
    }
    
    public static AuthResponse from(String token, User user) {
        return new AuthResponse(
            token,
            new UserDto(
                user.getId().toString(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name().toLowerCase(),
                user.getAvatarUrl()
            )
        );
    }
}
