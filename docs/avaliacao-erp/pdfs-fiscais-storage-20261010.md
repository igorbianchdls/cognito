# PDFs fiscais no Storage privado

## Estrutura

O conteúdo binário dos PDFs deve ficar no bucket privado `erp-fiscal` do mesmo projeto Supabase da conexão PostgreSQL do ERP. A referência é validada antes de qualquer solicitação de Storage. As configurações gerais de anexos podem apontar para outro projeto; por isso o armazenamento fiscal aceita configuração própria e não altera a dos anexos existentes.

- `erp.arquivos`: bucket, caminho, nome, MIME, tamanho, SHA-256, autoria e datas.
- `erp.notas_fiscais_arquivos`: associação preservada entre nota e arquivo.
- `erp.notas_fiscais_pdfs`: versão fiscal, versão do layout e `arquivo_id`, além dos metadados originais.
- Caminho: `<empresa>/notas/<nota>/v<versao>/layout-<layout>/<sha256>.pdf`.

Nenhuma tabela nova é necessária. As tabelas fiscais continuam guardando os dados estruturados das notas. XML e apresentação como anexo nativo no ChatGPT não fazem parte desta migração de PDFs.

## Configuração do servidor

Configure no ambiente local e no projeto Vercel:

```dotenv
ERP_FISCAL_SUPABASE_URL=https://mtadnxqoqxzbdksktwdr.supabase.co
ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY=<chave administrativa do mesmo projeto>
```

A chave é usada somente no servidor. O download resolve a nota e as permissões pelo Clerk e pelas políticas do ERP antes de consultar o arquivo. Não há acesso público ao bucket. O endpoint autenticado e os links HMAC temporários existentes continuam entregando o PDF; estes últimos revalidam o contexto de quem os criou em cada download. Nenhum link temporário é persistido como localização permanente.

