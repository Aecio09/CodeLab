package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class Switch extends Device {

    private Map<Integer, Vlan> vlans;
    private MacAddressTable macAddressTable;
}