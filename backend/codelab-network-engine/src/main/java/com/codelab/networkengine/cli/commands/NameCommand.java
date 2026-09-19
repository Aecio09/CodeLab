package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class NameCommand implements Command {

    @Override
    public String name() {
        return "name";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG_VLAN;
    }

    @Override
    public String usage() {
        return "name <nome>";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        Vlan vlan = cli.configVlan();
        if (vlan == null) {
            return "% nenhuma VLAN em configuracao";
        }
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        vlan.setName(String.join(" ", args));
        return "";
    }
}
