# Cognito ERP

Use o Cognito ERP, sistema de gestão para pequenas e médias empresas brasileiras, dentro de uma conversa com o Claude.

## Uso

Conecte o conector **Cognito ERP** na aba Connectors do plugin e entre com a sua conta do ERP. Depois peça em linguagem natural, por exemplo:

- "Quais contas a pagar vencem esta semana?"
- "Como foram minhas vendas nos últimos 3 meses?"
- "Crie um orçamento para a Padaria Central com 10 sacos de farinha."
- "Registre o pagamento da parcela do aluguel de hoje pela conta Itaú."

As consultas aparecem em cards com tabelas e indicadores. Toda alteração mostra antes uma prévia com os valores calculados pelo ERP e só é salva depois que você confirma. O Claude também pede sua permissão antes de cada alteração.

## Dados

O plugin envia os pedidos e os dados das operações à sua conta do Cognito ERP pelo servidor MCP do Cognito, autenticado com OAuth. Ele respeita as empresas e as permissões do seu perfil no ERP; consultas exigem `erp:read` e alterações também `erp:write`. O plugin não guarda dados próprios: prévias de alteração ficam no ERP por até 24 horas e a auditoria registra só metadados das chamadas. Registrar um pagamento apenas anota no ERP um pagamento já feito; nada movimenta dinheiro ou contas bancárias.

Nota fiscal de serviço está disponível como simulação, sem validade fiscal. Cobrança e integração bancária ainda não estão disponíveis.
