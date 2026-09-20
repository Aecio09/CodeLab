package com.codelab.networkengine.persistence;

import com.codelab.networkengine.snapshot.ExerciseSummary;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class FileSnapshotStore implements SnapshotStore {

    private static final Logger log = LoggerFactory.getLogger(FileSnapshotStore.class);

    private final ObjectMapper mapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);

    @Value("${playground.storage-dir:${user.home}/.codelab/playground}")
    private String storageDir;

    @Value("${playground.snapshot-ttl-days:7}")
    private int ttlDays;

    private Path baseDir;

    @PostConstruct
    void init() throws IOException {
        baseDir = Path.of(storageDir);
        Files.createDirectories(baseDir);
    }

    @Override
    public void save(PlaygroundSnapshot snapshot) {
        try {
            Path dir = baseDir.resolve(snapshot.getExerciseId());
            Files.createDirectories(dir);
            Path tmp = dir.resolve("snapshot.json.tmp");
            Path target = dir.resolve("snapshot.json");
            mapper.writeValue(tmp.toFile(), snapshot);
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new RuntimeException("falha ao salvar snapshot: " + snapshot.getExerciseId(), e);
        }
    }

    @Override
    public Optional<PlaygroundSnapshot> load(String exerciseId) {
        Path file = baseDir.resolve(exerciseId).resolve("snapshot.json");
        if (!Files.exists(file)) {
            return Optional.empty();
        }
        try {
            return Optional.of(mapper.readValue(file.toFile(), PlaygroundSnapshot.class));
        } catch (IOException e) {
            throw new RuntimeException("falha ao carregar snapshot: " + exerciseId, e);
        }
    }

    @Override
    public List<ExerciseSummary> list() {
        List<ExerciseSummary> result = new ArrayList<>();
        if (!Files.isDirectory(baseDir)) {
            return result;
        }
        try (var stream = Files.list(baseDir)) {
            for (Path dir : stream.toList()) {
                Path file = dir.resolve("snapshot.json");
                if (Files.exists(file)) {
                    try {
                        PlaygroundSnapshot snap = mapper.readValue(file.toFile(), PlaygroundSnapshot.class);
                        long mtime = Files.getLastModifiedTime(file).toMillis();
                        result.add(new ExerciseSummary(snap.getExerciseId(), snap.getName(), mtime));
                    } catch (IOException e) {
                        log.warn("ignorando snapshot corrupto: {}", dir.getFileName());
                    }
                }
            }
        } catch (IOException e) {
            log.warn("falha ao listar snapshots", e);
        }
        result.sort(Comparator.comparing(ExerciseSummary::getUpdatedAt).reversed());
        return result;
    }

    @Override
    public void delete(String exerciseId) {
        try {
            Path dir = baseDir.resolve(exerciseId);
            if (Files.isDirectory(dir)) {
                deleteRecursive(dir);
            }
        } catch (IOException e) {
            log.warn("falha ao deletar snapshot: {}", exerciseId, e);
        }
    }

    @Scheduled(fixedDelay = 3600000)
    void cleanupExpired() {
        if (!Files.isDirectory(baseDir)) {
            return;
        }
        long cutoff = Instant.now().toEpochMilli() - ((long) ttlDays * 24 * 60 * 60 * 1000);
        try (var stream = Files.list(baseDir)) {
            for (Path dir : stream.toList()) {
                Path file = dir.resolve("snapshot.json");
                if (Files.exists(file) && Files.getLastModifiedTime(file).toMillis() < cutoff) {
                    log.info("removendo snapshot expirado: {}", dir.getFileName());
                    deleteRecursive(dir);
                }
            }
        } catch (IOException e) {
            log.warn("falha na limpeza de snapshots", e);
        }
    }

    private void deleteRecursive(Path path) throws IOException {
        if (Files.isDirectory(path)) {
            try (var stream = Files.list(path)) {
                for (Path child : stream.toList()) {
                    deleteRecursive(child);
                }
            }
        }
        Files.deleteIfExists(path);
    }
}
