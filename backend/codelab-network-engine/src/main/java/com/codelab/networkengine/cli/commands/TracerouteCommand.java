package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class TracerouteCommand implements Command {

    @Override
    public String name() {
        return "traceroute";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "traceroute <ip>";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        String target = args.get(0);
        if (!CommandSupport.isValidIp(target)) {
            return "% endereco IP invalido: " + target;
        }
        List<String> hops = engine.traceroute(session, device, target, 16);
        StringBuilder sb = new StringBuilder();
        sb.append("Tracing route to ").append(target);
        for (int i = 0; i < hops.size(); i++) {
            String hop = hops.get(i);
            sb.append("\n").append(i + 1).append("  ")
                    .append("*".equals(hop) ? "* * *" : hop);
        }
        return sb.toString();
    }
}