A variável aceita tanto a Secret key atual (`sb_secret_...`) quanto a chave legada `service_role`. Ambas devem pertencer ao projeto do ERP; a [documentação de chaves do Supabase](https://supabase.com/docs/guides/getting-started/api-keys) descreve onde obtê-las. O leitor usa o [download autenticado de objetos privados](https://supabase.com/docs/guides/storage/serving/downloads).

## Gravação e integridade

O gravador trava a nota, verifica se a versão já existe, gera o PDF, calcula SHA-256 e envia o arquivo com `x-upsert: false`. Ele baixa novamente o objeto e confere tamanho, assinatura `%PDF-` e SHA-256 antes de registrar os metadados. Limite: 2 MiB por PDF, preservando o limite anterior do banco.

A função `erp.registrar_pdf_armazenado` registra o arquivo e os vínculos dentro da transação, validando empresa, usuário, permissão comercial e versão. Não recebe bytes. Os arquivos vinculados e as versões ficam protegidos contra mutação pelas regras existentes e pelo novo validador de metadados. O Storage não oferece, nesta implementação, uma política WORM contra um administrador; a aplicação não sobrescreve os objetos e não oferece exclusão de PDFs fiscais.

Storage e PostgreSQL não compartilham uma transação. Se o upload tiver sucesso e a transação falhar, o objeto pode ficar órfão. Caminho determinístico e conferência de hash permitem reutilizar o mesmo objeto em uma repetição compatível. O comando `orphans` produz um relatório para recuperação; não apaga arquivos automaticamente. Na simulação atual, falha de upload impede confirmar a operação local. Uma futura integração fiscal externa precisará tratar separadamente autorização fiscal e entrega dos documentos.

## Migração em etapas

Execute os comandos a partir da raiz do projeto. Eles verificam o projeto do banco e não imprimem credenciais.

```powershell
pnpm erp:fiscal-pdf-storage prepare
pnpm erp:fiscal-pdf-storage migrate
pnpm erp:fiscal-pdf-storage verify
```

1. `prepare` aplica `20261010110000_fiscal_pdf_storage_prepare.sql`. A coluna `arquivo_id` é opcional nesta fase, e `conteudo` continua disponível para a aplicação anterior.
2. `migrate` cria/confere o bucket pela API de Storage, salva `.cache/fiscal-pdf-storage/backup-originals.json`, envia cada PDF original e registra os vínculos. Uma retomada acrescenta ao backup os originais surgidos desde a execução anterior, preservando os já copiados. A cópia de segurança contém os bytes em base64; é privada, ignorada pelo Git e deve ser preservada em um local de backup protegido independente do banco.
3. Cada PDF é baixado novamente e comparado byte a byte com o original. A migração pode ser repetida sem duplicar versões. Datas, autoria e SHA-256 são preservados.
4. Publicar os leitores e gravadores compatíveis com as credenciais corretas. O empacotador existente aceita `node scripts/shared/stage-vercel.mjs --production --fiscal-storage`, que marca a publicação como compatível. Verificar os downloads pela API, plugins e Portal do Contador antes da promoção.
5. Depois da promoção, executar `pnpm erp:fiscal-pdf-storage live --company=2 --user=3`. Esse comando compara o SHA-256 dos PDFs entregues pela aplicação publicada com os metadados, exige o cabeçalho `X-PDF-Storage: storage`, confere o bloqueio de acesso público ao bucket e de links expirados, e grava `.cache/fiscal-pdf-storage/live-http.json`.
6. Só então executar:

```powershell
pnpm erp:fiscal-pdf-storage finalize --deployment=<deployment verificado>
```

`finalize` verifica se a cópia de segurança contém cada PDF original ainda presente no banco, baixa todos os PDFs novamente, exige que a publicação informada seja a produção ativa e aplica `20261010110100_fiscal_pdf_storage_finalize.sql`: torna `arquivo_id` obrigatório e remove `conteudo`. Não reverta depois para uma aplicação que exige essa coluna. A recuperação deve usar uma versão compatível e, se necessária, a cópia de segurança dos originais.

O Portal do Contador passa a obter o tamanho de `erp.arquivos` e escolhe a maior versão e o maior layout. ERP, ChatGPT e Claude usam o mesmo leitor, que confere integridade em todo download.

## Testes

```powershell
pnpm erp:fiscal-pdf-storage-smoke --company=2 --user=3
pnpm erp:fiscal-pdf-storage orphans
```

A suíte usa banco real com reversão integral e Storage simulado: projeto/credenciais incorretos, caminho adulterado, corrupção, falha antes do upload, timeout após upload, repetição, leitura legada, criação, edição, emissão simulada, cancelamento, preservação de versões e isolamento por empresa. Nenhuma solicitação é enviada ao Storage real nessa suíte. O relatório fica em `.cache/fiscal-pdf-storage/smoke.json`.

`verify` é a validação complementar dos arquivos reais. O relatório fica em `.cache/fiscal-pdf-storage/verification.json`.

## Estado da entrega em 10/10/2026

- Código e migrações preparados.
- Migração de preparação aplicada no banco, mantendo compatibilidade com a aplicação atual e os bytes originais.
- 17 grupos de testes passaram com banco real e Storage simulado; todas as alterações de teste foram revertidas. Incluem a execução da remoção de `conteudo` em uma transação de teste e leitura/gravação após essa remoção, proteção por empresa na aplicação e no banco, e retomada do backup.
- Teste integrado do plugin passou: 59 chamadas MCP, cobrindo sete ferramentas fiscais, quatro cenários de emissão simulada, PDF/XML, cancelamento e links expirados/adulterados. Usa protocolo e banco reais, autenticação e Storage simulados; 15 objetos de teste, nenhum arquivo enviado ao Storage real, dados originais preservados. Relatório em `.cache/all-tools/selected-report.json`.
- 38 verificações de contrato/erros do plugin passaram em `scripts/chatgptplugin-smoke.ts`.
- Nenhuma política de acesso público/autenticado está configurada no Storage do projeto do ERP, e as tabelas de Storage têm RLS habilitado, conforme levantamento. O acesso fiscal é feito pelo servidor após autorização do ERP; acesso público real será verificado na etapa `live`.
- Verificação TypeScript dos cinco arquivos de implementação/teste selecionados: zero erros.
- Encontrados 28 PDFs versionados de 11 notas no banco durante o levantamento.
- As configurações gerais de Storage da Vercel apontam para `ovdvpfxwfvqzseekwqqp`, diferente do banco do ERP (`mtadnxqoqxzbdksktwdr`). Elas não foram alteradas.
- A migração ao bucket real, a publicação e a remoção dos bytes dependem da credencial administrativa do projeto correto. Os PDFs originais permanecem no banco até essa etapa ser verificada.
