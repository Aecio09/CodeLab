package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class SwitchportAccessCommand implements Command {

    @Override
    public String name() {
        return "switchport access vlan";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG_INTERFACE;
    }

    @Override
    public String usage() {
        return "switchport access vlan <id>";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Switch;
    }

    @Override
    public boolean supportsNo() {
        return true;
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
        int id;
        try {
            id = Integer.parseInt(args.get(0));
        } catch (NumberFormatException e) {
            return "% id de VLAN invalido: " + args.get(0);
        }
        Switch switchDevice = (Switch) device;
        Vlan vlan = switchDevice.getVlans() != null ? switchDevice.getVlans().get(id) : null;
        if (vlan == null) {
            return "% VLAN " + id + " nao existe; crie com 'vlan " + id + "'";
        }
        intf.setVlan(vlan);
        return "";
    }

    @Override
    public String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        NetworkInterface intf = cli.configInterface();
        if (intf == null) {
            return "% nenhuma interface em configuracao";
        }
        intf.setVlan(null);
        return "";
    }
}
