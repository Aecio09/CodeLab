package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.MacAddressTable;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;
import java.util.Map;

public class ShowMacAddressTableCommand implements Command {

    @Override
    public String name() {
        return "show mac address-table";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show mac address-table";
    }

    @Override
    public boolean appliesTo(Device device) {
        return device instanceof Switch;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        MacAddressTable table = ((Switch) device).getMacAddressTable();
        if (table == null) {
            return "% tabela MAC nao disponivel";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Mac Address Table");
        sb.append("\n").append(String.format("%-8s%-20s%-11s%s", "Vlan", "Mac Address", "Tipo", "Portas"));
        sb.append("\n").append(String.format("%-8s%-20s%-11s%s", "----", "-----------", "----", "------"));
        table.getMacAddresses().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    MacAddressTable.MacAddress mac = entry.getValue();
                    sb.append("\n").append(String.format("%-8s%-20s%-11s%s",
                            mac.getVlan() != null ? mac.getVlan().getId() : 1,
                            entry.getKey(),
                            mac.getType() != null ? mac.getType().name() : "-",
                            mac.getInterfaceName() != null ? mac.getInterfaceName() : "-"));
                });
        return sb.toString();
    }
}
