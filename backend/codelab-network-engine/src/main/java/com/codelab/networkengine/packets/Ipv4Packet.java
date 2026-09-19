package com.codelab.networkengine.packets;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Ipv4Packet implements FramePayload {
    private String sourceIp;
    private String destinationIp;
    private int ttl;
    private IcmpMessage icmp;
}