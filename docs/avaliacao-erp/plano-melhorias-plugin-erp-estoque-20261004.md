# Plano de melhorias do plugin, ERP e estoque

Data: 04/10/2026, America/Fortaleza.

## Escopo combinado

Fiscal e OAuth dentro do ChatGPT ficam para uma etapa posterior, conforme solicitado. Este plano trata das demais pendências da avaliação e incorpora a revisão adicional do estoque no código e no Supabase.

Resultado esperado: ERP e backend do plugin com operações consistentes, interfaces claras, manutenção operacional e testes representativos. A aprovação final da conexão OAuth e da renderização dentro do ChatGPT continuará sendo uma etapa própria.

Nesta tarefa foram realizados planejamento, consultas somente leitura no Supabase e diagnósticos com dados fictícios em PostgreSQL local. Não foram aplicadas correções ao produto, migrações ou alterações em registros comerciais reais.

## 1. Avaliação complementar do estoque

### Estrutura que deve ser aproveitada

- 13 tabelas relacionadas ao estoque, todas com RLS; 62 chaves estrangeiras e 42 índices nessas tabelas.
- Saldo por produto e local; separação entre quantidade física, reservada e disponível.
- Movimentos protegidos contra alteração/exclusão por gatilho.
- Reservas de venda, documentos de estoque, inventários, transferências, kits e cadastro de conversões de unidades.
- Duas views com `security_invoker=true`: posição e giro de estoque.
- Bloqueio de saldo na transação e verificações de períodos fechados.

### Dados atuais do Supabase

Foi realizada uma conferência agregada em transação `REPEATABLE READ READ ONLY`:

| Verificação | Resultado |
|---|---|
| Posições de saldo | 40 |
| Movimentos | 169 |
| Saldo físico versus soma dos movimentos | Nenhuma divergência |
| Saldo e custo médio versus último movimento | Nenhuma divergência |
| Quantidade reservada versus reservas ativas | Nenhuma divergência |
| Saldo negativo em produto que proíbe negativo | Nenhum |
| Reserva acima do físico em produto que proíbe negativo | Nenhuma |
| Saldo positivo sem custo médio | Nenhum |
| Reservas ativas, inventários, transferências, kits e conversões cadastradas | Zero em cada grupo |

**Conclusão:** os dados atuais estão consistentes nas verificações feitas. A ausência de operações avançadas nesses dados impede usá-los como prova de funcionamento desses fluxos. Não foi identificada justificativa para reconstruir ou zerar o estoque atual.

### Problemas reproduzidos em banco local

Os diagnósticos usaram SQL e repositórios reais, catálogo local com as migrações de integridade e leitura aplicadas, dados fictícios e rollback entre cenários. Não usaram duas conexões simultâneas nem uma sessão real do navegador.

| Achado | Evidência local | Consequência |
|---|---|---|
| Transferência não transporta o custo | 10 unidades a custo 20; transferir 5 deixou o valor total em 100, antes 200. O destino recebeu custo zero. | Quantidade total é preservada, mas a avaliação monetária fica incorreta. |
| Saída manual consome estoque reservado | Físico 10, reserva 8, saída manual 5; resultado físico 5, reserva 8 e disponível −3. | Uma venda já reservada pode ficar sem quantidade para atendimento. |
| Produto desativado bloqueia liberação de reserva existente | Reservar, desativar o produto e liberar a reserva retornou “produto não encontrado ou inativo”. | Pode impedir recuperação/cancelamento de operação anterior. |
| Estorno simples de entrada não restaura a avaliação anterior | Saldo inicial 10×20; entrada de 10×40 seguida do estorno deixou 10×30. | A quantidade voltou, mas o valor passou de 200 para 300. O teste isolou o motor de estoque, sem cancelar o documento financeiro da compra. |
| Inventário não respeita a repetição da mesma chave | A mesma chamada gerou dois documentos. | Uma repetição pode duplicar o registro de inventário. |
| Data do inventário difere da data do movimento | Inventário em 03/02; movimento gravado com a data atual. | Documentos e relatórios podem representar datas diferentes para a mesma operação. |
| Permissões de inventário e saldo não estão alinhadas | Perfil com visualizar+ajustar foi autorizado na regra do recurso, mas a gravação falhou pela política de saldo, que exige movimentar. | A operação permitida na interface não termina no banco para esse conjunto de capacidades. |
| Kits aceitam ciclo | Kit A contém B e kit B contém A foram cadastrados. | A composição precisa de uma regra consistente com a expansão das reservas. |
| Repetição de movimento ignora mudança no conteúdo | Mesma chave com quantidades 1 e 7 devolveu o primeiro movimento. | A resposta não informa que a segunda solicitação tem conteúdo diferente. |

