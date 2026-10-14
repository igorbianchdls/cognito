# Plano de auditoria funcional e conferência de valores — Otto

Data: 13/10/2026. Site: https://cognito-seven.vercel.app/.

Estado: planejamento. Nenhum cadastro ou lançamento foi criado nesta etapa.

## Objetivo e método

Testar o site como usuário: criar, editar, pesquisar, confirmar, pagar, receber, cancelar e conferir os efeitos nos módulos relacionados. Para cada operação, registrar o estado anterior, os dados informados, o resultado esperado calculado independentemente, o resultado obtido, os identificadores dos registros e uma evidência.

Os fluxos principais serão executados pela interface real publicada. Consultas da API e, quando necessário e disponível, do banco em modo somente leitura servirão para conferir persistência, vínculos e diferenças. Uma aprovação da API não substituirá um formulário que falha no navegador. Testes locais não substituirão testes no site.

Os testes automatizados existentes serão revisados e aproveitados como apoio, especialmente CRUD HTTP, estoque, integridade, DRE e reconciliação dos dashboards. Evidências históricas serão tratadas como histórico; o resultado desta auditoria será obtido na versão efetivamente testada.

## 1. Preparação e isolamento

- Identificar a versão publicada e a empresa selecionada, conferir acesso e permissões e registrar o período, fuso e filtros utilizados. Datas de negócio seguirão o fuso da empresa; conferir a apresentação no contexto America/Fortaleza.
- Usar uma empresa dedicada a testes no próprio Otto, com dados fictícios e prefixo único `QA-OTTO-20261013-...`. Verificar primeiro se é possível criá-la/selecioná-la com o acesso disponível. Se faltar esse acesso, registrar a preparação como bloqueada e definir a empresa de teste antes de gravar operações.
- Conferir o vínculo do ambiente ao banco: uma publicação de prévia não garante banco separado. O isolamento é pela empresa de teste ou por um ambiente com banco comprovadamente próprio.
- Capturar saldos iniciais, contas abertas, posição de estoque e relatórios. Preparar uma memória de cálculo independente em centavos e quantidades, incluindo os movimentos previstos de cada cenário.
- As operações de pagamento/recebimento serão registros fictícios no ERP. Integrações fiscais, bancárias, mensagens e rotinas externas usarão simulação/homologação quando houver; cenários sem esse ambiente serão registrados como não testados, sem executar efeitos externos reais.
- Preservar registros e históricos de teste para reprodução. Não excluir registros reais nem apagar históricos ao encerrar.

## 2. Cadastros fundamentais

| Área | Operações | Conferência |
| --- | --- | --- |
| Contas contábeis | Criar grupo sintético e conta analítica; editar; pesquisar; vincular; tentar desativar | Hierarquia, classificação, natureza, código único por empresa, histórico e impedimento de vínculo incompatível/inativo |
| Categorias financeiras | Criar receita, despesa, aquisição de estoque fora da DRE e subcategoria; editar e desativar | Tipo, grupo da DRE, conta contábil, somas por categoria e conservação dos vínculos históricos |
| Contas financeiras | Criar banco/caixa com saldo inicial conhecido e vínculo contábil | Saldo inicial, saldo corrente, situação, seleção nas baixas e tratamento de cadastro utilizado |
| Clientes e fornecedores | Criar, editar, buscar, filtrar e desativar | Campos obrigatórios, validação dos documentos, papéis, persistência e associação às operações |
| Produtos e serviços | Criar com preço/custo conhecidos; selecionar categoria e controle de estoque | Unidade, precisão, preço, serviço sem estoque, disponibilidade e impossibilidade de usar cadastro incompatível |
| Auxiliares | Criar/selecionar local de estoque, vendedor e forma de pagamento | Referências, taxa/prazo quando aplicáveis, opções dos seletores e permissão de uso |

Em cada cadastro: salvar, recarregar a página, consultar o detalhe, editar, conferir histórico/versão, pesquisar e filtrar. Confirmar que o registro pertence somente à empresa escolhida. Testar duplicidade, ausência de campo obrigatório e valores inválidos conforme a regra do cadastro.

## 3. Ciclo financeiro

