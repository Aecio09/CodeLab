package com.codelab.networkengine.snapshot;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PlaygroundSnapshot {
    private String exerciseId;
    private String name;
    private List<DeviceSnapshot> devices = new ArrayList<>();
    private List<LinkSnapshot> links = new ArrayList<>();
}
