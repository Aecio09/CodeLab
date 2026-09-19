package com.codelab.networkengine.cli;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Vlan;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class DeviceCli {

    private final Device device;
    private final NetworkSession session;
    private final NetworkEngine engine;
    private final CommandRegistry registry;
    private final CommandParser parser = new CommandParser();
    private final Deque<CliMode> modes = new ArrayDeque<>();

    private NetworkInterface configInterface;
    private Vlan configVlan;

    public DeviceCli(Device device, NetworkSession session, NetworkEngine engine) {
        this(device, session, engine, new CommandRegistry());
    }

    public DeviceCli(Device device, NetworkSession session, NetworkEngine engine, CommandRegistry registry) {
        this.device = device;
        this.session = session;
        this.engine = engine;
        this.registry = registry;
        this.modes.push(CliMode.USER);
    }

    public String prompt() {
        return device.getHostname() + currentMode().getSuffix();
    }

    public CliMode currentMode() {
        return modes.peek();
    }

    public void pushMode(CliMode mode) {
        modes.push(mode);
    }

    public void popMode() {
        if (modes.size() <= 1) {
            return;
        }
        CliMode leaving = modes.pop();
        if (leaving == CliMode.CONFIG_INTERFACE) {
            configInterface = null;
        } else if (leaving == CliMode.CONFIG_VLAN) {
            configVlan = null;
        }
    }

    public void popTo(CliMode mode) {
        while (modes.size() > 1 && currentMode() != mode) {
            popMode();
        }
    }

    public String execute(String line) {
        boolean help = parser.isHelp(line);
        List<String> tokens = parser.tokenize(line);
        if (tokens.isEmpty()) {
            return help ? listHelp() : "";
        }
        if (help) {
            return helpFor(tokens);
        }
        boolean no = parser.isNo(tokens);
        List<String> effective = no ? tokens.subList(1, tokens.size()) : tokens;
        CommandResolution resolution = registry.resolve(effective, currentMode(), device);
        if (resolution.isError()) {
            return resolution.error();
        }
        Command command = resolution.command();
        if (no && !command.supportsNo()) {
            return "% comando '" + command.name() + "' nao suporta o prefixo 'no'";
        }
        try {
            return no
                    ? command.executeNo(device, session, engine, this, resolution.args())
                    : command.execute(device, session, engine, this, resolution.args());
        } catch (RuntimeException e) {
            return "% erro: " + e.getMessage();
        }
    }

    public String executeInMode(CliMode mode, List<String> tokens) {
        CommandResolution resolution = registry.resolve(tokens, mode, device);
        if (resolution.isError()) {
            return resolution.error();
        }
        try {
            return resolution.command().execute(device, session, engine, this, resolution.args());
        } catch (RuntimeException e) {
            return "% erro: " + e.getMessage();
        }
    }

    public String listHelp() {
        StringBuilder sb = new StringBuilder();
        sb.append("Comandos disponiveis no modo ").append(currentMode().name()).append(":");
        for (Command command : registry.eligible(currentMode(), device)) {
            sb.append("\n  ").append(command.usage());
        }
        return sb.toString();
    }

    public String helpFor(List<String> tokens) {
        List<Command> matches = new ArrayList<>();
        for (Command command : registry.eligible(currentMode(), device)) {
            if (nameStartsWith(command.name(), tokens)) {
                matches.add(command);
            }
        }
        if (matches.isEmpty()) {
            return "% nenhum comando comeca com: " + String.join(" ", tokens);
        }
        StringBuilder sb = new StringBuilder();
        for (Command command : matches) {
            sb.append(command.usage()).append("\n");
        }
        return sb.toString().stripTrailing();
    }

    private boolean nameStartsWith(String name, List<String> tokens) {
        String[] words = name.trim().split("\\s+");
        if (tokens.size() > words.length) {
            return false;
        }
        for (int i = 0; i < tokens.size(); i++) {
            if (!words[i].toLowerCase().startsWith(tokens.get(i).toLowerCase())) {
                return false;
            }
        }
        return true;
    }

    public Device device() {
        return device;
    }

    public NetworkSession session() {
        return session;
    }

    public NetworkEngine engine() {
        return engine;
    }

    public CommandRegistry registry() {
        return registry;
    }

    public NetworkInterface configInterface() {
        return configInterface;
    }

    public void setConfigInterface(NetworkInterface configInterface) {
        this.configInterface = configInterface;
    }

    public Vlan configVlan() {
        return configVlan;
    }

    public void setConfigVlan(Vlan configVlan) {
        this.configVlan = configVlan;
    }
}
