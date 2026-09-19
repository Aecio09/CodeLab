package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class IpRouteCommand implements Command {

    @Override
    public String name() {
        return "ip route";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG;
    }

    @Override
    public String usage() {
        return "ip route <rede> <mascara> <proximo-salto>";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Router;
    }

    @Override
    public boolean supportsNo() {
        return true;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.size() < 3) {
            return "% uso: " + usage();
        }
        String network = args.get(0);
        String mask = args.get(1);
        String nextHop = args.get(2);
        if (!CommandSupport.isValidIp(network)) {
            return "% rede invalida: " + network;
        }
        if (!CommandSupport.isValidIp(mask)) {
            return "% mascara invalida: " + mask;
        }
        if (!CommandSupport.isValidIp(nextHop)) {
            return "% proximo salto invalido: " + nextHop;
        }
        Router router = (Router) device;
        if (router.getRoutingTable() == null) {
            router.setRoutingTable(new RoutingTable());
        }
        RoutingTable.RouteEntry entry = new RoutingTable.RouteEntry();
        entry.setSubnetMask(mask);
        entry.setNextHop(nextHop);
        entry.setMetric(1);
        entry.setType(RoutingTable.RouteEntry.RouteType.STATIC);
        router.getRoutingTable().getRoutes().put(network, entry);
        return "";
    }

    @Override
    public String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: no " + usage();
        }
        Router router = (Router) device;
        if (router.getRoutingTable() == null || router.getRoutingTable().getRoutes() == null) {
            return "";
        }
        router.getRoutingTable().getRoutes().remove(args.get(0));
        return "";
    }
}
