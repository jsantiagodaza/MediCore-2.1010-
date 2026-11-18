package com.medicore.api.sources;

import java.util.List;

public interface AlertSource {

    String id();

    String nombre();

    List<ExternalAlert> consultar();
}