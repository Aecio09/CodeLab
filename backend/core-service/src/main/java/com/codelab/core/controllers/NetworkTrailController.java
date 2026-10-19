package com.codelab.core.controllers;

import com.codelab.core.dto.NetworkTrailResponse;
import com.codelab.core.entities.User;
import com.codelab.core.repositories.UserRepository;
import com.codelab.core.services.NetworkTrailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/network-trail")
public class NetworkTrailController {

    private final NetworkTrailService networkTrailService;
    private final UserRepository userRepository;

    public NetworkTrailController(NetworkTrailService networkTrailService, UserRepository userRepository) {
        this.networkTrailService = networkTrailService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<NetworkTrailResponse> getMyTrail(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(networkTrailService.getTrail(user.getId()));
    }
}
