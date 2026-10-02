package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.packets.ArpMessage;
import com.codelab.networkengine.packets.EthernetFrame;
import com.codelab.networkengine.packets.FramePayload;
import com.codelab.networkengine.packets.IcmpMessage;
import com.codelab.networkengine.packets.Ipv4Packet;

public record NetworkEvent(
        int hop,
        String protocol,
        String action,
        Integer srcDeviceId,
        String srcInterface,
        Integer dstDeviceId,
        String dstInterface,
        String srcIp,
        String dstIp,
        String srcMac,
        String dstMac,
        String summary) {

    public static NetworkEvent of(int hop, EthernetFrame frame, Device src, NetworkInterface srcIntf,
                                  Device dst, NetworkInterface dstIntf) {
        FramePayload payload = frame.getPayload();
        String protocol = payload instanceof ArpMessage ? "ARP" : "IPV4";
        String action = EthernetFrame.BROADCAST_MAC.equals(frame.getDestinationMac()) ? "BROADCAST" : "UNICAST";

        String srcIp = null;
        String dstIp = null;
        String summary;

        if (payload instanceof ArpMessage arp) {
            dstIp = arp.getTargetIp();
            srcIp = arp.getSenderIp();
            summary = arp.getOperation() == ArpMessage.ArpOperation.REQUEST
                    ? "ARP request: quem tem " + dstIp + "?"
                    : "ARP reply: " + dstIp + " esta em " + frame.getSourceMac();
        } else {
            Ipv4Packet ipv4 = (Ipv4Packet) payload;
            srcIp = ipv4.getSourceIp();
            dstIp = ipv4.getDestinationIp();
            IcmpMessage icmp = ipv4.getIcmp();
            String icmpText = switch (icmp != null ? icmp.getType() : null) {
                case ECHO_REQUEST -> "ping request";
                case ECHO_REPLY -> "ping reply";
                case TIME_EXCEEDED -> "TTL expirado (time exceeded)";
                default -> "IPv4";
            };
            summary = icmpText + " " + srcIp + " -> " + dstIp + " (ttl " + ipv4.getTtl() + ")";
        }

        return new NetworkEvent(hop, protocol, action,
                src != null ? src.getId() : null, srcIntf != null ? srcIntf.getName() : null,
                dst != null ? dst.getId() : null, dstIntf != null ? dstIntf.getName() : null,
                srcIp, dstIp, frame.getSourceMac(), frame.getDestinationMac(), summary);
    }

    @FunctionalInterface
    public interface TraceSink {
        void onEvent(NetworkEvent event);
    }
}
