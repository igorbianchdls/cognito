# Financeiro — fechamento da rodada de 14/10/2026

Foram avaliados os 14 grupos do roteiro: **10 aprovados, 2 aprovados com ressalvas, 1 parcial e 1 impedido por lacuna funcional**. Isso não representa aprovação integral de todos os fluxos do ERP.

A correção do reenvio da criação manual de contas a pagar foi publicada e retestada na API: duas chamadas simultâneas com a mesma chave retornam o mesmo título; conteúdo divergente retorna 409.

## Resultados

| Grupo | Resultado | Evidência resumida |
|---|---|---|
| F01 | aprovado | Reenvio simultâneo com mesma chave retorna o mesmo título; payload divergente retorna 409. Correção publicada. |
| F02 | aprovado | Cadastro UI100 em2parcelas50; outubro14/10 e novembro14/11; baixa20 e estorno; saldo50 restaurado. |
| F03 | aprovado | UI recebimento20/100 e estorno; crédito20 reduz saldo80 sem dinheiro adicional; reversão e devolução do adiantamento. |
| F04 | aprovado_com_ressalvas | OFX UI1transação20; conciliação manual e desfazimento persistidos; painéis não atualizam juntos, seletor ambíguo. |
| F05 | bloqueado_por_lacuna_funcional | Tela oferece criação recorrente, sem gestão para editar/encerrar. API existente; backend de calendário/pausa validado separadamente. |
| F06 | aprovado | UI salva cartão3%+0.30 D+2; recebimento100 gera taxa3.30 e repasse previsto96.70 em16/10. Estorno cancela repasse; não houve liquidação bancária externa. |
| F07 | aprovado | Tools de leitura de títulos/relatórios executadas no runtime MCP e SDKHTTP do teste; não valida OAuth em ChatGPT real. |
| F08 | aprovado | Prévia/confirmação, previsão, efetivação, baixa20 e estorno pelas tools pagar/receber; rollback final. OAuth externo fora do ensaio. |
| F09 | parcial | RLS, identidade sem vínculo, capacidades limitadas e escopo somente leitura passam. Falta login visual com usuários reais consulta/operador. Nenhum vínculo/perfil foi alterado. |
| F10 | aprovado | Aplicações simultâneas30 disputando adiantamento50: somente uma aceita; reenvio simultâneo de reversão retorna mesma reversão; caixa final0. |
| F11 | aprovado_com_ressalvas | Importação concorrente não duplica transações; duas regras concorrentes geram1título/1baixa, mas segundo trabalhador reporta erro indevido de chave. |
| F12 | aprovado | Dois processadores reais concorrentes geram exatamente janeiro31, fevereiro28, março31; sem duplicação. |
| F13 | aprovado | Saldos atuais das contas reconciliados com dados brutos; painéis26checagens e105detalhamentos;46conferências independentes; DRE caixa/competência de01a14/10. Não certifica cada período histórico possível. |
| F14 | aprovado | Mudar taxa/banco preserva repasse anterior96.70/banco21; novo89.70/banco22, tudo rollback. |

## Plano de melhorias

### FIN-FINAL-01 — P2 — Concorrência de regras automáticas retorna falso erro

financeiro-final-processadores.json: uma execução lança1, outra falha Chave de operacao ja utilizada;1título/1pagamento apenas.

**Ajuste:** Bloquear/reler a transação antes de lançar e tratar processamento concorrente já concluído como ignorado idempotente. Evitar suprimir conflitos reais de payload.

**Aceite:** Dois trabalhadores:1lançamento,0duplicações,0falsasfalhas; conflito de conteúdo continua rejeitado.

### FIN-FINAL-02 — P2 — Gestão de recorrências não disponível na interface

PayablesWorkspacePage cria recorrência; não consulta /recorrencias nem oferece edição/pausa/encerramento.

**Ajuste:** Listar recorrências e ligar edição, pausa e encerramento às APIs GET/PATCH já existentes, com explicação sobre próximas competências e preservação do histórico.

**Aceite:** Editar somente ocorrências futuras; encerrar impede novas gerações; títulos anteriores e trilha preservados.

### FIN-FINAL-03 — P2 — Painéis da conciliação ficam com estados diferentes

Conciliação manual muda linha para conciliada mas histórico recente só aparece após recarregar. Desfazer atualiza histórico/sugestão, enquanto lista principal conserva estado anterior.

**Ajuste:** Invalidar e recarregar lista, sugestões, histórico e saldos após conciliar/desfazer/ignorar, preservando conta e filtros.

**Aceite:** Todas as regiões mostram o mesmo estado sem recarregar a página.

### FIN-FINAL-04 — P2 — Seletor de baixas pouco identificável

Opções mostradas como Recebimento - data - valor; sem cliente/documento/conta, com opções visualmente iguais.

**Ajuste:** Exibir documento, contraparte, conta, valor pt-BR e referência; filtrar por elegibilidade, banco e direção; revisar opções de valor zero.

**Aceite:** Identificação inequívoca da baixa e nenhuma associação inválida ou ambígua.

### FIN-FINAL-05 — P3 — Datas técnicas e valor inicial maior que crédito disponível

Crédito20 mostra data2026-10-14T00:00:00.000Z e formulário sugere100, saldo do título.

**Ajuste:** Formatar datas pt-BR e sugerir mínimo entre saldo da parcela e crédito disponível, mantendo validação no servidor.

**Aceite:** Crédito20 em título100 inicia com20 e data14/10/2026.

## Limites e pendências de validação

- Perfis restritos: regras do servidor e RLS verificadas, mas falta sessão visual com usuários de consulta e operador. Não foram criados vínculos nem ampliadas permissões.
- MCP: executado o runtime real de tools, prévia e confirmação, com banco real em rollback e ensaio HTTP do SDK. Não foi realizado login OAuth e conversa em ChatGPT/Claude externos.
- Cartão: configuração visual, recebimento, taxa e repasse previsto validados; sem liquidação externa.
- Reconciliação: saldos atuais usam histórico dos movimentos; relatórios de resultado comparados no período 01–14/10/2026. Não certifica todos os meses históricos.
- Recorrências: calendário/processamento/concorrência do servidor passam; editar/encerrar pela tela depende de implementação.
- Nenhum novo ajuste da lista acima foi implementado nesta rodada; são achados para a próxima implementação.

## Limpeza

Venda1094 e contas a pagar653/654 canceladas. Pagamentos estornados; adiantamento11 devolvido integralmente em12; aplicação revertida. Repasse29 cancelado, transação34 ignorada, método34 e conta32 inativados. Efeito líquido de recebimentos e da maquininha: R$0,00. Histórico mantido. Conferência detalhada em `financeiro-ui-final-limpeza.json`.

## Evidências

Matriz: `financeiro-roteiro-restante.json`. Interface: `financeiro-ui-final.json`. MCP: `financeiro-mcp-final-evidencia.json`. Reconciliação: `financeiro-reconciliacao-final-evidencia.json`. Plano estruturado: `financeiro-plano-melhorias-final.json`. Capturas em `output/audit-20261014`.
