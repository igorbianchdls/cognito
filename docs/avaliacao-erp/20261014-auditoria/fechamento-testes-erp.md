# Fechamento da rodada de testes do Otto

Data: 14/10/2026, America/Fortaleza (evidências finais em 15/10 UTC). Empresa autorizada: 2, Igor Bianch Workspace. Registros fictícios identificados por QA-OTTO.

A rodada executável foi encerrada. O sistema **não está integralmente aprovado**: há duas falhas reproduzidas na publicação e dependências externas descritas abaixo. Não houve movimentação bancária externa, emissão fiscal real ou exclusão permanente.

## Resultados desta continuação

| Área | Resultado | Evidência |
|---|---|---|
| Dashboards | Sete painéis, 26 verificações e 113 consultas de detalhamento aprovadas; 83 tabelas sem alteração. Reconciliadas 49 comparações numéricas independentes de setembro/2026. | `.cache/dashboards/read-smoke.json`, `reconcile-smoke.json` |
| Relatórios | Oito relatórios de vendas/compras/margem em três recortes na virada de 2026/2027: 24 comparações de receita/compra e 18 de custo/margem aprovadas. Paginação do serviço exercitada. Fixtures desfeitas por rollback. | `fechamento-relatorios-margens.json` |
| Contratos | Dois itens, janeiro de R$ 180 e revisão de fevereiro para R$ 300; ciclo anterior preservado e repetição sem duplicar. Segundo item preparado na versão rascunho do ensaio, antes de efetivar; não certifica cadastro visual de contratos com múltiplos itens. | `fechamento-contratos-relatorios.json` |
| Estoque publicado | Inventário com dois itens finalizado pela interface: 1→2 e 1→3; custos médios R$ 10/R$ 20 preservados, valor final R$ 80. Conversão CX→UN fator 12 salva; fator -1 recusado. | `fechamento-estoque-ui-fixtures.json`, captura em `output/audit-20261014/fechamento-inventario-publicado.png` |
| Financeiro publicado | Recorrência QA editada de três para quatro ocorrências; pausa, retomada e encerramento pela interface aprovados. Descrição do título anterior preservada. Encerramento usa diálogo próprio do ERP. | `fechamento-financeiro-ui.json`, captura `fechamento-recorrencia-publicada.png` |
| Financeiro complementar publicado | Crédito e devolução sugerem R$ 20 disponíveis para dívida de R$ 80, data 14/10/2026; seletor mostra pagamento #1150, R$ 20, contraparte e conta corretos. Conciliação manual, desfazimento e sugestão exata atualizam linha, histórico, sugestões e pendências sem recarga; conta/filtro preservados. Banco e serviços confirmam os estados. | `fechamento-financeiro-complementar.json`, capturas `fechamento-credito-publicado.png` e `fechamento-conciliacao-publicada.png` |
| PDFs atuais | Downloads autenticados de orçamento, OS e nota fiscal aprovados no domínio publicado. | `fechamento-documentos-publicados.json` |
| Storage comercial real | OS QA 200 arquivada em bucket privado, repetição reutiliza revisão 1, download confere tamanho e SHA-256. URL pública do objeto é recusada. | `fechamento-storage-real.json` |
| Links fiscais | PDF e XML válidos retornam 200; expirados, adulterados e de contexto de outra empresa retornam 404. | `fechamento-links-anexos.json` |
| Agendador | Orquestração real com seis empresas fictícias, cinco rotinas por empresa, fusos na virada do ano, limite de quatro execuções simultâneas e continuidade após falha esperada aprovada. Seleção/trabalho substituídos; sem banco e sem disparo cron real. | `fechamento-agendador-isolado.json` |

As correções anteriores de compras/cadastros permanecem documentadas em `correcoes-compras-cadastros.md`: seis defeitos corrigidos, migração aplicada, 17 grupos gerais e sete específicos aprovados e publicação autenticada conferida. Os cenários anteriores de financeiro, compras, vendas, serviços, cadastros, concorrência e isolamento estão nos relatórios históricos relacionados em `pendencias-por-secao.md`; não foram todos repetidos nesta continuação.

## Falhas reproduzidas e plano de correção

### A01 — Link comercial temporário não abre sem sessão (prioridade alta)

Reprodução: link HMAC válido para a revisão arquivada da OS QA 200 retorna 404 sem sessão. **O mesmo token retorna 200 com sessão autenticada**. Download autenticado e objeto privado funcionam.

Causa identificada no código: `src/proxy.ts` dispensa autenticação para `/api/public/nfse/`, mas não para `/api/public/documentos-comerciais/`. O middleware exige login antes de o handler comercial conferir o token assinado.

Plano: incluir somente a rota comercial pública assinada no mesmo tratamento das rotas fiscais; manter validação de assinatura, validade, contexto e acesso no handler. Retestar link válido sem sessão, adulteração, expiração, versão e contexto de outra empresa. Os 404 negativos comerciais desta rodada não provam validação HMAC sem sessão: o middleware já barra todos eles.

### A02 — Preparação de anexo falha no ambiente publicado (prioridade alta)

