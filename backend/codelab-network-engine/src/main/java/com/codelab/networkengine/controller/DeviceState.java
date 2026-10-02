package com.codelab.networkengine.controller;

import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.MacAddressTable;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.protocols.routing.IpMath;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public record DeviceState(
        String ref,
        String hostname,
        String kind,
        List<ArpRow> arp,
        List<MacRow> macTable,
        List<RouteRow> routes,
        List<VlanRow> vlans,
        String defaultGateway) {

    public static DeviceState of(Device dev) {
        List<ArpRow> arp = new ArrayList<>();
        ArpTable table = arpOf(dev);
        if (table != null && table.getEntries() != null) {
            for (Map.Entry<String, ArpTable.ArpEntry> e : table.getEntries().entrySet()) {
                ArpTable.ArpEntry v = e.getValue();
                arp.add(new ArpRow(e.getKey(), v.getMacAddress(), v.getInterfaceName(),
                        ageOf(v.getTimestamp()), v.getType().name()));
            }
        }

        List<MacRow> macs = new ArrayList<>();
        if (dev instanceof Switch sw && sw.getMacAddressTable() != null
                && sw.getMacAddressTable().getMacAddresses() != null) {
            // O MAC e a chave do mapa; o objeto so guarda interface/vlan.
            for (Map.Entry<String, MacAddressTable.MacAddress> e
                    : sw.getMacAddressTable().getMacAddresses().entrySet()) {
                MacAddressTable.MacAddress v = e.getValue();
                macs.add(new MacRow(e.getKey(), v.getInterfaceName(),
                        v.getVlan() != null ? v.getVlan().getId() : 1,
                        ageOf(v.getTimestamp()), v.getType().name()));
            }
        }

        List<RouteRow> routes = new ArrayList<>();
        RoutingTable rt = dev instanceof Router r ? r.getRoutingTable()
                : (dev instanceof Computer c ? c.getRoutingTable() : null);
        if (rt != null && rt.getRoutes() != null) {
            for (Map.Entry<String, RoutingTable.RouteEntry> e : rt.getRoutes().entrySet()) {
                RoutingTable.RouteEntry v = e.getValue();
                routes.add(new RouteRow(e.getKey(),
                        v.getSubnetMask() != null ? String.valueOf(IpMath.prefixLength(v.getSubnetMask())) : "",
                        v.getNextHop(), v.getInterfaceName(), v.getMetric(), v.getType().name()));
            }
        }
        for (NetworkInterface intf : dev.getInterfaces()) {
            if (intf.getIpAddress() == null || intf.getSubnetMask() == null) {
                continue;
            }
            String net = IpMath.networkOf(intf.getIpAddress(), intf.getSubnetMask());
            if (routes.stream().noneMatch(r -> r.network().equals(net))) {
                routes.add(new RouteRow(net, String.valueOf(IpMath.prefixLength(intf.getSubnetMask())),
                        null, intf.getName(), 0, "CONNECTED"));
            }
        }

        List<VlanRow> vlans = new ArrayList<>();
        if (dev instanceof Switch sw && sw.getVlans() != null) {
            for (Vlan v : sw.getVlans().values()) {
                vlans.add(new VlanRow(v.getId(), v.getName()));
            }
        }

        return new DeviceState(null, dev.getHostname(), dev.getModel().name(),
                arp, macs, routes, vlans,
                dev instanceof Computer c ? c.getDefaultGateway() : null);
    }

    private static ArpTable arpOf(Device dev) {
        if (dev instanceof Computer c) {
            return c.getArpTable();
        }
        if (dev instanceof Router r) {
            return r.getArpTable();
        }
        return null;
    }

    private static long ageOf(LocalDateTime ts) {
        return ts == null ? 0 : Duration.between(ts, LocalDateTime.now()).getSeconds();
    }

    public record ArpRow(String ip, String mac, String iface, long ageSeconds, String type) {}
    public record MacRow(String mac, String iface, int vlan, long ageSeconds, String type) {}
    public record RouteRow(String network, String prefix, String nextHop, String iface, int metric, String type) {}
    public record VlanRow(int id, String name) {}
}
