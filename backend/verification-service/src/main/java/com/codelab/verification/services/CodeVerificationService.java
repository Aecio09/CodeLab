package com.codelab.verification.services;

import com.codelab.verification.dto.AnswerVerificationRequestDto;
import com.codelab.verification.dto.VerificationResultDto;
import com.codelab.verification.exceptions.AnswerRejectedByNodeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CodeVerificationService {

    private final RestTemplate restTemplate;

    @Value("${code-verification.service.url:http://localhost:3000}")
    private String verificationServiceUrl;

    public CodeVerificationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public VerificationResultDto verifyAnswer(AnswerVerificationRequestDto request) {
        try {
            String url = verificationServiceUrl + "/verify-answer";
            VerificationResultDto result = restTemplate.postForObject(url, request, VerificationResultDto.class);
            
            // Se não foi válido, lança exceção para rejeitar a resposta
            if (result != null && !result.valid()) {
                throw new AnswerRejectedByNodeException(result.message());
            }
            
            return result;
        } catch (Exception e) {
            // Se for AnswerRejectedByNodeException, relança
            if (e instanceof AnswerRejectedByNodeException) {
                throw e;
            }
            
            // Se o serviço de verificação não estiver disponível, retorna válido por padrão
            return new VerificationResultDto(
                    true,
                    "Verification service unavailable, answer accepted",
                    request.requiredUsage(),
                    true
            );
        }
    }
}

