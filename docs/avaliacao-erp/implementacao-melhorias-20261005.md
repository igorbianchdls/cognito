# Implementação das melhorias do ERP e plugin

Atualizado em 05/10/2026. Trabalho em andamento; não representa conclusão das oito etapas nem aprovação 10/10.

## Escopo

Fiscal e OAuth na conta ChatGPT continuam adiados. O usuário informou que ainda não escolheu banco/provedor para cobrança externa. Esse fluxo aguarda definição e credenciais de teste.

## Evidências já obtidas

| Área | Implementação e verificação | Pendência |
|---|---|---|
| Estoque | Transferências transportam custo e calculam média ponderada; reservas protegidas; liberação parcial; estorno de entrada; conversão de unidades; repetição com conteúdo diferente recusada | Concorrência entre duas conexões independentes ao PostgreSQL do ERP |
| Inventário | Backend com até 200 itens; revisão do saldo no envio; tela com produtos e diferenças; 8 cenários no componente real em navegador local | Fluxo autenticado completo no ambiente de testes |
| Banco | Duas migrações aplicadas no Supabase em transação; RLS, chaves, gatilhos e views conferidos; fingerprints das 87 tabelas anteriores iguais | Teste de carga e concorrência |
| Automações | Prazo de 15 minutos para retomada; efeitos e conclusão na mesma transação; falha desfaz efeitos; histórico de tentativas; contratos incompletos podem continuar com a mesma chave diária | Agenda e alertas no ambiente publicado |
| Contratos | Dia de referência preservado após fevereiro; lotes atrasados; isolamento de falha por contrato; pausa e retomada; limites de 24 ciclos/200 vendas e revisão de condições comprovados | Concorrência real de trabalhadores e agenda publicada |
| Plugin | Seleção por nome de cadastros e registros existentes; linhas de itens/parcelas; preenchimento da edição; revisão antes/depois; limpeza explícita de campos financeiros; títulos selecionados pelo conta_id | Estorno de pagamento ainda pode exigir identificador; centro de custo sem seletor; documentos comerciais com várias parcelas são editados no ERP |
| Consultas | 99 verificações contra Supabase, incluindo todas as 26 ferramentas de leitura, 8 relatórios e 6 cards; dados comerciais preservados | Renderização na conta ChatGPT adiada pelo usuário |
| CRUD | 27 grupos locais com 44 propostas, permissões, isolamento, auditoria, pagamentos, estornos e rollback; omissão/limpeza de campos e proteção de parcelas com contas diferentes comprovadas | Fluxos completos por navegador autenticado |
| Formulário | Teste em navegador local: linhas visuais, busca por nome, preenchimento atual, limpeza explícita, repetição, arquivos e proteção contra injeção de HTML | Experiência dentro do ChatGPT adiada |
| Financeiro | Testes existentes de conciliação, OFX repetido, créditos, renegociação, rateios e estornos; 44 verificações integradas aprovadas | Cobrança externa e testes adicionais de indicadores |
| Anexos | Link após vínculo autorizado; expiração em 60 segundos; validação de configuração/caminho; limite de tempo; 19 verificações locais sem acesso externo | Configurar credencial e testar Storage real |
| Cópia/restauração | ERP/shared: 88 tabelas, 4.106 registros, 414 FKs e 85 sequências; restauração isolada, hashes iguais e próximos identificadores conferidos | Não inclui plugin, autenticação completa, Storage nem prova de recuperação de toda a plataforma |
| Dependências | Next 16.3.8 recuperado; React 19.3.0; bibliotecas desnecessárias retiradas; versões corrigidas fixadas no manifesto e lockfile; auditoria desse conjunto com 1 alerta alto sem patch | Instalar todo o conjunto corrigido e comprovar compatibilidade; falta espaço |
| Qualidade | Compilação completa aprovada em revisão anterior; tipos ERP/plugin aprovados; análise estática final dessas áreas com zero erros e 13 avisos | Compilação final após instalação das dependências corrigidas; análise global tem problemas em outras áreas |
| Pacote | Versão 1.6.0; ZIP atualizado; esquemas, 2 skills, integridade e 37 verificações negativas aprovados; segredos excluídos | URLs oficiais de suporte/privacidade/termos, elegibilidade e instalação na conta real |