Reprodução: POST `/api/erp/anexos` para OS QA 200, PDF fictício válido, retorna **503 FILE_UNAVAILABLE**, “Não foi possível preparar o envio do anexo. Tente novamente.” O upload não chegou a começar.

Os buckets `erp-anexos`, `erp-comercial` e `erp-fiscal` existem e são privados no banco do projeto auditado. Portanto, não atribuir a falha à ausência de bucket sem evidência. Arquivamento comercial real funciona; anexos usam configuração distinta por padrão. A causa exata da recusa do Storage ainda requer diagnóstico da configuração efetiva e resposta do serviço no servidor.

Plano: conferir URL/chave de Storage efetivamente usadas pelos anexos e a assinatura no bucket correto; registrar código da resposta remota sem credenciais; corrigir configuração ou integração conforme evidência. Depois retestar preparação, confirmação antes do envio (409), upload, confirmação/repetição, listagem única, download/hash, expiração do link e isolamento. A transação de preparação desfez o registro pendente: nenhum arquivo QA dessa tentativa ficou ativo.

### Observações adicionais

- O console publicado informa uso de chaves de desenvolvimento do Clerk. Planejar migração para instância de produção e validar login, organização e callbacks. Não foi feita troca de credenciais nesta rodada.
- Diálogos de recorrência emitem aviso de acessibilidade por descrição ausente. Acrescentar descrição acessível e verificar leitor de tela.
- Devolução ao fornecedor e suspensão/encerramento manual de contratos seguem lacunas funcionais identificadas anteriormente; não há fluxo dedicado validado para aprovar.

## Bloqueios e limites que impedem certificar 100%

1. **Fiscal externo:** configuração atual é homologação com `simulador_local`; o repositório usa simulador, sem adaptador externo implementado. Emissão/consulta/rejeição/cancelamento reais exigem integração fiscal externa. PDF fiscal existente foi baixado do banco legado; arquivamento de nova nota em Storage fiscal real não foi comprovado por esse download.
2. **Perfis reais de consulta/operador:** apenas proprietário disponível para login. Isolamento de leitura em 105 tabelas e capacidades no servidor têm evidência anterior; não substituem sessões visuais desses perfis.
3. **Agendamento físico:** endpoint anônimo recusa 401 e há CRON_SECRET configurado; não há prova de disparo automático por horário. Não foi acionado job global sobre lançamentos reais. Exige ensaio por horário com escopo isolado.
4. **ChatGPT/Claude reais:** serviços/runtime MCP têm ensaios locais; conexão OAuth e execução dentro dos hosts externos não foram certificadas nesta sessão.
5. **CSV dos relatórios no navegador integrado:** relatório de vendas carregou e botão CSV foi acionado sem erro JavaScript observado, mas a automação não recebeu evento de download em 10 segundos. Arquivo final não comprovado; não classificar essa limitação de captura como defeito do ERP. Exportações HTTP anteriores e paginação de serviços têm evidências separadas.
A pendência F01 de conferência visual financeira foi fechada nos cenários de recorrência, crédito, seleção contextual de baixa e atualização/undo de conciliação descritos acima. A concorrência de regras tem evidência anterior com banco real; o teste de concorrência não é substituído por cliques sequenciais.

O teste local de Storage fiscal indicou configuração local ausente; isso **não** significa que o servidor publicado não tenha configuração. A presença de configuração fiscal na publicação e o Storage comercial real foram verificados separadamente.

## Encerramento dos dados desta rodada

- Produtos QA 241 e 242: saldos conferidos após inventário; saída compensatória, saldo final zero e ambos inativos, conferidos no banco.
- Conversão QA 7: fator 12 conferido e registro inativado; histórico preservado.
- Inventário QA-OTTO-INV-FINAL-028: finalizado com dois itens, preservado como histórico.
- Recorrência QA 48: encerrada; título QA 687 cancelado, sem baixa e sem geração de próximos títulos.
- Financeiro complementar: título QA 688 cancelado, pagamento 1150 estornado, crédito 13 devolvido, transação 37 ignorada e ambas as conciliações desfeitas. Contas QA 34/35 e fornecedores QA 381/382 inativos; todos conferidos no banco. Soma dos movimentos de pagamento e adiantamento igual a zero, zero vínculos de conciliação ativos. Os registros adicionais da preparação interrompida também foram encerrados.
- PDF arquivado da OS QA 200: revisão preservada para rastreabilidade. Nenhuma exclusão permanente.
- Contratos/relatórios numéricos: transações desfeitas por rollback. Agendador isolado não acessou banco.
- Preparação do anexo falhou antes do upload e deixou zero registros ativos com o nome QA dessa tentativa.

Nenhuma correção de aplicação foi feita nesta continuação: o resultado é evidência de testes e plano para as duas falhas reproduzidas. Não foi efetuada nova publicação.

## Atualização em 15/10/2026

A01 e A02 corrigidas e publicadas; devolução integral ao fornecedor e gestão dos estados do contrato implementadas e testadas. O estado posterior está em [Correções e evolução funcional](../20261015-evolucao.md). Este fechamento preserva os achados e limites da rodada anterior.
