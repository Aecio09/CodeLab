package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Router extends Device {
    private RoutingTable routingTable;
    private ArpTable arpTable;
}