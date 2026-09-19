package com.codelab.networkengine.demo;

import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.simulation.DeviceFactory;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

public class RoutingLabDemo {

    public static void main(String[] args) {
        DeviceFactory factory = new DeviceFactory();
        NetworkEngine engine = new NetworkEngine();
        NetworkSession session = new NetworkSession();

        Computer pc1 = factory.computer("PC1", "10.0.1.10", "255.255.255.0");
        pc1.setDefaultGateway("10.0.1.1");
        Computer pc2 = factory.computer("PC2", "10.0.2.10", "255.255.255.0");
        pc2.setDefaultGateway("10.0.2.1");

        Router r1 = factory.router("R1");
        NetworkInterface r1Gi00 = factory.addInterface(r1, "gi0/0", "10.0.1.1", "255.255.255.0");
        NetworkInterface r1Gi01 = factory.addInterface(r1, "gi0/1", "10.0.3.1", "255.255.255.0");
        addStaticRoute(r1.getRoutingTable(), "10.0.2.0", "255.255.255.0", "10.0.3.2");

        Router r2 = factory.router("R2");
        NetworkInterface r2Gi00 = factory.addInterface(r2, "gi0/0", "10.0.3.2", "255.255.255.0");
        NetworkInterface r2Gi01 = factory.addInterface(r2, "gi0/1", "10.0.2.1", "255.255.255.0");
        addStaticRoute(r2.getRoutingTable(), "10.0.1.0", "255.255.255.0", "10.0.3.1");

        session.addDevice(pc1);
        session.addDevice(pc2);
        session.addDevice(r1);
        session.addDevice(r2);
        session.addLink(pc1.getInterfaces().get(0), r1Gi00);
        session.addLink(r1Gi01, r2Gi00);
        session.addLink(r2Gi01, pc2.getInterfaces().get(0));

        System.out.println("PC1 -> PC2 (2 rotas): " + engine.ping(session, pc1, "10.0.2.10"));
        System.out.println("PC2 -> PC1 (2 rotas): " + engine.ping(session, pc2, "10.0.1.10"));
        System.out.println("ARP PC1: " + pc1.getArpTable().getEntries().keySet());
        System.out.println("ARP R1 p/ 10.0.3.2: " + r1.getArpTable().getEntries().keySet());
    }

    private static void addStaticRoute(RoutingTable table, String network,
                                       String mask, String nextHop) {
        RoutingTable.RouteEntry entry = new RoutingTable.RouteEntry();
        entry.setSubnetMask(mask);
        entry.setNextHop(nextHop);
        entry.setMetric(1);
        entry.setType(RoutingTable.RouteEntry.RouteType.STATIC);
        table.getRoutes().put(network, entry);
    }
}