package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.TreeMap;

@Getter
@Setter
public class RoutingTable {
    private Map<String, RouteEntry> routes = new TreeMap<>();

    @Getter
    @Setter
    public static class RouteEntry {
        private String subnetMask;
        private String nextHop;
        private String interfaceName;
        private int metric;
        private RouteType type;

        public boolean isDirectlyConnected() {
            return type == RouteType.CONNECTED;
        }

        public enum RouteType {
            CONNECTED,
            STATIC,
            RIP,
            OSPF,
            EIGRP
        }
    }
}