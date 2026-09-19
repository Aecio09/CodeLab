package com.codelab.networkengine.cli;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

import java.util.List;

public interface Command {

    String name();

    CliMode mode();

    String usage();

    default boolean appliesTo(Device device) {
        return true;
    }

    default boolean supportsNo() {
        return false;
    }

    String execute(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args);

    default String executeNo(Device device, NetworkSession session, NetworkEngine engine, DeviceCli cli, List<String> args) {
        return "% comando '" + name() + "' nao suporta o prefixo 'no'";
    }
}
