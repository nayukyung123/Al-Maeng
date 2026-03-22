package com.almaeng.global.auth;


import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final String secretKeyPlain;
    private final long accessExpiration;
    @Getter
    private final long refreshExpiration;
    private SecretKey key;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secretKeyPlain,
            @Value("${jwt.access-expiration}") long accessExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.secretKeyPlain = secretKeyPlain;
        this.accessExpiration = accessExpiration;
        this.refreshExpiration = refreshExpiration;
    }
    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyPlain.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userId) {
        return createToken(userId, accessExpiration);
    }

    public String createRefreshToken(Long userId) {
        return createToken(userId, refreshExpiration);
    }

    private String createToken(Long userId, long expirationTime) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString()) // 토큰의 주인
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationTime))
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.info("잘못된 JWT 토큰: {}", e.getMessage());
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        String subject = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject();
        return Long.parseLong(subject);
    }

    public Long getExpiration(String token) {
        Date expiration = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getExpiration();
        long now = new Date().getTime();
        return (expiration.getTime() - now);
    }
}
