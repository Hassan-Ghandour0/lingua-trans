package com.lingua.backend.ipa;

import com.lingua.backend.ipa.dto.IpaRequest;
import com.lingua.backend.ipa.dto.IpaResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ipa")
@CrossOrigin(origins = "*") // à ajuster selon ton frontend
public class IpaController {

    private final IpaService ipaService;

    public IpaController(IpaService ipaService) {
        this.ipaService = ipaService;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<IpaResponse> transcribe(@RequestBody IpaRequest request) {
        return ResponseEntity.ok(ipaService.transcribe(request));
    }

    @GetMapping("/health")
    public String health() { return "OK"; }
}
