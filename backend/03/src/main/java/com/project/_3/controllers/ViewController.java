package com.project._3.controllers;

import com.project._3.entities.User;
import com.project._3.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    private final UserRepository repository;

    public ViewController(UserRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/perfil")
    public String profile(Authentication authentication, Model model) {

        if (authentication == null) {
            return "redirect:/login";
        }

        if (authentication instanceof OAuth2AuthenticationToken token) {

            model.addAttribute("name", token.getPrincipal().getAttribute("name"));
            model.addAttribute("email", token.getPrincipal().getAttribute("email"));
            model.addAttribute("photo", token.getPrincipal().getAttribute("picture"));

        } else {

            User user = repository.findByEmail(authentication.getName())
                    .orElseThrow();

            model.addAttribute("name", user.getName());
            model.addAttribute("email", user.getEmail());
            String photo = user.getPhoto();

            if (photo == null || photo.isBlank()) {
                photo = "/images/default-image.png";
            }

            model.addAttribute("photo", photo);
        }

        return "user-profile";
    }

    @GetMapping("/login")
    public String login() {
        return "custom-login";
    }
}