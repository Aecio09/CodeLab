package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.protocols.routing.IpMath;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;
import java.util.Map;

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
        if (!IpMath.isValidNetmask(mask)) {
            return "% mascara invalida: " + mask + " (use uma mascara contigua, como 255.255.255.0)";
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
        // O Cisco normaliza a rede digitada: 'ip route 10.9.9.5 255.255.255.0'
        // e gravado como 10.9.9.0/24. Sem isso a rota nunca casa com o destino.
        String normalized = IpMath.networkOf(network, mask);
        router.getRoutingTable().getRoutes().put(normalized, entry);
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
        Map<String, RoutingTable.RouteEntry> routes = router.getRoutingTable().getRoutes();
        // Remove pela rede normalizada, a mesma que foi gravada no execute.
        boolean maskGiven = args.size() > 1
                && CommandSupport.isValidIp(args.get(1))
                && IpMath.isValidNetmask(args.get(1));
        final String network = maskGiven
                ? IpMath.networkOf(args.get(0), args.get(1))
                : args.get(0);
        routes.remove(network);
        if (!maskGiven) {
            // Sem mascara na linha, remove qualquer entrada cuja rede normalizada
            // corresponda, cobrindo rotas gravadas antes da normalizacao.
            routes.entrySet().removeIf(e -> e.getValue().getSubnetMask() != null
                    && network.equals(IpMath.networkOf(e.getKey(), e.getValue().getSubnetMask())));
        }
        return "";
    }
}
