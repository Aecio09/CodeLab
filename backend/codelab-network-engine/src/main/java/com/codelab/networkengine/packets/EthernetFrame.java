package com.codelab.networkengine.packets;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EthernetFrame {
    public static final String BROADCAST_MAC = "ff:ff:ff:ff:ff:ff";

    private String destinationMac;
    private String sourceMac;
    private FramePayload payload;

    public EthernetFrame() {
    }

    public EthernetFrame(String destinationMac, String sourceMac, FramePayload payload) {
        this.destinationMac = destinationMac;
        this.sourceMac = sourceMac;
        this.payload = payload;
    }
}