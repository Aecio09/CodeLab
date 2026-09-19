package com.codelab.networkengine.demo;

import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.simulation.DeviceFactory;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;
import com.codelab.networkengine.simulation.PingResult;

public class ScenarioDemo {

    public static void main(String[] args) {
        NetworkEngine engine = new NetworkEngine();
        NetworkSession session = new NetworkSession();
        DeviceFactory factory = new DeviceFactory();

        Computer pc1 = factory.computer("PC1", "10.0.0.1", "255.255.255.0");
        Computer pc2 = factory.computer("PC2", "10.0.0.2", "255.255.255.0");
        session.addDevice(pc1);
        session.addDevice(pc2);
        session.addLink(pc1.getInterfaces().get(0), pc2.getInterfaces().get(0));

        PingResult result = engine.ping(session, pc1, "10.0.0.2");
        System.out.println(result);

        System.out.println("ARP PC1: " + pc1.getArpTable().getEntries().keySet());
    }
}