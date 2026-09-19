package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.packets.ArpMessage;
import com.codelab.networkengine.packets.EthernetFrame;
import com.codelab.networkengine.packets.FramePayload;
import com.codelab.networkengine.packets.IcmpMessage;
import com.codelab.networkengine.packets.Ipv4Packet;
import com.codelab.networkengine.protocols.arp.ArpProtocol;
import com.codelab.networkengine.protocols.icmp.IcmpProtocol;
import com.codelab.networkengine.protocols.routing.IpMath;
import com.codelab.networkengine.protocols.routing.RoutingProtocol;
import com.codelab.networkengine.protocols.switching.SwitchingProtocol;

import java.util.ArrayList;
import java.util.List;

public class NetworkEngine {
    private final PacketSimulator packetSimulator = new PacketSimulator();
    private final ArpProtocol arpProtocol = new ArpProtocol();
    private final IcmpProtocol icmpProtocol = new IcmpProtocol();
    private final SwitchingProtocol switchingProtocol = new SwitchingProtocol();
    private final RoutingProtocol routingProtocol = new RoutingProtocol();
    private final List<PendingPing> pendingPings = new ArrayList<>();
    private int sequenceCounter = 1;

    public PingResult ping(NetworkSession session, Device source, String targetIp) {
        RouteHint route = computeRoute(source, targetIp);
        if (route == null) {
            return PingResult.failure(targetIp, "sem rota para o destino");
        }

        PendingPing pending = new PendingPing(source, targetIp);
        pendingPings.add(pending);
        pending.sequence = sequenceCounter++;

        Ipv4Packet request = icmpProtocol.buildEchoRequest(
                route.outInterface().getIpAddress(), targetIp, pending.sequence);
        sendIpv4(session, source, targetIp, request);

        pendingPings.remove(pending);
        return pending.reached
                ? PingResult.success(targetIp, pending.rttNanos)
                : PingResult.failure(targetIp, "sem resposta (ARP ou ICMP)");
    }

    public void send(NetworkSession session, Device source, NetworkInterface intf, EthernetFrame frame) {
        packetSimulator.send(session, source, intf, frame, this::onFrame);
    }

    private void onFrame(NetworkSession session, Device receiver, NetworkInterface intf, EthernetFrame frame) {
        if (receiver instanceof Switch switchDevice) {
            switchingProtocol.process(session, this::send, switchDevice, intf, frame);
            return;
        }
        FramePayload payload = frame.getPayload();
        if (payload instanceof ArpMessage arp) {
            handleArp(session, receiver, intf, arp);
        } else if (payload instanceof Ipv4Packet ipv4) {
            handleIpv4(session, receiver, ipv4);
        }
    }

    private void handleArp(NetworkSession session, Device receiver, NetworkInterface intf, ArpMessage arp) {
        ArpTable table = arpTableOf(receiver);
        EthernetFrame reply = arpProtocol.handleMessage(intf, table, arp);
        if (reply != null) {
            send(session, receiver, intf, reply);
        }
    }

    private void handleIpv4(NetworkSession session, Device receiver, Ipv4Packet ipv4) {
        boolean addressedToUs = hasInterfaceWithIp(receiver, ipv4.getDestinationIp());
        if (!addressedToUs) {
            if (receiver instanceof Router router) {
                forward(session, router, ipv4);
            }
            return;
        }
        if (ipv4.getIcmp() == null) {
            return;
        }
        if (ipv4.getIcmp().getType() == IcmpMessage.IcmpType.ECHO_REQUEST) {
            Ipv4Packet reply = icmpProtocol.buildEchoReply(ipv4);
            sendIpv4(session, receiver, reply.getDestinationIp(), reply);
        } else if (ipv4.getIcmp().getType() == IcmpMessage.IcmpType.ECHO_REPLY) {
            completePing(receiver, ipv4.getSourceIp(), ipv4.getIcmp().getSequenceNumber());
        }
    }

    private void forward(NetworkSession session, Router router, Ipv4Packet ipv4) {
        if (ipv4.getTtl() <= 1) {
            return;
        }
        ipv4.setTtl(ipv4.getTtl() - 1);
        sendIpv4(session, router, ipv4.getDestinationIp(), ipv4);
    }

