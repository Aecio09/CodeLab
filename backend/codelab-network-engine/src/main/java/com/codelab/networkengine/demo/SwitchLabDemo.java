package com.codelab.networkengine.demo;

import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.simulation.DeviceFactory;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

public class SwitchLabDemo {

    public static void main(String[] args) {
        DeviceFactory factory = new DeviceFactory();
        NetworkEngine engine = new NetworkEngine();
        NetworkSession session = new NetworkSession();

        Computer pc1 = factory.computer("PC1", "10.0.0.1", "255.255.255.0");
        Computer pc2 = factory.computer("PC2", "10.0.0.2", "255.255.255.0");
        Switch sw = factory.networkSwitch("SW1");

        NetworkInterface swPort1 = factory.addInterface(sw, "fa0/1", null, null);
        NetworkInterface swPort2 = factory.addInterface(sw, "fa0/2", null, null);

        session.addDevice(pc1);
        session.addDevice(pc2);
        session.addDevice(sw);
        session.addLink(pc1.getInterfaces().get(0), swPort1);
        session.addLink(pc2.getInterfaces().get(0), swPort2);

        System.out.println("PC1 -> PC2 (via switch):  " + engine.ping(session, pc1, "10.0.0.2"));
        System.out.println("PC2 -> PC1 (via switch):  " + engine.ping(session, pc2, "10.0.0.1"));

        System.out.println("MAC table SW1: " + sw.getMacAddressTable().getMacAddresses().keySet());
        System.out.println("ARP PC1: " + pc1.getArpTable().getEntries().keySet());
    }
}