# Revisão de propostas, OS e notas de serviço

Data: 10/10/2026. Escopo: código atual, integração com anexos, consistência documental, evidências anteriores e estado real do Supabase/Vercel. Revisão sem alterações no código do produto ou publicação.

Atualização posterior: os achados 1 e 2 foram corrigidos e testados, com a migração corretiva aplicada no Supabase. Consulte [correções de PDF/XML e anexos](correcoes-pdf-xml-anexos-20261010.md). O diagnóstico abaixo preserva o estado encontrado durante a revisão; a publicação permanece pendente.

## Conclusão

A estrutura principal está bem encaminhada, mas ainda não está pronta para ser considerada concluída. Foram confirmados três problemas de código, além da conclusão pendente do Storage fiscal e da publicação.

## Problemas confirmados

### 1. Prioridade alta: PDF e XML da mesma NFS-e podem identificar o cliente de forma diferente

Em `src/products/erp/server/fiscal/serviceInvoiceRepository.ts:166`, a preparação da DPS consulta o cadastro atual do cliente. A emissão, na linha 255, atualiza o emitente e a DPS, mas mantém `destinatario_snapshot` do rascunho. O PDF utiliza esse snapshot antigo.

Reprodução no banco real, dentro de transação revertida: criar rascunho, atualizar o nome do cliente, emitir pelo simulador e obter PDF/XML. O PDF manteve o nome anterior; o XML trouxe o novo nome. Não é apenas uma diferença de apresentação: são duas representações divergentes do mesmo documento.

Correção recomendada: adotar uma única fotografia do tomador para a emissão, utilizada pela DPS, XML, PDF e resposta da API. Se a regra for usar o cadastro atualizado, persistir essa fotografia atomicamente na emissão e exigir nova revisão quando ela divergir da prévia aprovada. Preservar as revisões históricas.

### 2. Prioridade média: PDFs comerciais não estão completamente integrados aos anexos

Em `supabase/migrations/20261010120000_propostas_ordens_documentos.sql:97`, a proposta arquivada recebe `metadata.documento = 'orcamento'`. A função `erp.anexo_destino`, usada por `erp.anexo_acessivel`, reconhece `venda`, mas não `orcamento`.

Reprodução: arquivar uma proposta, listar seus anexos e solicitar o download genérico. O anexo aparece na lista, mas o download retorna `NOT_FOUND`. O download pela rota específica do PDF comercial funciona.

Além disso, `src/products/erp/server/erpStorage.ts:8` usa somente as variáveis gerais de Supabase. O módulo comercial aceita variáveis `ERP_DOCUMENTS_*` e `ERP_FISCAL_*`. Assim, configurar as variáveis documentais não basta para o download pela área de anexos; os caminhos podem consultar configurações diferentes. Uma prova isolada, sem rede, confirmou `STORAGE_UNAVAILABLE` com apenas as variáveis específicas configuradas.

Correção recomendada: uniformizar o tipo de documento nos metadados e no resolvedor de permissões, contemplar registros já arquivados e selecionar a configuração correta de Storage para cada bucket. Cobrir os dois caminhos de download, incluindo proposta e OS.

### 3. Prioridade média: revisão no chat esconde a descrição personalizada

Em `src/products/mcpcore/ui/cards/revisao.ts:11`, `itemName` prioriza o nome da referência do catálogo. Quando o usuário informa uma descrição personalizada, a revisão exibe apenas o nome do catálogo, embora a descrição personalizada seja utilizada no documento.

A execução isolada da função confirmou esse comportamento. Não foi um teste no host real do ChatGPT nesta revisão.

Correção recomendada: mostrar a descrição que será gravada e impressa como texto principal; se necessário, apresentar o nome do catálogo como informação secundária.

## Pendências reais de armazenamento e publicação

Conferência somente de leitura no Supabase:

- Migração comercial `20261010120000` aplicada.
- Bucket `erp-comercial` existente, privado e limitado a PDFs de até 2 MiB.
- Zero revisões comerciais e zero objetos comerciais persistidos.
- Bucket `erp-fiscal` ainda inexistente.
- 28 PDFs fiscais existentes: todos ainda com conteúdo no banco; nenhum associado a arquivo no Storage.
- As chaves específicas fiscal/comercial não estão presentes na configuração local inspecionada. As variáveis remotas da Vercel não foram reinspecionadas nesta revisão.

A consulta da Vercel confirmou que o build preparado está `READY`, corresponde aos arquivos locais e ainda é diferente do deployment do domínio principal. Não houve promoção nesta revisão.

Antes de publicar o conjunto: configurar as credenciais corretas do projeto ERP, criar o bucket fiscal privado, executar e conferir a migração dos PDFs existentes, validar upload e download reais e corrigir os problemas acima. A versão fiscal preparada exige Storage nas operações que geram novos PDFs.

## Pontos positivos

- Controle de empresa e permissões nos fluxos documentais.
- Controle de versão, repetição segura de operações e histórico de decisões comerciais.
- Proposta com validade, aprovação/recusa e conversão para venda; OS mantém os vínculos com proposta e venda.
- PDFs comerciais com rota própria, revisões imutáveis e verificação de tamanho e hash.
- Observações internas da OS excluídas do PDF público.
- Notas explicitamente simuladas, sem envio a provedor fiscal real.

A suspeita inicial de troca de cliente da OS deixando dados antigos não se confirmou na leitura das regras: o banco bloqueia essa troca para preservar a identidade do documento. Uma melhoria de clareza seria informar essa restrição na validação da API/tool antes de chegar à exceção do banco.

## Evidências e limites

Executado nesta revisão:

- Duas reproduções com banco real e permissões do ERP: divergência de cliente na NFS-e e falha de download do anexo de proposta.
- Transação revertida; comparação do conteúdo das tabelas do ERP antes/depois confirmou os registros originais inalterados. Sequências de IDs podem avançar em testes revertidos.
- Oito operações de Storage em memória, três objetos simulados e nenhuma requisição ao Storage externo.
- Provas isoladas do seletor de configuração de anexos e do texto do card de revisão.
- Consultas reais somente de leitura do estado documental no Supabase e da publicação na Vercel.

Evidências em `.cache/commercial-documents/review-probes.json`, `review-state.json`, `database-state.json` e `deployment-proof.json`. Scripts de reprodução em `.cache/review-commercial-fiscal.ts` e `.cache/review-document-state.mjs`.

As evidências anteriores incluem 10 grupos de testes comerciais, 66 chamadas MCP e 16 cenários de cards. Foram consultadas, não reexecutadas integralmente nesta revisão. Também não foram refeitos OAuth/host real do ChatGPT, inspeção visual dos PDFs, build completo ou integração fiscal externa. Os testes locais de Storage não comprovam upload real no bucket.
