package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.simulation.NetworkSession;

public final class CommandSupport {

    private CommandSupport() {
    }

    public static NetworkInterface findInterface(Device device, String name) {
        if (device.getInterfaces() == null || name == null) {
            return null;
        }
        for (NetworkInterface intf : device.getInterfaces()) {
            if (name.equalsIgnoreCase(intf.getName())) {
                return intf;
            }
        }
        return null;
    }

    public static NetworkInterface createInterface(Device device, String name) {
        NetworkInterface intf = new NetworkInterface();
        intf.setId(900000 + device.getId() * 100 + device.getInterfaces().size() + 1);
        intf.setName(name);
        intf.setType(typeFor(name));
        intf.setMacAddress(macFor(device));
        intf.setSpeed(100);
        intf.setDuplex(NetworkInterface.Duplex.FULL);
        intf.setAdminState(NetworkInterface.AdminState.UP);
        device.getInterfaces().add(intf);
        return intf;
    }

    public static boolean isLineUp(NetworkSession session, NetworkInterface intf) {
        if (intf.getAdminState() == NetworkInterface.AdminState.DOWN) {
            return false;
        }
        if (session == null) {
            return false;
        }
        return session.peerOf(intf)
                .map(peer -> peer.intf() == null
                        || peer.intf().getAdminState() != NetworkInterface.AdminState.DOWN)
                .orElse(false);
    }

    public static ArpTable arpTableOf(Device device) {
        if (device instanceof Computer computer) {
            return computer.getArpTable();
        }
        if (device instanceof Router router) {
            return router.getArpTable();
        }
        return null;
    }

    public static boolean isValidIp(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String[] parts = value.split("\\.");
        if (parts.length != 4) {
            return false;
        }
        for (String part : parts) {
            try {
                int octet = Integer.parseInt(part);
                if (octet < 0 || octet > 255) {
                    return false;
                }
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return true;
    }

    public static String networkOf(String ip, String mask) {
        return fromInt(toInt(ip) & toInt(mask));
    }

    public static int prefixLength(String mask) {
        return Integer.bitCount(toInt(mask));
    }

    public static String typeName(NetworkInterface intf) {
        NetworkInterface.InterfaceType type = intf.getType();
        if (type == null) {
            return "Ethernet";
        }
        return switch (type) {
            case FAST_ETHERNET -> "Fast Ethernet";
            case GIGABIT_ETHERNET -> "Gigabit Ethernet";
            case SERIAL -> "Serial";
            case LOOPBACK -> "Loopback";
            default -> "Ethernet";
        };
    }

    private static int toInt(String ip) {
        String[] parts = ip.split("\\.");
        return (Integer.parseInt(parts[0]) << 24)
                | (Integer.parseInt(parts[1]) << 16)
                | (Integer.parseInt(parts[2]) << 8)
                | Integer.parseInt(parts[3]);
    }

    private static String fromInt(int value) {
        return ((value >>> 24) & 0xFF) + "."
                + ((value >>> 16) & 0xFF) + "."
                + ((value >>> 8) & 0xFF) + "."
                + (value & 0xFF);
    }

    private static NetworkInterface.InterfaceType typeFor(String name) {
        String lower = name.toLowerCase();
        if (lower.startsWith("gi")) {
            return NetworkInterface.InterfaceType.GIGABIT_ETHERNET;
        }
        if (lower.startsWith("fa")) {
            return NetworkInterface.InterfaceType.FAST_ETHERNET;
        }
        if (lower.startsWith("se")) {
            return NetworkInterface.InterfaceType.SERIAL;
        }
        if (lower.startsWith("lo")) {
            return NetworkInterface.InterfaceType.LOOPBACK;
        }
        return NetworkInterface.InterfaceType.ETHERNET;
    }

    private static String macFor(Device device) {
        int index = device.getInterfaces().size() + 1;
        return String.format("02:00:%02x:%02x:00:01", device.getId() & 0xFF, index & 0xFF);
    }
}
