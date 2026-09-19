package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class EndCommand implements Command {

    @Override
    public String name() {
        return "end";
    }

    @Override
    public CliMode mode() {
        return CliMode.ANY;
    }

    @Override
    public String usage() {
        return "end";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (cli.currentMode() != CliMode.USER) {
            cli.popTo(CliMode.PRIVILEGED);
        }
        return "";
    }
}
