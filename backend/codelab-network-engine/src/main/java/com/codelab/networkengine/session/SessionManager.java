package com.codelab.networkengine.session;

import com.codelab.networkengine.persistence.SnapshotStore;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionManager {

    private static final Logger log = LoggerFactory.getLogger(SessionManager.class);

    private final ConcurrentHashMap<String, SessionContext> sessions = new ConcurrentHashMap<>();

    @Value("${playground.session-idle-minutes:30}")
    private int idleMinutes;

    public SessionContext create(String exerciseId, SnapshotStore store) {
        Optional<PlaygroundSnapshot> snap = store.load(exerciseId);
        if (snap.isEmpty()) {
            throw new IllegalArgumentException("exercicio nao encontrado: " + exerciseId);
        }
        String sessionId = UUID.randomUUID().toString();
        SessionContext ctx = new SessionContext(sessionId, exerciseId);
        SnapshotMapper.buildFromSnapshot(ctx, snap.get());
        sessions.put(sessionId, ctx);
        log.info("sessao criada: {} para exercise {}", sessionId, exerciseId);
        return ctx;
    }

    public Optional<SessionContext> get(String sessionId) {
        SessionContext ctx = sessions.get(sessionId);
        if (ctx != null) {
            ctx.touch();
        }
        return Optional.ofNullable(ctx);
    }

    public void destroy(String sessionId) {
        sessions.remove(sessionId);
        log.info("sessao destruida: {}", sessionId);
    }

    @Scheduled(fixedDelay = 60000)
    void evictIdle() {
        long thresholdNanos = (long) idleMinutes * 60L * 1_000_000_000L;
        sessions.entrySet().removeIf(entry -> {
            if (entry.getValue().idleNanos(thresholdNanos)) {
                log.info("sessao expirada: {} (idle > {} min)", entry.getKey(), idleMinutes);
                return true;
            }
            return false;
        });
    }
}
