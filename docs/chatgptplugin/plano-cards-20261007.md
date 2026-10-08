# Plano de melhoria dos cards — 07/10/2026

Objetivo: o usuário da PME **opera** o ERP pelos cards no ChatGPT, não apenas consulta. Base: revisão das capturas de `.cache/chatgptplugin-cards/` (inline, celular e tela cheia) e as diretrizes de UI da OpenAI (inline com no máximo 2 ações, sem rolagem interna nem abas; tela cheia para trabalho detalhado).

## Princípios

1. **Um card por resultado**; o desenho se adapta à **largura do card**, não ao aparelho: tabela quando largo, lista de dois níveis quando estreito (celular, janela pequena, painel lateral).
2. **Inline mostra e sugere; tela cheia trabalha.** Inline: resumo, até 5 itens e no máximo 2 ações. Tela cheia: filtros, ordenação, paginação, detalhes e ações por registro.
3. **Toda ação passa pela prévia.** Botões nunca alteram o ERP direto: pedem a ação (gerando a prévia com Confirmar/Ajustar) ou abrem a prévia já preenchida.
4. **Nada de ID para o usuário.** IDs ficam nos dados e no contexto do modelo, não nas colunas.
5. **Prioridade visual ao que pede atenção:** vencido, saldo pendente, estoque abaixo do mínimo.

## Etapa A — Cards de lista (tabulares)

### A1. Colunas por tipo de lista

| Tool / tipo | Largo (tabela) | Estreito (linha 1 / linha 2) |
| --- | --- | --- |
| `consultar_financeiro` pagar/receber | Vencimento · Descrição · Fornecedor/Cliente · **Saldo** · Situação | Descrição — **Saldo** / Fornecedor · vence dd/mm · ● situação |
| `listar_vendas` (venda/orçamento) | Número · Cliente · Data · Total · Situação | Número · Cliente — **Total** / data · ● situação |
| `listar_compras` | Número · Fornecedor · Data · Total · Situação | idem |
| `consultar_estoque` | Produto · Local · Disponível · Reservado · Físico | Produto — **Disponível** / local · reservado |
| `listar_pagamentos` | Data · Tipo · Conta · Valor líquido · Estornado | Tipo · conta — **Valor** / data · estornado |
| `buscar_cadastros` | Nome · Documento · Cidade/Contato · Situação (produtos: Nome · SKU · Preço) | Nome — (preço) / documento · cidade |

Fallback genérico atual permanece para tipos não mapeados.

### A2. Leitura

- Situação como **etiqueta colorida**: vencido (vermelho), parcial/pendente (âmbar), pago/confirmado (verde), rascunho/cancelado (neutro).
- Parcelas vencidas: linha destacada e "venceu há N dias"; a vencer em até 7 dias: "vence em N dias".
- Indicadores do resumo: em aberto, vencidas e **vencem em 7 dias** (já calculados pelo servidor).
- Subtítulo com contexto: "7 em aberto · por vencimento · empresa X", incluindo filtros recebidos da tool.
- Remover coluna ID; números alinhados à direita; valores sempre visíveis.

### A3. Tela cheia

- Filtros por tipo: situação (aberto, vencido, parcial, pago…), período (vencimento ou data do documento), busca.
- **Ordenação no servidor** (todas as páginas, não só a visível): novo parâmetro `ordenar` nas tools de lista (`vencimento`, `valor`, `data`, `nome`), com direção.
- Clique na linha abre os **detalhes** no próprio card (com "Voltar" preservando filtros e página).
- Ações por registro (ver Etapa C).

### A4. Ações inline (máximo 2)

- "Ver tudo" (tela cheia) sempre que houver mais registros.
- Uma ação contextual quando fizer sentido: contas a pagar/receber com vencidas → "Ver vencidas" (tela cheia já filtrada).

## Etapa B — Escolha entre resultados

Quando uma busca retorna de 2 a 8 cadastros (ex.: "Padaria" com 3 clientes), mostrar opções com nome, documento e cidade, cada uma com "Usar este" → mensagem à conversa com o nome e o ID. Substitui a pergunta em texto do modelo. Acima de 8, lista normal.

## Etapa C — Ações a partir dos detalhes

| Registro | Ação primária | Secundária |
| --- | --- | --- |
| Parcela em aberto | Registrar pagamento/recebimento (valor = saldo, data = hoje, conta padrão) | Ver título |
| Título financeiro | Registrar pagamento da próxima parcela | Editar título |
| Venda em rascunho | Confirmar venda | Editar |
| Venda confirmada não atendida | Atender venda | Cancelar |
| Orçamento | Converter em venda | Editar |
| Compra em rascunho / confirmada | Confirmar compra / Cancelar | — |
| Cliente / fornecedor | Nova venda / Nova compra | Editar |
| Produto | Ver estoque | Editar |

Implementação: a ação chama a **tool de escrita em modo prévia** com os dados já conhecidos (gera o card de revisão com Confirmar/Ajustar) quando todos os campos obrigatórios estão disponíveis; caso contrário envia a ação à conversa para o modelo completar. Pré-requisito no servidor: conta financeira padrão e saldo já presentes nos detalhes da parcela.

