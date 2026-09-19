package com.codelab.networkengine.demo;

import com.codelab.networkengine.cli.CommandRegistry;
import com.codelab.networkengine.cli.DeviceCli;
import com.codelab.networkengine.domain.Computer;
import com.codelab.networkengine.domain.NetworkInterface;
import com.codelab.networkengine.domain.Router;
import com.codelab.networkengine.domain.Switch;
import com.codelab.networkengine.simulation.DeviceFactory;
import com.codelab.networkengine.simulation.NetworkEngine;
import com.codelab.networkengine.simulation.NetworkSession;

public class CliDemo {

    public static void main(String[] args) {
        l2Scenario();
        l3Scenario();
    }

    private static void l2Scenario() {
        DeviceFactory factory = new DeviceFactory();
        NetworkEngine engine = new NetworkEngine();
        NetworkSession session = new NetworkSession();
        CommandRegistry registry = new CommandRegistry();

        Computer pc1 = factory.computer("PC1", "10.0.0.10", "255.255.255.0");
        Computer pc2 = factory.computer("PC2", "10.0.0.20", "255.255.255.0");
        Computer pc3 = factory.computer("PC3", "10.0.0.30", "255.255.255.0");
        Switch sw1 = factory.networkSwitch("SW1");
        NetworkInterface swPort1 = factory.addInterface(sw1, "fa0/1", null, null);
        NetworkInterface swPort2 = factory.addInterface(sw1, "fa0/2", null, null);
        NetworkInterface swPort3 = factory.addInterface(sw1, "fa0/3", null, null);

        session.addDevice(pc1);
        session.addDevice(pc2);
        session.addDevice(pc3);
        session.addDevice(sw1);
        session.addLink(pc1.getInterfaces().get(0), swPort1);
        session.addLink(pc2.getInterfaces().get(0), swPort2);
        session.addLink(pc3.getInterfaces().get(0), swPort3);

        DeviceCli swCli = new DeviceCli(sw1, session, engine, registry);
        DeviceCli pcCli = new DeviceCli(pc1, session, engine, registry);

        section("Cenario L2 - configurando o switch SW1");
        run(swCli,
                "enable",
                "configure terminal",
                "hostname SW1",
                "vlan 10",
                "name VENDAS",
                "exit",
                "vlan 20",
                "name FINANCEIRO",
                "exit",
                "interface fa0/1",
                "switchport mode access",
                "switchport access vlan 10",
                "description Porta do PC1",
                "exit",
                "interface fa0/2",
                "switchport access vlan 10",
                "exit",
                "interface fa0/3",
                "switchport mode access",
                "switchport access vlan 20",
                "exit",
                "exit");

        section("Cenario L2 - configurando o host PC1");
        run(pcCli,
                "enable",
                "configure terminal",
                "hostname PC1",
                "interface eth0",
                "description Host do aluno",
                "exit",
                "exit");

        section("Cenario L2 - ping do PC1 para o PC2 (via switch)");
        run(pcCli, "ping 10.0.0.20", "ping 10.0.0.20");

        section("Cenario L2 - show ip arp no PC1");
        run(pcCli, "show ip arp");

        section("Cenario L2 - show interfaces no PC1");
        run(pcCli, "show interfaces");

        section("Cenario L2 - show mac address-table no SW1");
        run(swCli, "show mac address-table");

        section("Cenario L2 - show vlan brief no SW1");
        run(swCli, "show vlan brief");

        section("Cenario L2 - show running-config no SW1");
        run(swCli, "show running-config");

        section("Cenario L2 - show ip interface brief no PC1");
        run(pcCli, "show ip interface brief");

        section("Cenario L2 - isolamento de VLAN: PC1 (VLAN 10) -> PC3 (VLAN 20) deve falhar");
        run(pcCli, "ping 10.0.0.30");
    }

    private static void l3Scenario() {
        DeviceFactory factory = new DeviceFactory();
        NetworkEngine engine = new NetworkEngine();
        NetworkSession session = new NetworkSession();
        CommandRegistry registry = new CommandRegistry();

        Computer pc1 = factory.computer("PC1", "10.0.1.10", "255.255.255.0");
        Computer pc2 = factory.computer("PC2", "10.0.2.10", "255.255.255.0");
        Router r1 = factory.router("R1");
        Router r2 = factory.router("R2");

        NetworkInterface r1Gi00 = factory.addInterface(r1, "gi0/0", null, null);
        NetworkInterface r1Gi01 = factory.addInterface(r1, "gi0/1", null, null);
        NetworkInterface r2Gi00 = factory.addInterface(r2, "gi0/0", null, null);
        NetworkInterface r2Gi01 = factory.addInterface(r2, "gi0/1", null, null);

        session.addDevice(pc1);
        session.addDevice(pc2);
        session.addDevice(r1);
        session.addDevice(r2);
        session.addLink(pc1.getInterfaces().get(0), r1Gi00);
        session.addLink(r1Gi01, r2Gi00);
        session.addLink(r2Gi01, pc2.getInterfaces().get(0));

        DeviceCli r1Cli = new DeviceCli(r1, session, engine, registry);
        DeviceCli r2Cli = new DeviceCli(r2, session, engine, registry);
        DeviceCli pc1Cli = new DeviceCli(pc1, session, engine, registry);
        DeviceCli pc2Cli = new DeviceCli(pc2, session, engine, registry);

        section("Cenario L3 - configurando o roteador R1 via CLI");
        run(r1Cli,
                "enable",
                "conf t",
                "hostname R1",
                "interface gi0/0",
                "ip address 10.0.1.1 255.255.255.0",
                "no shutdown",
                "exit",
                "interface gi0/1",
                "ip address 10.0.3.1 255.255.255.0",
                "no shutdown",
                "exit",
                "ip route 10.0.2.0 255.255.255.0 10.0.3.2",
                "exit");

        section("Cenario L3 - configurando o roteador R2 via CLI");
        run(r2Cli,
                "enable",
                "conf t",
                "hostname R2",
                "interface gi0/0",
                "ip address 10.0.3.2 255.255.255.0",
                "no shutdown",
                "exit",
                "interface gi0/1",
                "ip address 10.0.2.1 255.255.255.0",
                "no shutdown",
                "exit",
                "ip route 10.0.1.0 255.255.255.0 10.0.3.1",
                "exit");

        section("Cenario L3 - default gateway dos hosts via CLI");
        run(pc1Cli, "enable", "conf t", "ip default-gateway 10.0.1.1", "exit", "exit");
        run(pc2Cli, "enable", "conf t", "ip default-gateway 10.0.2.1", "exit", "exit");

        section("Cenario L3 - ping do PC1 para o PC2 (via 2 roteadores)");
        run(pc1Cli, "ping 10.0.2.10");

        section("Cenario L3 - show ip route no R1");
        run(r1Cli, "enable", "show ip route");

        section("Cenario L3 - show ip arp no PC1");
        run(pc1Cli, "show ip arp");
    }

    private static void run(DeviceCli cli, String... lines) {
        for (String line : lines) {
            String prompt = cli.prompt();
            String output = cli.execute(line);
            System.out.println(prompt + " " + line);
            if (output != null && !output.isEmpty()) {
                System.out.println(output);
            }
        }
    }

    private static void section(String title) {
        System.out.println();
        System.out.println("=== " + title + " ===");
    }
}
