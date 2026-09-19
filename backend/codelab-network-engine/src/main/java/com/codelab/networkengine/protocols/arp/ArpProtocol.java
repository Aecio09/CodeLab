package com.codelab.networkengine.protocols.arp;

import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.packets.ArpMessage;
import com.codelab.networkengine.packets.EthernetFrame;

import java.time.LocalDateTime;

public class ArpProtocol {

    public EthernetFrame createRequest(NetworkInterface sourceInterface, String targetIp) {
        ArpMessage message = new ArpMessage();
        message.setOperation(ArpMessage.ArpOperation.REQUEST);
        message.setSenderMac(sourceInterface.getMacAddress());
        message.setSenderIp(sourceInterface.getIpAddress());
        message.setTargetIp(targetIp);
        return new EthernetFrame(EthernetFrame.BROADCAST_MAC, sourceInterface.getMacAddress(), message);
    }

    public EthernetFrame createReply(NetworkInterface localInterface, ArpMessage request) {
        ArpMessage message = new ArpMessage();
        message.setOperation(ArpMessage.ArpOperation.REPLY);
        message.setSenderMac(localInterface.getMacAddress());
        message.setSenderIp(localInterface.getIpAddress());
        message.setTargetMac(request.getSenderMac());
        message.setTargetIp(request.getSenderIp());
        return new EthernetFrame(request.getSenderMac(), localInterface.getMacAddress(), message);
    }

    public EthernetFrame handleMessage(NetworkInterface localInterface, ArpTable arpTable, ArpMessage message) {
        learn(arpTable, localInterface, message.getSenderIp(), message.getSenderMac());
        boolean addressedToUs = message.getTargetIp() != null
                && message.getTargetIp().equals(localInterface.getIpAddress());
        if (message.getOperation() == ArpMessage.ArpOperation.REQUEST && addressedToUs) {
            return createReply(localInterface, message);
        }
        return null;
    }

    private void learn(ArpTable arpTable, NetworkInterface localInterface, String ip, String mac) {
        if (arpTable == null || ip == null || mac == null) {
            return;
        }
        ArpTable.ArpEntry entry = arpTable.getEntries().computeIfAbsent(ip, k -> new ArpTable.ArpEntry());
        entry.setMacAddress(mac);
        entry.setInterfaceName(localInterface.getName());
        entry.setTimestamp(LocalDateTime.now());
        entry.setType(ArpTable.ArpEntry.ArpEntryType.DYNAMIC);
    }
}