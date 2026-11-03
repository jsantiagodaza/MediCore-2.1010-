package com.medicore.api.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.User;
import com.medicore.api.models.UserSession;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findByTokenHash(String tokenHash);

    /** Sesiones activas (no revocadas y sin caducar) de un usuario. */
    List<UserSession> findByUserAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            User user, LocalDateTime ahora);
}
