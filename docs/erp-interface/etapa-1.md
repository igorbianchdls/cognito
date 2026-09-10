# Etapa 1 — Base de adaptação da interface ERP

Implementação local em 09/09/2026. Escopo: contratos compartilhados, valores monetários, erros, proteção de operações, contexto transacional e permissões. Nenhuma conexão com o Supabase, migração, alteração de dados reais ou publicação nesta etapa.

## Entregas

- Contratos compartilhados para versões, datas reais do calendário, valores monetários, identificação de operações e envelopes de leitura/gravação. Campos controlados pelo sistema são rejeitados nas entradas genéricas.
- Cálculos decimais com arredondamento explícito, sem transformar silenciosamente valores inválidos em zero. A adoção de todas as fórmulas específicas dos módulos continua nas etapas seguintes.
- Erros estruturados com código, mensagem, orientação de recuperação e identificador de atendimento. Falhas internas não expõem SQL nem dados comerciais. O cliente aceita o protocolo anterior durante a transição.
- Operação reutilizável por formulário/ação: cliques simultâneos compartilham a requisição; uma resposta perdida preserva a identificação e o conteúdo. Não há repetição automática.
- Recebimentos e pagamentos exigem identificação de operação e persistem sua solicitação canônica nos metadados existentes. Repetir a mesma operação devolve o resultado anterior; reutilizar sua chave com outro conteúdo é rejeitado. Nenhuma tabela nova foi necessária.
- O contexto de empresa, usuário e permissões é reaplicado antes do commit, inclusive para validações adiadas do banco. Mudança de contexto durante a transação é rejeitada e falhas no commit provocam rollback.
- Permissões começam negadas enquanto carregam. A página genérica filtra ações e os controles financeiros de baixa, estorno e criação de despesa respeitam as permissões. O servidor continua sendo a autoridade de acesso.

## Mapa de adaptação restante

| Entrada | Camada responsável | Próxima adaptação |
| --- | --- | --- |
| Cadastros genéricos `/api/erp/[entityId]` | `erpRepository` e `ErpEntityPage` | Etapa 2: contatos normalizados, campos e relações por cadastro |
| Vendas e ordens de serviço | Rotas especializadas, `erpRepository` e repositório profissional | Etapa 3: documentos, itens, transições e versões |
| Contratos e processamento de ciclos | Repositório de gestão e `/contratos/processar` | Etapa 3: versões, ciclos e vínculos comerciais |
| Baixas, estornos e posições financeiras | Páginas financeiras e repositórios ERP | Etapa 4: créditos, renegociações, saldos e todas as ações financeiras |
| Recorrências, automações e importações | Processadores e repositórios específicos | Etapa 5: produtores indiretos, histórico, navegação e remoção das dependências das views financeiras |
| Ferramentas de IA | `erpAiApplication` e `erpTools` | Validar os mesmos contratos ao adaptar cada módulo; a ferramenta de baixa já exige chave |
| Fluxos completos | Interface, API e banco de teste | Etapa 6: testes de ponta a ponta, concorrência e capacidade |

Compras, estoque e fiscal não receberam novas funcionalidades. A padronização de erros em rotas existentes é infraestrutura compartilhada.

## Limites explícitos

O executor mantém a operação em memória: não promete recuperação automática após recarregar a página. Cadastros sem deduplicação persistente bloqueiam uma nova tentativa após resultado incerto, exigindo verificar o resultado primeiro. A infraestrutura de idempotência não significa que todos os geradores e comandos antigos já estejam adaptados.

Os contratos de transporte são a base comum; não substituem os esquemas específicos de cada módulo. As fórmulas, saldos exibidos, formulários especializados e demais controles de ação serão adaptados nas respectivas etapas. Esta entrega não declara a interface inteira pronta.

## Validação

- Compilação de tipos: `tsconfig.erp.json`.
- Teste reproduzível: `node scripts/erp/interface-foundation-smoke.mjs`.
- 16 cenários offline, incluindo arredondamento, datas, erros, repetição segura, conflitos de chave, permissões durante carregamento, contexto no commit e rollback integral.
- Integração com PostgreSQL embarcado (PGlite), estrutura restaurada de arquivos locais e registros fictícios. Testes de pagamento usam o repositório real contra esse banco isolado.
- Resultado detalhado em `etapa-1-testes.json`.
