package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.HashMap;
import java.util.List;

public class VlanCommand implements Command {

    @Override
    public String name() {
        return "vlan";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG;
    }

    @Override
    public String usage() {
        return "vlan <id>";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Switch;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        if (args.isEmpty()) {
            return "% uso: " + usage();
        }
        int id;
        try {
            id = Integer.parseInt(args.get(0));
        } catch (NumberFormatException e) {
            return "% id de VLAN invalido: " + args.get(0);
        }
        if (id < 1 || id > 4094) {
            return "% id de VLAN fora do intervalo valido (1-4094)";
        }
        Switch switchDevice = (Switch) device;
        if (switchDevice.getVlans() == null) {
            switchDevice.setVlans(new HashMap<>());
        }
        int vlanId = id;
        Vlan vlan = switchDevice.getVlans().computeIfAbsent(vlanId, key -> {
            Vlan created = new Vlan();
            created.setId(key);
            created.setName("VLAN" + key);
            return created;
        });
        cli.setConfigVlan(vlan);
        cli.pushMode(CliMode.CONFIG_VLAN);
        return "";
    }
}
