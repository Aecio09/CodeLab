package com.codelab.networkengine.persistence;

import com.codelab.networkengine.snapshot.ExerciseSummary;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;

import java.util.List;
import java.util.Optional;

public interface SnapshotStore {
    void save(PlaygroundSnapshot snapshot);
    Optional<PlaygroundSnapshot> load(String exerciseId);
    List<ExerciseSummary> list();
    void delete(String exerciseId);
}
