package com.codelab.networkengine.protocols.icmp;

import com.codelab.networkengine.packets.IcmpMessage;
import com.codelab.networkengine.packets.Ipv4Packet;

public class IcmpProtocol {

    public Ipv4Packet buildEchoRequest(String sourceIp, String targetIp, int sequenceNumber) {
        IcmpMessage icmp = new IcmpMessage();
        icmp.setType(IcmpMessage.IcmpType.ECHO_REQUEST);
        icmp.setIdentifier(1);
        icmp.setSequenceNumber(sequenceNumber);
        icmp.setTimestamp(System.currentTimeMillis());

        Ipv4Packet packet = new Ipv4Packet();
        packet.setSourceIp(sourceIp);
        packet.setDestinationIp(targetIp);
        packet.setTtl(64);
        packet.setIcmp(icmp);
        return packet;
    }

    public Ipv4Packet buildEchoReply(Ipv4Packet request) {
        IcmpMessage incoming = request.getIcmp();

        IcmpMessage icmp = new IcmpMessage();
        icmp.setType(IcmpMessage.IcmpType.ECHO_REPLY);
        icmp.setIdentifier(incoming.getIdentifier());
        icmp.setSequenceNumber(incoming.getSequenceNumber());
        icmp.setTimestamp(System.currentTimeMillis());

        Ipv4Packet packet = new Ipv4Packet();
        packet.setSourceIp(request.getDestinationIp());
        packet.setDestinationIp(request.getSourceIp());
        packet.setTtl(64);
        packet.setIcmp(icmp);
        return packet;
    }
}