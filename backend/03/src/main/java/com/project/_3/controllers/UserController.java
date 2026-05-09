package com.project._3.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.project._3.entities.User;
import com.project._3.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.UUID;


import java.security.Principal;

@Controller
public class UserController {

    @RequestMapping("/")
    public String home(){
        return "Testando";
    }

    @RequestMapping("/user")
    @ResponseBody
    public Principal user(Principal user){
        return user;
    }

    private final UserRepository repository;
    private final PasswordEncoder encoder;

    public UserController(UserRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    @PostMapping("/register")
    public String register(User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        repository.save(user);
        return "redirect:/login";
    }

    @GetMapping("/perfil/editar")
    public String editPage(Principal principal, org.springframework.ui.Model model) {

        User user = repository.findByEmail(principal.getName()).orElseThrow();

        model.addAttribute("user", user);

        return "edit-profile";
    }

    @PostMapping("/perfil/editar")
    public String updateUser(
            Principal principal,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String password
    ) {

        User user = repository.findByEmail(principal.getName()).orElseThrow();
        user.setName(name);
        user.setEmail(email);

        if (!password.isBlank()) {
            user.setPassword(encoder.encode(password));
        }

        repository.save(user);

        return "redirect:/perfil";
    }

    @PostMapping("/perfil/deletar")
    public String deleteUser(Principal principal) {

        User user = repository.findByEmail(principal.getName()).orElseThrow();

        repository.delete(user);

        return "redirect:/login?deleted";
    }

    @PostMapping("/upload-photo")
    public String uploadPhoto(
            @RequestParam("photo") MultipartFile file,
            Authentication authentication
    ) throws IOException {

        User user = repository.findByEmail(authentication.getName())
                .orElseThrow();

        String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();

        Path path = Paths.get("uploads");
        Files.createDirectories(path);

        Files.copy(
                file.getInputStream(),
                path.resolve(fileName),
                StandardCopyOption.REPLACE_EXISTING
        );

        user.setPhoto("/uploads/" + fileName);

        repository.save(user);

        return "redirect:/perfil";
    }
}
