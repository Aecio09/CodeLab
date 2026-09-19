package com.codelab.networkengine.cli;

import java.util.List;

public record CommandResolution(Command command, List<String> args, String error) {

    public static CommandResolution success(Command command, List<String> args) {
        return new CommandResolution(command, args, null);
    }

    public static CommandResolution error(String message) {
        return new CommandResolution(null, List.of(), message);
    }

    public boolean isError() {
        return error != null;
    }
}
