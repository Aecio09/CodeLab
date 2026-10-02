package com.codelab.networkengine.domain;

public enum DeviceModel {
    SWITCH("Switch 2960", "fa", 24),
    ROUTER("Router 1941", "gi", 4),
    HOST("Host Padrão", "eth", 1),
    FIREWALL("ASA 5505", "gi", 4);

    private final String displayName;
    private final String defaultPortPrefix;
    private final int defaultPortCount;

    DeviceModel(String displayName, String defaultPortPrefix, int defaultPortCount) {
        this.displayName = displayName;
        this.defaultPortPrefix = defaultPortPrefix;
        this.defaultPortCount = defaultPortCount;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDefaultPortPrefix() {
        return defaultPortPrefix;
    }

    public int getDefaultPortCount() {
        return defaultPortCount;
    }

    /** Nome da n-esima porta (1-based) no padrao do modelo: fa0/1, gi0/2, eth0. */
    public String portName(int index1Based) {
        if (this == HOST) {
            return defaultPortPrefix + (index1Based - 1);
        }
        return defaultPortPrefix + "0/" + index1Based;
    }
}