package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class DoCommand implements Command {

    @Override
    public String name() {
        return "do";
    }

    @Override
    public CliMode mode() {
        return CliMode.ANY;
    }

    @Override
    public String usage() {
        return "do <comando exec>";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        if (cli.currentMode() == CliMode.USER || cli.currentMode() == CliMode.PRIVILEGED) {
            return "% 'do' so e valido em modo de configuracao";
        }
        return cli.executeInMode(CliMode.PRIVILEGED, args);
    }
}
