package com.codelab.core.security;

import com.codelab.core.entities.User;
import com.codelab.core.repositories.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtValidator jwtValidator;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtValidator jwtValidator, UserRepository userRepository) {
        this.jwtValidator = jwtValidator;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtValidator.validateToken(token)) {
                Claims claims = jwtValidator.extractClaims(token);
                String email = claims.getSubject();
                String role = claims.get("role", String.class);

                var authorities = List.of(new SimpleGrantedAuthority(role != null ? role : "ROLE_USER"));
                var authentication = new UsernamePasswordAuthenticationToken(email, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                syncUser(claims);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void syncUser(Claims claims) {
        String email = claims.getSubject();
        if (email == null || email.isBlank()) return;

        if (userRepository.findByEmail(email).isPresent()) return;

        User user = new User();
        Number userId = claims.get("user_id", Number.class);
        if (userId != null) {
            user.setId(userId.longValue());
        }
        user.setEmail(email);
        user.setName(email);
        user.setRole(claims.get("role", String.class) != null ? claims.get("role", String.class) : "USER");
        user.setUserStreak(0);
        user.setUserPoints(0f);

        userRepository.save(user);
        System.out.println("[JwtAuthenticationFilter] Usuário sincronizado no core_db: " + email);
    }
}
