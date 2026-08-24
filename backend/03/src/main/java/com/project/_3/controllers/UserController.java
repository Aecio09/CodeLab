package com.project._3.controllers;

import com.project._3.dto.UserDto;
import com.project._3.entities.User;
import com.project._3.services.UserService;
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

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<java.util.List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