O teste de estoque/contratos/automações agora contém **29 cenários aprovados**. O lote global gerou 324 ciclos únicos em três chamadas (200, 120 e 4), sem duplicação. A revisão de contrato preservou os valores anteriores e aplicou as condições novas somente nos períodos seguintes.

As verificações de navegador usam APIs/host sintéticos e não substituem os fluxos autenticados completos. O teste local de Storage valida construção/recusa de links; não comprova autorização ou configuração do bucket remoto.

## Dependências e compilação pendente

A atualização completa foi interrompida por `ENOSPC`. Foram recuperados os vínculos dos pacotes existentes e verificados Next 16.3.8, React 19.3.0, js-yaml 4.3.2 e esbuild 0.28.2. O manifesto e o lockfile foram preparados com correções específicas por versão principal, usando `pnpm.overrides`.

A auditoria do **lockfile planejado** (905 dependências) e a auditoria de produção mostram zero alertas críticos, moderados e baixos, e um alerta alto em `braces@3.0.3`, sem versão corrigida informada. Ele chega por processamento de padrões de arquivos em Sass/ESLint. A busca no código não encontrou encaminhamento de padrões fornecidos por usuários do ERP/MCP para essa biblioteca; essa conclusão é limitada ao código examinado e não declara ausência de risco nas ferramentas de desenvolvimento. Referência do alerta: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

**Os pacotes instalados ainda não correspondem a todas as versões corrigidas do lockfile.** Essa auditoria não comprova que o ambiente instalado está livre dos demais alertas. Após liberar pelo menos 10 GB: executar `corepack pnpm install --frozen-lockfile --store-dir .pnpm-store`, repetir tipos e testes afetados e executar a compilação completa. A instalação não foi tentada novamente com o disco abaixo de 1 GB.

## Banco aplicado

- `20261005020000_harden_erp_stock_operations.sql`
- `20261005021000_anchor_contract_cycles.sql`

Aplicação: projeto `mtadnxqoqxzbdksktwdr`, às 03:26 UTC de 05/10. Conferência de integridade, privilégios dos helpers internos e `security_invoker` das views antes do commit. Nenhum registro comercial reescrito.

A tabela `erp.operacoes_estoque` guarda a identidade e resultado das operações de estoque para permitir repetição segura inclusive de cadastros. As tabelas comerciais atuais foram preservadas. As colunas novas em históricos anteriores permanecem nulas; chaves antigas sem fingerprint exigem conferência em vez de equivalência presumida.

## Regras operacionais adotadas

- Quantidade base: quatro casas; custo: seis casas.
- Movimentos operacionais e contagens: dia atual em America/Fortaleza; retroativos recusados.
- Kits: um nível, sem ciclos ou componentes que também sejam kits ativos.
- Giro: saídas de venda dos últimos 90 dias divididas pelo saldo físico atual; não é custo médio nem giro baseado em estoque médio.
- Automações: operações parciais/falhas são visíveis e retomáveis; o cron responde com falha quando alguma rotina falha.

## Evidências privadas

Relatórios e cópias ficam sob `.cache`, ignorada pelo Git. Não publicar esses arquivos: a cópia contém registros e dados de usuários. Principais relatórios em `erp-audit`: `stock-regression.json`, `stock-count-ui.json`, `storage-regression.json`, `mcp-all-read.json`, `product-lint-final.json`, `dependency-audit-lock-final.json`, `dependency-audit-prod-final.json` e `stock-application/application.json`. A prova de restauração está em `.cache/database-backups/restore-proof.json`.

A cópia mais recente tem formato `erp-shared-text-v2`. Os dados das tabelas são lidos em uma única transação consistente. Sequências não têm a mesma semântica de snapshot do PostgreSQL: seu estado é capturado ao final da leitura, podendo já ter avançado por gravações concorrentes. A restauração local verifica esses estados e os próximos identificadores, sem chamar `nextval` no banco de origem.

## Restrições do ambiente

O disco C: voltou a ficar abaixo de 1 GB após instalação/compilação. Foi solicitado ao usuário liberar 10 GB. Limpeza foi feita por comandos dos gerenciadores de pacotes. Exclusões recusadas pela revisão automática não foram contornadas.

Nenhuma publicação, commit ou alteração do endpoint remoto foi feita nesta implementação.
