package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class InterfaceCommand implements Command {

    @Override
    public String name() {
        return "interface";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG;
    }

    @Override
    public String usage() {
        return "interface <nome>";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        String name = args.get(0);
        NetworkInterface intf = CommandSupport.findInterface(device, name);
        if (intf == null) {
            intf = CommandSupport.createInterface(device, name);
        }
        cli.setConfigInterface(intf);
        cli.pushMode(CliMode.CONFIG_INTERFACE);
        return "";
    }
}
