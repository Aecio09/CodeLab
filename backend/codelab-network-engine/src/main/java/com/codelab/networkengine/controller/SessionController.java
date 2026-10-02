package com.codelab.networkengine.controller;

import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.DeviceModel;
import com.codelab.networkengine.domain.Link;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.persistence.SnapshotStore;
import com.codelab.networkengine.session.SessionContext;
import com.codelab.networkengine.session.SessionManager;
import com.codelab.networkengine.session.SnapshotMapper;
import com.codelab.networkengine.simulation.NetworkEvent;
import com.codelab.networkengine.snapshot.DeviceSnapshot;
import com.codelab.networkengine.snapshot.LinkSnapshot;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionManager sessionManager;
    private final SnapshotStore store;

    public SessionController(SessionManager sessionManager, SnapshotStore store) {
        this.sessionManager = sessionManager;
        this.store = store;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(@RequestBody CreateSessionRequest req) {
        try {
            SessionContext ctx = sessionManager.create(req.exerciseId(), store);
            return ResponseEntity.ok(new SessionResponse(ctx.getSessionId(), ctx.getExerciseId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{sessionId}/cli")
    public ResponseEntity<CliResponse> cli(@PathVariable String sessionId, @RequestBody CliRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        DeviceCli cli = ctx.getCliByRef().get(req.deviceRef());
        if (cli == null) {
            return ResponseEntity.badRequest().build();
        }
        List<TraceEvent> events = new ArrayList<>();
        ctx.getEngine().setTraceSink(e -> events.add(toTraceEvent(ctx, e)));
        String output;
        try {
            output = cli.execute(req.line());
        } finally {
            ctx.getEngine().setTraceSink(null);
        }
        return ResponseEntity.ok(new CliResponse(req.deviceRef(), cli.prompt(), output, events));
    }

    private static TraceEvent toTraceEvent(SessionContext ctx, NetworkEvent e) {
        return new TraceEvent(e.hop(), e.protocol(), e.action(),
                refOfId(ctx, e.srcDeviceId()), e.srcInterface(),
                refOfId(ctx, e.dstDeviceId()), e.dstInterface(),
                e.srcIp(), e.dstIp(), e.srcMac(), e.dstMac(), e.summary());
    }

    private static String refOfId(SessionContext ctx, Integer deviceId) {
        if (deviceId == null) {
            return null;
        }
        for (Map.Entry<String, Device> e : ctx.getDeviceByRef().entrySet()) {
            if (e.getValue().getId() == deviceId) {
                return e.getKey();
            }
        }
        return null;
    }

    @GetMapping("/{sessionId}/snapshot")
    public ResponseEntity<PlaygroundSnapshot> snapshot(@PathVariable String sessionId) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot stored = store.load(ctx.getExerciseId()).orElse(null);
        if (stored == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(SnapshotMapper.mergeLiveConfig(stored, ctx));
    }

    @PostMapping("/{sessionId}/save")
    public ResponseEntity<PlaygroundSnapshot> save(@PathVariable String sessionId) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot stored = store.load(ctx.getExerciseId()).orElse(null);
        if (stored == null) {
            return ResponseEntity.notFound().build();
        }
        PlaygroundSnapshot merged = SnapshotMapper.mergeLiveConfig(stored, ctx);
        store.save(merged);
        return ResponseEntity.ok(merged);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> destroy(@PathVariable String sessionId) {
        if (sessionManager.get(sessionId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        sessionManager.destroy(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sessionId}/devices")
    public ResponseEntity<?> addDevice(@PathVariable String sessionId, @RequestBody CreateDeviceRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.kind() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "kind obrigatorio"));
        }
        DeviceSnapshot ds = new DeviceSnapshot();
        ds.setRef(UUID.randomUUID().toString());
        ds.setKind(req.kind());
        ds.setX(req.x() != null ? req.x() : 0.0);
        ds.setY(req.y() != null ? req.y() : 0.0);
        ds.setHostname(req.hostname() != null && !req.hostname().isBlank()
                ? req.hostname() : defaultHostname(req.kind()));
        ds.setInterfaces(SnapshotMapper.defaultInterfaces(req.kind(),
                req.ports() != null ? req.ports() : req.kind().getDefaultPortCount()));
        SnapshotMapper.addDeviceToContext(ctx, ds);
        return ResponseEntity.ok(ds);
    }

    @PatchMapping("/{sessionId}/devices/{ref}")
    public ResponseEntity<?> patchDevice(@PathVariable String sessionId, @PathVariable String ref,
                                        @RequestBody PatchDeviceRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        Device live = ctx.getDeviceByRef().get(ref);
        if (live == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.hostname() != null && !req.hostname().isBlank()) {
            live.setHostname(req.hostname());
        }
        return ResponseEntity.ok(Map.of("ref", ref, "hostname", live.getHostname()));
    }

    @DeleteMapping("/{sessionId}/devices/{ref}")
    public ResponseEntity<Void> deleteDevice(@PathVariable String sessionId, @PathVariable String ref) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        Device live = ctx.getDeviceByRef().remove(ref);
        ctx.getCliByRef().remove(ref);
        if (live == null || !ctx.getSession().removeDevice(live)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sessionId}/links")
    public ResponseEntity<?> addLink(@PathVariable String sessionId, @RequestBody CreateLinkRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        Device devA = ctx.getDeviceByRef().get(req.deviceRefA());
        Device devB = ctx.getDeviceByRef().get(req.deviceRefB());
        if (devA == null || devB == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "deviceRefA/deviceRefB nao existem nesta sessao"));
        }
        NetworkInterface intfA = SnapshotMapper.findOrCreateInterface(ctx.getFactory(), devA, req.interfaceA());
        NetworkInterface intfB = SnapshotMapper.findOrCreateInterface(ctx.getFactory(), devB, req.interfaceB());
        if (ctx.getSession().isLinked(intfA) || ctx.getSession().isLinked(intfB)) {
            return ResponseEntity.badRequest().body(Map.of("error", "porta ja esta conectada"));
        }
        ctx.getSession().addLink(intfA, intfB);
        List<LinkSnapshot> links = SnapshotMapper.exportLiveLinks(ctx);
        return ResponseEntity.ok(links.get(links.size() - 1));
    }

    /** Corta (DOWN) ou religa (UP) o cabo pelo indice da lista viva. */
    @PatchMapping("/{sessionId}/links/{index}")
    public ResponseEntity<?> patchLink(@PathVariable String sessionId, @PathVariable int index,
                                       @RequestBody PatchLinkRequest req) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        Link link = ctx.getSession().linkAt(index);
        if (link == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.status() != null) {
            link.setStatus("DOWN".equalsIgnoreCase(req.status()) ? Link.LinkStatus.DOWN : Link.LinkStatus.UP);
        }
        return ResponseEntity.ok(SnapshotMapper.exportLiveLinks(ctx).get(index));
    }

    @DeleteMapping("/{sessionId}/links/{index}")
    public ResponseEntity<?> deleteLink(@PathVariable String sessionId, @PathVariable int index) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        if (ctx.getSession().linkAt(index) == null) {
            return ResponseEntity.notFound().build();
        }
        ctx.getSession().removeLinkAt(index);
        return ResponseEntity.noContent().build();
    }

    /** Estado estruturado para os paineis da tela (tabelas ARP/MAC/rotas). */
    @GetMapping("/{sessionId}/devices/{ref}/state")
    public ResponseEntity<?> deviceState(@PathVariable String sessionId, @PathVariable String ref) {
        SessionContext ctx = sessionManager.get(sessionId).orElse(null);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }
        Device dev = ctx.getDeviceByRef().get(ref);
        if (dev == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(DeviceState.of(dev));
    }

    private static String defaultHostname(DeviceModel kind) {
        return switch (kind) {
            case HOST -> "PC";
            case SWITCH -> "SW";
            case ROUTER -> "R";
            default -> "Device";
        };
    }

    public record CreateSessionRequest(String exerciseId) {}
    public record SessionResponse(String sessionId, String exerciseId) {}
    public record CliRequest(String deviceRef, String line) {}
    public record CliResponse(String deviceRef, String prompt, String output, List<TraceEvent> events) {}
    public record CreateDeviceRequest(DeviceModel kind, Double x, Double y, String hostname, Integer ports) {}
    public record PatchDeviceRequest(Double x, Double y, String hostname) {}
    public record PatchLinkRequest(String status) {}
    public record CreateLinkRequest(String deviceRefA, String interfaceA, String deviceRefB, String interfaceB) {}
    public record TraceEvent(int hop, String protocol, String action, String fromDeviceRef, String fromInterface,
                             String toDeviceRef, String toInterface, String srcIp, String dstIp,
                             String srcMac, String dstMac, String summary) {}
}
