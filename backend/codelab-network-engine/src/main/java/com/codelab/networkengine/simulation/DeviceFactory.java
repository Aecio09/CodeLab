package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.ArpTable;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.DeviceModel;
import com.codelab.networkengine.domain.MacAddressTable;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.RoutingTable;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.domain.Vlan;

import java.util.HashMap;

public class DeviceFactory {
    private int idCounter = 1;

    public Computer computer(String hostname, String ip, String mask) {
        Computer computer = new Computer();
        computer.setId(idCounter++);
        computer.setHostname(hostname);
        computer.setModel(DeviceModel.HOST);
        computer.setInterfaces(new java.util.ArrayList<>());
        computer.setArpTable(new ArpTable());
        computer.setRoutingTable(new RoutingTable());
        addInterface(computer, DeviceModel.HOST.getDefaultPortPrefix() + "0", ip, mask);
        return computer;
    }

    public Router router(String hostname) {
        Router router = new Router();
        router.setId(idCounter++);
        router.setHostname(hostname);
        router.setModel(DeviceModel.ROUTER);
        router.setInterfaces(new java.util.ArrayList<>());
        router.setArpTable(new ArpTable());
        router.setRoutingTable(new RoutingTable());
        return router;
    }

    public Switch networkSwitch(String hostname) {
        Switch s = new Switch();
        s.setId(idCounter++);
        s.setHostname(hostname);
        s.setModel(DeviceModel.SWITCH);
        s.setInterfaces(new java.util.ArrayList<>());
        s.setVlans(new HashMap<>());
        Vlan defaultVlan = new Vlan();
        defaultVlan.setId(1);
        defaultVlan.setName("default");
        s.getVlans().put(1, defaultVlan);
        s.setMacAddressTable(new MacAddressTable());
        return s;
    }

    public NetworkInterface addInterface(Device device, String name, String ip, String mask) {
        NetworkInterface intf = new NetworkInterface();
        intf.setId(idCounter++);
        intf.setName(name);
        intf.setType(NetworkInterface.InterfaceType.FAST_ETHERNET);
        intf.setIpAddress(ip);
        intf.setSubnetMask(mask);
        intf.setMacAddress(nextMac());
        intf.setSpeed(100);
        intf.setDuplex(NetworkInterface.Duplex.FULL);
        intf.setAdminState(NetworkInterface.AdminState.UP);
        device.getInterfaces().add(intf);
        return intf;
    }

    private String nextMac() {
        return String.format("02:00:00:00:%02x:%02x", (idCounter >> 8) & 0xFF, idCounter & 0xFF);
    }
}