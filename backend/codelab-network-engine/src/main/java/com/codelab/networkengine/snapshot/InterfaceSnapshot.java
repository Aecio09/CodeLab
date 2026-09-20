package com.codelab.networkengine.snapshot;

import com.codelab.networkengine.domain.NetworkInterface;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InterfaceSnapshot {
    private String name;
    private String ipAddress;
    private String subnetMask;
    private String description;
    private NetworkInterface.PortMode portMode;
    private Integer accessVlanId;
    private boolean adminUp = true;
}
