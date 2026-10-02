package com.codelab.networkengine.protocols.routing;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IpMathTest {

    @Test
    void coversAceitaRedeNormalizada() {
        assertTrue(IpMath.covers("10.9.9.0", "255.255.255.0", "10.9.9.2"));
        assertTrue(IpMath.covers("10.9.9.0", "255.255.255.0", "10.9.9.254"));
    }

    @Test
    void coversNormalizaRedeComBitsDeHost() {
        // O Cisco aceita 'ip route 10.9.9.5 255.255.255.0' e normaliza para
        // 10.9.9.0/24. A comparacao precisa tolerar a rede nao normalizada.
        assertTrue(IpMath.covers("10.9.9.5", "255.255.255.0", "10.9.9.2"));
    }

    @Test
    void coversRejeitaDestinoForaDaRede() {
        assertFalse(IpMath.covers("10.9.9.0", "255.255.255.0", "10.9.10.2"));
        assertFalse(IpMath.covers("192.168.1.0", "255.255.255.0", "192.168.2.1"));
    }

    @Test
    void cobreDiferentesTamanosDeRede() {
        assertTrue(IpMath.covers("10.0.0.0", "255.255.255.128", "10.0.0.100"));
        assertFalse(IpMath.covers("10.0.0.0", "255.255.255.128", "10.0.0.200"));
        assertTrue(IpMath.covers("10.0.0.0", "255.255.0.0", "10.0.200.1"));
        assertFalse(IpMath.covers("10.0.0.0", "255.255.0.0", "10.1.0.1"));
    }

    @Test
    void rotaPadraoCobreQualquerDestino() {
        assertTrue(IpMath.covers("0.0.0.0", "0.0.0.0", "8.8.8.8"));
        assertTrue(IpMath.covers("0.0.0.0", "0.0.0.0", "192.168.1.1"));
    }

    @Test
    void networkOfNormaliza() {
assertTrue("10.9.9.0".equals(IpMath.networkOf("10.9.9.5", "255.255.255.0")));
        assertTrue("10.9.9.16".equals(IpMath.networkOf("10.9.9.20", "255.255.255.240")));
        assertTrue("0.0.0.0".equals(IpMath.networkOf("192.168.1.1", "0.0.0.0")));
    }

    @Test
    void prefixLengthContaBits() {
        assertTrue(IpMath.prefixLength("255.255.255.0") == 24);
        assertTrue(IpMath.prefixLength("255.255.255.252") == 30);
        assertTrue(IpMath.prefixLength("0.0.0.0") == 0);
    }

    @Test
    void mascarasValidasSaoContiguas() {
        assertTrue(IpMath.isValidNetmask("0.0.0.0"));
        assertTrue(IpMath.isValidNetmask("128.0.0.0"));
        assertTrue(IpMath.isValidNetmask("255.255.255.0"));
        assertTrue(IpMath.isValidNetmask("255.255.255.252"));
        assertTrue(IpMath.isValidNetmask("255.255.255.255"));
    }

    @Test
    void mascarasNaoContiguasSaoInvalidas() {
        assertFalse(IpMath.isValidNetmask("255.0.255.0"));
        assertFalse(IpMath.isValidNetmask("255.255.0.255"));
        assertFalse(IpMath.isValidNetmask("0.255.255.255"));
        assertFalse(IpMath.isValidNetmask("255.255.255.1"));
    }

    @Test
    void sameSubnetComparaPelaMascara() {
        assertTrue(IpMath.sameSubnet("10.0.0.1", "255.255.255.0", "10.0.0.2"));
        assertFalse(IpMath.sameSubnet("10.0.0.1", "255.255.255.0", "10.0.1.2"));
    }
}