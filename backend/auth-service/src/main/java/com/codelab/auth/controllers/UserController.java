package com.codelab.auth.controllers;

import com.codelab.auth.dto.UserDto;
import com.codelab.auth.entities.User;
import com.codelab.auth.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        return userService.getCurrentUser(principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<java.util.Map<String, String>> login(@RequestBody java.util.Map<String, String> loginRequest) {
        String token = userService.login(loginRequest.get("email"), loginRequest.get("password"));
        return ResponseEntity.ok(java.util.Map.of("token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        userService.register(user);
        return ResponseEntity.ok("Usuário registrado com sucesso");
    }

    @PutMapping("/perfil")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<UserDto> updateUser(Principal principal, @RequestBody java.util.Map<String, String> updates) {
        return ResponseEntity.ok(userService.updateUser(principal.getName(), updates));
    }

    @DeleteMapping("/perfil")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<Void> deleteUser(Principal principal) {
        userService.deleteUser(principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-photo")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<String> uploadPhoto(@RequestParam("photo") MultipartFile file, Principal principal) throws IOException {
        return ResponseEntity.ok(userService.uploadPhoto(file, principal.getName()));
    }

    @DeleteMapping("/photo")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<UserDto> deletePhoto(Principal principal) {
        return ResponseEntity.ok(userService.removePhoto(principal.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<java.util.List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
