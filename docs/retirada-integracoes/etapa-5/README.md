# Etapa 5 — Validação da aplicação após a retirada

Data: 08/09/2026. **Validações implementadas e executadas; etapa ainda não aprovada para produção.** Build e testes conectados têm impedimentos de ambiente. O lint agora funciona, mas apresenta erros existentes no código.

## Entregas

- Corrigido `lint` em `package.json`: de `next lint` (comando removido) para `eslint src scripts`.
- Adaptado `eslint.config.mjs` para consumir diretamente as configurações flat instaladas do Next.js 16. Nenhuma regra de qualidade foi desabilitada. Bundles e diretórios gerados ficam fora da análise.
- Criado `scripts/plugin/widget-browser-smoke.mjs`: testa o HTML/bundle final do plugin em Edge headless, usando servidor local isolado. Verifica resposta antiga de conectores, tabela com dados fornecidos e lista vazia de dashboards; intercepta e rejeita requisições externas e chamadas de API.
- Publicados os comandos `plugin:widget-browser-smoke` e `plugin:retirement-smoke` para repetir as verificações.
- Regenerado e testado o widget. Executada a auditoria de ausência de dependências de Integrações/BigQuery.
- Tentados build completo de produção e os três testes do ERP conectados ao banco. Os testes foram examinados previamente: foundation/professional usam transações com rollback; runtime faz verificações de leitura, role e isolamento. As tentativas falharam na resolução DNS, antes de conectar ou escrever dados.

## Resultados e evidências

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Build do widget | Aprovado | [widget-build.log](verificacoes/widget-build.log) |
| Widget final no navegador | Aprovado | [widget-browser.log](verificacoes/widget-browser.log) |
| Testes do plugin | Aprovado | [plugin.log](verificacoes/plugin.log) |
| Auditoria de retirada | Aprovado; preserva a exceção explícita dos dois bundles bloqueados na etapa 4 | [retirement.log](verificacoes/retirement.log) |
| Tipos globais sem cache incremental | Aprovado | [global-typecheck.log](verificacoes/global-typecheck.log) |
| Lint dos arquivos criados/adaptados nesta etapa | Aprovado | [lint-stage5.log](verificacoes/lint-stage5.log) |
| Lint geral | Reprovado: 639 erros e 216 avisos em 620 arquivos analisados | [lint.log](verificacoes/lint.log) |
| Comparação de lint dos arquivos modificados | Nenhuma nova ocorrência de erro por regra/mensagem nos arquivos comparados | [lint-comparison.json](verificacoes/lint-comparison.json) |
| Build de produção | Interrompido por `ENOSPC: no space left on device, write` | [build.log](verificacoes/build.log) |
| ERP foundation | Bloqueado por DNS (`ENOTFOUND`) | [erp-foundation.log](verificacoes/erp-foundation.log) |
| ERP professional | Bloqueado por DNS (`ENOTFOUND`) | [erp-professional.log](verificacoes/erp-professional.log) |
| ERP runtime/isolation | Bloqueado por DNS (`ENOTFOUND`) | [erp-runtime.log](verificacoes/erp-runtime.log) |
| Alterações Remotion preexistentes | Preservadas, mesmo SHA-256 inicial | [preservacao.log](verificacoes/preservacao.log) |

A comparação de lint aplica a mesma configuração atual ao conteúdo de HEAD dos arquivos modificados com erros, comparando contagens por regra/mensagem. Ela não é uma prova de correção funcional, nem torna aprovado o lint geral. O detalhe completo da execução local está em `.next/cache/etapa-5-eslint.json`; o resumo durável está nos registros acima. O lint não havia sido executado corretamente na linha de base, portanto esta etapa tornou visível uma dívida de qualidade antes não medida.

O primeiro teste do navegador esperava um título em uma lista vazia. A expectativa foi corrigida para a mensagem real de lista vazia, sem modificar o componente para satisfazer o teste.

## Impedimentos para encerrar a etapa

1. **Build:** a unidade C: ficou com aproximadamente 1,1 GB livre. Os resultados gerados em `.next` somam aproximadamente 180 MB, insuficientes para resolver a falta de espaço por sua limpeza. Liberar espaço e repetir o build completo. Não foi obtido um build de produção utilizável.
2. **Banco:** o hostname de `SUPABASE_DB_URL` em `.env.local` não resolve no DNS. Confirmar que o projeto Supabase está ativo e atualizar a conexão local, se necessário. Nenhuma senha deve ser colocada nos documentos ou na conversa.
3. **Lint:** tratar a dívida de erros existente antes de considerar o lint um critério aprovado. Esta etapa não fez uma refatoração geral de centenas de erros em módulos fora da retirada.
4. **Fluxos autenticados:** cadastro real, venda, compra, conciliação, importação e edição persistida de artefatos ainda precisam de validação ponta a ponta no ambiente de teste acessível. O teste headless isolado do widget não equivale a esses fluxos.

## Como repetir

Na raiz do projeto:

```powershell
corepack pnpm build
corepack pnpm lint
corepack pnpm plugin:smoke
corepack pnpm plugin:retirement-smoke
corepack pnpm plugin:widget-browser-smoke
corepack pnpm erp:foundation-smoke
corepack pnpm erp:professional-smoke
corepack pnpm erp:runtime-smoke
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false --pretty false
```

As validações aprovadas da etapa 4 continuam registradas no relatório anterior; não são substituídas por uma alegação de aprovação completa nesta etapa.

Nenhum deploy, commit, migração, desligamento de GCP ou alteração de credenciais foi realizado. A etapa 6 não foi iniciada. A pendência de exclusão dos dois bundles locais antigos registrada na etapa 4 permanece.
