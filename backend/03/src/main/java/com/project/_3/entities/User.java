package com.project._3.entities;
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String photo;

    private String email;
    private String password;

    private int userStreak;
    private LocalDateTime lastActivityDate;

    private float userPoints;

    @Enumerated(EnumType.STRING)
    private Role role;

}
