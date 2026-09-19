package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class ShowIpInterfaceBriefCommand implements Command {

    @Override
    public String name() {
        return "show ip interface brief";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show ip interface brief";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%-22s%-16s%-4s%-7s%-22s%s",
                "Interface", "IP-Address", "OK?", "Method", "Status", "Protocol"));
        for (NetworkInterface intf : device.getInterfaces()) {
            boolean adminUp = intf.getAdminState() != NetworkInterface.AdminState.DOWN;
            boolean lineUp = adminUp && CommandSupport.isLineUp(session, intf);
            String ip = intf.getIpAddress() != null ? intf.getIpAddress() : "unassigned";
            String method = intf.getIpAddress() != null ? "manual" : "unset";
            sb.append("\n").append(String.format("%-22s%-16s%-4s%-7s%-22s%s",
                    intf.getName(),
                    ip,
                    "YES",
                    method,
                    adminUp ? "up" : "administratively down",
                    lineUp ? "up" : "down"));
        }
        return sb.toString();
    }
}
