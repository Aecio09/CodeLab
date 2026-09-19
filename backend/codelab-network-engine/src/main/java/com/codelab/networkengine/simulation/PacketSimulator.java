package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.packets.EthernetFrame;

import java.util.Optional;

public class PacketSimulator {

    public void send(NetworkSession session, Device source, NetworkInterface sourceInterface,
                     EthernetFrame frame, FrameReceiver receiver) {
        Optional<NetworkSession.Peer> peer = session.peerOf(sourceInterface);
        peer.ifPresent(p -> receiver.onFrame(session, p.device(), p.intf(), frame));
    }

    @FunctionalInterface
    public interface FrameReceiver {
        void onFrame(NetworkSession session, Device receiver, NetworkInterface intf, EthernetFrame frame);
    }
}