    private void sendIpv4(NetworkSession session, Device source, String destinationIp, Ipv4Packet packet) {
        RouteHint route = computeRoute(source, destinationIp);
        if (route == null) {
            return;
        }
        String nextHopMac = resolveMac(session, source, route.outInterface(), route.nextHop());
        if (nextHopMac == null) {
            return;
        }
        send(session, source, route.outInterface(),
                new EthernetFrame(nextHopMac, route.outInterface().getMacAddress(), packet));
    }

    private String resolveMac(NetworkSession session, Device device, NetworkInterface intf, String ip) {
        ArpTable.ArpEntry entry = arpEntryOf(device, ip);
        if (entry != null) {
            return entry.getMacAddress();
        }
        send(session, device, intf, arpProtocol.createRequest(intf, ip));
        entry = arpEntryOf(device, ip);
        return entry != null ? entry.getMacAddress() : null;
    }

    private RouteHint computeRoute(Device device, String destinationIp) {
        for (NetworkInterface intf : device.getInterfaces()) {
            if (isActive(intf) && IpMath.sameSubnet(destinationIp, intf.getSubnetMask(), intf.getIpAddress())) {
                return new RouteHint(intf, destinationIp);
            }
        }
        if (device instanceof Computer computer
                && computer.getDefaultGateway() != null
                && !computer.getDefaultGateway().isBlank()) {
            NetworkInterface intf = interfaceOnSubnetOf(device, computer.getDefaultGateway());
            if (intf == null) {
                intf = activeInterface(device);
            }
            if (intf != null) {
                return new RouteHint(intf, computer.getDefaultGateway());
            }
        }
        if (device instanceof Router router) {
            RoutingProtocol.RouteMatch match = routingProtocol.bestMatch(
                    router.getInterfaces(), router.getRoutingTable(), destinationIp);
            if (match != null) {
                return new RouteHint(match.outInterface(), match.nextHop());
            }
        }
        return null;
    }

    private NetworkInterface activeInterface(Device device) {
        for (NetworkInterface intf : device.getInterfaces()) {
            if (isActive(intf)) {
                return intf;
            }
        }
        return null;
    }

    private NetworkInterface interfaceOnSubnetOf(Device device, String ip) {
        for (NetworkInterface intf : device.getInterfaces()) {
            if (isActive(intf) && IpMath.sameSubnet(ip, intf.getSubnetMask(), intf.getIpAddress())) {
                return intf;
            }
        }
        return null;
    }

    private boolean isActive(NetworkInterface intf) {
        return intf.getIpAddress() != null
                && intf.getSubnetMask() != null
                && intf.getAdminState() == NetworkInterface.AdminState.UP;
    }

    private boolean hasInterfaceWithIp(Device device, String ip) {
        if (ip == null) {
            return false;
        }
        for (NetworkInterface intf : device.getInterfaces()) {
            if (ip.equals(intf.getIpAddress())) {
                return true;
            }
        }
        return false;
    }

    private void completePing(Device source, String targetIp, int sequence) {
        for (PendingPing pending : pendingPings) {
            if (pending.sequence == sequence
                    && pending.source == source
                    && pending.targetIp.equals(targetIp)) {
                pending.markReached();
                return;
            }
        }
    }

    private ArpTable.ArpEntry arpEntryOf(Device device, String ip) {
        ArpTable table = arpTableOf(device);
        return table != null && table.getEntries() != null ? table.getEntries().get(ip) : null;
    }

    private ArpTable arpTableOf(Device device) {
        if (device instanceof Computer computer) {
            if (computer.getArpTable() == null) {
                computer.setArpTable(new ArpTable());
            }
            return computer.getArpTable();
        }
        if (device instanceof Router router) {
            if (router.getArpTable() == null) {
                router.setArpTable(new ArpTable());
            }
            return router.getArpTable();
        }
        return null;
    }

    private record RouteHint(NetworkInterface outInterface, String nextHop) {
    }

    private static class PendingPing {
        private final Device source;
        private final String targetIp;
        private final long startedNanos = System.nanoTime();
        private int sequence;
        private boolean reached;
        private long rttNanos;

        PendingPing(Device source, String targetIp) {
            this.source = source;
            this.targetIp = targetIp;
        }

        void markReached() {
            if (!reached) {
                reached = true;
                rttNanos = System.nanoTime() - startedNanos;
            }
        }
    }
}