---
name: get-started
description: Primeiro uso do Cognito ERP no Claude. Use quando o usuário acabou de instalar o plugin ou conectar o conector, pergunta o que o Cognito ERP faz ou como começar, ou quando a conexão com o ERP falha.
---

1. Chame `meu_acesso` para confirmar a conexão. Apresente o nome da conta e as empresas autorizadas. Com mais de uma empresa, peça ao usuário para escolher uma.
2. Sugira uma primeira consulta útil e faça-a: por exemplo `resumo_erp` para uma visão geral ou `consultar_financeiro` com `tipo: pagar` para as contas que vencem em breve. O resultado aparece em um card; "Ver tudo" abre a lista completa em tela cheia, com filtros.
3. Explique em uma ou duas frases como funcionam as alterações: o usuário pede na conversa (por exemplo, "crie um orçamento para a Padaria Central"), o Claude pede permissão para usar a tool, o card mostra uma prévia com os valores calculados pelo ERP, e nada é salvo até ele clicar em Confirmar ou confirmar na conversa.

Se a conexão falhar, peça para reconectar o conector Cognito ERP na aba Connectors do plugin, com a conta correta do ERP. Consultas exigem a permissão `erp:read`; alterações exigem também `erp:write` e as permissões do perfil no ERP. Não peça senhas, tokens ou chaves na conversa.

Nota fiscal, cobrança e integração bancária ainda não estão disponíveis.
