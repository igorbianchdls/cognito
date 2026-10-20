---
name: get-started
description: {chatgpt}Orientar a primeira conexão e o primeiro uso do Cognito ERP no chat — conferir a conta e as empresas, fazer uma primeira consulta e mostrar como alterações são confirmadas.{/chatgpt}{claude}Primeiro uso do Cognito ERP no Claude. Use quando o usuário acabou de instalar o plugin ou conectar o conector, pergunta o que o Cognito ERP faz ou como começar, ou quando a conexão com o ERP falha.{/claude}
---

1. Se houver um pedido concreto, vá direto à consulta solicitada, sem chamar `meu_acesso` antes. Reutilize `empresa_id` já escolhido; se ainda não for conhecido, omita-o e deixe o servidor selecionar a única empresa autorizada. Nunca invente o ID. Em `COMPANY_REQUIRED`, consulte `meu_acesso` e peça ao usuário para escolher uma empresa{chatgpt} (o card tem o botão "Usar esta"){/chatgpt}; mantenha o ID escolhido nos próximos pedidos, sem repetir a descoberta. Use `meu_acesso` também quando o usuário pedir para conferir a conta, empresas ou permissões ou precisar escolher/trocar de empresa sem um ID autorizado conhecido. Não escolha entre várias empresas pelo usuário.
2. Se o usuário apenas perguntar como começar, sugira uma primeira consulta útil e faça-a: por exemplo `resumo_erp` para uma visão geral ou `consultar_financeiro` com `tipo: pagar` para as contas que vencem em breve, seguindo a mesma regra de empresa. O resultado aparece em um card; "Ver tudo" abre a lista completa em tela cheia, com filtros.
3. Explique em uma ou duas frases como funcionam as alterações: o usuário pede na conversa (por exemplo, "crie um orçamento para a Padaria Central"), {claude}o Claude pede permissão para usar a tool, {/claude}o card mostra uma prévia com os valores calculados pelo ERP, e nada é salvo até ele clicar em Confirmar ou confirmar na conversa.
{chatgpt}4. Mencione que as preferências (empresa preferida e quantidade de registros por página) ficam nas configurações do plugin, e que `abrir_painel` abre uma navegação em tela cheia.
{/chatgpt}
Se a conexão falhar, peça para reconectar {chatgpt}o plugin{/chatgpt}{claude}o conector Cognito ERP na aba Connectors do plugin{/claude}, com a conta correta do ERP. Consultas exigem a permissão `erp:read`; alterações exigem também `erp:write` e as permissões do perfil no ERP. Nunca peça senhas, tokens ou chaves na conversa.

Nota fiscal de serviço está disponível como simulação, sem validade fiscal. Cobrança e integração bancária ainda não estão disponíveis.

## Tables

Quando o pedido for sobre bases ou tabelas personalizadas, use as ferramentas com prefixo `tables_`. Comece por `tables_listar_bases` (com `base_id`, traz as tabelas da base) e `tables_obter_tabela` para descobrir IDs, campos e opções. Os registros do Tables são independentes dos cadastros do ERP; não use ferramentas financeiras para atender pedidos do Tables. Para entregar uma planilha, `tables_exportar` gera o CSV e devolve um link de 1 hora; para trazer linhas de um CSV, `tables_importar_csv` (até 500 por vez). Alterações exigem prévia e confirmação; em caso de resultado incerto, consulte `tables_obter_operacao` com a chave original. Para anexos, aguardando_envio não significa arquivo enviado: abra o formulário autenticado e só informe conclusão depois da confirmação do arquivo.

## Apps

Para criar telas e pequenos sistemas da empresa, use as ferramentas com prefixo `apps_`: `apps_criar`, depois `apps_salvar_codigo`, e mostre o link da prévia. Leia `erro_compilacao` e `erros_execucao` (em `apps_obter`) e corrija antes de publicar. Publicar, tirar do ar, mudar o acesso e limpar dados de uma coleção (`apps_limpar_dados`) exigem prévia e confirmação.

## WhatsApp Business

Comece por `whatsapp_obter_conexao`. As ferramentas remotas só aparecem após conectar a Meta e validar os contratos; indisponibilidade exige concluir a configuração, sem inventar acesso. Alterações exigem prévia e confirmação explícita. Códigos e PINs são preenchidos na tela protegida. Em resultado indeterminado, consulte `whatsapp_obter_operacao` antes de repetir; cancelar uma prévia não apaga uma mensagem enviada. Uma resposta da Meta pode conter etapas humanas pendentes.
