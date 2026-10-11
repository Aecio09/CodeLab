package com.codelab.networkengine.verification;

import com.codelab.networkengine.session.SessionContext;
import com.codelab.networkengine.session.SnapshotMapper;
import com.codelab.networkengine.snapshot.PlaygroundSnapshot;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class VerificationService {

    private final ObjectMapper mapper = new ObjectMapper();

    public record Check(String field, String check, JsonNode value) {}

    public record CheckResult(String field, String check, JsonNode expected, JsonNode actual, boolean passed) {}

    public record VerifyRequest(List<Check> checks) {}

    public record VerifyResponse(String verdict, List<CheckResult> checks) {}

    public VerifyResponse verify(SessionContext ctx, VerifyRequest request) {
        PlaygroundSnapshot live = SnapshotMapper.mergeLiveConfig(new PlaygroundSnapshot(), ctx);
        ObjectNode root = mapper.valueToTree(live);

        List<CheckResult> results = new ArrayList<>(request.checks().size());
        for (Check check : request.checks()) {
            JsonNode actual = resolve(root, check.field());
            boolean passed = compare(check.check(), actual, check.value());
            JsonNode actualOut = (actual == null || actual.isMissingNode()) ? null : actual;
            results.add(new CheckResult(check.field(), check.check(), check.value(), actualOut, passed));
        }

        boolean allPassed = results.stream().allMatch(CheckResult::passed);
        return new VerifyResponse(allPassed ? "APPROVED" : "REJECTED", results);
    }

    private boolean compare(String checkName, JsonNode actual, JsonNode expected) {
        if (actual == null || actual.isMissingNode() || actual.isNull()) {
            return false;
        }
        String check = (checkName == null || checkName.isBlank()) ? "equals" : checkName.toLowerCase(Locale.ROOT);
        return switch (check) {
            case "equals", "eq" -> jsonEquals(actual, expected);
            case "not_equals", "ne" -> !jsonEquals(actual, expected);
            case "exists" -> true;
            case "contains" -> contains(actual, expected);
            default -> false;
        };
    }

    private boolean jsonEquals(JsonNode a, JsonNode b) {
        if (a == null || b == null) {
            return false;
        }
        if (a.isNumber() && b.isNumber()) {
            return a.decimalValue().compareTo(b.decimalValue()) == 0;
        }
        return a.equals(b);
    }

    private boolean contains(JsonNode container, JsonNode expected) {
        if (expected == null || expected.isMissingNode() || expected.isNull()) {
            return false;
        }
        if (container.isArray()) {
            for (JsonNode element : container) {
                if (jsonEquals(element, expected)) {
                    return true;
                }
            }
            return false;
        }
        if (container.isObject() && expected.isObject()) {
            ObjectNode c = (ObjectNode) container;
            ObjectNode e = (ObjectNode) expected;
            Iterator<Map.Entry<String, JsonNode>> it = e.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> f = it.next();
                JsonNode cv = c.get(f.getKey());
                if (cv == null || !jsonEquals(cv, f.getValue())) {
                    return false;
                }
            }
            return true;
        }
        if (container.isTextual() && expected.isTextual()) {
            return container.asText().contains(expected.asText());
        }
        return false;
    }

    private JsonNode resolve(JsonNode node, String path) {
        if (path == null || path.isBlank()) {
            return MissingNode.getInstance();
        }
        JsonNode current = node;
        for (String segment : path.split("\\.")) {
            if (segment.isBlank()) {
                return MissingNode.getInstance();
            }
            if (current instanceof ObjectNode obj) {
                current = obj.get(segment);
                if (current == null) {
                    return MissingNode.getInstance();
                }
            } else if (current instanceof ArrayNode arr) {
                current = selectFromArray(arr, segment);
                if (current == null) {
                    return MissingNode.getInstance();
                }
            } else {
                return MissingNode.getInstance();
            }
        }
        return current;
    }

    private JsonNode selectFromArray(ArrayNode arr, String key) {
        if (key.matches("\\d+")) {
            try {
                int index = Integer.parseInt(key);
                return index >= 0 && index < arr.size() ? arr.get(index) : null;
            } catch (NumberFormatException e) {
                return null;
            }
        }
        for (JsonNode element : arr) {
            if (!(element instanceof ObjectNode obj)) {
                continue;
            }
            if (key.equals(stringOf(obj, "ref"))
                    || key.equals(stringOf(obj, "name"))
                    || key.equals(stringOf(obj, "id"))) {
                return element;
            }
        }
        return null;
    }

    private static String stringOf(ObjectNode obj, String field) {
        JsonNode value = obj.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}