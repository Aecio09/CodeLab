package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ShowIpArpCommand implements Command {

    @Override
    public String name() {
        return "show ip arp";
    }

    @Override
    public CliMode mode() {
        return CliMode.USER;
    }

    @Override
    public String usage() {
        return "show ip arp";
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        ArpTable table = CommandSupport.arpTableOf(device);
        if (table == null) {
            return "% tabela ARP nao disponivel para este dispositivo";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%-11s%-17s%-11s%-19s%-10s%s",
                "Protocolo", "Endereco", "Idade(min)", "MAC", "Tipo", "Interface"));
        table.getEntries().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    ArpTable.ArpEntry arp = entry.getValue();
                    sb.append("\n").append(String.format("%-11s%-17s%-11s%-19s%-10s%s",
                            "Internet",
                            entry.getKey(),
                            ageMinutes(arp.getTimestamp()),
                            blankToDash(arp.getMacAddress()),
                            arp.getType() != null ? arp.getType().name() : "-",
                            blankToDash(arp.getInterfaceName())));
                });
        return sb.toString();
    }

    private long ageMinutes(LocalDateTime timestamp) {
        if (timestamp == null) {
            return 0;
        }
        return Math.max(0, Duration.between(timestamp, LocalDateTime.now()).toMinutes());
    }

    private String blankToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
