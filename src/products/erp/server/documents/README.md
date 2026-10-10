# Documentos comerciais: propostas e ordens de serviço

Proposta comercial é `erp.vendas.tipo_documento = 'orcamento'`. Não é um rascunho de aprovação do plugin.

## Fluxo e regras

- Situações da proposta: `em_andamento`, `enviada`, `aprovado`, `recusado`, `convertido`, `cancelado`. A migração normaliza os nomes antigos sem remover registros.
- Enviar registra um envio informado pelo usuário; não envia e-mail. Aprovação/recusa guardam data, autor e histórico; a recusa pode guardar motivo.
- Proposta vencida não pode ser enviada, aprovada ou convertida. Renove `validade_em` pela edição. Editar uma proposta enviada/aprovada reinicia sua situação e preserva a aprovação anterior no evento.
- OS: rascunho → aprovada → em execução → concluída. Cancelamento segue as transições permitidas, com autor/histórico. Apenas rascunhos sem documentos gerados podem ser editados.
- OS → proposta → venda usa uma única origem. As conversões compartilham trava por empresa, bloqueiam as linhas, filtram itens ativos e sincronizam o vínculo da OS. As restrições do banco impedem vínculos incompatíveis.
- Gerar venda cria rascunho comercial: confirmar a venda é uma operação separada, responsável pelos efeitos financeiros/estoque.

## PDF atual e revisões

`commercialPdf.ts` gera PDF A4 próprio, com empresa/cliente, itens, descontos, frete, total, vencimentos, prazo, observações e assinatura. A OS inclui equipamento, solicitação e diagnóstico. Observações internas, metadados operacionais e credenciais ficam fora do snapshot público.

- `GET /api/erp/documentos-comerciais/{orcamento|ordem_servico}/{id}/pdf`: PDF atual, sob demanda, sem salvar binário no banco. Exige sessão e `erp.vendas.visualizar`.
- `POST` na mesma rota, `{expectedVersion}`: arquiva uma revisão imutável. Exige `erp.vendas.gerenciar`. A mesma apresentação comercial/layout reaproveita a revisão; conteúdo/layout alterado gera a próxima.
- `GET .../pdf?revisao=N`: baixa a revisão original privada e confere SHA-256/tamanho.
- `GET /api/public/documentos-comerciais/{token}`: link HMAC de 15 minutos para o chat, com empresa/usuário/documento/versão. A leitura revalida permissões/RLS. Se a versão atual mudar, solicite outro link. O token não deve ser registrado nem embutido no PDF.

As tabelas `erp.documentos_comerciais_pdfs` e `erp.arquivos` contêm apenas metadados. Os bytes ficam no bucket privado `erp-comercial`, em `{empresa}/{tipo}/{id}/r{revisao}/layout-{layout}/{sha256}.pdf`. Upload sem sobrescrita, seguido de leitura/conferência antes de registrar o arquivo. Os vínculos também entram nos anexos e eventos do documento.

A migração `20261010130000_documentos_anexos_orcamento.sql` permite que o resolvedor de anexos reconheça `orcamento` como documento de vendas, inclusive em revisões anteriores. Não altera os arquivos imutáveis. O download genérico escolhe a mesma configuração comercial usada no arquivamento; para o bucket fiscal, escolhe a configuração fiscal.

## Configuração

Configure `ERP_DOCUMENTS_SUPABASE_URL` e `ERP_DOCUMENTS_SUPABASE_SERVICE_ROLE_KEY`; o código aceita as configurações específicas `ERP_FISCAL_SUPABASE_*` como reserva. Projeto do Storage e banco do ERP precisam coincidir. Nunca use chaves públicas para o upload nem conceda leitura direta anônima no bucket.

Sem chave válida, baixar o PDF atual continua disponível. Arquivar devolve `STORAGE_UNAVAILABLE` e não grava metadados de um upload que não aconteceu. A migração cria o bucket privado; o teste de Storage real precisa das credenciais e é independente dos testes com simulação de upload.

## Testes

- `node scripts/erp/commercial-documents-migrate.mjs`: valida a migração com rollback. `--apply` aplica e registra a versão uma única vez.
- `node --import tsx scripts/erp/commercial-documents-smoke.ts`: banco real, 10 grupos, rollback, impressão digital de todas as tabelas ERP. Storage em memória, nenhum objeto externo criado.
- `node --import tsx scripts/erp/document-consistency-smoke.ts`: regressões de consistência PDF/XML da NFS-e e download de proposta/OS pelos anexos. Aplica a migração corretiva dentro da transação de teste e reverte todos os dados; Storage em memória. A NFS-e usa o tomador salvo na criação/edição do rascunho para a DPS e o PDF, mesmo se o cadastro mudar depois.
- `node --import tsx scripts/chatgptplugin-all-tools-smoke.ts --company=2 --user=3 --flows-only --case="Comercial ampliado|Orçamento"`: MCP/SDK reais, autenticação de teste, revisão/execução/repetição, leitura e PDF protegido. Banco real com rollback.
- Exemplos gerados em `output/pdf/` podem ser renderizados com Poppler para conferir layout.

Não confunda o sucesso da simulação de upload com confirmação de armazenamento real nem os testes de autenticação simulada com validação OAuth no ChatGPT.
