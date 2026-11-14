package com.medicore.api.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicore.api.dto.AssistantChatResponse;
import com.medicore.api.dto.AssistantMessageRequest;
import com.medicore.api.services.AssistantChatService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantChatService assistantChatService;

    public AssistantController(AssistantChatService assistantChatService) {
        this.assistantChatService = assistantChatService;
    }

    @PostMapping("/messages")
    public AssistantChatResponse responder(@Valid @RequestBody AssistantMessageRequest request) {
        return assistantChatService.responder(request.message());
    }
}