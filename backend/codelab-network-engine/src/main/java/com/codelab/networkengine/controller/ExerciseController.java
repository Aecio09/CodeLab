package com.codelab.networkengine.controller;

import com.codelab.networkengine.domain.DeviceModel;
import com.codelab.networkengine.persistence.SnapshotStore;
import com.codelab.networkengine.session.SnapshotMapper;
import com.codelab.networkengine.snapshot.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final SnapshotStore store;

    public ExerciseController(SnapshotStore store) {
        this.store = store;
    }

    @PostMapping
    public ResponseEntity<PlaygroundSnapshot> create(@RequestBody CreateExerciseRequest req) {
        PlaygroundSnapshot snap = new PlaygroundSnapshot();
        snap.setExerciseId(UUID.randomUUID().toString());
        snap.setName(req.name() != null ? req.name() : "Novo laboratorio");
        store.save(snap);
        return ResponseEntity.created(URI.create("/api/exercises/" + snap.getExerciseId())).body(snap);
    }

    @GetMapping
    public ResponseEntity<List<ExerciseSummary>> list() {
        return ResponseEntity.ok(store.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaygroundSnapshot> get(@PathVariable String id) {
        return store.load(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaygroundSnapshot> update(@PathVariable String id, @RequestBody PlaygroundSnapshot snap) {
        if (store.load(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        snap.setExerciseId(id);
        store.save(snap);
        return ResponseEntity.ok(snap);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (store.load(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        store.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/devices")
    public ResponseEntity<DeviceSnapshot> addDevice(@PathVariable String id, @RequestBody CreateDeviceRequest req) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
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
        if (snap.getDevices() == null) {
            snap.setDevices(new ArrayList<>());
        }
        snap.getDevices().add(ds);
        store.save(snap);
        return ResponseEntity.ok(ds);
    }

    @PostMapping("/{id}/links")
    public ResponseEntity<?> addLink(@PathVariable String id, @RequestBody CreateLinkRequest req) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
        }
        if (!hasDevice(snap, req.deviceRefA()) || !hasDevice(snap, req.deviceRefB())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "deviceRefA/deviceRefB nao existem no exercicio"));
        }
        LinkSnapshot ls = new LinkSnapshot();
        ls.setDeviceRefA(req.deviceRefA());
        ls.setInterfaceA(req.interfaceA());
        ls.setDeviceRefB(req.deviceRefB());
        ls.setInterfaceB(req.interfaceB());
        if (snap.getLinks() == null) {
            snap.setLinks(new ArrayList<>());
        }
        snap.getLinks().add(ls);
        store.save(snap);
        return ResponseEntity.ok(ls);
    }

    @GetMapping("/device-models")
    public ResponseEntity<List<DeviceModelInfo>> deviceModels() {
        return ResponseEntity.ok(List.of(DeviceModel.values()).stream()
                .map(m -> new DeviceModelInfo(m.name(), m.getDisplayName(),
                        m.getDefaultPortPrefix(), m.getDefaultPortCount()))
                .toList());
    }

    @PatchMapping("/{id}/devices/{ref}")
    public ResponseEntity<?> patchDevice(@PathVariable String id, @PathVariable String ref,
                                        @RequestBody PatchDeviceRequest req) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
        }
        DeviceSnapshot ds = findDevice(snap, ref);
        if (ds == null) {
            return ResponseEntity.notFound().build();
        }
        if (req.x() != null) {
            ds.setX(req.x());
        }
        if (req.y() != null) {
            ds.setY(req.y());
        }
        if (req.hostname() != null && !req.hostname().isBlank()) {
            ds.setHostname(req.hostname());
        }
        store.save(snap);
        return ResponseEntity.ok(ds);
    }

    /** Remove o device e todos os cabos ligados a ele. */
    @DeleteMapping("/{id}/devices/{ref}")
    public ResponseEntity<Void> deleteDevice(@PathVariable String id, @PathVariable String ref) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
        }
        if (findDevice(snap, ref) == null) {
            return ResponseEntity.notFound().build();
        }
        snap.getDevices().removeIf(d -> ref.equals(d.getRef()));
        if (snap.getLinks() != null) {
            snap.getLinks().removeIf(l -> ref.equals(l.getDeviceRefA()) || ref.equals(l.getDeviceRefB()));
        }
        store.save(snap);
        return ResponseEntity.noContent().build();
    }

    /** Corta ou religa o cabo pelo indice na lista de links do snapshot. */
    @PatchMapping("/{id}/links/{index}")
    public ResponseEntity<?> patchLink(@PathVariable String id, @PathVariable int index,
                                       @RequestBody PatchLinkRequest req) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
        }
        if (snap.getLinks() == null || index < 0 || index >= snap.getLinks().size()) {
            return ResponseEntity.notFound().build();
        }
        LinkSnapshot ls = snap.getLinks().get(index);
        if (req.status() != null) {
            ls.setStatus("DOWN".equalsIgnoreCase(req.status()) ? "DOWN" : "UP");
        }
        store.save(snap);
        return ResponseEntity.ok(ls);
    }

    @DeleteMapping("/{id}/links/{index}")
    public ResponseEntity<Void> deleteLink(@PathVariable String id, @PathVariable int index) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
        }
        if (snap.getLinks() == null || index < 0 || index >= snap.getLinks().size()) {
            return ResponseEntity.notFound().build();
        }
        snap.getLinks().remove(index);
        store.save(snap);
        return ResponseEntity.noContent().build();
    }

    private static DeviceSnapshot findDevice(PlaygroundSnapshot snap, String ref) {
        if (snap.getDevices() == null) {
            return null;
        }
        return snap.getDevices().stream().filter(d -> ref.equals(d.getRef())).findFirst().orElse(null);
    }

    private static boolean hasDevice(PlaygroundSnapshot snap, String ref) {
        if (snap.getDevices() == null || ref == null) {
            return false;
        }
        return snap.getDevices().stream().anyMatch(d -> ref.equals(d.getRef()));
    }

    private static String defaultHostname(DeviceModel kind) {
        return switch (kind) {
            case HOST -> "PC";
            case SWITCH -> "SW";
            case ROUTER -> "R";
            default -> "Device";
        };
    }

    public record CreateExerciseRequest(String name) {}
    public record CreateDeviceRequest(DeviceModel kind, Double x, Double y, String hostname, Integer ports) {}
    public record PatchDeviceRequest(Double x, Double y, String hostname) {}
    public record PatchLinkRequest(String status) {}
    public record DeviceModelInfo(String kind, String displayName, String portPrefix, int defaultPorts) {}
    public record CreateLinkRequest(String deviceRefA, String interfaceA, String deviceRefB, String interfaceB) {}
}
