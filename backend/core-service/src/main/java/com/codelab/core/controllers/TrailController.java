package com.codelab.core.controllers;

import com.codelab.core.dto.TopicStatusDto;
import com.codelab.core.entities.User;
import com.codelab.core.repositories.UserRepository;
import com.codelab.core.services.TrailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/trail")
public class TrailController {

    private final TrailService trailService;
    private final UserRepository userRepository;

    public TrailController(TrailService trailService, UserRepository userRepository) {
        this.trailService = trailService;
        this.userRepository = userRepository;
    }

    @GetMapping("/progress")
    public ResponseEntity<List<TopicStatusDto>> getMyProgress(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        return userRepository.findByEmail(principal.getName())
                .map(User::getId)
                .map(id -> ResponseEntity.ok(trailService.getStudentProgress(id)))
                .orElse(ResponseEntity.notFound().build());
    }
}
