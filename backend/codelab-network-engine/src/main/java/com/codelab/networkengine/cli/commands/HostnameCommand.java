package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class HostnameCommand implements Command {

    @Override
    public String name() {
        return "hostname";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG;
    }

    @Override
    public String usage() {
        return "hostname <nome>";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        device.setHostname(args.get(0));
        return "";
    }
}
