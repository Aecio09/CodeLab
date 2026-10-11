package com.codelab.networkengine.verification;

import com.codelab.networkengine.domain.DeviceModel;
import com.codelab.networkengine.session.SessionContext;
import com.codelab.networkengine.session.SnapshotMapper;
import com.codelab.networkengine.snapshot.DeviceSnapshot;
import com.codelab.networkengine.snapshot.InterfaceSnapshot;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import com.codelab.networkengine.snapshot.RouteSnapshot;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VerificationServiceTest {

    private final VerificationService service = new VerificationService();

    @Test
    void ipCorretoAprova() {
        SessionContext ctx = ctx(hosts(2));

        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.ipAddress", "equals", txt("192.168.1.10"))));

        assertEquals("APPROVED", res.verdict());
        assertTrue(res.checks().get(0).passed());
    }

    @Test
    void ipErradoReprovaComValorReal() {
        SessionContext ctx = ctx(hosts(2));

        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.ipAddress", "equals", txt("192.168.1.99"))));

        assertEquals("REJECTED", res.verdict());
        assertEquals("192.168.1.10", res.checks().get(0).actual().asText());
    }

    @Test
    void mascaraAprova() {
        SessionContext ctx = ctx(hosts(2));
        assertEquals("APPROVED", service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.subnetMask", "equals", txt("255.255.255.0")))).verdict());
    }

    @Test
    void adminUpTrueAprova() {
        SessionContext ctx = ctx(hosts(2));
        assertEquals("APPROVED", service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.adminUp", "equals", JsonNodeFactory.instance.booleanNode(true)))).verdict());
    }

    @Test
    void adminUpFalseReprovaQuandoEstaLigada() {
        SessionContext ctx = ctx(hosts(2));
        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.adminUp", "equals", JsonNodeFactory.instance.booleanNode(false))));
        assertEquals("REJECTED", res.verdict());
        assertEquals(true, res.checks().get(0).actual().asBoolean());
    }

    @Test
    void adminUpDesligadoReprovaQuandoEsperadoLigado() {
        PlaygroundSnapshot snap = hosts(2);
        snap.getDevices().get(0).getInterfaces().get(0).setAdminUp(false);
        SessionContext ctx = ctx(snap);

        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.adminUp", "equals", JsonNodeFactory.instance.booleanNode(true))));

        assertEquals("REJECTED", res.verdict());
        assertEquals(false, res.checks().get(0).actual().asBoolean());
    }

    @Test
    void caminhoInexistenteReprovaComActualNulo() {
        SessionContext ctx = ctx(hosts(2));
        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.nope.interfaces.eth0.ipAddress", "equals", txt("1.1.1.1")),
                check("devices.pc1.interfaces.eth0.inexistente", "equals", txt("x"))));
        assertEquals("REJECTED", res.verdict());
        assertFalse(res.checks().get(0).passed());
        assertFalse(res.checks().get(1).passed());
        assertNull(res.checks().get(0).actual());
    }

    @Test
    void notEqualsPassaQuandoDiferente() {
        SessionContext ctx = ctx(hosts(2));
        assertEquals("APPROVED", service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.ipAddress", "not_equals", txt("192.168.1.99")))).verdict());
    }

    @Test
    void existsConfereSomentePresenca() {
        SessionContext ctx = ctx(hosts(2));
        assertEquals("APPROVED", service.verify(ctx, req(
                check("devices.pc1.interfaces.eth0.ipAddress", "exists", null))).verdict());
    }

    @Test
    void rotaContemEntradaEsperada() {
        SessionContext ctx = ctx(routerWithRoute());

        JsonNode route = JsonNodeFactory.instance.objectNode()
                .put("network", "192.168.3.0")
                .put("subnetMask", "255.255.255.0")
                .put("nextHop", "192.168.1.1");

        assertEquals("APPROVED", service.verify(ctx, req(
                check("devices.r1.routes", "contains", route))).verdict());
    }

    @Test
    void rotaAusenteReprova() {
        SessionContext ctx = ctx(routerWithRoute());

        JsonNode route = JsonNodeFactory.instance.objectNode()
                .put("network", "10.0.0.0")
                .put("subnetMask", "255.255.255.0")
                .put("nextHop", "192.168.1.1");

        VerificationService.VerifyResponse res = service.verify(ctx, req(
                check("devices.r1.routes", "contains", route)));
        assertEquals("REJECTED", res.verdict());
        assertFalse(res.checks().get(0).passed());
    }

    private VerificationService.Check check(String field, String check, JsonNode value) {
        return new VerificationService.Check(field, check, value);
    }

    private VerificationService.VerifyRequest req(VerificationService.Check... checks) {
        return new VerificationService.VerifyRequest(List.of(checks));
    }

    private static JsonNode txt(String value) {
        return JsonNodeFactory.instance.textNode(value);
    }

    private SessionContext ctx(PlaygroundSnapshot snapshot) {
        SessionContext ctx = new SessionContext("s1", "e1");
        SnapshotMapper.buildFromSnapshot(ctx, snapshot);
        return ctx;
    }

    /** Dois hosts no mesmo switch; pc2 com subnet errada (o defeito do modulo 1). */
    private PlaygroundSnapshot hosts(int ignored) {
        PlaygroundSnapshot snap = new PlaygroundSnapshot();
        snap.setExerciseId("e1");
        snap.setName("modulo 1");

        DeviceSnapshot pc1 = new DeviceSnapshot();
        pc1.setRef("pc1");
        pc1.setKind(DeviceModel.HOST);
        pc1.setHostname("PC1");
        InterfaceSnapshot eth0a = new InterfaceSnapshot();
        eth0a.setName("eth0");
        eth0a.setIpAddress("192.168.1.10");
        eth0a.setSubnetMask("255.255.255.0");
        eth0a.setAdminUp(true);
        pc1.setInterfaces(List.of(eth0a));

        DeviceSnapshot pc2 = new DeviceSnapshot();
        pc2.setRef("pc2");
        pc2.setKind(DeviceModel.HOST);
        pc2.setHostname("PC2");
        InterfaceSnapshot eth0b = new InterfaceSnapshot();
        eth0b.setName("eth0");
        eth0b.setIpAddress("192.168.2.20");
        eth0b.setSubnetMask("255.255.255.0");
        eth0b.setAdminUp(true);
        pc2.setInterfaces(List.of(eth0b));

        snap.setDevices(List.of(pc1, pc2));
        snap.setLinks(List.of());
        return snap;
    }

    private PlaygroundSnapshot routerWithRoute() {
        PlaygroundSnapshot snap = new PlaygroundSnapshot();
        snap.setExerciseId("e1");
        snap.setName("router");

        DeviceSnapshot r1 = new DeviceSnapshot();
        r1.setRef("r1");
        r1.setKind(DeviceModel.ROUTER);
        r1.setHostname("R1");
        InterfaceSnapshot g0 = new InterfaceSnapshot();
        g0.setName("gi0/0");
        g0.setIpAddress("192.168.1.1");
        g0.setSubnetMask("255.255.255.0");
        g0.setAdminUp(true);
        InterfaceSnapshot g1 = new InterfaceSnapshot();
        g1.setName("gi0/1");
        g1.setIpAddress("192.168.3.1");
        g1.setSubnetMask("255.255.255.0");
        g1.setAdminUp(true);
        r1.setInterfaces(List.of(g0, g1));

        RouteSnapshot route = new RouteSnapshot();
        route.setNetwork("192.168.3.0");
        route.setSubnetMask("255.255.255.0");
        route.setNextHop("192.168.1.1");
        r1.setRoutes(List.of(route));

        snap.setDevices(List.of(r1));
        snap.setLinks(List.of());
        return snap;
    }
}