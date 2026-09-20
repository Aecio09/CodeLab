package com.codelab.networkengine.snapshot;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExerciseSummary {
    private String exerciseId;
    private String name;
    private long updatedAt;
}
