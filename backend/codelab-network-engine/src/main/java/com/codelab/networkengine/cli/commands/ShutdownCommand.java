package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class ShutdownCommand implements Command {

    @Override
    public String name() {
        return "shutdown";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG_INTERFACE;
    }

    @Override
    public String usage() {
        return "shutdown";
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
        intf.setAdminState(NetworkInterface.AdminState.DOWN);
        return "";
    }

    @Override
    public String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        NetworkInterface intf = cli.configInterface();
        if (intf == null) {
            return "% nenhuma interface em configuracao";
        }
        intf.setAdminState(NetworkInterface.AdminState.UP);
        return "";
    }
}
