package com.codelab.networkengine.controller;

import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.persistence.SnapshotStore;
import com.codelab.networkengine.session.SessionContext;
import com.codelab.networkengine.session.SessionManager;
import com.codelab.networkengine.session.SnapshotMapper;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionManager sessionManager;
    private final SnapshotStore store;

    public SessionController(SessionManager sessionManager, SnapshotStore store) {
        this.sessionManager = sessionManager;
        this.store = store;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(@RequestBody CreateSessionRequest req) {
        try {
            SessionContext ctx = sessionManager.create(req.exerciseId(), store);
            return ResponseEntity.ok(new SessionResponse(ctx.getSessionId(), ctx.getExerciseId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{sessionId}/cli")
    public ResponseEntity<CliResponse> cli(@PathVariable String sessionId, @RequestBody CliRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        DeviceCli cli = ctx.getCliByRef().get(req.deviceRef());
        if (cli == null) {
            return ResponseEntity.badRequest().build();
        }
        String output = cli.execute(req.line());
        return ResponseEntity.ok(new CliResponse(req.deviceRef(), cli.prompt(), output));
    }

    @GetMapping("/{sessionId}/snapshot")
    public ResponseEntity<PlaygroundSnapshot> snapshot(@PathVariable String sessionId) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot stored = store.load(ctx.getExerciseId()).orElse(null);
        if (stored == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(SnapshotMapper.mergeLiveConfig(stored, ctx));
    }

    @PostMapping("/{sessionId}/save")
    public ResponseEntity<PlaygroundSnapshot> save(@PathVariable String sessionId) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot stored = store.load(ctx.getExerciseId()).orElse(null);
        if (stored == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot merged = SnapshotMapper.mergeLiveConfig(stored, ctx);
        store.save(merged);
        return ResponseEntity.ok(merged);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> destroy(@PathVariable String sessionId) {
        if (sessionManager.get(sessionId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        sessionManager.destroy(sessionId);
        return ResponseEntity.noContent().build();
    }

    public record CreateSessionRequest(String exerciseId) {}
    public record SessionResponse(String sessionId, String exerciseId) {}
    public record CliRequest(String deviceRef, String line) {}
    public record CliResponse(String deviceRef, String prompt, String output) {}
}
