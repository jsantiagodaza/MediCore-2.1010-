package com.medicore.api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.AlertSourceRun;

@Repository
public interface AlertSourceRunRepository extends JpaRepository<AlertSourceRun, Long> {

    List<AlertSourceRun> findAllByOrderByStartedAtDesc();

    Optional<AlertSourceRun> findTopBySourceIdOrderByStartedAtDesc(String sourceId);
}