package com.medicore.api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.medicore.api.models.SeasonAlert;

@Repository
public interface SeasonAlertRepository extends JpaRepository<SeasonAlert, Long>,
        JpaSpecificationExecutor<SeasonAlert> {

    @Query("select distinct a.category from SeasonAlert a where a.category is not null order by a.category")
    List<String> findDistinctCategories();

    @Query("select distinct a.region from SeasonAlert a where a.region is not null order by a.region")
    List<String> findDistinctRegions();

    @Query("select distinct a.city from SeasonAlert a where a.city is not null order by a.city")
    List<String> findDistinctCities();
}