package com.medicore.api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.NotificationDelivery;
import com.medicore.api.models.SeasonAlert;
import com.medicore.api.models.User;

@Repository
public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, Long> {

    List<NotificationDelivery> findByUserOrderByCreatedAtDesc(User user);

    Optional<NotificationDelivery> findByUserAndAlert(User user, SeasonAlert alert);
}