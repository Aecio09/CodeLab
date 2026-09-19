package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class ArpTable {
    private Map<String, ArpEntry> entries = new HashMap<>();

    @Getter
    @Setter
    public static class ArpEntry {
        private String macAddress;
        private String interfaceName;
        private LocalDateTime timestamp;
        private ArpEntryType type;

        public enum ArpEntryType {
            DYNAMIC,
            STATIC
        }
    }
}