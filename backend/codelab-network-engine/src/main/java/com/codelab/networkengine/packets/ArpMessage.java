package com.codelab.networkengine.packets;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArpMessage implements FramePayload {
    private ArpOperation operation;
    private String senderMac;
    private String senderIp;
    private String targetMac;
    private String targetIp;

    public enum ArpOperation {
        REQUEST,
        REPLY
    }
}