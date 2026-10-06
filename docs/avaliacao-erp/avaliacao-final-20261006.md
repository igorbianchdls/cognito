# Avaliação final do ERP, API e plugin — 06/10/2026

## Conclusão

Os fluxos principais passaram em testes novos, inclusive consultas no Supabase, CRUD por MCP com aprovação e consultas na API publicada com sessão Clerk real. O conjunto ainda não deve ser considerado 10/10: há uma falha de paginação fiscal, limitações de edição no MCP, alertas de dependências e pendências de armazenamento, recuperação e validação em ambiente real.

Esta avaliação não altera regras de negócio, migrações ou a versão publicada. Foram atualizados os testes antigos para acompanhar o catálogo e as migrações atuais. Gravações de teste usam registros descartáveis e exclusão lógica; seus históricos e auditorias permanecem no banco.

## Ambientes e alcance

- Supabase: projeto confirmado, empresa demonstrativa 2, usuário 3. Consultas com isolamento por empresa e permissões reais.
- MCP: HTTP local → handler e repositórios da aplicação → Supabase real. A resolução da identidade e as decisões humanas usam fixtures autorizadas apenas no teste. Isso não comprova OAuth ou uma conversa dentro do ChatGPT.
- Site publicado: `https://cognito-seven.vercel.app`, implantação `dpl_Chh7WmKeaNMkdcQgRV2v1JsYnH5U`, pronta na Vercel. Consultas autenticadas com sessão real do Clerk.
- Interface dos dashboards: componentes e CSS reais, banco real, navegação e sessão simuladas no teste de interface. Desktop e celular. Os cards e formulários do plugin usam testes locais.
- Não houve nova publicação, emissão fiscal real ou chamada a banco/provedor de cobrança.

## Resultados dos testes

| Área | Evidência nova | Limite da conclusão |
| --- | --- | --- |
| Tipos ERP, plugin e shared | Três verificações aprovadas | Não substituem execução funcional |
| API HTTP | 20 grupos; catálogo de 62 rotas / 89 métodos | Banco local PGlite; não são todos os caminhos de todos os métodos |
| API publicada | 32 respostas verificadas, incluindo contas a pagar/receber, vendas, compras, cadastros, pagamentos, sete dashboards e PDFs | Consultas reais; permissões administrativas do usuário demonstrativo |
| Todas as ferramentas de leitura | 30 ferramentas chamadas; 112 verificações aprovadas e uma falha de paginação fiscal; 22 tabelas comerciais/fiscais, propostas e preferências preservadas | A falha é funcional e permanece aberta; OAuth do ChatGPT não exercitado |
| CRUD pelo MCP | 25 verificações, 88 chamadas de ferramenta e 37 chamadas ao fluxo de aprovação | Identidade do teste no HTTP local; OAuth do ChatGPT não exercitado |
| Dados do CRUD | Seis registros: cliente, fornecedor, conta a pagar, conta a receber, venda e compra; criados, consultados, editados e excluídos logicamente | Vendas e compras de teste em rascunho |
| Preservação dos dados | Zero registros ativos de teste ao final; registros anteriores das duas empresas preservados | Auditorias, históricos e registros excluídos permanecem |
| Dashboards | 26 verificações de banco, 108 consultas de detalhamento, 53 tabelas preservadas; 39 verificações HTTP | Não é teste de carga |
| Interface dos dashboards | 27 verificações nos sete dashboards, desktop e celular | Sessão e navegação do teste; não revisão visual completa do site autenticado |
| Estoque, contratos e automações | 29 cenários de regressão aprovados | Banco local; gravações simultâneas no PostgreSQL ainda não comprovadas |
| Notas de serviço simuladas | 40 verificações no Supabase, com transação revertida | Simulador local, sem validade fiscal |
| PDFs | Quatro documentos baixados da produção, abertos e verificados; aviso em todas as páginas; documento extenso de sete páginas também verificado | PDF demonstrativo, não documento fiscal oficial |
| Cards e formulários | Seis cards; revisão, resultado, filtros, paginação, proteção de conteúdo, formulários e repetição de solicitações aprovados | Renderização dentro do ChatGPT não validada |
| Protocolo e autenticação | 32 verificações de protocolo, 35 de autenticação, 13 grupos de formulários/protocolo | Tokens de teste; não consentimento/token real do ChatGPT |
| Pacote | Estrutura, schemas, metadados e integridade do ZIP aprovados; 37 verificações negativas | Instalação real e publicação pública não comprovadas |
| MCP publicado | Metadados com recurso correto; chamada sem autenticação recebe 401 e desafio OAuth | Não autoriza afirmar que a conexão do ChatGPT foi concluída |
| Configuração OAuth | Metadados, scopes, tabelas e chave de formulário prontos | Audiência de token real ainda não verificada |
| Análise estática | 309 arquivos ERP/plugin/API, zero erros e dez avisos | Avisos e restante dos produtos não foram corrigidos nesta avaliação |

## Banco e acesso

O catálogo atual tem **87 tabelas ERP**, **oito shared** e **quatro plugin**. As 87 tabelas ERP têm RLS; o catálogo ERP/shared não apresentou constraints não validadas, índices inválidos ou triggers desativados. As funções com privilégios elevados analisadas possuem `search_path` configurado.

