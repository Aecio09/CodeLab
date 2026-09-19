package com.codelab.networkengine.protocols.routing;

public final class IpMath {

    private IpMath() {
    }

    public static boolean sameSubnet(String ip1, String mask, String ip2) {
        return (toInt(ip1) & toInt(mask)) == (toInt(ip2) & toInt(mask));
    }

    public static boolean covers(String network, String mask, String ip) {
        return (toInt(ip) & toInt(mask)) == toInt(network);
    }

    public static String networkOf(String ip, String mask) {
        return fromInt(toInt(ip) & toInt(mask));
    }

    public static int prefixLength(String mask) {
        return Integer.bitCount(toInt(mask));
    }

    static int toInt(String ip) {
        String[] parts = ip.split("\\.");
        return (Integer.parseInt(parts[0]) << 24)
                | (Integer.parseInt(parts[1]) << 16)
                | (Integer.parseInt(parts[2]) << 8)
                | Integer.parseInt(parts[3]);
    }

    static String fromInt(int value) {
        return ((value >>> 24) & 0xFF) + "."
                + ((value >>> 16) & 0xFF) + "."
                + ((value >>> 8) & 0xFF) + "."
                + (value & 0xFF);
    }
}