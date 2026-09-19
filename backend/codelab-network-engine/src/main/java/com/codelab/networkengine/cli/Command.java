package com.codelab.networkengine.cli;

public interface Command {
    String name();

    String usage();

    void execute(String[] args);
}