Evidências centrais: `src/products/erp/server/erpStockRepository.ts`, `src/products/erp/server/erpOperationAccess.ts` e políticas do catálogo atual.

### Outros pontos a tratar

- A view de giro soma movimentos negativos, incluindo transferências e ajustes. O indicador deve separar venda/consumo de remanejamentos e explicitar a base do cálculo.
- Conversões de unidade aparecem no cadastro/listagem; não foi encontrada aplicação do fator no motor de movimentação examinado.
- O inventário disponível na interface finaliza um produto por chamada. Deve evoluir para contagem e revisão das diferenças, aproveitando a tabela existente de itens.
- As garantias de saldo e reserva estão concentradas na aplicação. O banco precisa conferir os efeitos conjuntos na transação, preservando as operações que atualizam saldo e reserva em passos separados.
- A data operacional e o instante de gravação precisam ser distintos e coerentes. O Supabase está em UTC; a regra do dia comercial deve ser explícita.

## 2. Etapas de implementação

### Etapa 1 — Segurança e base de testes

**Implementar:**

1. Atualizar as dependências com alertas aplicáveis, incluindo Next.js e bibliotecas associadas, para versões corrigidas compatíveis.
2. Conferir o uso das dependências declaradas e retirar as que forem comprovadamente desnecessárias.
3. Atualizar o teste que espera um código antigo de erro de FK e o teste que ainda solicita relatórios descontinuados.
4. Corrigir os quatro erros de análise da interface identificados na avaliação.
5. Transformar os casos de estoque reproduzidos em testes permanentes, que inicialmente evidenciem as falhas.

**Concluída quando:** build e tipos passam; testes existentes estão alinhados ao produto atual; avisos graves de dependências usadas são resolvidos ou têm aplicabilidade documentada; os problemas de estoque têm reproduções confiáveis.

### Etapa 2 — Corrigir o motor de estoque e suas garantias no Supabase

**Implementar em partes revisáveis:**

**A. Quantidades e custos**

- Transportar o custo da origem para o destino nas transferências e calcular corretamente o custo médio do destino.
- Registrar o custo das saídas e definir o tratamento de estornos/devoluções; o estorno simples de uma entrada deve devolver a situação anterior dentro do arredondamento definido.
- Proteger reservas em saídas manuais, transferências e ajustes. O atendimento da própria venda deve consumir sua reserva na mesma transação.
- Permitir recuperação de operações históricas com produto desativado, mantendo a validação de vínculo e empresa.
- Padronizar precisão das quantidades/custos e validar valores finitos, limites e arredondamento.

**B. Repetição, permissões e datas**

- Exigir e persistir a identidade das operações que alteram estoque, inclusive inventários.
- Repetição com o mesmo conteúdo retorna o mesmo resultado; conteúdo diferente com a mesma chave é recusado.
- Alinhar permissões da interface, API e banco para movimentar e ajustar.
- Usar uma data operacional coerente entre documento, movimento, fechamento e relatório. Definir o tratamento de lançamentos retroativos antes de permiti-los como se fossem movimentos atuais.
- Ordenar os bloqueios de produto/local nas operações compostas para reduzir conflitos entre transferências opostas.

**C. Integridade e experiência**

