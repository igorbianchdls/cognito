---
name: get-started
description: Orientar a primeira conexão e o primeiro uso do Cognito ERP no chat — conferir a conta e as empresas, fazer uma primeira consulta e mostrar como alterações são confirmadas.
---

1. Chame `meu_acesso` para confirmar a conexão. Apresente o nome da conta e as empresas autorizadas. Com mais de uma empresa, peça ao usuário para escolher uma (o card tem o botão "Usar esta").
2. Sugira uma primeira consulta útil e faça-a: por exemplo `resumo_erp` para uma visão geral ou `consultar_financeiro` com `tipo: pagar` para as contas que vencem em breve. O resultado aparece em um card.
3. Explique em uma ou duas frases como funcionam as alterações: o usuário pede no chat (por exemplo, "crie um orçamento para a Padaria Central"), o plugin mostra uma prévia com os valores calculados pelo ERP, e nada é salvo até ele clicar em Confirmar ou confirmar na conversa.
4. Mencione que as preferências (empresa preferida e quantidade de registros por página) ficam nas configurações do plugin, e que `abrir_painel` abre uma navegação em tela cheia.

Se a conexão falhar, peça para reconectar o plugin com a conta correta do ERP. Consultas exigem a permissão `erp:read`; alterações exigem também `erp:write` e as permissões do perfil no ERP. Nunca peça senhas, tokens ou chaves no chat.

Nota fiscal de serviço está disponível como simulação, sem validade fiscal. Cobrança e integração bancária ainda não estão disponíveis no chat.

Quando o pedido for sobre bases ou tabelas personalizadas, use as ferramentas com prefixo tables_. Comece por tables_listar_bases, tables_obter_base e tables_obter_tabela para descobrir IDs, campos e opções. Os registros do Tables são independentes dos cadastros do ERP; não use ferramentas financeiras para atender pedidos do Tables. Alterações exigem prévia e confirmação; em caso de resultado incerto, consulte tables_obter_operacao com a chave original. Para anexos, aguardando_envio não significa arquivo enviado: abra o formulário autenticado e só informe conclusão depois da confirmação do arquivo.


## WhatsApp Business

Comece por `whatsapp_obter_conexao`. As ferramentas remotas só aparecem após conectar a Meta e validar os contratos; indisponibilidade exige concluir a configuração, sem inventar acesso. Alterações exigem prévia e confirmação explícita. Códigos e PINs são preenchidos na tela protegida. Em resultado indeterminado, consulte `whatsapp_obter_operacao` antes de repetir; cancelar uma prévia não apaga uma mensagem enviada. Uma resposta da Meta pode conter etapas humanas pendentes.
