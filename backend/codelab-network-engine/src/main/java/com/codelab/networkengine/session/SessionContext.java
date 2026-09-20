package com.codelab.networkengine.session;

import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.simulation.DeviceFactory;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;
import lombok.Getter;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
public class SessionContext {
    private final String sessionId;
    private final String exerciseId;
    private final NetworkSession session;
    private final NetworkEngine engine;
    private final DeviceFactory factory;
    private final Map<String, Device> deviceByRef = new LinkedHashMap<>();
    private final Map<String, DeviceCli> cliByRef = new LinkedHashMap<>();
    private volatile long lastActivity = System.nanoTime();

    public SessionContext(String sessionId, String exerciseId) {
        this.sessionId = sessionId;
        this.exerciseId = exerciseId;
        this.session = new NetworkSession();
        this.engine = new NetworkEngine();
        this.factory = new DeviceFactory();
    }

    public void touch() {
        this.lastActivity = System.nanoTime();
    }

    public boolean idleNanos(long thresholdNanos) {
        return System.nanoTime() - lastActivity > thresholdNanos;
    }
}
