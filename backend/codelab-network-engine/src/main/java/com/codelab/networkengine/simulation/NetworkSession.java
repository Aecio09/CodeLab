package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.Link;
import com.codelab.networkengine.domain.NetworkInterface;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class NetworkSession {
    private final List<Device> devices = new ArrayList<>();
    private final List<Link> links = new ArrayList<>();

    public Device addDevice(Device device) {
        devices.add(device);
        return device;
    }

    public Link addLink(NetworkInterface interfaceA, NetworkInterface interfaceB) {
        return addLink(interfaceA, interfaceB, Link.LinkStatus.UP);
    }

    public Link addLink(NetworkInterface interfaceA, NetworkInterface interfaceB, Link.LinkStatus status) {
        Link link = new Link();
        link.setId(links.size() + 1);
        link.setInterfaceA(interfaceA);
        link.setInterfaceB(interfaceB);
        link.setStatus(status);
        links.add(link);
        return link;
    }

    public Optional<Peer> peerOf(NetworkInterface networkInterface) {
        for (Link link : links) {
            if (link.getStatus() != Link.LinkStatus.UP) {
                continue;
            }
            if (link.getInterfaceA() == networkInterface && link.getInterfaceB() != null) {
                return Optional.of(new Peer(ownerOf(link.getInterfaceB()), link.getInterfaceB()));
            }
            if (link.getInterfaceB() == networkInterface && link.getInterfaceA() != null) {
                return Optional.of(new Peer(ownerOf(link.getInterfaceA()), link.getInterfaceA()));
            }
        }
        return Optional.empty();
    }

    public List<Device> getDevices() {
        return devices;
    }

    public List<Link> getLinks() {
        return links;
    }

    private Device ownerOf(NetworkInterface networkInterface) {
        for (Device device : devices) {
            if (device.getInterfaces() != null && device.getInterfaces().contains(networkInterface)) {
                return device;
            }
        }
        return null;
    }

    public record Peer(Device device, NetworkInterface intf) {
    }
}