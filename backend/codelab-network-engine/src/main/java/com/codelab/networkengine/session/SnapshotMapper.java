package com.codelab.networkengine.session;

import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.*;
import com.codelab.networkengine.snapshot.*;
import com.codelab.networkengine.simulation.DeviceFactory;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

public class SnapshotMapper {

    private SnapshotMapper() {
    }

    public static void buildFromSnapshot(SessionContext ctx, PlaygroundSnapshot snapshot) {
        if (snapshot.getDevices() != null) {
            for (DeviceSnapshot ds : snapshot.getDevices()) {
                addDeviceToContext(ctx, ds);
            }
        }
        if (snapshot.getLinks() != null) {
            for (LinkSnapshot ls : snapshot.getLinks()) {
                connectInContext(ctx, ls);
            }
        }
    }

    public static void addDeviceToContext(SessionContext ctx, DeviceSnapshot ds) {
        DeviceFactory factory = ctx.getFactory();
        String hostname = (ds.getHostname() != null && !ds.getHostname().isBlank())
                ? ds.getHostname() : defaultHostname(ds);

        Device dev = switch (ds.getKind()) {
            case HOST -> {
                Computer c = factory.computerWithoutInterface(hostname);
                yield c;
            }
            case SWITCH -> factory.networkSwitch(hostname);
            case ROUTER -> factory.router(hostname);
            default -> throw new IllegalArgumentException("tipo nao suportado: " + ds.getKind());
        };

        ctx.getSession().addDevice(dev);
        ctx.getDeviceByRef().put(ds.getRef(), dev);

        if (dev instanceof Switch sw && ds.getVlans() != null && !ds.getVlans().isEmpty()) {
            sw.getVlans().clear();
            for (VlanSnapshot vs : ds.getVlans()) {
                Vlan v = new Vlan();
                v.setId(vs.getId());
                v.setName(vs.getName());
                sw.getVlans().put(v.getId(), v);
            }
        }
        if (dev instanceof Switch sw) {
            sw.getVlans().computeIfAbsent(1, id -> {
                Vlan v = new Vlan();
                v.setId(1);
                v.setName("default");
                return v;
            });
        }

        if (ds.getInterfaces() != null) {
            for (InterfaceSnapshot is : ds.getInterfaces()) {
                boolean exists = dev.getInterfaces().stream()
                        .anyMatch(i -> i.getName().equals(is.getName()));
                if (!exists) {
                    NetworkInterface intf = factory.addInterface(dev, is.getName(), is.getIpAddress(), is.getSubnetMask());
                    applyInterfaceConfig(intf, is, dev);
                } else {
                    NetworkInterface existing = dev.getInterfaces().stream()
                            .filter(i -> i.getName().equals(is.getName())).findFirst().get();
                    applyInterfaceConfig(existing, is, dev);
                }
            }
        }

        if (dev instanceof Router router && ds.getRoutes() != null) {
            for (RouteSnapshot rs : ds.getRoutes()) {
                router.getRoutingTable().getRoutes().put(rs.getNetwork(),
                        createRouteEntry(rs.getSubnetMask(), rs.getNextHop()));
            }
        }

        if (dev instanceof Computer computer) {
            computer.setDefaultGateway(ds.getDefaultGateway());
            if (computer.getArpTable() == null) {
                computer.setArpTable(new ArpTable());
            }
            if (computer.getRoutingTable() == null) {
                computer.setRoutingTable(new RoutingTable());
            }
        }

        if (dev instanceof Router router) {
            if (router.getArpTable() == null) {
                router.setArpTable(new ArpTable());
            }
            if (router.getRoutingTable() == null) {
                router.setRoutingTable(new RoutingTable());
            }
        }

        DeviceCli cli = new DeviceCli(dev, ctx.getSession(), ctx.getEngine());
        ctx.getCliByRef().put(ds.getRef(), cli);
    }

    public static void connectInContext(SessionContext ctx, LinkSnapshot ls) {
        Device devA = ctx.getDeviceByRef().get(ls.getDeviceRefA());
        Device devB = ctx.getDeviceByRef().get(ls.getDeviceRefB());
        if (devA == null || devB == null) {
            throw new IllegalArgumentException("dispositivo nao encontrado para link");
        }
        DeviceFactory factory = ctx.getFactory();
        NetworkInterface intfA = findOrCreateInterface(factory, devA, ls.getInterfaceA());
        NetworkInterface intfB = findOrCreateInterface(factory, devB, ls.getInterfaceB());
        ctx.getSession().addLink(intfA, intfB);
    }

