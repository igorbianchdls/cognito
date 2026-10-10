# Propostas e ordens de serviço — implementação

Data: 10/10/2026. Alterações baseadas no [diagnóstico](propostas-ordens-servico-diagnostico-20261010.md).

## Entregue

- Situações de propostas normalizadas no banco: em andamento, enviada, aprovada, recusada, convertida e cancelada. Aprovação/recusa possuem autor, data e histórico; edição após aprovação exige nova aprovação e preserva a decisão anterior no evento.
- Validade verificada antes de enviar, aprovar ou converter. Propostas recusadas/canceladas não podem gerar venda.
- Datas da OS normalizadas e itens arquivados excluídos das conversões. OS → proposta → venda mantém uma única venda e sincroniza os vínculos, inclusive na repetição das ações.
- Listagem de OS com busca, situação, paginação e resumo de todos os registros filtrados.
- Nove tools novas: `listar_ordens_servico`, `obter_ordem_servico`, `criar_ordem_servico`, `editar_ordem_servico`, `alterar_ordem_servico`, `converter_ordem_servico`, `alterar_orcamento`, `obter_documento_comercial` e `arquivar_documento_comercial`.
- Criação/edição comercial pelo MCP aceita validade, entrega, descrição dos itens, desconto geral, frete e até 48 parcelas. Escritas continuam exigindo prévia e confirmação.
- Cards com situações comerciais, filtro de propostas, ciclo da OS e abertura de PDF. O clique em abrir PDF consulta um link temporário novo.
- PDFs A4 próprios de proposta e OS, disponíveis pela API, pelo site e pelo MCP. Incluem identificação, cliente, itens, condições comerciais e assinatura; observações internas da OS ficam fora do PDF.
- Arquivamento de revisões imutáveis, conferência de tamanho e SHA-256 e download protegido. Apenas metadados no banco; conteúdo privado no Storage.

Converter em venda cria um rascunho. Confirmar a venda, com seus efeitos financeiros e de estoque, continua sendo uma ação separada. Marcar uma proposta como enviada registra a informação; não envia e-mail.

## Supabase real

Migração `20261010120000` aplicada no projeto `mtadnxqoqxzbdksktwdr`. As tabelas principais foram preservadas; foram acrescentados campos de decisão, restrições de integridade e a tabela `erp.documentos_comerciais_pdfs`.

Bucket **`erp-comercial` criado e privado**, limitado a PDF de até 2 MiB. A conferência após os testes encontrou zero PDFs arquivados e zero objetos nesse bucket. Os testes de escrita foram revertidos; não ficaram propostas, vendas ou OS de teste no ERP.

## Validação

| Verificação | Resultado e limite |
| --- | --- |
| Repositórios e banco real | 10 grupos aprovados; transação revertida e conteúdo original das tabelas ERP conferido |
| MCP, SDK e banco real | 66 chamadas no fluxo comercial; criação, edição, decisões, conversão, repetição e PDF protegido aprovados; autenticação de teste |
| Contexto nativo de somente leitura | PDFs atuais de proposta e OS obtidos com as permissões reais do banco |
| Cards em navegador | 16 cenários aprovados, incluindo situação comercial, OS e PDF; host MCP Apps simulado |
| PDF | Dois exemplos e testes com 24 itens longos, 13 páginas e valores grandes; renderização conferida visualmente |
| TypeScript | Zero erros na verificação direcionada dos módulos alterados e testes |
| Vercel | Build final aprovado (`READY`), arquivos conferidos com o código local; domínio de produção sem promoção |

Evidências locais em `.cache/commercial-documents/`: `report.json`, `mcp-report.json`, `native-read.json`, `database-state.json` e `deployment-proof.json`. Capturas dos cards em `.cache/chatgptplugin-cards/`. Exemplos em `output/pdf/`.

Build de validação: `dpl_ESDGXuiWtXQpVaEUXSCzyvS5MMpx`. A versão preparada do ChatGPT possui 59 descritores; a do Claude, 55. Esses números não indicam que o catálogo de produção já foi atualizado.

## Pendência de configuração e publicação

Falta a chave de Storage do projeto do ERP. Configure `ERP_DOCUMENTS_SUPABASE_URL` e `ERP_DOCUMENTS_SUPABASE_SERVICE_ROLE_KEY`; o módulo aceita as variáveis fiscais específicas como reserva. A configuração de outro projeto Supabase é recusada.

O PDF atual funciona sem Storage. Arquivar exige a chave válida. Os testes de upload usaram Storage em memória, sem requisições externas, e não comprovam upload real no Supabase.

A publicação completa permanece pendente: o código fiscal anterior também passou a exigir a chave correta para novos PDFs de NFS-e. Promover toda a versão antes de resolver essa configuração prejudicaria esse fluxo. Os PDFs fiscais antigos não foram excluídos nem migrados nesta etapa.

Não foram testados OAuth real no ChatGPT, renderização no host real do ChatGPT, envio de e-mail ou integração fiscal externa.

Documentação de funcionamento: [documentos comerciais](../../src/products/erp/server/documents/README.md).
