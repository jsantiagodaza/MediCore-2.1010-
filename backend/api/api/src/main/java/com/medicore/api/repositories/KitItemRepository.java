package com.medicore.api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.KitItem;
import com.medicore.api.models.Medicine;
import com.medicore.api.models.User;

@Repository
public interface KitItemRepository extends JpaRepository<KitItem, Long> {

    List<KitItem> findByUserOrderByMedicineNameAsc(User user);

    Optional<KitItem> findByUserAndMedicine(User user, Medicine medicine);

    boolean existsByUserAndMedicine(User user, Medicine medicine);
}