package com.codelab.networkengine.packets;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IcmpMessage {
    private IcmpType type;
    private int identifier;
    private int sequenceNumber;
    private long timestamp;

    public enum IcmpType {
        ECHO_REQUEST,
        ECHO_REPLY
    }
}