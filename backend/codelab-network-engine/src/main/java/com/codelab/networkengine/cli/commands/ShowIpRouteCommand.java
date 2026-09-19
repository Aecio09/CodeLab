package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ShowIpRouteCommand implements Command {

    @Override
    public String name() {
        return "show ip route";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show ip route";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        StringBuilder sb = new StringBuilder();
        sb.append("Codigos: C - conectado, S - estatico, S* - rota padrao");

        if (device instanceof Computer computer
                && computer.getDefaultGateway() != null
                && !computer.getDefaultGateway().isBlank()) {
            sb.append("\n").append(String.format("%-5s%-18s[1/0] via %s", "S*", "0.0.0.0/0", computer.getDefaultGateway()));
        }

        for (NetworkInterface intf : connectedInterfaces(device)) {
            String network = CommandSupport.networkOf(intf.getIpAddress(), intf.getSubnetMask());
            sb.append("\n").append(String.format("%-5s%-17s is directly connected, %s",
                    "C", network + "/" + CommandSupport.prefixLength(intf.getSubnetMask()), intf.getName()));
        }

        if (device instanceof Router router && router.getRoutingTable() != null) {
            List<Map.Entry<String, RoutingTable.RouteEntry>> routes =
                    new ArrayList<>(router.getRoutingTable().getRoutes().entrySet());
            routes.sort(Map.Entry.comparingByKey());
            for (Map.Entry<String, RoutingTable.RouteEntry> route : routes) {
                RoutingTable.RouteEntry entry = route.getValue();
                String destination = route.getKey() + "/" + CommandSupport.prefixLength(entry.getSubnetMask());
                if (entry.getNextHop() != null && !entry.getNextHop().isBlank()) {
                    sb.append("\n").append(String.format("%-5s%-18s[%d/0] via %s",
                            "S", destination, entry.getMetric(), entry.getNextHop()));
                } else {
                    sb.append("\n").append(String.format("%-5s%-17s is directly connected, %s",
                            "C", destination, entry.getInterfaceName()));
                }
            }
        }
        return sb.toString();
    }

    private List<NetworkInterface> connectedInterfaces(Device device) {
        List<NetworkInterface> result = new ArrayList<>();
        if (device.getInterfaces() == null) {
            return result;
        }
        for (NetworkInterface intf : device.getInterfaces()) {
            if (intf.getIpAddress() != null && intf.getSubnetMask() != null) {
                result.add(intf);
            }
        }
        return result;
    }
}
