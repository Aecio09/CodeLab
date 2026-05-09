package com.project._3.controllers;

import com.project._3.dto.QuestionCreateRequest;
import com.project._3.dto.QuestionSeedImportRequest;
import com.project._3.dto.QuestionSeedImportResponse;
import com.project._3.entities.Question;
import com.project._3.services.QuestionService;
import com.project._3.services.QuestionSeedImportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionSeedImportService questionSeedImportService;

    public QuestionController(QuestionService questionService, QuestionSeedImportService questionSeedImportService) {
        this.questionService = questionService;
        this.questionSeedImportService = questionSeedImportService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Question> createQuestion(@Valid @RequestBody QuestionCreateRequest request) {
        Question savedQuestion = questionService.createQuestion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestion);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Question> updateQuestion(@PathVariable long id,
                                                   @Valid @RequestBody QuestionCreateRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteQuestion(@PathVariable long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-seed")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<QuestionSeedImportResponse> importSeed(@Valid @RequestBody QuestionSeedImportRequest request) {
        QuestionSeedImportResponse response = questionSeedImportService.importFromResource(request.fileName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
