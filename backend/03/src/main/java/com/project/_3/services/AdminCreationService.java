package com.project._3.services;

import com.project._3.entities.Role;
import com.project._3.entities.User;
import com.project._3.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminCreationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminCreationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean createAdminIfNotExists() {
        Optional<User> existingAdmin =
                userRepository.findByEmail("admin@gmail.com");

        if (existingAdmin.isPresent()) {
            return false;
        }

        User admin = new User();
        admin.setName("admin");
        admin.setEmail("admin@gmail.com");
        admin.setPassword(passwordEncoder.encode("admin"));
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);

        return true;
    }
    public boolean createUserIfNotExist() {
        Optional<User> userExists = userRepository.findByEmail("user@gmail.com");

        if(userExists.isPresent()) {
            return false;
        }
        User simpleUser = new User();
        simpleUser.setName("firstUser");
        simpleUser.setEmail("user@gmail.com");
        simpleUser.setPassword(passwordEncoder.encode("user123"));
        simpleUser.setRole(Role.USER);
        simpleUser.setUserStreak(0);
        simpleUser.setUserPoints(0.0f);
        userRepository.save(simpleUser);

        return true;
    }
}
