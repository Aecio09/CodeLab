package com.codelab.networkengine.protocols.routing;

import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.RoutingTable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RoutingProtocol {

    public RouteMatch bestMatch(List<NetworkInterface> interfaces, RoutingTable table, String destinationIp) {
        List<Candidate> candidates = new ArrayList<>();

        if (interfaces != null) {
            for (NetworkInterface intf : interfaces) {
                if (intf.getIpAddress() == null || intf.getSubnetMask() == null) {
                    continue;
                }
                String network = IpMath.networkOf(intf.getIpAddress(), intf.getSubnetMask());
                if (IpMath.covers(network, intf.getSubnetMask(), destinationIp)) {
                    int prefix = IpMath.prefixLength(intf.getSubnetMask());
                    candidates.add(new Candidate(prefix, 0, intf, destinationIp));
                }
            }
        }

        if (table != null && table.getRoutes() != null) {
            for (Map.Entry<String, RoutingTable.RouteEntry> e : table.getRoutes().entrySet()) {
                RoutingTable.RouteEntry entry = e.getValue();
                if (entry.getSubnetMask() == null
                        || !IpMath.covers(e.getKey(), entry.getSubnetMask(), destinationIp)) {
                    continue;
                }
                NetworkInterface intf = resolveInterface(interfaces, entry);
                if (intf == null) {
                    continue;
                }
                int prefix = IpMath.prefixLength(entry.getSubnetMask());
                String nextHop = entry.getNextHop() != null ? entry.getNextHop() : destinationIp;
                candidates.add(new Candidate(prefix, entry.getMetric(), intf, nextHop));
            }
        }

        Candidate best = null;
        for (Candidate candidate : candidates) {
            if (best == null
                    || candidate.prefix > best.prefix
                    || (candidate.prefix == best.prefix && candidate.metric < best.metric)) {
                best = candidate;
            }
        }
        return best == null ? null : new RouteMatch(best.outInterface, best.nextHop);
    }

    private NetworkInterface resolveInterface(List<NetworkInterface> interfaces, RoutingTable.RouteEntry entry) {
        if (interfaces == null) {
            return null;
        }
        if (entry.getInterfaceName() != null) {
            for (NetworkInterface intf : interfaces) {
                if (entry.getInterfaceName().equals(intf.getName())) {
                    return intf;
                }
            }
        }
        if (entry.getNextHop() != null) {
            for (NetworkInterface intf : interfaces) {
                if (intf.getIpAddress() != null
                        && intf.getSubnetMask() != null
                        && IpMath.sameSubnet(entry.getNextHop(), intf.getSubnetMask(), intf.getIpAddress())) {
                    return intf;
                }
            }
        }
        return null;
    }

    private record Candidate(int prefix, int metric, NetworkInterface outInterface, String nextHop) {
    }

    public record RouteMatch(NetworkInterface outInterface, String nextHop) {
    }
}