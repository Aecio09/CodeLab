package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class SwitchportModeCommand implements Command {

    @Override
    public String name() {
        return "switchport mode";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG_INTERFACE;
    }

    @Override
    public String usage() {
        return "switchport mode access|trunk";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Switch;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        NetworkInterface intf = cli.configInterface();
        if (intf == null) {
            return "% nenhuma interface em configuracao";
        }
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        String value = args.get(0).toLowerCase();
        if (value.startsWith("acc")) {
            intf.setPortMode(NetworkInterface.PortMode.ACCESS);
            return "";
        }
        if (value.startsWith("tr")) {
            intf.setPortMode(NetworkInterface.PortMode.TRUNK);
            return "";
        }
        return "% modo invalido: use access ou trunk";
    }
}
