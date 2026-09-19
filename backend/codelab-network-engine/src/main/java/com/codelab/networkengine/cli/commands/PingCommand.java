package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;
import com.codelab.networkengine.simulation.PingResult;

import java.util.List;

public class PingCommand implements Command {

    @Override
    public String name() {
        return "ping";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "ping <ip>";
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
        PingResult result = engine.ping(session, device, target);
        StringBuilder sb = new StringBuilder();
        sb.append("Enviando ICMP echo para ").append(target);
        if (result.isReached()) {
            sb.append("\n!!!!!");
            sb.append("\nSucesso: resposta de ").append(target)
                    .append(" tempo=").append(result.getRttMillis()).append("ms");
        } else {
            sb.append("\n.....");
            sb.append("\nFalha: ").append(result.getReason());
        }
        return sb.toString();
    }
}
