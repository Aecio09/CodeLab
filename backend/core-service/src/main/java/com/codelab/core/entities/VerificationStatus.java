package com.codelab.core.entities;

public enum VerificationStatus {
    PENDING,              // Aguardando verificação
    NODE_VERIFIED,        // Passou na verificação do Node
    NODE_REJECTED,        // Rejeitado pelo Node (não atende requisitos)
    AI_VERIFIED,          // Passou na verificação da IA
    AI_REJECTED,          // Rejeitado pela IA
    APPROVED              // Resposta aprovada
}

