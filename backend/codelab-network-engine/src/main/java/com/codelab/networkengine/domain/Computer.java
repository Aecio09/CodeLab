package com.codelab.networkengine.domain;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Computer extends Device {
    private String defaultGateway;
    private RoutingTable routingTable;
    private ArpTable arpTable;
}