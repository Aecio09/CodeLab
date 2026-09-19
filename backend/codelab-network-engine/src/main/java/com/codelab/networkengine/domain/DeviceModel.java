package com.codelab.networkengine.domain;

public enum DeviceModel {
    SWITCH("Switch 2960", "fa"),
    ROUTER("Router 1941", "gi"),
    HOST("Host Padrão", "eth"),
    FIREWALL("ASA 5505", "gi");

    private final String displayName;
    private final String defaultPortPrefix;

    DeviceModel(String displayName, String defaultPortPrefix) {
        this.displayName = displayName;
        this.defaultPortPrefix = defaultPortPrefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDefaultPortPrefix() {
        return defaultPortPrefix;
    }
}