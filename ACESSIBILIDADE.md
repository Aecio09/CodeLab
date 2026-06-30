# Acessibilidade no CodeLab

## O que é WCAG?

**WCAG (Web Content Accessibility Guidelines)** é o conjunto de diretrizes internacionais do W3C para tornar conteúdo web acessível a pessoas com deficiência. A versão atual é a **WCAG 2.1**, organizada em 4 princípios:

| Princípio | Significado |
|---|---|
| **Perceptível** | A informação deve ser apresentada de forma que todos possam perceber (visão, audição, tato) |
| **Operável** | A interface deve poder ser operada por diferentes formas (teclado, voz, toque) |
| **Compreensível** | A informação e a navegação devem ser compreensíveis |
| **Robusto** | O conteúdo deve funcionar com diferentes tecnologias assistivas (leitores de tela, etc.) |

Cada princípio tem critérios de sucesso nos níveis **A** (mínimo), **AA** (recomendado) e **AAA** (avançado).

No Brasil, a **Lei Brasileira de Inclusão (LBI - 13.146/2015)** e o **e-MAG (Modelo de Acessibilidade do Governo Eletrônico)** exigem conformidade com WCAG 2.1 nível AA para sistemas públicos e educacionais.

---

## O que implementamos

### Estrutura e Semântica

- **HTML semântico**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section>`, `<table>`, `<form>` usados apropriadamente
- **Landmarks ARIA**: `role="dialog"`, `role="alert"`, `role="status"` nos elementos dinâmicos
- **Idioma**: `<html lang="pt-BR">` configurado

### Navegação por Teclado

- **Skip-to-content link**: link "Pular para o conteúdo principal" no topo de todas as páginas
- **Focus trap no modal**: ao abrir "Editar Perfil", o foco fica preso dentro do modal com Tab cíclico
- **`focus-visible`** em todos os elementos interativos (botões, inputs, links)
- **Sidebars convertidas para `<a>`**: navegação usa links semânticos em vez de `<button>` com `onClick`

### Leitores de Tela (ARIA)

- **`aria-label`** em botões de ícone sem texto visível (editar, playground, fechar modal)
- **`aria-current="page"`** no item de navegação ativo
- **`aria-live="polite"`** em:
  - Resultados de correção de código (aprovação/rejeição)
  - Mensagens de carregamento
  - Mensagens de sucesso
- **`role="alert"`** em mensagens de erro
- **`aria-modal="true"`** e **`aria-labelledby`** no modal de edição de perfil
- **`aria-label`** nos elementos `<nav>` para distinguir navegações

### Formulários

- **`<label>` com `htmlFor`** em todos os campos de formulário
- **`id`s correspondentes** em todos os inputs
- **Mensagens de erro** visíveis e anunciadas por leitores de tela

### Imagens e Ícones

- **`alt` descritivo** em todas as imagens
- **`aria-hidden="true"`** em SVGs decorativos (ícones Google, background blurs)
- **Ícones decorativos** sem texto alternativo (Material Symbols)

### Título Dinâmico

- **`document.title`** atualizado conforme a página (`CodeLab - Login`, `CodeLab - Trilha de Aprendizado`, etc.)

### Contraste e Cor

- Tema escuro com contraste adequado entre foreground/background
- Informação nunca transmitida **apenas por cor** — sempre acompanhada de ícone ou texto
- Daltônicos conseguem diferenciar status (ex: aprovado/rejeitado) por ícone + texto, não só verde/vermelho

---

## Status por Critério WCAG 2.1 AA

| Critério | Status | Detalhe |
|---|---|---|
| 1.1.1 Non-text Content | ✅ | `alt` + `aria-label` |
| 1.3.1 Info and Relationships | ✅ | HTML semântico + ARIA |
| 1.4.1 Use of Color | ✅ | Cor nunca é único diferenciador |
| 1.4.3 Contrast (Minimum) | ⚠️ | Revisar com axe DevTools |
| 1.4.4 Resize Text | ⚠️ | Testar zoom 200% |
| 2.1.1 Keyboard | ✅ | Focus trap + Tab lógico |
| 2.4.1 Bypass Blocks | ✅ | Skip-to-content link |
| 2.4.2 Page Titled | ✅ | Título dinâmico por rota |
| 2.4.3 Focus Order | ✅ | Ordem lógica de tabulação |
| 2.4.6 Headings and Labels | ✅ | Hierarquia de títulos consistente |
| 2.4.7 Focus Visible | ✅ | `focus-visible:ring` |
| 3.3.1 Error Identification | ✅ | `role="alert"` |
| 3.3.2 Labels or Instructions | ⚠️ | Melhorar com `aria-describedby` |
| 4.1.2 Name, Role, Value | ✅ | ARIA roles + nomes |
| 4.1.3 Status Messages | ✅ | `aria-live="polite"` |

---

## Como testar

### Automatizado (gratuito)

1. **axe DevTools** (extensão Chrome) — auditoria automática de WCAG
2. **Lighthouse** (Chrome DevTools > Lighthouse > Accessibility)
3. **WAVE** (extensão Chrome) — visualiza problemas diretamente na página

### Manual

1. **Teclado**: navegar por toda a plataforma usando apenas `Tab`, `Enter`, `Space`, `Esc`
2. **NVDA** (Windows, gratuito) — leitor de tela mais usado
3. **VoiceOver** (Mac, nativo) — ativar com `Cmd + F5`
4. **Zoom**: testar com 200% de zoom no navegador

---

## Toolbar de Acessibilidade Customizada

Além das adequações WCAG nativas, o CodeLab possui uma **toolbar de acessibilidade** própria, implementada como componente React:

| Recurso | Descrição |
|---|---|
| **Aumentar/Diminuir Fonte** | Cicla entre 5 tamanhos (14px a 24px) |
| **Alto Contraste** | Fundo preto com texto branco, links em amarelo, bordas brancas |
| **Escala de Cinza** | Remove todas as cores (útil para acromatopsia) |
| **Destacar Links** | Destaca visualmente todos os links e botões com fundo amarelo e contorno |

### Como funciona

- Botão flutuante no canto inferior esquerdo de todas as páginas
- Configurações persistem em `localStorage` entre sessões
- Implementado com CSS puro + classes toggle no `<html>`, sem dependências externas
- Botão e painel seguem WCAG (foco visível, `aria-label`, `aria-expanded`, `aria-pressed`)

## Por que não usamos VLibras / UserWay / ReadSpeaker

Overlays de acessibilidade (VLibras, UserWay, ReadSpeaker) são soluções terceirizadas que:

1. **Não substituem conformidade real** com a LBI — o governo brasileiro já se posicionou contra overlays como substitutos
2. **Criam falsa sensação de conformidade** — o sistema parece acessível mas não é
3. **Dependem de JavaScript de terceiro** — falham com bloqueadores de anúncio, redes lentas, ou mudanças no serviço
4. **Têm custo recorrente** — ReadSpeaker custa milhares de reais/ano

A abordagem correta é **WCAG 2.1 AA nativo**: HTML semântico, ARIA, teclado, contraste — isso funciona independentemente de qualquer serviço externo e cobre **todos os tipos de deficiência** (cegos, surdos, baixa visão, daltônicos, mobilidade reduzida) de uma só vez.