- Conferir saldo físico, movimentos e reservas ao concluir a transação, com regras que não rejeitem estados intermediários legítimos.
- Validar que reservas e itens correspondem ao documento correto da mesma empresa.
- Bloquear ciclos de kits e alinhar cadastro e expansão da composição; definir explicitamente o suporte a kits aninhados.
- Integrar conversões à unidade base dos movimentos, com quantidade e custo correspondentes.
- Respeitar as restrições de uso dos locais de estoque.
- Acrescentar motivo e revisão de diferenças nos ajustes/inventários; permitir contagem de vários itens conforme a estrutura existente.
- Corrigir giro, reposição e a paginação vazia do estoque.

**Banco:** usar migrações específicas sobre as tabelas existentes. A idempotência de inventários pode exigir uma coluna/chave e índice adicionais. Validadores e políticas precisam preservar RLS, histórico e isolamento; não há necessidade identificada de outro schema ou de reconstrução das tabelas.

**Concluída quando:** os nove cenários diagnosticados têm o comportamento correto; transferências conservam quantidade e valor; reservas não são consumidas por outras operações; repetição não duplica efeitos; datas, permissões e relatórios conferem. A etapa de validação final ainda deve provar concorrência entre conexões reais.

### Etapa 3 — Automações, contratos e manutenção

**Implementar:**

- Prazo e recuperação de execuções abandonadas em `processando`, com retomada idempotente e registro de tentativas.
- Seleção de empresas ativas e tratamento de falha por empresa/rotina.
- Monitoramento das falhas retornadas pelo cron e alertas úteis.
- Agendamento da manutenção do plugin, incluindo expiração e retenção de propostas/auditoria.
- Calendário de contratos baseado no dia de referência escolhido, com regra explícita de fim de mês.
- Recuperação de competências atrasadas com limite por lote e tratamento de falhas por contrato.
- Testes de geração repetida, pausa, retomada, vigência e mudanças contratuais.

**Concluída quando:** interromper uma execução não impede retomá-la; execuções repetidas não duplicam documentos; contratos iniciados no fim do mês e atrasados seguem a regra definida; falhas são visíveis e recuperáveis.

### Etapa 4 — Interface do ERP e CRUD do plugin

**Implementar:**

- Recarregar indicadores junto com a lista depois de salvar, editar, desativar ou atualizar.
- Representar falha do resumo como falha, sem apresentar valores estáticos como dados atuais.
- Preservar o total na paginação vazia e corrigir respostas antigas que sobrescrevem buscas recentes.
- Substituir preenchimento de JSON por seleção de nomes e linhas visuais de itens/parcelas no formulário do plugin.
- Preencher os dados atuais ao editar e mostrar comparação antes/depois na revisão.
- Preservar campos omitidos ou deixar explícito que serão removidos; exigir ação clara para limpar dados.
- Melhorar mensagens de validação, conflito, proposta expirada e resposta incerta, com recuperação compreensível.
- Validar teclado, telas pequenas e acessibilidade da revisão e formulários.

**Concluída quando:** operações comuns podem ser preenchidas sem JSON ou IDs manuais; o usuário entende todas as alterações antes de aprovar; listas, indicadores e estados são atualizados corretamente. A interação no ChatGPT real permanece na etapa futura de integração solicitada pelo usuário.

### Etapa 5 — Financeiro, relatórios e cobrança

**Implementar:**

- Reconciliar os relatórios existentes com títulos, parcelas, pagamentos, créditos, renegociações, rateios e estornos.
- Explicitar período e critério de cada indicador; separar posição atual, caixa realizado, previsão e inadimplência.
- Consolidar as visões gerenciais necessárias com cálculos testados, aproveitando os repositórios atuais.
- Validar importação bancária, conciliação, repetição e recuperação de falhas com exemplos representativos.
- Preparar e concluir o fluxo de cobrança externa: emissão, retorno, cancelamento, pagamento parcial, deduplicação e reprocessamento.

