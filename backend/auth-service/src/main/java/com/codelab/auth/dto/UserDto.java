package com.codelab.auth.dto;

public record UserDto(Long id, String name, String email, String photo, String role, int userStreak, float userPoints) {}
