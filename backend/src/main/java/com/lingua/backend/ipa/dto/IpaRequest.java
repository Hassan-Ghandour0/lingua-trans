package com.lingua.backend.ipa.dto;

public class IpaRequest {
    private String language; // "fr-FR", "en-US", "ar-LB"
    private String text;

    public IpaRequest() { }

    public IpaRequest(String language, String text) {
        this.language = language;
        this.text = text;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
