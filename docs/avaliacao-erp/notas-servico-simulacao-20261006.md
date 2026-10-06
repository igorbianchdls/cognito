# Notas de serviço simuladas — 06/10/2026

## Funcionamento

API, site e MCP utilizam o mesmo serviço em `src/products/erp/server/fiscal/serviceInvoiceRepository.ts`. A nota é exclusivamente NFS-e de saída demonstrativa: provedor `simulador_local`, ambiente `homologacao`, modo gerado pelo banco `simulacao`, número `DEMO-*` e aviso **SIMULAÇÃO - SEM VALIDADE FISCAL**. Nenhuma prefeitura ou API fiscal é acessada. Não há geração de contas, pagamentos ou movimentações de estoque.

Pode ser avulsa ou vinculada a uma venda da mesma empresa e cliente. Os serviços precisam estar ativos; uma venda vinculada deve conter os serviços e suas quantidades. Os cálculos monetários compartilham o módulo de valores do ERP. ISS e retenção são informados para demonstração; não constituem motor tributário real.

## API autenticada

| Método | Caminho | Função |
| --- | --- | --- |
| GET | `/api/erp/notas-servico` | Lista, busca, status, competência e paginação |
| POST | `/api/erp/notas-servico` | Cria rascunho com `dados` e `chave_operacao` |
| GET | `/api/erp/notas-servico/{id}` | Detalhes, itens, totais, histórico e dados para edição |
| PATCH | `/api/erp/notas-servico/{id}` | Edita rascunho com dados, chave e versão |
| GET | `/api/erp/notas-servico/{id}/validar` | Valida referências e valores sem emitir |
| GET | `/api/erp/notas-servico/{id}/pdf?versao=1` | PDF privado; sem versão retorna o mais recente |
| POST | `/api/erp/notas-servico/{id}/simular` | Emissão local; cenário, chave e versão |
| POST | `/api/erp/notas-servico/{id}/consultar` | Conclui resultado pendente local |
| POST | `/api/erp/notas-servico/{id}/cancelar` | Cancela nota simulada emitida, com motivo |
| POST | `/api/erp/notas-servico/{id}/excluir` | Exclusão lógica de rascunho, com motivo |

Filtros: `busca`, `status`, `inicio`, `fim`, `pagina` e `por_pagina`. Criação e mudanças exigem `erp.vendas.gerenciar`; consultas exigem `erp.vendas.visualizar`. Cada repetição deve preservar a chave e o conteúdo original. Conteúdo diferente sob a mesma chave é recusado; versão desatualizada exige consulta e nova revisão.

## Simulador e estados

`sucesso` termina em `emitida`; `rejeicao` termina em `falha`; `demora` e `timeout` ficam em `aguardando_retorno`. A operação de consultar resultado conclui a autorização local. Consultar detalhes por GET não altera estado. Somente rascunhos podem ser editados ou excluídos. Nota emitida permite cancelamento com motivo e mantém seu conteúdo anterior.

## PDF e banco

A migração `20261006020000_service_invoice_simulation.sql` mantém as notas existentes, acrescenta modo/cenário e a tabela privada `erp.notas_fiscais_pdfs`. PDFs são gravados como bytes com versão e SHA-256, protegidos por RLS e imutáveis. Não são arquivos públicos. Cada versão recebe marcação de simulação em todas as páginas, inclusive após cancelamento. Nota/PDF/histórico são persistidos na mesma transação. O acesso ao link requer login Clerk e permissão na empresa.

## Site e ChatGPT

Site: `/erp/vendas/notas-fiscais`, com tabela no padrão financeiro, revisão, formulário de serviços, cenários, detalhes e PDF. MCP acrescenta `listar_notas_servico`, `obter_nota_servico`, `validar_nota_servico` e `obter_pdf_nota_servico`. Os cards tabela/detalhes e revisão/resultado suportam a operação.

Mudanças pelo chat são propostas em `preparar_rascunho`: `nota_servico`, `editar_nota_servico`, `simular_nota_servico`, `consultar_resultado_nota_servico`, `cancelar_nota_servico`, `excluir_nota_servico`. Aprovação humana autenticada, revalidação de permissões e estado continuam obrigatórias. Os formulários visual e nativo expõem os mesmos contratos. O link de PDF retorna metadados, nunca bytes ou credenciais pelo chat.

## Verificação e publicação

`scripts/erp/service-invoice-smoke.ts` executa o ciclo e aprovações reais de repositório dentro de uma transação revertida. Também verifica idempotência, versões, conteúdo finalizado, ferramentas, cards e isolamento de empresa. Os testes do plugin verificam protocolo, autenticação, formulários e cards; PDFs simples e extensos são renderizados e conferidos visualmente. Isso não equivale a uma conexão OAuth real dentro do ChatGPT.

`scripts/erp/apply-service-invoice.ts` exige projeto confirmado, testes aprovados e versão Vercel pronta com código idêntico. Preserva os dados comerciais/financeiros/estoque e gera PDFs para NFS-e demonstrativas existentes. Evidências ficam em `.cache/service-invoice/`.

### Resultado desta implementação

- Migração aplicada no projeto Supabase confirmado; quatro PDFs gerados para as NFS-e de saída demonstrativas existentes. Notas anteriores e dados comerciais, financeiros e de estoque preservados.
- 40 verificações fiscais e de aprovação passaram dentro de uma transação revertida. O contexto real do runtime PostgreSQL também foi verificado. A verificação avulsa desse contexto e o CRUD HTTP deixaram somente rascunhos excluídos logicamente, com seus históricos de teste.
- Protocolo MCP: 32 verificações; autenticação: 35; MRTR/formulário nativo: 13 grupos; regressão API HTTP: 20 grupos. Formulários, seis cards, abertura do link de PDF, catálogo de 62 rotas/89 métodos, tipos e pacote 1.7.0 passaram.
- Na Vercel, sessão Clerk real confirmou criação, repetição idempotente, consulta, edição, versão antiga recusada, PDF da versão original e exclusão lógica. Impressões completas das tabelas comerciais/financeiras/estoque permaneceram iguais. A proteção do proxy Clerk recusou acesso anônimo com 404, antes do handler.
- PDFs de uma e sete páginas foram renderizados e inspecionados; o documento extenso contém os 50 serviços e aviso em todas as páginas.
- Foi corrigida a reconstrução da requisição HTTP limitada: o novo objeto usa URL e campos de transporte explícitos, evitando herdar o fluxo já consumido da requisição Next. Os testes HTTP gerais e publicados passaram após o ajuste.
- Publicação principal: `dpl_Chh7WmKeaNMkdcQgRV2v1JsYnH5U`, domínio `cognito-seven.vercel.app`, com preservação da versão anterior nos registros de publicação.
- O navegador integrado não inicializou neste ambiente. A conferência visual interativa do site publicado e a conexão/renderização dentro da conta real do ChatGPT continuam sem comprovação; testes automatizados de interface usam um navegador isolado e dados fictícios.

## Integração futura

Integração real ainda requer provedor escolhido, credenciais, configuração fiscal válida, mapeamento do modelo municipal/nacional, tributação, homologação, retornos/webhooks e testes do município. O contrato `FiscalProviderAdapter` permanece disponível para esse trabalho; o simulador local não seleciona nem acessa um provedor real. Notas simuladas não podem ser convertidas em reais. Notas reais serão documentos novos e terão fluxo próprio de integração, aproveitando contratos, permissões, revisão e infraestrutura de histórico existentes.