Ajustes nos detalhes: situação só como etiqueta (sem duplicar), itens na ordem Descrição · Qtd. · Valor unitário · Total, campos agrupados (dados, valores, datas), histórico recolhido em tela cheia.

## Etapa D — Prévia, risco e resultado

- **Exclusão/cancelamento/estorno:** título com o alvo ("Excluir cliente · Padaria Central"), resumo do registro afetado e consequência em linguagem simples.
- **Prévia de criação:** cabeçalho com o essencial (cliente, total, vencimento) antes da tabela de campos.
- **Resultado:** mostrar o que foi criado/alterado (número, nome, total, situação) em vez de "Registro 321", sem repetir a situação, e oferecer o **próximo passo** (criou venda → Confirmar venda; confirmou → Atender; registrou pagamento → Ver título).
- Erro com campos: manter lista, com rótulos humanos e sugestão de correção quando o servidor informar.

## Etapa E — Análise, resumo e empresas

- Meses como "ago/2026"; valores dos meses com variação em relação ao anterior.
- Fluxo de caixa: barras de entradas e saídas por mês e linha de saldo acumulado; meses com saldo negativo destacados.
- Aging: barras empilhadas por faixa de atraso; maiores devedores primeiro.
- Resumo: "A receber vencido" destacado quando maior que zero; cada indicador abre a lista correspondente em tela cheia.
- Empresas: manter; mostrar perfil em português.

## Etapa F — Estados e acabamento

- Carregamento com esqueleto (linhas fantasma) em vez de "Consultando…".
- Estado vazio com sugestão ("Nenhuma conta vencida. Ver todas em aberto?").
- Erro de rede com "Tentar novamente".
- Acessibilidade: cor nunca é a única pista (texto "Vencida" junto da cor), foco visível, rótulos nas ações.
- Altura: card inline sem rolagem interna; conteúdo extra só em tela cheia.

## Etapa G — Validação

1. Testes de navegador (`chatgptplugin:cards-smoke`): largo e estreito para cada tipo de lista; colunas por tipo; vencidos destacados; filtros/ordenação/paginação em tela cheia; clique na linha → detalhes → voltar; ações gerando prévia correta; resultado com próximo passo; contraste e foco.
2. Servidor: `ordenar` nas tools de lista com testes de ordenação entre páginas; detalhes de parcela com conta padrão.
3. **ChatGPT real** (modo desenvolvedor, desktop e celular): altura, tela cheia, tema, `ui/message`, confirmação nativa somada ao botão Confirmar, desempenho percebido.

## Ordem sugerida

| Ordem | Etapa | Por quê |
| --- | --- | --- |
| 1 | A (listas) | É o card mais usado; problema real no celular |
| 2 | C (ações nos detalhes) + clique na linha | Transforma consulta em operação |
| 3 | D (prévia e resultado) | Fecha o ciclo da operação com segurança |
| 4 | B (escolha) | Remove idas e vindas na conversa |
| 5 | E e F | Acabamento |
| 6 | G (validação no ChatGPT real) | Depende do teste de login |

## Fora deste plano

Nota fiscal, cobrança e bancos; carrossel com imagens de produto (só se houver fotos cadastradas).

## Andamento — 07/10/2026

- **A (listas): concluída.** Colunas por tipo (`ui/cards/lista.ts`), tabela/lista de duas linhas por largura, vencidas destacadas e "vence em N dias" em âmbar, subtítulo com contexto, "Ver vencidas" + "Ver tudo", filtros e ordenação no servidor (`ordenar` em `consultar_financeiro`, `listar_vendas`, `listar_compras`; whitelist em `erp/shared/readQueries.ts`), clique na linha abre detalhes com "Voltar".
- **B (escolha): concluída.** Busca de cadastros com 2 a 8 resultados mostra opções com "Usar este".
- **C (ações): concluída.** Parcela → Registrar pagamento/recebimento (prévia com saldo, hoje e conta sugerida — `conta_financeira_sugerida` nos detalhes da parcela); título → próxima parcela; venda → confirmar/atender/editar/cancelar; compra → confirmar/cancelar; cadastro → nova venda/compra, ver estoque. Ações sem todos os dados vão à conversa. Ainda não há tool para converter orçamento em venda.
- **D (prévia e resultado): concluída.** Título com o registro afetado, consequência explicada nas operações de risco, resultado com próximo passo; confirmar limpa a navegação.
- **E (análise e resumo): concluída.** Meses por extenso com variação, fluxo de caixa com entradas/saídas/saldo e alerta de saldo negativo, inadimplência em barras por faixa, indicadores do resumo abrem a lista.
- **F (acabamento): concluída.** Esqueleto de carregamento, estado vazio com "Limpar filtros", "Tentar novamente" em falhas de rede, etiquetas com texto e cor.
- **G (validação):** 11 cenários de navegador em `chatgptplugin:cards-smoke`. Falta o ChatGPT real.
- Correção junto: `CURRENT_DATE` do SQL (UTC) trocado por `ERP_TODAY_SQL` (fuso da empresa) em vencidos, "vence hoje" e resumos.
