package com.codelab.networkengine.cli;

public enum CliMode {
    USER(">"),
    PRIVILEGED("#"),
    CONFIG("(config)#"),
    CONFIG_INTERFACE("(config-if)#"),
    CONFIG_VLAN("(config-vlan)#"),
    ANY("");

    private final String suffix;

    CliMode(String suffix) {
        this.suffix = suffix;
    }

    public String getSuffix() {
        return suffix;
    }
}
