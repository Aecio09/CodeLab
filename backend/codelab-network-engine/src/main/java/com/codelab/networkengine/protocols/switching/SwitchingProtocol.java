package com.codelab.networkengine.protocols.switching;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.MacAddressTable;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.packets.EthernetFrame;
import com.codelab.networkengine.simulation.NetworkSession;

import java.time.LocalDateTime;

public class SwitchingProtocol {

    private static final int DEFAULT_VLAN_ID = 1;

    public void process(NetworkSession session, FrameSender sender, Switch switchDevice,
                        NetworkInterface ingress, EthernetFrame frame) {
        MacAddressTable table = switchDevice.getMacAddressTable();
        if (table == null) {
            table = new MacAddressTable();
            switchDevice.setMacAddressTable(table);
        }
        learn(table, frame, ingress);

        String destinationMac = frame.getDestinationMac();
        int vlanId = vlanIdOf(ingress);
        if (EthernetFrame.BROADCAST_MAC.equals(destinationMac)) {
            flood(session, sender, switchDevice, ingress, vlanId, frame);
            return;
        }
        MacAddressTable.MacAddress entry = table.getMacAddresses().get(destinationMac);
        if (entry != null && vlanIdOf(entry) == vlanId) {
            forwardToPort(session, sender, switchDevice, ingress, entry.getInterfaceName(), vlanId, frame);
        } else {
            flood(session, sender, switchDevice, ingress, vlanId, frame);
        }
    }

    public void expire(MacAddressTable table, int maxAgeSeconds) {
        if (table == null || table.getMacAddresses() == null) {
            return;
        }
        table.getMacAddresses().entrySet().removeIf(e ->
                e.getValue().getType() == MacAddressTable.MacAddress.MacEntryType.DYNAMIC
                        && e.getValue().getTimestamp() != null
                        && e.getValue().getTimestamp().isBefore(LocalDateTime.now().minusSeconds(maxAgeSeconds)));
    }

    private void learn(MacAddressTable table, EthernetFrame frame, NetworkInterface ingress) {
        if (frame.getSourceMac() == null) {
            return;
        }
        MacAddressTable.MacAddress entry = table.getMacAddresses()
                .computeIfAbsent(frame.getSourceMac(), k -> new MacAddressTable.MacAddress());
        entry.setInterfaceName(ingress.getName());
        entry.setVlan(ingress.getVlan());
        entry.setTimestamp(LocalDateTime.now());
        entry.setType(MacAddressTable.MacAddress.MacEntryType.DYNAMIC);
    }

    private void forwardToPort(NetworkSession session, FrameSender sender, Switch switchDevice,
                               NetworkInterface ingress, String interfaceName, int vlanId, EthernetFrame frame) {
        for (NetworkInterface port : switchDevice.getInterfaces()) {
            if (port == ingress || !accepts(port, vlanId)) {
                continue;
            }
            if (interfaceName.equals(port.getName())) {
                sender.send(session, switchDevice, port, frame);
                return;
            }
        }
    }

    private void flood(NetworkSession session, FrameSender sender, Switch switchDevice,
                       NetworkInterface ingress, int vlanId, EthernetFrame frame) {
        for (NetworkInterface port : switchDevice.getInterfaces()) {
            if (port == ingress || !accepts(port, vlanId)) {
                continue;
            }
            sender.send(session, switchDevice, port, frame);
        }
    }

    private boolean accepts(NetworkInterface port, int vlanId) {
        if (port.getAdminState() == NetworkInterface.AdminState.DOWN) {
            return false;
        }
        if (port.getPortMode() == NetworkInterface.PortMode.TRUNK) {
            return true;
        }
        return vlanIdOf(port) == vlanId;
    }

    private int vlanIdOf(NetworkInterface intf) {
        return intf.getVlan() != null ? intf.getVlan().getId() : DEFAULT_VLAN_ID;
    }

    private int vlanIdOf(MacAddressTable.MacAddress entry) {
        return entry.getVlan() != null ? entry.getVlan().getId() : DEFAULT_VLAN_ID;
    }

    @FunctionalInterface
    public interface FrameSender {
        void send(NetworkSession session, Device source, NetworkInterface intf, EthernetFrame frame);
    }
}
