package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public abstract class Device {

    private int id;
    private String hostname;
    private DeviceModel model;
    private List<NetworkInterface> interfaces = new ArrayList<>();
}