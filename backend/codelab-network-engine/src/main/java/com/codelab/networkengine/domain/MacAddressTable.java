package com.codelab.networkengine.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class MacAddressTable {
    private Map<String, MacAddress> macAddresses = new HashMap<>();

    @Getter
    @Setter
    public static class MacAddress {
        private String macAddress;
        private String interfaceName;
        private Vlan vlan;
        private LocalDateTime timestamp;
        private MacEntryType type;

        public enum MacEntryType {
            DYNAMIC,
            STATIC
        }
    }
}