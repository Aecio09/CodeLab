package com.project._3.controllers;

import com.project._3.dto.AnswerCreateRequest;
import com.project._3.entities.Answer;
import com.project._3.services.AnswerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/answers")
public class AnswerController {

    private final AnswerService answerService;

    public AnswerController(AnswerService answerService) {
        this.answerService = answerService;
    }

    @PostMapping
    public ResponseEntity<Answer> createAnswer(@Valid @RequestBody AnswerCreateRequest request, java.security.Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(answerService.createAnswer(request, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Answer> updateAnswer(@PathVariable long id,
                                               @Valid @RequestBody AnswerCreateRequest request, java.security.Principal principal) {
        return ResponseEntity.ok(answerService.updateAnswer(id, request, principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Answer> getAnswerById(@PathVariable long id) {
        return ResponseEntity.ok(answerService.getAnswerById(id));
    }

    @GetMapping
    public ResponseEntity<List<Answer>> getAllAnswers() {
        return ResponseEntity.ok(answerService.getAllAnswers());
    }
    @GetMapping("/user/{id}")
    public ResponseEntity<List<Answer>> getAnswerByUserId(@PathVariable long id) {
    return ResponseEntity.ok(answerService.getUserAnswersById(id));
  }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnswer(@PathVariable long id) {
        answerService.deleteAnswer(id);
        return ResponseEntity.noContent().build();
    }
}

