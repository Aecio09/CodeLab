package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class ShowInterfacesCommand implements Command {

    @Override
    public String name() {
        return "show interfaces";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show interfaces";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        StringBuilder sb = new StringBuilder();
        for (NetworkInterface intf : device.getInterfaces()) {
            boolean adminUp = intf.getAdminState() != NetworkInterface.AdminState.DOWN;
            String state = adminUp ? "up" : "administratively down";
            String protocol = adminUp && CommandSupport.isLineUp(session, intf) ? "up" : "down";
            sb.append(intf.getName()).append(" is ").append(state)
                    .append(", line protocol is ").append(protocol);
            sb.append("\n  Hardware is ").append(CommandSupport.typeName(intf))
                    .append(", address is ").append(intf.getMacAddress() != null ? intf.getMacAddress() : "-");
            if (intf.getIpAddress() != null && intf.getSubnetMask() != null) {
                sb.append("\n  Internet address is ").append(intf.getIpAddress())
                        .append("/").append(CommandSupport.prefixLength(intf.getSubnetMask()));
            }
            sb.append("\n  MTU 1500 bytes, BW 100000 Kbit/sec");
            sb.append("\n  ").append(intf.getDuplex() != null ? capitalize(intf.getDuplex().name()) : "Full")
                    .append("-duplex, ").append(intf.getSpeed()).append("Mb/s");
            if (intf.getPortMode() != null) {
                sb.append("\n  Modo switchport: ").append(intf.getPortMode().name());
            }
            if (intf.getVlan() != null) {
                sb.append("\n  VLAN de acesso: ").append(intf.getVlan().getId());
            }
            if (intf.getDescription() != null && !intf.getDescription().isBlank()) {
                sb.append("\n  Descricao: ").append(intf.getDescription());
            }
            sb.append("\n");
        }
        return sb.toString().stripTrailing();
    }

    private String capitalize(String value) {
        return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
    }
}
