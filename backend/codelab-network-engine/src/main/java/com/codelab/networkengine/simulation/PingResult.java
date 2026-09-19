package com.codelab.networkengine.simulation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PingResult {
    private boolean reached;
    private String targetIp;
    private long rttMillis;
    private String reason;

    public static PingResult success(String targetIp, long rttNanos) {
        return new PingResult(true, targetIp, rttNanos / 1_000_000, null);
    }

    public static PingResult failure(String targetIp, String reason) {
        return new PingResult(false, targetIp, 0L, reason);
    }

    @Override
    public String toString() {
        return reached
                ? "ping to " + targetIp + ": " + rttMillis + "ms"
                : "ping to " + targetIp + ": unreachable (" + reason + ")";
    }
}