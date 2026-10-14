# Financeiro — isolamento, acesso e concorrência pagar — 14/10/2026

Onze grupos aprovados, sem nova falha confirmada: seis de contexto/isolamento, dois de acesso HTTP publicado e três concorrências de pagar. Nenhuma mudança ou publicação de produto.

## Isolamento e acesso

- Administrador autenticado lê o financeiro sob o contexto restrito.
- Consulta com empresa diferente do contexto é recusada antes do acesso.
- RLS não entrega linhas de outras empresas numa consulta ampla.
- Identidade numérica fictícia sem vínculo não vê linhas financeiras.
- Contexto somente leitura recusa UPDATE, mesmo sem linha afetada.
- Consulta ERP sem contexto autenticado é recusada.
- API publicada /acesso retorna200 para sessão administrativa Clerk,15capacidades, e401para acesso anônimo. Deployment dpl_3BY6EbtcjHYG2M86CTrAPnNgsjXR.

Não foram criados usuários externos nem alteradas permissões/vínculos. A primeira versão do roteiro tentou chamar diretamente função interna do schema shared sob modo de leitura e recebeu permission denied; foi adaptada para verificar as consultas financeiras autorizadas. Não se afirma aprovação de todos os perfis; consulta/operador restritos seguem no roteiro restante.

## Concorrência de pagar na API publicada

CompraQA337, título629, parcela financeira933, fornecedorQA295, bancoQA21, produtoQA126 sem recebimento de estoque.

- Duas baixas20 com a mesma chave: ambas200, mesmo pagamento1117, um efeito.
- Duas baixas60 com chaves diferentes, disputando saldo80: uma200, outra422; pagamento1118, saldo final20.
- Dois estornos concorrentes do pagamento1117 com mesma chave: ambas200, uma reversão.

Encerramento: pagamentos1117/1118 estornados; compra337 cancelada; total ativo pagar0; caixa líquido0. Não foi feito recebimento de estoque ou transferência externa. Histórico QA preservado.

## Contagem e plano

Acumulado deste avanço financeiro:54grupos,53aprovados e1falhaP2aberta (reenvio da criação manual de pagar). Onze novos grupos neste lote.

O roteiro de fechamento agora possui **14 grupos pendentes**, listados em financeiro-roteiro-restante.json e abaixo. É uma contagem do escopo definido; cada grupo pode conter vários passos, e novos achados podem exigir retestes.

| ID | Grupo pendente |
|---|---|
| F01 | Corrigir e retestar reenvio da criação manual de pagar |
| F02 | Interface pagar: cadastro, parcelas, baixa e estorno |
| F03 | Interface receber: baixa, crédito e estorno |
| F04 | Interface extrato: importação e conciliação |
| F05 | Interface recorrência: edição e encerramento |
| F06 | Interface cartão: configuração e repasse |
| F07 | MCP: leituras de títulos e relatórios |
| F08 | MCP: proposta/confirmação de escrita financeira |
| F09 | Perfis consulta e operador com permissões restritas |
| F10 | Concorrência de aplicação/reversão de créditos e adiantamentos |
| F11 | Concorrência de importação e regras automáticas |
| F12 | Concorrência de processadores de recorrência |
| F13 | Conferência integral do histórico: banco, fluxo e DRE |
| F14 | Cartão: alterar configuração e preservar recebimentos anteriores |

## Evidências

financeiro-seguranca-concorrencia-final.json; financeiro-isolamento.json; financeiro-pagar-concorrencia.json; .cache/erp-access/production-smoke.json. Roteiro de isolamento: testes-financeiro-isolamento.mjs. Testes de isolamento não modificaram dados de negócio; as mutações HTTP QA foram encerradas como descrito.
