package com.codelab.networkengine.domain;

import java.util.List;

public abstract class Device {

    private int id;
    private String hostname;
    private DeviceModel model;
    private List<NetworkInterface> interfaces;
}