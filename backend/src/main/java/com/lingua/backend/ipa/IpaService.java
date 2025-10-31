package com.lingua.backend.ipa;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingua.backend.ipa.dto.IpaRequest;
import com.lingua.backend.ipa.dto.IpaResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class IpaService {

    private final ObjectMapper mapper = new ObjectMapper();
    // cache: lang -> règles ordonnées (clé la plus longue d'abord)
    private final Map<String, LinkedHashMap<String, String>> cache = new ConcurrentHashMap<>();

    public IpaResponse transcribe(IpaRequest req) {
        String lang = Optional.ofNullable(req.getLanguage()).orElse("fr-FR");
        String text = Optional.ofNullable(req.getText()).orElse("");
        LinkedHashMap<String, String> rules = loadRules(lang);
        String ipa = applyRules(text, rules, lang);
        return new IpaResponse(lang, text, ipa);
    }

    @SuppressWarnings("deprecation")
    private LinkedHashMap<String, String> loadRules(String lang) {
        return cache.computeIfAbsent(lang, l -> {
            try {
                ClassPathResource res = new ClassPathResource("ipa/" + l + ".json");
                try (InputStream is = res.getInputStream()) {
                    JsonNode root = mapper.readTree(is);

                    // 1) si { "map": {...} } ou { "phonetics": {...} }
                    JsonNode table = root.get("map");
                    if (table == null) table = root.get("phonetics");

                    Map<String, String> flat = new LinkedHashMap<>();

                    if (table != null && table.isObject()) {
                        table.fields().forEachRemaining(e ->
                                flat.put(e.getKey(), extractIpa(e.getValue()))
                        );
                    } else if (root.isObject()) {
                        // 2) ton format: { "k": { "ipa": "...", "audio": "..." }, "a":"..." }
                        root.fields().forEachRemaining(e -> flat.put(e.getKey(), extractIpa(e.getValue())));
                    } else {
                        throw new IllegalStateException("Format JSON non supporté pour " + l + ".json");
                    }

                    // supprime les règles vides et trie par longueur DESC
                    Map<String, String> cleaned = flat.entrySet().stream()
                            .filter(en -> en.getValue() != null && !en.getValue().isBlank())
                            .sorted((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()))
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    Map.Entry::getValue,
                                    (x, y) -> x,
                                    LinkedHashMap::new
                            ));

                    if (cleaned.isEmpty()) {
                        throw new IllegalStateException("Aucune règle valide trouvée dans " + l + ".json");
                    }
                    return new LinkedHashMap<>(cleaned);
                }
            } catch (Exception e) {
                throw new RuntimeException("Erreur chargement règles pour " + lang + ": " + e.getMessage(), e);
            }
        });
    }

    // Accepte: "ʃ", "/ʃ/", "/d͡ʒ/ ou /ʒ/", { "ipa": "...", "audio": "..." }
    private String extractIpa(JsonNode node) {
        if (node == null || node.isNull()) return null;

        String raw;
        if (node.isObject()) {
            JsonNode ipaNode = node.get("ipa");
            if (ipaNode == null) return null;
            raw = ipaNode.asText();
        } else {
            raw = node.asText();
        }

        if (raw == null) return null;
        raw = raw.trim();

        // si alternatives "… ou …" -> on garde la première
        String first = raw.split("\\bou\\b")[0].trim();  // sépare sur le mot français "ou"

        // enlève les /.../ si présents
        if (first.startsWith("/") && first.endsWith("/")) {
            first = first.substring(1, first.length() - 1);
        }
        return first;
    }

    private String applyRules(String text, LinkedHashMap<String, String> rules, String lang) {
        if (text.isEmpty()) return "";
        boolean latinLike = !lang.startsWith("ar");
        String work = latinLike ? text.toLowerCase(Locale.ROOT) : text;

        StringBuilder out = new StringBuilder();
        int i = 0, n = work.length();
        List<String> keys = new ArrayList<>(rules.keySet());

        while (i < n) {
            boolean matched = false;
            for (String k : keys) {
                int end = i + k.length();
                if (end <= n && work.regionMatches(true, i, k, 0, k.length())) {
                    out.append(rules.get(k));
                    i = end;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                out.append(text.charAt(i));
                i++;
            }
        }
        return out.toString().replaceAll("\\s{2,}", " ").trim();
    }
}
