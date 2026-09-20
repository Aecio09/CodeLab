package com.codelab.networkengine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PlaygroundFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;

    private final ObjectMapper json = new ObjectMapper();

    private static final String JWT_SECRET = "test-secret-for-unit-tests-must-be-at-least-32-bytes-long!!";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));

    private String token() {
        return Jwts.builder()
                .subject("test@codelab.com")
                .claim("role", "USER")
                .claim("user_id", 1)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(KEY)
                .compact();
    }

    @BeforeEach
    void cleanup() throws Exception {
        Path storage = Path.of(System.getProperty("user.home"), ".codelab", "playground");
        if (java.nio.file.Files.isDirectory(storage)) {
            try (var stream = java.nio.file.Files.list(storage)) {
                for (Path p : stream.toList()) {
                    deleteRecursive(p);
                }
            }
        }
    }

    @Test
    void fullCycleCreateConfigureSaveReload() throws Exception {
        String t = token();

        // 1. Create exercise
        MvcResult r1 = mvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test Lab\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exerciseId").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Test Lab"))
                .andReturn();
        String exId = json.readTree(r1.getResponse().getContentAsString()).get("exerciseId").asText();

        // 2. Add switch
        MvcResult r2 = mvc.perform(post("/api/exercises/" + exId + "/devices")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"SWITCH\",\"x\":200,\"y\":100}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ref").isNotEmpty())
                .andExpect(jsonPath("$.kind").value("SWITCH"))
                .andReturn();
        String swRef = json.readTree(r2.getResponse().getContentAsString()).get("ref").asText();

        // 3. Add PC1
        MvcResult r3 = mvc.perform(post("/api/exercises/" + exId + "/devices")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"HOST\",\"x\":50,\"y\":100}"))
                .andExpect(status().isOk())
                .andReturn();
        String pc1Ref = json.readTree(r3.getResponse().getContentAsString()).get("ref").asText();

        // 4. Add PC2
        MvcResult r4 = mvc.perform(post("/api/exercises/" + exId + "/devices")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"HOST\",\"x\":350,\"y\":100}"))
                .andExpect(status().isOk())
                .andReturn();
        String pc2Ref = json.readTree(r4.getResponse().getContentAsString()).get("ref").asText();

        // 5. Link PC1 -> Switch
        mvc.perform(post("/api/exercises/" + exId + "/links")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deviceRefA\":\"" + pc1Ref + "\",\"interfaceA\":\"eth0\"," +
                                "\"deviceRefB\":\"" + swRef + "\",\"interfaceB\":\"fa0/1\"}"))
                .andExpect(status().isOk());

        // 6. Link PC2 -> Switch
        mvc.perform(post("/api/exercises/" + exId + "/links")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deviceRefA\":\"" + pc2Ref + "\",\"interfaceA\":\"eth0\"," +
                                "\"deviceRefB\":\"" + swRef + "\",\"interfaceB\":\"fa0/2\"}"))
                .andExpect(status().isOk());

        // 7. Create session
        MvcResult r7 = mvc.perform(post("/api/sessions")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"exerciseId\":\"" + exId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andReturn();
        String sessionId = json.readTree(r7.getResponse().getContentAsString()).get("sessionId").asText();

        // 8. Configure switch: hostname + VLANs
        cli(sessionId, swRef, "enable", t);
        cli(sessionId, swRef, "configure terminal", t);
        cli(sessionId, swRef, "hostname SW1", t);
        cli(sessionId, swRef, "vlan 10", t);
        cli(sessionId, swRef, "name RedeA", t);
        cli(sessionId, swRef, "exit", t);
        cli(sessionId, swRef, "vlan 20", t);
        cli(sessionId, swRef, "name RedeB", t);
        cli(sessionId, swRef, "exit", t);
        cli(sessionId, swRef, "interface fa0/1", t);
        cli(sessionId, swRef, "switchport mode access", t);
        cli(sessionId, swRef, "switchport access vlan 10", t);
        cli(sessionId, swRef, "exit", t);
        cli(sessionId, swRef, "interface fa0/2", t);
        cli(sessionId, swRef, "switchport mode access", t);
        cli(sessionId, swRef, "switchport access vlan 20", t);
        cli(sessionId, swRef, "end", t);

        // 9. Configure PC1
        cli(sessionId, pc1Ref, "enable", t);
        cli(sessionId, pc1Ref, "configure terminal", t);
        cli(sessionId, pc1Ref, "hostname PC1", t);
        cli(sessionId, pc1Ref, "interface eth0", t);
        cli(sessionId, pc1Ref, "ip address 10.0.10.1 255.255.255.0", t);
        cli(sessionId, pc1Ref, "exit", t);
        cli(sessionId, pc1Ref, "end", t);

        // 10. Configure PC2
        cli(sessionId, pc2Ref, "enable", t);
        cli(sessionId, pc2Ref, "configure terminal", t);
        cli(sessionId, pc2Ref, "hostname PC2", t);
        cli(sessionId, pc2Ref, "interface eth0", t);
        cli(sessionId, pc2Ref, "ip address 10.0.20.1 255.255.255.0", t);
        cli(sessionId, pc2Ref, "exit", t);
        cli(sessionId, pc2Ref, "end", t);

        // 11. Save
        MvcResult r11 = mvc.perform(post("/api/sessions/" + sessionId + "/save")
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isOk())
                .andReturn();
        String saved = r11.getResponse().getContentAsString();
        JsonNode savedSnap = json.readTree(saved);
        assertEquals("Test Lab", savedSnap.get("name").asText());

        // 12. Verify saved snapshot via exercise endpoint
        mvc.perform(get("/api/exercises/" + exId)
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Lab"))
                .andExpect(jsonPath("$.devices.length()").value(3));

        // 13. Verify list
        mvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Lab"));

        // 14. Reload session from saved
        MvcResult r14 = mvc.perform(post("/api/sessions")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"exerciseId\":\"" + exId + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String sessionId2 = json.readTree(r14.getResponse().getContentAsString()).get("sessionId").asText();

        // 15. Verify reloaded config: get snapshot from new session
        MvcResult r15 = mvc.perform(get("/api/sessions/" + sessionId2 + "/snapshot")
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode reloadedSnap = json.readTree(r15.getResponse().getContentAsString());
        assertEquals(3, reloadedSnap.get("devices").size());

        // Find SW1 in reloaded
        boolean sw1Found = false;
        for (JsonNode dev : reloadedSnap.get("devices")) {
            if ("SW1".equals(dev.get("hostname").asText())) {
                sw1Found = true;
                assertEquals(3, dev.get("vlans").size());
                break;
            }
        }
        assertTrue(sw1Found, "SW1 should exist with hostname in reloaded snapshot");

        // Cleanup session 2
        mvc.perform(delete("/api/sessions/" + sessionId2)
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteExercise() throws Exception {
        String t = token();

        MvcResult r1 = mvc.perform(post("/api/exercises")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"To Delete\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String exId = json.readTree(r1.getResponse().getContentAsString()).get("exerciseId").asText();

        mvc.perform(delete("/api/exercises/" + exId)
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/exercises/" + exId)
                        .header("Authorization", "Bearer " + t))
                .andExpect(status().isNotFound());
    }

    @Test
    void createDeviceReturnsNotFoundForMissingExercise() throws Exception {
        String t = token();

        mvc.perform(post("/api/exercises/does-not-exist/devices")
                        .header("Authorization", "Bearer " + t)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"HOST\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void unauthorizedRequestReturns403() throws Exception {
        mvc.perform(post("/api/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"No Auth\"}"))
                .andExpect(status().isForbidden());
    }

    private void cli(String sessionId, String deviceRef, String line, String token) throws Exception {
        mvc.perform(post("/api/sessions/" + sessionId + "/cli")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deviceRef\":\"" + deviceRef + "\",\"line\":\"" + line + "\"}"))
                .andExpect(status().isOk());
    }

    private void deleteRecursive(Path path) throws Exception {
        if (java.nio.file.Files.isDirectory(path)) {
            try (var stream = java.nio.file.Files.list(path)) {
                for (Path child : stream.toList()) {
                    deleteRecursive(child);
                }
            }
        }
        java.nio.file.Files.deleteIfExists(path);
    }
}
