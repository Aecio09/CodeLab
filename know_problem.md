# Problemas Conhecidos

Registro de problemas já identificados e ainda **não corrigidos**, com a causa raiz
encontrada e o caminho de correção sugerido. Serve para evitar rediscoveries e
para não tratar esses sintomas como regressão nova.

---

## 1. Mensagem de erro enganosa para comandos bloqueados por modo

**Status:** em aberto — não corrigido
**Área:** backend `codelab-network-engine` (CLI)
**Reproduzível:** sim

### Sintoma

Comandos que existem e funcionam aparecem como desconhecidos quando digitados no
modo errado:

```
R2# ip address 10.0.0.1 255.255.255.0
% comando desconhecido: ip address 10.0.0.1 255.255.255.0

R2# ip
% comando desconhecido: ip

R2(config)# show vlan
% comando desconhecido: show vlan
```

No frontend o usuário não consegue distinguir "digitei errado" de "o comando não
existe aqui", então tenta abreviações — que também falham com a mesma mensagem.

### Causa raiz

Dois pontos em conjunto:

1. **`CommandRegistry.applies()`** (`cli/CommandRegistry.java:119`) só resolve um
   comando se o modo atual for exatamente o modo do comando, com três exceções
   fixas: `ANY`, `USER` dentro de `PRIVILEGED`, e `CONFIG` dentro de
   `CONFIG_INTERFACE`/`CONFIG_VLAN`. Comandos como `ip address`
   (`CONFIG_INTERFACE`) e `configure terminal` (`PRIVILEGED`) ficam fora do
   alcance nos demais modos.

2. **A mensagem de fallback não distingue os dois casos.** Quando não há comando
   elegível, `resolve()` retorna sempre
   `% comando desconhecido: ...`. Como `isIncomplete()` só varre comandos
   elegíveis no modo atual, um comando barrado por privilégio é reportado como
   inexistente.

### Comandos afetados

| Comando | Modo exigido |
|---|---|
| `ip address` | `CONFIG_INTERFACE` |
| `shutdown` / `no shutdown` | `CONFIG_INTERFACE` |
| `switchport mode` / `switchport access vlan` | `CONFIG_INTERFACE` |
| `description` | `CONFIG_INTERFACE` |
| `configure terminal` | `PRIVILEGED` |
| `vlan`, `name` | `CONFIG` / `CONFIG_VLAN` |
| `show ...` | `USER` — funciona em `USER` e `PRIVILEGED`, **falha** em `CONFIG*` |

### Caminho correto (confirmado na API)

```
enable                            → R#
conf t                            → R(config)#
int gi0/1                         → R(config-if)#
ip address 10.0.0.1 255.255.255.0 → ok
end                               → R#
```

### Correção sugerida

Backend, em `applies()`:

- aceitar `USER` a partir de qualquer modo (equivale a tratar os `show` como `ANY`);
- aceitar `PRIVILEGED` também dentro de `CONFIG*`;
- em `resolve()`, quando não houver match, checar o registro completo para
  decidir entre "comando desconhecido" e "comando existe, mas exige outro modo",
  listando os modos válidos.

Nenhuma dessas mudanças altera o resultado dos comandos — apenas o alcance por
modo e a mensagem de erro.

---

## 2. Hostname duplicado no prompt do terminal (frontend)

**Status:** em aberto — não corrigido
**Área:** `CodelabWeb`
**Reproduzível:** sim

### Sintoma

Com hostname `R2`, o histórico do terminal exibe `R2R2#` em vez de `R2#`. Com
hostname `router`, exibe `routerR2R2#`.

### Causa raiz

`NetworkPlaygroundPage.tsx:640` concatena o hostname com o prompt que a API já
devolve completo:

```tsx
{line.kind === 'in' ? `${selected.hostname}${prompt} ${line.text}` : line.text}
```

`DeviceCli.prompt()` (`cli/DeviceCli.java:39`) já retorna
`device.getHostname() + currentMode().getSuffix()`, ou seja, `R2#`. O frontend
soma `R2` de novo. A barra de input (linha 662) renderiza `{prompt}` sozinho e
está correta — o defeito é só na linha de histórico.

### Correção sugerida

Remover `${selected.hostname}` da interpolação da linha 640 e usar apenas
`${prompt}`.

---

## 3. Hint do terminal sugere interface inexistente em roteadores

**Status:** em aberto — não corrigido
**Área:** `CodelabWeb`
**Reproduzível:** sim

O hint do terminal em `NetworkPlaygroundPage.tsx` sugere `int eth0`. Roteadores e
firewalls desta simulação usam `gi0/1` a `gi0/4`, então seguir o hint literalmente
falha.

**Correção sugerida:** derivar o exemplo de interface do `kind` do dispositivo
selecionado.