    public static PlaygroundSnapshot mergeLiveConfig(PlaygroundSnapshot stored, SessionContext ctx) {
        PlaygroundSnapshot merged = new PlaygroundSnapshot();
        merged.setExerciseId(stored.getExerciseId());
        merged.setName(stored.getName());

        Map<String, DeviceSnapshot> storedByRef = new LinkedHashMap<>();
        if (stored.getDevices() != null) {
            for (DeviceSnapshot ds : stored.getDevices()) {
                storedByRef.put(ds.getRef(), ds);
            }
        }

        merged.setDevices(new ArrayList<>());
        for (Map.Entry<String, Device> entry : ctx.getDeviceByRef().entrySet()) {
            String ref = entry.getKey();
            Device live = entry.getValue();
            DeviceSnapshot base = storedByRef.get(ref);

            DeviceSnapshot md = new DeviceSnapshot();
            md.setRef(ref);
            md.setKind(base != null ? base.getKind() : live.getModel());
            md.setX(base != null ? base.getX() : 0);
            md.setY(base != null ? base.getY() : 0);
            md.setHostname(live.getHostname());

            md.setInterfaces(new ArrayList<>());
            for (NetworkInterface intf : live.getInterfaces()) {
                InterfaceSnapshot is = new InterfaceSnapshot();
                is.setName(intf.getName());
                is.setIpAddress(intf.getIpAddress());
                is.setSubnetMask(intf.getSubnetMask());
                is.setDescription(intf.getDescription());
                is.setPortMode(intf.getPortMode());
                is.setAccessVlanId(intf.getVlan() != null ? intf.getVlan().getId() : null);
                is.setAdminUp(intf.getAdminState() == NetworkInterface.AdminState.UP);
                md.getInterfaces().add(is);
            }

            md.setVlans(new ArrayList<>());
            if (live instanceof Switch sw && sw.getVlans() != null) {
                for (Vlan v : sw.getVlans().values()) {
                    VlanSnapshot vs = new VlanSnapshot();
                    vs.setId(v.getId());
                    vs.setName(v.getName());
                    md.getVlans().add(vs);
                }
            }

            md.setRoutes(new ArrayList<>());
            if (live instanceof Router router && router.getRoutingTable() != null) {
                for (Map.Entry<String, RoutingTable.RouteEntry> r : router.getRoutingTable().getRoutes().entrySet()) {
                    RouteSnapshot rs = new RouteSnapshot();
                    rs.setNetwork(r.getKey());
                    rs.setSubnetMask(r.getValue().getSubnetMask());
                    rs.setNextHop(r.getValue().getNextHop());
                    md.getRoutes().add(rs);
                }
            }

            if (live instanceof Computer computer) {
                md.setDefaultGateway(computer.getDefaultGateway());
            }

            merged.getDevices().add(md);
        }

        merged.setLinks(stored.getLinks() != null ? new ArrayList<>(stored.getLinks()) : new ArrayList<>());
        return merged;
    }

    private static void applyInterfaceConfig(NetworkInterface intf, InterfaceSnapshot is, Device dev) {
        if (is.getIpAddress() != null) {
            intf.setIpAddress(is.getIpAddress());
        }
        if (is.getSubnetMask() != null) {
            intf.setSubnetMask(is.getSubnetMask());
        }
        if (is.getDescription() != null) {
            intf.setDescription(is.getDescription());
        }
        if (is.getPortMode() != null) {
            intf.setPortMode(is.getPortMode());
        }
        if (is.getAccessVlanId() != null && dev instanceof Switch sw) {
            Vlan v = sw.getVlans().get(is.getAccessVlanId());
            if (v != null) {
                intf.setVlan(v);
            }
        }
        intf.setAdminState(is.isAdminUp()
                ? NetworkInterface.AdminState.UP
                : NetworkInterface.AdminState.DOWN);
    }

    private static NetworkInterface findOrCreateInterface(DeviceFactory factory, Device dev, String name) {
        return dev.getInterfaces().stream()
                .filter(i -> i.getName().equals(name))
                .findFirst()
                .orElseGet(() -> factory.addInterface(dev, name, null, null));
    }

    private static RoutingTable.RouteEntry createRouteEntry(String mask, String nextHop) {
        RoutingTable.RouteEntry entry = new RoutingTable.RouteEntry();
        entry.setSubnetMask(mask);
        entry.setNextHop(nextHop);
        entry.setType(RoutingTable.RouteEntry.RouteType.STATIC);
        return entry;
    }

    private static String defaultHostname(DeviceSnapshot ds) {
        return switch (ds.getKind()) {
            case HOST -> "PC";
            case SWITCH -> "SW";
            case ROUTER -> "R";
            default -> "Device";
        };
    }
}
