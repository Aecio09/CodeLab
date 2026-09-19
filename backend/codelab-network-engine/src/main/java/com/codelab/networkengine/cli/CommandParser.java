package com.codelab.networkengine.cli;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CommandParser {

    public List<String> tokenize(String line) {
        if (line == null) {
            return List.of();
        }
        String cleaned = line.trim();
        if (cleaned.endsWith("?")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        }
        if (cleaned.isEmpty()) {
            return List.of();
        }
        return new ArrayList<>(Arrays.asList(cleaned.split("\\s+")));
    }

    public boolean isHelp(String line) {
        return line != null && line.trim().endsWith("?");
    }

    public boolean isNo(List<String> tokens) {
        return !tokens.isEmpty() && tokens.get(0).equalsIgnoreCase("no");
    }
}
