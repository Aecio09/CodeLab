package com.codelab.core.controllers;

import com.codelab.core.dto.QuestionNetworkCreateRequest;
import com.codelab.core.dto.StartNetworkQuestionResponse;
import com.codelab.core.dto.SubmitNetworkQuestionRequest;
import com.codelab.core.dto.SubmitNetworkQuestionResponse;
import com.codelab.core.entities.QuestionNetwork;
import com.codelab.core.services.QuestionNetworkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/network-questions")
public class QuestionNetworkController {

    private final QuestionNetworkService questionNetworkService;

    public QuestionNetworkController(QuestionNetworkService questionNetworkService) {
        this.questionNetworkService = questionNetworkService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<QuestionNetwork> createQuestionNetwork(@Valid @RequestBody QuestionNetworkCreateRequest request) {
        QuestionNetwork saved = questionNetworkService.createQuestionNetwork(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<StartNetworkQuestionResponse> startQuestionNetwork(
            @PathVariable long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(questionNetworkService.startQuestionNetwork(id, authHeader));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<SubmitNetworkQuestionResponse> submitQuestionNetwork(
            @PathVariable long id,
            @Valid @RequestBody SubmitNetworkQuestionRequest request,
            @RequestHeader("Authorization") String authHeader,
            Principal principal) {
        return ResponseEntity.ok(questionNetworkService.submitQuestionNetwork(
                id, request.sessionId(), authHeader, principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<QuestionNetwork> updateQuestionNetwork(@PathVariable long id,
                                                                 @Valid @RequestBody QuestionNetworkCreateRequest request) {
        return ResponseEntity.ok(questionNetworkService.updateQuestionNetwork(id, request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<List<QuestionNetwork>> getAllQuestionNetworks() {
        return ResponseEntity.ok(questionNetworkService.getAllQuestionNetworks());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<QuestionNetwork> getQuestionNetworkById(@PathVariable long id) {
        return ResponseEntity.ok(questionNetworkService.getQuestionNetworkById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteQuestionNetwork(@PathVariable long id) {
        questionNetworkService.deleteQuestionNetwork(id);
        return ResponseEntity.noContent().build();
    }
}