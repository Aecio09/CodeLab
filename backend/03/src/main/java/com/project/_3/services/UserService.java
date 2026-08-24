package com.project._3.services;

import com.project._3.dto.UserDto;
import com.project._3.entities.Role;
import com.project._3.entities.User;
import com.project._3.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    public Optional<UserDto> getCurrentUser(String email) {
        return repository.findByEmail(email).map(this::toDtoWithEffectiveStreak);
    }

    public void register(User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.valueOf("USER"));
        repository.save(user);
    }

    public UserDto updateUser(String email, Map<String, String> updates) {
        User u = findByEmail(email);

        if (updates.containsKey("name")) u.setName(updates.get("name"));
        if (updates.containsKey("email")) u.setEmail(updates.get("email"));
        if (updates.containsKey("password") && !updates.get("password").isBlank()) {
            u.setPassword(encoder.encode(updates.get("password")));
        }

        return toDto(repository.save(u));
    }

    public void deleteUser(String email) {
        repository.delete(findByEmail(email));
    }

    public String uploadPhoto(MultipartFile file, String email) throws IOException {
        User user = findByEmail(email);
        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path path = Paths.get("uploads");
        Files.createDirectories(path);
        Files.copy(file.getInputStream(), path.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

        user.setPhoto("/uploads/" + fileName);
        repository.save(user);
        return user.getPhoto();
    }

    public List<UserDto> getAllUsers() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    private User findByEmail(String email) {
        return repository.findByEmail(email).orElseThrow();
    }

    private UserDto toDtoWithEffectiveStreak(User u) {
        int effectiveStreak = u.getUserStreak();
        if (u.getLastActivityDate() != null) {
            LocalDate last = u.getLastActivityDate().toLocalDate();
            LocalDate today = LocalDate.now();
            if (ChronoUnit.DAYS.between(last, today) > 1) {
                effectiveStreak = 0;
            }
        }
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhoto(), u.getRole().name(), effectiveStreak, u.getUserPoints());
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhoto(), u.getRole().name(), u.getUserStreak(), u.getUserPoints());
    }
}
