package com.codelab.networkengine.controller;

import com.codelab.networkengine.domain.DeviceModel;
import com.codelab.networkengine.persistence.SnapshotStore;
import com.codelab.networkengine.snapshot.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
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
        ds.setHostname(defaultHostname(req.kind()));
        if (snap.getDevices() == null) {
            snap.setDevices(new ArrayList<>());
        }
        snap.getDevices().add(ds);
        store.save(snap);
        return ResponseEntity.ok(ds);
    }

    @PostMapping("/{id}/links")
    public ResponseEntity<LinkSnapshot> addLink(@PathVariable String id, @RequestBody CreateLinkRequest req) {
        PlaygroundSnapshot snap = store.load(id).orElse(null);
        if (snap == null) {
            return ResponseEntity.notFound().build();
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

    private static String defaultHostname(DeviceModel kind) {
        return switch (kind) {
            case HOST -> "PC";
            case SWITCH -> "SW";
            case ROUTER -> "R";
            default -> "Device";
        };
    }

    public record CreateExerciseRequest(String name) {}
    public record CreateDeviceRequest(DeviceModel kind, Double x, Double y) {}
    public record CreateLinkRequest(String deviceRefA, String interfaceA, String deviceRefB, String interfaceB) {}
}
