package com.codelab.core.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    private Long id;

    private String name;
    private String email;
    private String role;

    private int userStreak;
    private LocalDateTime lastActivityDate;
    private float userPoints;
}
