package com.codelab.networkengine.cli.commands;

import com.codelab.networkengine.cli.CliMode;
import com.codelab.networkengine.cli.Command;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public class IpAddressCommand implements Command {

    @Override
    public String name() {
        return "ip address";
    }

    @Override
    public CliMode mode() {
        return CliMode.CONFIG_INTERFACE;
    }

    @Override
    public String usage() {
        return "ip address <ip> <mascara>";
    }

    @Override
    public boolean supportsNo() {
        return true;
    }

    @Override
    public String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        NetworkInterface intf = cli.configInterface();
        if (intf == null) {
            return "% nenhuma interface em configuracao; use 'exit' e selecione com 'interface'";
        }
        if (args.size() < 2) {
            return "% uso: " + usage();
        }
        String ip = args.get(0);
        String mask = args.get(1);
        if (!CommandSupport.isValidIp(ip)) {
            return "% endereco IP invalido: " + ip;
        }
        if (!CommandSupport.isValidIp(mask)) {
            return "% mascara invalida: " + mask;
        }
        intf.setIpAddress(ip);
        intf.setSubnetMask(mask);
        return "";
    }

    @Override
    public String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        NetworkInterface intf = cli.configInterface();
        if (intf == null) {
            return "% nenhuma interface em configuracao";
        }
        intf.setIpAddress(null);
        intf.setSubnetMask(null);
        return "";
    }
}
