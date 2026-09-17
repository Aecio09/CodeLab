package com.codelab.core.controllers;

import com.codelab.core.dto.QuestionCreateRequest;
import com.codelab.core.dto.QuestionSeedImportRequest;
import com.codelab.core.dto.QuestionSeedImportResponse;
import com.codelab.core.entities.Question;
import com.codelab.core.repositories.UserRepository;
import com.codelab.core.services.QuestionService;
import com.codelab.core.services.TrailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    private final QuestionService questionService;
    private final TrailService trailService;
    private final UserRepository userRepository;

    public QuestionController(QuestionService questionService, 
                               TrailService trailService,
                               UserRepository userRepository) {
        this.questionService = questionService;
        this.trailService = trailService;
        this.userRepository = userRepository;
    }

    @GetMapping("/next")
    public ResponseEntity<Question> getNextQuestion(@RequestParam("topic") Question.Topics topic, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return userRepository.findByEmail(principal.getName())
                .map(user -> {
                    var progress = trailService.getStudentProgress(user.getId());
                    var topicStatusOpt = progress.stream()
                            .filter(p -> p.topicName().equals(topic.name()))
                            .findFirst();

                    if (topicStatusOpt.isEmpty()) {
                        System.err.println("Topic not found in trail progress: " + topic.name());
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).<Question>build();
                    }

                    var topicStatus = topicStatusOpt.get();

                    if (topicStatus.status().equals("LOCKED")) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<Question>build();
                    }

                    var difficulty = questionService.determineDifficulty(topicStatus.currentLesson(), topicStatus.totalLessons());
                    
                    System.out.println("Searching next question for user " + user.getId() + " topic " + topic + " diff " + difficulty);

                    var nextQuestion = questionService.findNextQuestionForUser(user.getId(), topic, difficulty);
                    
                    if (nextQuestion.isEmpty()) {
                        System.out.println("No question found for ideal difficulty, trying fallback...");
                        for (Question.DifficultyLevel altDiff : Question.DifficultyLevel.values()) {
                            nextQuestion = questionService.findNextQuestionForUser(user.getId(), topic, altDiff);
                            if (nextQuestion.isPresent()) {
                                System.out.println("Found fallback question with difficulty: " + altDiff);
                                break;
                            }
                        }
                    }

                    return nextQuestion
                            .map(ResponseEntity::ok)
                            .orElseGet(() -> {
                                System.err.println("REALLY NO QUESTIONS FOUND for topic: " + topic);
                                return ResponseEntity.notFound().build();
                            });
                })
                .orElse(ResponseEntity.notFound().build());
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
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
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
        return ResponseEntity.status(HttpStatus.CREATED).body(new QuestionSeedImportResponse(0, "Seed import moved to ETL service"));
    }

    @PostMapping(value = "/import-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<QuestionSeedImportResponse> importUploadedFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new QuestionSeedImportResponse(0, "Seed import moved to ETL service"));
    }
}
