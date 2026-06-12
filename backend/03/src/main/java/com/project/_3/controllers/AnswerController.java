package com.project._3.controllers;

import com.project._3.dto.AnswerCreateRequest;
import com.project._3.entities.Answer;
import com.project._3.services.AnswerService;
import com.project._3.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/answers")
public class AnswerController {

    private final AnswerService answerService;
    private final UserRepository userRepository;

    public AnswerController(AnswerService answerService, UserRepository userRepository) {
        this.answerService = answerService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<Answer> createAnswer(@Valid @RequestBody AnswerCreateRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(answerService.createAnswer(request, principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @answerService.getAnswerById(#id).user.email == authentication.name")
    public ResponseEntity<Answer> updateAnswer(@PathVariable long id,
                                               @Valid @RequestBody AnswerCreateRequest request, Principal principal) {
        return ResponseEntity.ok(answerService.updateAnswer(id, request, principal));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @answerService.getAnswerById(#id).user.email == authentication.name")
    public ResponseEntity<Answer> getAnswerById(@PathVariable long id) {
        return ResponseEntity.ok(answerService.getAnswerById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Answer>> getAllAnswers() {
        return ResponseEntity.ok(answerService.getAllAnswers());
    }

    @GetMapping("/user/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @userRepository.findById(#id).orElse(new com.project._3.entities.User()).email == authentication.name")
    public ResponseEntity<List<Answer>> getAnswerByUserId(@PathVariable long id) {
        return ResponseEntity.ok(answerService.getUserAnswersById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteAnswer(@PathVariable long id) {
        answerService.deleteAnswer(id);
        return ResponseEntity.noContent().build();
    }
}
