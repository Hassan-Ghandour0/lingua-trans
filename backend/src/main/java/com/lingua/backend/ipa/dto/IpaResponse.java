package com.lingua.backend.ipa.dto;

public class IpaResponse {
    private String language;
    private String originalText;
    private String ipa;

    public IpaResponse() { }

    public IpaResponse(String language, String originalText, String ipa) {
        this.language = language;
        this.originalText = originalText;
        this.ipa = ipa;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getIpa() { return ipa; }
    public void setIpa(String ipa) { this.ipa = ipa; }
}
