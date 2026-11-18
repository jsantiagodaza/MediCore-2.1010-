package com.medicore.api.sources;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class SourcesConfiguration {

    private RestClient cliente(int timeoutMs) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(timeoutMs);
        fabrica.setReadTimeout(timeoutMs);
        return RestClient.builder().requestFactory(fabrica).build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.sources.weather", name = "enabled", havingValue = "true")
    public AlertSource openMeteoAlertSource(
            ObjectMapper json,
            @Value("${app.sources.weather.url}") String url,
            @Value("${app.sources.weather.latitude}") double latitud,
            @Value("${app.sources.weather.longitude}") double longitud,
            @Value("${app.sources.weather.city}") String ciudad,
            @Value("${app.sources.weather.region}") String region,
            @Value("${app.sources.weather.calor-medio}") double calorMedio,
            @Value("${app.sources.weather.calor-alto}") double calorAlto,
            @Value("${app.sources.weather.frio-medio}") double frioMedio,
            @Value("${app.sources.weather.frio-alto}") double frioAlto,
            @Value("${app.sources.timeout-ms:8000}") int timeoutMs) {

        return new OpenMeteoAlertSource(cliente(timeoutMs), json, url,
                latitud, longitud, ciudad, region,
                calorMedio, calorAlto, frioMedio, frioAlto);
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.sources.ins", name = "enabled", havingValue = "true")
    public AlertSource insBulletinAlertSource(
            ObjectMapper json,
            @Value("${app.sources.ins.url}") String url,
            @Value("${app.sources.timeout-ms:8000}") int timeoutMs) {

        return new InsBulletinAlertSource(cliente(timeoutMs), json, url);
    }
}