- Criar títulos a pagar e a receber avulsos, à vista e parcelados; conferir soma das parcelas, vencimentos e datas de competência/emissão.
- Editar antes de movimentar; verificar as restrições depois de pagamento/recebimento e a preservação do histórico.
- Fazer baixa parcial e depois integral. Conferir principal, descontos, juros, multa, valor líquido, saldo restante e situação da parcela.
- Repetir envio/recarregar após gravar: a mesma operação não pode duplicar título, baixa ou efeito no saldo.
- Estornar baixa no mesmo mês e em outro mês. Conferir datas, recomposição do saldo em aberto e efeito bancário na data do estorno.
- Testar vencidos, vencendo hoje, previstos e efetivos, cancelamento e tentativas de pagamento superior ao saldo.
- Testar rateio entre categorias, adiantamento/crédito, uso desse crédito e renegociação quando disponíveis. A aplicação de crédito não deve registrar novamente o caixa já movimentado.
- Transferir entre duas contas de teste: saldo diminui na origem e aumenta no destino, sem criar receita/despesa nem alterar a soma das contas da empresa.
- Conferir conciliação com extrato fictício: importar quando suportado, conciliar, desfazer e tentar conciliar duas vezes. Verificar que conciliar não duplica uma baixa existente.

## 4. Compras, vendas e estoque integrados

### Compras

Criar cotação/rascunho e compra efetiva; testar descontos, frete, itens, unidades e parcelas. Confirmar e receber parcialmente e integralmente. Conferir títulos a pagar, estoque físico, custo médio, recebimento pendente e histórico em cada etapa. Testar cancelamento antes/depois de recebimento, recebimento superior ao pendente e repetição da confirmação/recebimento.

### Vendas

Criar orçamento e converter em pedido; criar venda diretamente; confirmar e concluir as etapas que movimentam o estoque. Conferir itens, total, desconto, preço, parcelas a receber, reservas, saída física, CMV e margem. Testar desconto acima do permitido, estoque insuficiente, serviço sem movimentação de estoque, cancelamento e confirmação repetida.

### Estoque

Conferir físico, reservado e disponível separadamente; disponível deve respeitar a regra físico menos reservas. Conferir saldo por local, entradas/saídas, custo médio e valor estocado. Testar transferência entre locais, inventário com diferença e segunda aplicação da mesma contagem. Incluir kits e conversão de unidades em cenários próprios, se utilizáveis pela interface. Transferência interna não deve alterar a quantidade total da empresa.

### Devoluções

Testar devolução parcial e total, retorno de estoque, crédito/abatimento/reembolso conforme o fluxo disponível e impacto em receita, caixa e títulos. Não confundir devolução de mercadoria com estorno de pagamento. Verificar limites de quantidade/valor e repetição da operação.

## 5. Primeiro cenário com valores previamente conhecidos

Executar em empresa/período isolados, sem impostos, frete, descontos, juros, créditos ou outros movimentos. Usar categorias corretamente classificadas; aquisição para revenda marcada fora da DRE. Confirmar compra/venda e concluir o recebimento e a saída física dos produtos.

1. Abrir conta financeira de teste com R$ 5.000,00 de saldo inicial.
2. Comprar e receber 10 unidades a R$ 100,00: compra de R$ 1.000,00. Registrar pagamento parcial de R$ 400,00.
3. Vender e entregar 4 unidades a R$ 180,00: venda de R$ 720,00. Registrar recebimento parcial de R$ 300,00.
4. Criar despesa operacional de R$ 80,00 e pagá-la integralmente.

| Resultado ao final desse cenário | Valor esperado |
| --- | ---: |
| Compra total | R$ 1.000,00 |
| Venda total | R$ 720,00 |
| Contas a pagar em aberto | R$ 600,00 |
| Contas a receber em aberto | R$ 420,00 |
| Saldo da conta: 5.000 − 400 + 300 − 80 | R$ 4.820,00 |
| Entradas realizadas | R$ 300,00 |
| Saídas realizadas | R$ 480,00 |
| Resultado dos movimentos de caixa: 300 − 480 | −R$ 180,00 |
| Estoque físico final | 6 unidades |
| Custo médio e valor do estoque | R$ 100,00/unidade e R$ 600,00 |
| CMV das 4 unidades entregues | R$ 400,00 |
| Margem bruta da venda | R$ 320,00; 44,44% da receita |
| Resultado gerencial por competência: 720 − 400 − 80 | R$ 240,00 |
| DRE por caixa: 300 − 80, excluindo a aquisição fora da DRE | R$ 220,00 |

A diferença entre −R$ 180,00 no movimento de caixa e R$ 220,00 na DRE por caixa corresponde aos R$ 400,00 pagos pela aquisição classificada fora da DRE. O saldo bancário de R$ 4.820,00 inclui os R$ 5.000,00 iniciais. Essas diferenças são esperadas; precisam aparecer explicadas e não ser tratadas como divergências automáticas.

Depois, completar os pagamentos e recebimentos, conferir a quitação, estornar movimentos e adicionar descontos/frete/parcelamento em cenários separados. Recalcular a expectativa antes de cada operação.

## 6. Reconciliação de números e relatórios

