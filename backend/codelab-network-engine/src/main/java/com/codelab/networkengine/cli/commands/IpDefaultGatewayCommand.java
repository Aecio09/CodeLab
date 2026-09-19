package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class IpDefaultGatewayCommand implements Command {

    @Override
    public String name() {
        return "ip default-gateway";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG;
    }

    @Override
    public String usage() {
        return "ip default-gateway <ip>";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Computer;
    }

    @Override
    public boolean supportsNo() {
        return true;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        String ip = args.get(0);
        if (!CommandSupport.isValidIp(ip)) {
            return "% endereco IP invalido: " + ip;
        }
        ((Computer) device).setDefaultGateway(ip);
        return "";
    }

    @Override
    public String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        ((Computer) device).setDefaultGateway(null);
        return "";
    }
}
