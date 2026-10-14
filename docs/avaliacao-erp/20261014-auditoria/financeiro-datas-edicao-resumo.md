# Financeiro — datas, desempate e edição de recorrências — 14/10/2026

Cinco novos grupos aprovados, sem nova falha do ERP confirmada. Funções/consultas compartilhadas com contexto ERP empresa2/usuário3 e transações descartadas. Nenhuma mudança ou publicação do produto.

## Aprovados

- Receber100 em30/09 e estornar em14/10: resultado de setembro permanece+100; outubro registra-100; saldo da parcela volta100.
- Pagar100 em30/09 e estornar em14/10: setembro permanece-100; outubro registra+100; saldo volta100.
- Duas regras com mesmo texto: critério de desempate por ID seleciona de forma estável a primeira regra, categoria128. Após desativar/excluir logicamente ambas, nova transação não gera lançamento. Regras e extratos limitados aos IDs QA.
- Recorrência pagar: após dois títulos de100, editar valor_total no modelo para200 gera os dois próximos de200, preservando os anteriores:100,100,200,200.
- Recorrência encerrada: ativa=false, encerrada_em e proxima_competencia=NULL impedem geração futura; título original é preservado.

As mudanças de estado/modelo da recorrência neste roteiro foram preparadas em SQL para avaliar o comportamento do processador. Isso não aprova o fluxo de edição/encerramento na interface ou nas tools. O processador selecionou somente IDs QA criados no teste.

## MCP — tentativa não concluída

O roteiro financial-tools-qa-smoke.ts, adaptado para referências QA, terminou sem saída com código de processo-1073740791. Não há aprovação do transporte MCP, OAuth ou contratos nesse ensaio, nem evidência para classificar isso como defeito funcional do ERP. A consulta posterior encontrou0títulos com o prefixo QA-OTTO TOOL FIN em pagar e receber. O teste não entrou na contagem de aprovados.

## Plano atualizado

Continua aberta a falhaP2 no reenvio de criação manual de pagar com conteúdo diferente. Restam interface publicada, execução individual das tools/MCP, permissões/isolamento e concorrências adicionais (pagar, créditos, importação e processadores). Também falta conciliação integral do histórico e testes adicionais após alteração de configuração de cartão. Não declarar auditoria integral concluída.

## Evidências

financeiro-datas-edicao-final.json; financeiro-datas-regras.json; financeiro-recorrencias-edicao.json; roteiros testes-financeiro-datas-regras.mjs e testes-financeiro-recorrencias-edicao.mjs. Acumulado destes avanços financeiros:43grupos distintos,42aprovados e1falhaP2aberta. A tentativa MCP não foi contada.