Para cada etapa, comparar a memória de cálculo com listagem, detalhe, resumo do módulo, dashboard, relatório e exportação quando disponíveis. Usar a mesma empresa, período, data de referência, situação e regime.

- Total do documento = soma dos itens e ajustes conforme as regras de arredondamento; parcelas devem conservar o total.
- Saldo em aberto = obrigação ajustada menos baixas, créditos e abatimentos válidos, com os estornos tratados corretamente.
- Saldo financeiro = saldo inicial mais entradas menos saídas e efeitos líquidos de transferências/estornos.
- Estoque e seu valor devem reconciliar com movimentos, reservas, custo médio e CMV; compras para estoque não podem entrar novamente como despesa integral na DRE por competência.
- Conferir os sete dashboards: visão geral, financeiro, vendas, compras, estoque, resultados e serviços/contratos. Conferir também gráficos, comparações, quantidade de registros, ticket médio e links de detalhamento.
- Conferir DRE por competência e caixa, fluxo realizado/previsto, contas em atraso, margem, vendas, compras e orçado × realizado. Checar paginação: total geral não pode depender apenas dos registros da página visível.
- Testar mudança rápida de período/regime/filtros; respostas antigas não podem substituir dados novos. Comparar troca de mês, vencimento hoje, período vazio e dia na fronteira do fuso.
- Registrar valores brutos e os arredondados exibidos. Totais monetários que deveriam ser idênticos devem coincidir em centavos; quantidades e percentuais seguirão a precisão definida para cada campo. Nenhuma diferença será descartada apenas por ser pequena.

Contas contábeis no Otto representam atualmente o cadastro e os vínculos. O código não implementa escrituração completa por partidas dobradas; Diário, Razão e fechamento contábil legal não serão considerados aprovados por esta auditoria. A DRE gerencial usa categorias, títulos/baixas e movimentos de estoque.

## 7. Demais módulos e casos de recusa

- Ordens de serviço, contratos/recorrência, tabelas de preço, metas e comissões: testar um ciclo completo, alteração/cancelamento e ausência de duplicação. Conferir o vínculo com venda, título, vendedor e pagamento quando aplicável.
- Orçamento financeiro e orçado × realizado: cadastrar valor de referência e conferir variação com os movimentos de teste.
- Fechamentos: bloquear período na empresa de teste, tentar lançar/editar/estornar, reabrir e verificar histórico.
- Importação/exportação: arquivo fictício com linhas válidas, inválidas e repetidas; conferir resultado por linha, total importado e conteúdo exportado.
- PDFs e anexos: conferir valores, vínculo com documento, acesso e download. NFS-e: limitar-se ao fluxo demonstrativo/homologação disponível e verificar identificação do modo; não equiparar uma simulação à emissão fiscal real.
- Perfil de consulta: deve conseguir ler e ser impedido de criar/editar/baixar. Sem sessão: áreas privadas devem permanecer protegidas.
- Duas empresas de teste: tentar consultar/vincular registros da outra; esperar recusa e ausência de mistura de saldos.
- Duas abas: edição com versão antiga, confirmação repetida e recarregamento após falha de rede. Verificar mensagem clara e consistência após a nova consulta.

## 8. Ordem de execução e entregas

1. Preparar empresa, versão, saldos iniciais e memória de cálculo.
2. Executar primeiro cadastros, pagar/receber e o ciclo numérico de compra → estoque → venda → baixas → relatórios. Reportar imediatamente qualquer bloqueio ou valor incorreto encontrado.
3. Executar estornos, devoluções, rateios, parcelamento, transferências e casos negativos.
4. Ampliar para módulos complementares, permissões e regressões. Módulos inacessíveis/ausentes serão registrados explicitamente, sem receber aprovação presumida.
5. Entregar matriz de cobertura e relatório com: cenário, passos, esperado, obtido, diferença, empresa/período, registros, evidências, gravidade e condição de reprodução.

Estados: **aprovado**, **falhou**, **bloqueado** ou **não testado**. Tela visível sem ciclo funcional completo não basta para aprovação. Separar falha de interface, de regra, de cálculo e de integração externa.

Prioridade máxima: valores incorretos, operações duplicadas, estoque inconsistente, perda de histórico ou exposição entre empresas. Depois: fluxo impedido/formulário quebrado; por último: problemas de apresentação sem impacto nos valores.

Esta execução tem como entrega o diagnóstico. Correções de código, alterações estruturais e publicação de ajustes serão propostas com evidências e tratadas em uma etapa posterior. O relatório final também listará a cobertura que ainda falta, para não afirmar que todo o ERP foi validado com base em poucos exemplos.
