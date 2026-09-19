package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class DisableCommand implements Command {

    @Override
    public String name() {
        return "disable";
    }

    @Override
    public CliMode mode() {
        return CliMode.PRIVILEGED;
    }

    @Override
    public String usage() {
        return "disable";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        cli.popTo(CliMode.USER);
        return "";
    }
}
