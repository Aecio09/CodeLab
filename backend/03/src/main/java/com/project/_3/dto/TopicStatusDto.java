package com.project._3.dto;

public record TopicStatusDto(
    String topicName,
    String status, // COMPLETED, AVAILABLE, LOCKED
    int currentLesson,
    int totalLessons,
    int activitiesInCurrentLesson, // 0, 1 or 2
    int totalActivitiesCompleted
) {}
