package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NetworkInterface {
    private int id;
    private String name;
    private InterfaceType type;
    private String ipAddress;
    private String subnetMask;
    private String macAddress;
    private String description;
    private int speed;
    private Duplex duplex;
    private PortMode portMode;
    private Vlan vlan;
    private AdminState adminState;

    public enum InterfaceType {
        ETHERNET,
        FAST_ETHERNET,
        GIGABIT_ETHERNET,
        SERIAL,
        LOOPBACK
    }

    public enum Duplex {
        FULL,
        HALF
    }

    public enum PortMode {
        ACCESS,
        TRUNK
    }

    public enum AdminState {
        UP,
        DOWN
    }
}