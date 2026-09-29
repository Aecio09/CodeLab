package com.codelab.networkengine.snapshot;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkSnapshot {
    private String deviceRefA;
    private String interfaceA;
    private String deviceRefB;
    private String interfaceB;
    /** UP (padrao) ou DOWN. Permite "cortar" o cabo pela UI. */
    private String status = "UP";
}
