package com.codelab.networkengine.snapshot;

import com.codelab.networkengine.domain.DeviceModel;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class DeviceSnapshot {
    private String ref;
    private DeviceModel kind;
    private String hostname;
    private double x;
    private double y;
    private List<InterfaceSnapshot> interfaces = new ArrayList<>();
    private List<VlanSnapshot> vlans = new ArrayList<>();
    private List<RouteSnapshot> routes = new ArrayList<>();
    private String defaultGateway;
}
