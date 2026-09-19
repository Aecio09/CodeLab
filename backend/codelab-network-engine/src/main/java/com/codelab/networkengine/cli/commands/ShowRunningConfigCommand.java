package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;
import java.util.Map;

public class ShowRunningConfigCommand implements Command {

    @Override
    public String name() {
        return "show running-config";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show running-config";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        StringBuilder sb = new StringBuilder();
        sb.append("!\n");
        sb.append("hostname ").append(device.getHostname()).append("\n");

        if (device instanceof Switch switchDevice && switchDevice.getVlans() != null) {
            switchDevice.getVlans().values().stream()
                    .sorted((a, b) -> Integer.compare(a.getId(), b.getId()))
                    .forEach(vlan -> sb.append("!\n")
                            .append("vlan ").append(vlan.getId()).append("\n")
                            .append(" name ").append(vlan.getName()).append("\n"));
        }

        for (NetworkInterface intf : device.getInterfaces()) {
            sb.append("!\n");
            sb.append("interface ").append(intf.getName()).append("\n");
            if (intf.getDescription() != null && !intf.getDescription().isBlank()) {
                sb.append(" description ").append(intf.getDescription()).append("\n");
            }
            if (intf.getIpAddress() != null && intf.getSubnetMask() != null) {
                sb.append(" ip address ").append(intf.getIpAddress())
                        .append(" ").append(intf.getSubnetMask()).append("\n");
            }
            if (intf.getPortMode() != null) {
                sb.append(" switchport mode ").append(intf.getPortMode().name().toLowerCase()).append("\n");
            }
            if (intf.getVlan() != null) {
                sb.append(" switchport access vlan ").append(intf.getVlan().getId()).append("\n");
            }
            if (intf.getAdminState() == NetworkInterface.AdminState.DOWN) {
                sb.append(" shutdown\n");
            }
        }

        if (device instanceof Computer computer
                && computer.getDefaultGateway() != null
                && !computer.getDefaultGateway().isBlank()) {
            sb.append("!\n");
            sb.append("ip default-gateway ").append(computer.getDefaultGateway()).append("\n");
        }

        if (device instanceof Router router && router.getRoutingTable() != null) {
            List<Map.Entry<String, RoutingTable.RouteEntry>> routes =
                    router.getRoutingTable().getRoutes().entrySet().stream()
                            .sorted(Map.Entry.comparingByKey())
                            .toList();
            for (Map.Entry<String, RoutingTable.RouteEntry> route : routes) {
                RoutingTable.RouteEntry entry = route.getValue();
                if (entry.getNextHop() != null && !entry.getNextHop().isBlank()) {
                    sb.append("!\n");
                    sb.append("ip route ").append(route.getKey())
                            .append(" ").append(entry.getSubnetMask())
                            .append(" ").append(entry.getNextHop()).append("\n");
                }
            }
        }

        sb.append("!\n");
        sb.append("end");
        return sb.toString();
    }
}
