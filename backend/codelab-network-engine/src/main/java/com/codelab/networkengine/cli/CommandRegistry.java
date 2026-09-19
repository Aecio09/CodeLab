package com.codelab.networkengine.cli;

import com.codelab.networkengine.cli.commands.ConfigureTerminalCommand;
import com.codelab.networkengine.cli.commands.DescriptionCommand;
import com.codelab.networkengine.cli.commands.DisableCommand;
import com.codelab.networkengine.cli.commands.DoCommand;
import com.codelab.networkengine.cli.commands.EnableCommand;
import com.codelab.networkengine.cli.commands.EndCommand;
import com.codelab.networkengine.cli.commands.ExitCommand;
import com.codelab.networkengine.cli.commands.HostnameCommand;
import com.codelab.networkengine.cli.commands.InterfaceCommand;
import com.codelab.networkengine.cli.commands.IpAddressCommand;
import com.codelab.networkengine.cli.commands.IpDefaultGatewayCommand;
import com.codelab.networkengine.cli.commands.IpRouteCommand;
import com.codelab.networkengine.cli.commands.NameCommand;
import com.codelab.networkengine.cli.commands.PingCommand;
import com.codelab.networkengine.cli.commands.ShowInterfacesCommand;
import com.codelab.networkengine.cli.commands.ShowIpArpCommand;
import com.codelab.networkengine.cli.commands.ShowIpInterfaceBriefCommand;
import com.codelab.networkengine.cli.commands.ShowIpRouteCommand;
import com.codelab.networkengine.cli.commands.ShowMacAddressTableCommand;
import com.codelab.networkengine.cli.commands.ShowRunningConfigCommand;
import com.codelab.networkengine.cli.commands.ShowVlanCommand;
import com.codelab.networkengine.cli.commands.ShutdownCommand;
import com.codelab.networkengine.cli.commands.SwitchportAccessCommand;
import com.codelab.networkengine.cli.commands.SwitchportModeCommand;
import com.codelab.networkengine.cli.commands.VlanCommand;
import com.codelab.networkengine.domain.Device;

import java.util.ArrayList;
import java.util.List;

public class CommandRegistry {

    private final List<Command> commands = new ArrayList<>();

    public CommandRegistry() {
        register(new EnableCommand());
        register(new DisableCommand());
        register(new ExitCommand());
        register(new EndCommand());
        register(new DoCommand());
        register(new ConfigureTerminalCommand());
        register(new InterfaceCommand());
        register(new VlanCommand());
        register(new NameCommand());
        register(new HostnameCommand());
        register(new IpAddressCommand());
        register(new IpRouteCommand());
        register(new IpDefaultGatewayCommand());
        register(new SwitchportModeCommand());
        register(new SwitchportAccessCommand());
        register(new DescriptionCommand());
        register(new ShutdownCommand());
        register(new PingCommand());
        register(new ShowIpArpCommand());
        register(new ShowIpRouteCommand());
        register(new ShowIpInterfaceBriefCommand());
        register(new ShowMacAddressTableCommand());
        register(new ShowVlanCommand());
        register(new ShowRunningConfigCommand());
        register(new ShowInterfacesCommand());
    }

    public CommandRegistry register(Command command) {
        commands.add(command);
        return this;
    }

    public List<Command> all() {
        return List.copyOf(commands);
    }

    public List<Command> eligible(CliMode mode, Device device) {
        List<Command> result = new ArrayList<>();
        for (Command command : commands) {
            if (applies(command, mode, device)) {
                result.add(command);
            }
        }
        return result;
    }

    public CommandResolution resolve(List<String> tokens, CliMode mode, Device device) {
        if (tokens.isEmpty()) {
            return CommandResolution.error("% sintaxe incompleta");
        }
        List<Command> matches = new ArrayList<>();
        for (Command command : eligible(mode, device)) {
            if (matchesPrefix(command.name(), tokens)) {
                matches.add(command);
            }
        }
        if (matches.isEmpty()) {
            if (isIncomplete(tokens, mode, device)) {
                return CommandResolution.error("% comando incompleto: " + String.join(" ", tokens));
            }
            return CommandResolution.error("% comando desconhecido: " + String.join(" ", tokens));
        }
        Command chosen = exactMatch(matches, tokens);
        if (chosen == null) {
            if (matches.size() > 1) {
                return CommandResolution.error("% comando ambiguo: " + candidates(matches));
            }
            chosen = matches.get(0);
        }
        int nameWords = splitName(chosen.name()).length;
        List<String> args = tokens.size() > nameWords
                ? new ArrayList<>(tokens.subList(nameWords, tokens.size()))
                : List.of();
        return CommandResolution.success(chosen, args);
    }

    private boolean applies(Command command, CliMode mode, Device device) {
        if (!command.appliesTo(device)) {
            return false;
        }
        CliMode commandMode = command.mode();
        if (commandMode == CliMode.ANY || commandMode == mode) {
            return true;
        }
        return commandMode == CliMode.USER && mode == CliMode.PRIVILEGED;
    }

    private boolean matchesPrefix(String name, List<String> tokens) {
        String[] nameWords = splitName(name);
        if (tokens.size() < nameWords.length) {
            return false;
        }
        for (int i = 0; i < nameWords.length; i++) {
            if (!nameWords[i].toLowerCase().startsWith(tokens.get(i).toLowerCase())) {
                return false;
            }
        }
        return true;
    }

    private boolean isIncomplete(List<String> tokens, CliMode mode, Device device) {
        for (Command command : eligible(mode, device)) {
            String[] nameWords = splitName(command.name());
            if (nameWords.length <= tokens.size()) {
                continue;
            }
            boolean prefix = true;
            for (int i = 0; i < tokens.size(); i++) {
                if (!nameWords[i].toLowerCase().startsWith(tokens.get(i).toLowerCase())) {
                    prefix = false;
                    break;
                }
            }
            if (prefix) {
                return true;
            }
        }
        return false;
    }

    private Command exactMatch(List<Command> matches, List<String> tokens) {
        for (Command command : matches) {
            String[] nameWords = splitName(command.name());
            if (nameWords.length != tokens.size()) {
                continue;
            }
            boolean exact = true;
            for (int i = 0; i < nameWords.length; i++) {
                if (!nameWords[i].equalsIgnoreCase(tokens.get(i))) {
                    exact = false;
                    break;
                }
            }
            if (exact) {
                return command;
            }
        }
        return null;
    }

    private String candidates(List<Command> matches) {
        List<String> names = new ArrayList<>();
        for (Command command : matches) {
            names.add(command.name());
        }
        return String.join(", ", names);
    }

    private String[] splitName(String name) {
        return name.trim().split("\\s+");
    }
}
