package com.codelab.networkengine.snapshot;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteSnapshot {
    private String network;
    private String subnetMask;
    private String nextHop;
}
