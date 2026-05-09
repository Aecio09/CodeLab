package com.project._3.controllers;

import com.project._3.dto.UserDto;
import com.project._3.entities.Role;
import com.project._3.entities.User;
import com.project._3.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    public UserController(UserRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        return repository.findByEmail(principal.getName())
                .map(u -> new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhoto(), u.getRole().name()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.valueOf("USER"));
        repository.save(user);
        return ResponseEntity.ok("Usuário registrado com sucesso");
    }

    @PutMapping("/perfil")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<UserDto> updateUser(Principal principal, @RequestBody Map<String, String> updates) {
        User u = repository.findByEmail(principal.getName()).orElseThrow();
        
        if (updates.containsKey("name")) u.setName(updates.get("name"));
        if (updates.containsKey("email")) u.setEmail(updates.get("email"));
        if (updates.containsKey("password") && !updates.get("password").isBlank()) {
            u.setPassword(encoder.encode(updates.get("password")));
        }

        repository.save(u);
        return ResponseEntity.ok(new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhoto(), u.getRole().name()));
    }

    @DeleteMapping("/perfil")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<Void> deleteUser(Principal principal) {
        User user = repository.findByEmail(principal.getName()).orElseThrow();
        repository.delete(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-photo")
    @PreAuthorize("hasAuthority('ADMIN') or #principal.name == authentication.name")
    public ResponseEntity<String> uploadPhoto(@RequestParam("photo") MultipartFile file, Authentication authentication) throws IOException {
        User user = repository.findByEmail(authentication.getName()).orElseThrow();
        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path path = Paths.get("uploads");
        Files.createDirectories(path);
        Files.copy(file.getInputStream(), path.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        
        user.setPhoto("/uploads/" + fileName);
        repository.save(user);
        return ResponseEntity.ok(user.getPhoto());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
             return ResponseEntity.ok(repository.findAll().stream()
                            .map(u -> new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhoto(), u.getRole().name()))
                             .toList());
    }
}
