package com.codelab.networkengine.simulation;

import com.codelab.networkengine.domain.Device;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.packets.EthernetFrame;

import java.util.Optional;

public class PacketSimulator {

    private static final int MAX_HOPS = 64;

    private int hops;
    private NetworkEvent.TraceSink traceSink;

    public void setTraceSink(NetworkEvent.TraceSink traceSink) {
        this.traceSink = traceSink;
    }

    public void send(NetworkSession session, Device source, NetworkInterface sourceInterface,
                     EthernetFrame frame, FrameReceiver receiver) {
        if (hops >= MAX_HOPS) {
            return;
        }
        Optional<NetworkSession.Peer> peer = session.peerOf(sourceInterface);
        if (peer.isEmpty()) {
            return;
        }
        hops++;
        if (traceSink != null) {
            traceSink.onEvent(NetworkEvent.of(hops, frame, source, sourceInterface,
                    peer.get().device(), peer.get().intf()));
        }
        try {
            receiver.onFrame(session, peer.get().device(), peer.get().intf(), frame);
        } finally {
            hops--;
        }
    }

    @FunctionalInterface
    public interface FrameReceiver {
        void onFrame(NetworkSession session, Device receiver, NetworkInterface intf, EthernetFrame frame);
    }
}
