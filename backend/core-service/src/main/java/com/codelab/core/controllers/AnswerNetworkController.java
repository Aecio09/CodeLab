package com.codelab.core.controllers;

import com.codelab.core.dto.AnswerNetworkCreateRequest;
import com.codelab.core.dto.AnswerNetworkView;
import com.codelab.core.services.AnswerNetworkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/network-answers")
public class AnswerNetworkController {

    private final AnswerNetworkService answerNetworkService;

    public AnswerNetworkController(AnswerNetworkService answerNetworkService) {
        this.answerNetworkService = answerNetworkService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('USER')")
    public ResponseEntity<AnswerNetworkView> createAnswerNetwork(@Valid @RequestBody AnswerNetworkCreateRequest request, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(answerNetworkService.createAnswerNetwork(request, principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @answerNetworkService.getAnswerNetworkById(#id).userEmail() == authentication.name")
    public ResponseEntity<AnswerNetworkView> updateAnswerNetwork(@PathVariable long id,
                                                                 @Valid @RequestBody AnswerNetworkCreateRequest request, Principal principal) {
        return ResponseEntity.ok(answerNetworkService.updateAnswerNetwork(id, request, principal));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @answerNetworkService.getAnswerNetworkById(#id).userEmail() == authentication.name")
    public ResponseEntity<AnswerNetworkView> getAnswerNetworkById(@PathVariable long id) {
        return ResponseEntity.ok(answerNetworkService.getAnswerNetworkById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AnswerNetworkView>> getAllAnswerNetworks() {
        return ResponseEntity.ok(answerNetworkService.getAllAnswerNetworks());
    }

    @GetMapping("/user/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or @userRepository.findById(#id).orElse(new com.codelab.core.entities.User()).email == authentication.name")
    public ResponseEntity<List<AnswerNetworkView>> getAnswerNetworksByUserId(@PathVariable long id) {
        return ResponseEntity.ok(answerNetworkService.getUserAnswerNetworksById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteAnswerNetwork(@PathVariable long id) {
        answerNetworkService.deleteAnswerNetwork(id);
        return ResponseEntity.noContent().build();
    }
}