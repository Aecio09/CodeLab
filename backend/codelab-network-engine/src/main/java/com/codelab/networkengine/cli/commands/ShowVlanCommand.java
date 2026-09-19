package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class ShowVlanCommand implements Command {

    private static final int DEFAULT_VLAN_ID = 1;

    @Override
    public String name() {
        return "show vlan";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show vlan [brief]";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Switch;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        Switch switchDevice = (Switch) device;
        Set<Integer> vlanIds = new TreeSet<>();
        if (switchDevice.getVlans() != null) {
            vlanIds.addAll(switchDevice.getVlans().keySet());
        }
        for (NetworkInterface intf : switchDevice.getInterfaces()) {
            if (intf.getPortMode() != NetworkInterface.PortMode.TRUNK) {
                vlanIds.add(vlanIdOf(intf));
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%-5s%-33s%-10s%s", "VLAN", "Name", "Status", "Ports"));
        sb.append("\n").append(String.format("%-5s%-33s%-10s%s", "----",
                "--------------------------------", "---------", "------------------------------"));
        for (int vlanId : vlanIds) {
            Vlan vlan = switchDevice.getVlans() != null ? switchDevice.getVlans().get(vlanId) : null;
            String name = vlan != null ? vlan.getName() : defaultName(vlanId);
            sb.append("\n").append(String.format("%-5d%-33s%-10s%s",
                    vlanId, name, "active", portsOf(switchDevice, vlanId)));
        }
        return sb.toString();
    }

    private String portsOf(Switch switchDevice, int vlanId) {
        List<String> ports = new ArrayList<>();
        for (NetworkInterface intf : switchDevice.getInterfaces()) {
            if (intf.getPortMode() != NetworkInterface.PortMode.TRUNK && vlanIdOf(intf) == vlanId) {
                ports.add(intf.getName());
            }
        }
        ports.sort(String::compareToIgnoreCase);
        return String.join(", ", ports);
    }

    private int vlanIdOf(NetworkInterface intf) {
        return intf.getVlan() != null ? intf.getVlan().getId() : DEFAULT_VLAN_ID;
    }

    private String defaultName(int vlanId) {
        return vlanId == DEFAULT_VLAN_ID ? "default" : "VLAN" + vlanId;
    }
}