As oito tabelas shared são privadas da camada de servidor: não têm RLS, mas também não têm grants de tabelas para `anon`, `authenticated` ou `PUBLIC`. A ausência de RLS nessas tabelas não foi tratada isoladamente como vazamento. As quatro tabelas do plugin têm RLS.

As consultas de isolamento e revogação passaram. A comprovação de leituras entre contextos não equivale a comprovar gravações concorrentes, ausência de deadlocks ou resistência sob carga.

## Problemas e melhorias, por prioridade

### 1. Dependências com alertas de segurança

A auditoria nova da árvore de produção encontrou **dois alertas altos e um moderado**, sem alertas críticos:

- `braces` 3.0.3: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- `source-map-js` 1.2.1: [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- `postcss-selector-parser` 7.1.1: [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).

São dependências transitivas ligadas também ao processamento de CSS/build. A presença na árvore não comprova exploração pela API do ERP. É necessário atualizar a resolução, conferir as versões publicadas disponíveis e repetir as verificações afetadas. Há divergência entre o campo de versão corrigida retornado pela auditoria npm e o aviso GitHub de `braces`; não se deve presumir uma correção disponível apenas pelo campo da auditoria.

O disco local tem pouco espaço; não foram instaladas dependências nem executado um build Next completo novo. A implantação publicada foi confirmada pronta e exercitada por HTTP.

### 2. Atualizar a recuperação de backup para o banco atual

`scripts/erp/backup-restore-proof.mjs` ainda consulta `shared.users`, que foi substituída por `shared.usuarios`. Foi confirmado no banco que `shared.users` não existe. Portanto, esse utilitário precisa ser adaptado antes de servir como prova de recuperação atual.

Existe prova anterior, de 05/10, de restauração isolada de ERP/shared, com 88 tabelas e 4.106 registros. Ela não cobre as novas tabelas fiscais nem plugin, auth e Storage. É necessário gerar uma cópia atual e restaurá-la em ambiente isolado, incluindo PDFs, sequências e o escopo de recuperação escolhido. O script shared de cópia e migração também foi escrito para o estado anterior à mudança de nomes; não é um utilitário genérico atual de recuperação.

### 3. Corrigir total na paginação de notas de serviço

`listServiceInvoices` calcula o total a partir da primeira linha retornada por `count(*) OVER()`. Em uma página vazia além da última, não há primeira linha e o total vira zero.

Reprodução: `listar_notas_servico`, empresa 2, página 10000. Retorna registros vazios e total zero; o total correto da consulta sem esse deslocamento é quatro. O problema está na consulta compartilhada, atingindo API, site e ferramenta MCP. O cenário novo permanece como regressão que falha; sua expectativa não foi relaxada.

### 4. Ampliar edição dos cadastros pelo MCP

Os testes de `editar_cliente` e `editar_fornecedor` confirmam que telefone e e-mail não fazem parte do contrato atual de edição utilizado pelo MCP. Criar o cadastro e alterar nome/status funciona. É preciso expor os demais campos desejados com validação, permissões e revisão, para uma experiência de edição completa.

### 5. Concluir armazenamento real de anexos

O teste do assinador de arquivos passou em 19 verificações locais, mas o bucket previsto `erp-anexos` não existe no Supabase consultado. Configurar o bucket privado e comprovar acesso autorizado, recusa de outra empresa e expiração dos links continua pendente.

Os PDFs simulados já servidos pela API são armazenados de forma privada e versionada no banco; o resultado positivo deles não comprova o funcionamento do Storage genérico.

### 6. Homologar concorrência e operação contínua

- Exercitar baixas, reservas/atendimento, recebimentos e operações repetidas com duas sessões PostgreSQL gravando simultaneamente, em banco exclusivo de teste.
- Validar as rotinas agendadas da Vercel, retomada, alertas e observabilidade em execução real. O agendamento e a variável de autenticação estão configurados; os testes locais não comprovam toda a operação diária.
- Revisar a interface autenticada completa do ERP e os fluxos de erro com navegação real. O teste de dashboards usa componentes reais, porém sessão/navegação de teste.

## Integrações deixadas para depois

OAuth e UI dentro de uma conversa real no ChatGPT, emissão fiscal real e cobrança externa continuam fora da validação final. Fiscal e cobrança dependem do provedor e da homologação escolhidos. Isso respeita as decisões anteriores do usuário, mas impede declarar o produto completo em produção.

## Evidências privadas

Relatórios de execução estão em `.cache/final-audit`, `.cache/erp-audit`, `.cache/chatgptplugin-crud`, `.cache/dashboards` e `.cache/service-invoice`. Esses diretórios podem conter dados demonstrativos e auditorias; não foram incluídos no relatório público valores de credenciais ou tokens.

Os ajustes desta avaliação ficaram nos scripts de teste: catálogo de 33 ferramentas/30 consultas; quatro novas consultas fiscais; comparação de snapshots sob a mesma role; migrações fiscais na fixture local; ambiente/provedor explícitos nessa fixture; retirada de configuração de sessão somente leitura do teste CRUD, incompatível com o pooler de transações. Não foram feitas correções funcionais no produto nesta avaliação.