**Dependência para cobrança externa:** escolher o provedor/banco e obter credenciais de ambiente de testes. Esse trabalho é separado da emissão fiscal e pode avançar com OAuth do ChatGPT adiado. A conciliação e os relatórios existentes podem ser corrigidos antes da escolha do provedor.

**Concluída quando:** valores dos relatórios conferem com cálculos independentes e estornos aparecem no período correto; importações repetidas não duplicam efeitos; após configurar o provedor, retornos repetidos de cobrança geram uma única baixa, com falhas recuperáveis.

### Etapa 6 — Anexos, backup e operação

**Implementar:**

- Configurar e validar Storage para anexos, autorização por empresa e expiração de links.
- Definir e verificar o procedimento de backup e restauração em ambiente separado.
- Monitorar erros, tempos de resposta, tarefas interrompidas e crescimento das tabelas operacionais.
- Conferir segredos e agenda de execução no ambiente publicado.
- Testar limites de banco/tempo de resposta com volume representativo e medir consultas antes de criar índices adicionais.

**Concluída quando:** anexos têm acesso autorizado comprovado, restauração foi demonstrada em outro ambiente, falhas geram alertas acionáveis e consultas importantes atendem aos limites definidos.

### Etapa 7 — Organização do código e pacote

**Implementar:**

- Dividir os repositórios e componentes maiores por responsabilidade, mantendo as transações compostas e as interfaces públicas.
- Usar as pastas atuais dos produtos; acrescentar arquivos específicos para regras, testes e migrações.
- Atualizar documentação, versão e pacote após as mudanças.
- Completar metadados e materiais de distribuição que já possam ser preparados.
- Manter uma matriz de capacidades: implementado, testado localmente, validado no banco real e dependente de integração externa.

**Concluída quando:** código reorganizado conserva o comportamento; documentação e pacote representam a mesma versão; credenciais continuam fora do pacote; os limites de validação são explícitos.

### Etapa 8 — Validação final do conjunto

**Executar em ambiente exclusivo de testes:**

- Duas conexões PostgreSQL reais para venda/reserva concorrente, saídas, transferência em sentidos opostos, inventário durante movimento, pagamento/estorno, fechamento e aprovação repetida.
- Perfis separados: consulta, vendas, financeiro, movimentação e ajuste de estoque; empresas/vínculos suspensos e tentativas de acesso entre empresas.
- Fluxos autenticados do ERP: cadastrar, editar, confirmar, atender, cancelar, pagar, receber, estornar, contar e transferir.
- CRUD do plugin e leituras MCP com fixtures representativas, incluindo orçamento/rascunho existentes e os novos cenários de estoque.
- Build completo atual, análise de código e testes de protocolo, formulários, cards, banco e pacote.
- Falha no meio da operação, repetição e recuperação, comprovando que não ficam efeitos parciais.

**Concluída quando:** os cenários essenciais têm comprovantes da versão exata, sem falhas de integridade, isolamento ou duplicação; pendências externas ficam identificadas. Aprovação de fiscal e OAuth/ChatGPT real exige as etapas futuras já separadas do escopo atual.

## 3. Ordem e dependências

1. Segurança e testes de base.
2. Motor de estoque e garantias no banco.
3. Automações e contratos.
4. Interface e revisão das operações.
5. Financeiro e relatórios; cobrança externa após definir provedor.
6. Anexos, backup e monitoramento.
7. Organização e pacote.
8. Validação final integrada.

Os testes específicos acompanham cada alteração. A última etapa demonstra as propriedades que os testes locais não conseguem provar, especialmente concorrência e fluxo autenticado completo.

## Comprovantes desta revisão

- Estrutura Supabase: `.cache/erp-audit/stock-catalog-20261004.json`.
- Conferência dos dados atuais, somente leitura: `.cache/erp-audit/stock-data-20261004.json`.
- Nove reproduções locais: `.cache/erp-audit/stock-local-20261004.json`.
- Diagnóstico local: `.cache/erp-audit/stock-local-review.cjs`.
- Avaliação anterior: [Avaliação do plugin e ERP](avaliacao-plugin-erp-20261004.md).
