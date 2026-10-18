# Hosts do MCP

Os assistentes que usam o Cognito (ChatGPT e Claude) compartilham o mesmo catálogo de tools, cards, regras e skills. Cada pasta de host tem só o que é dele.

```
hosts/
  shared/            ← igual para todos
    instructions.ts  instruções do servidor (regras gerais + Tables, Apps e WhatsApp)
    registerTools.ts registra meu_acesso, ERP, Tables, Apps e WhatsApp
    config.ts        configuração a partir das variáveis de cada host
    writeTools.ts    quais tools alteram dados (exigem erp:write)
    resourceMetadata.ts  metadados OAuth (RFC 9728)
    skills/          fonte única das skills; trechos de um host só entre {chatgpt}…{/chatgpt} ou {claude}…{/claude}
  chatgpt/           extensões da OpenAI (configurações, menções), painel, formulário nativo (MRTR),
                     protocolo MCP 2026-07-28, página de aprovação e o pacote do plugin
  claude/            domínio dos cards no Claude e o pacote do plugin
```

- **Tool ou regra nova:** em `../domains`, `../tools` ou `shared/`. Vale nos dois hosts de uma vez.
- **Endpoints e variáveis não mudam:** `/api/mcp` (ChatGPT, `CHATGPTPLUGIN_*`) e `/api/claude/mcp` (Claude, `CLAUDEPLUGIN_*`).
- **Pacotes:** `npm run chatgptplugin:package` e `npm run claudeplugin:package` geram as skills de cada host a partir de `shared/skills` (renderização em `scripts/plugin-skills.mjs`).
- **Novo host:** uma pasta com `server.ts` (registra recursos próprios e chama `registerCommonTools`), `handleRequest.ts` e `config.ts` (com `hostConfig`).
