package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Link {
    private int id;
    private NetworkInterface interfaceA;
    private NetworkInterface interfaceB;
    private LinkStatus status;

    public enum LinkStatus {
        UP,
        DOWN
    }
}