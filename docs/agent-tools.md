# Agent Tools (`crud`, `documento`)

Documentacao operacional das tools usadas pelo agente para servir como `daily driver` de um SMB owner.

## Visao geral

As 2 tools disponiveis sao:

1. `crud`
2. `documento`

Elas podem ser chamadas:

- via agente (`/api/agente-api`)
- ou diretamente nas rotas `agent-tools` (`/api/agent-tools/...`)

## Autenticacao (chamando direto `agent-tools`)

Headers esperados:

- `Authorization: Bearer <AGENT_INTERNAL_API_KEY>` (ou agent token valido)
- `x-chat-id: <chat-id>`
- `x-tenant-id: <tenant-id>`
- `Content-Type: application/json`

## Fluxo recomendado (daily driver)

Fluxo tipico comercial/operacional:

1. `crud` busca contexto (`crm`, `vendas`, `financeiro`)
2. `documento` gera proposta/fatura/OS
3. `documento` persiste o arquivo (`save_to_drive=true`)

Esse fluxo evita trafegar PDF base64 quando nao e necessario.

## Tool `crud`

### O que e

Tool canonica para operacoes ERP:

- `listar`
- `criar`
- `atualizar`
- `deletar` (somente quando fizer sentido)
- acoes de negocio (`cancelar`, `baixar`, `estornar`, `reabrir`)

### Regra importante de negocio

Recursos transacionais **nao devem ser deletados** via CRUD generico.

Exemplos:

- `vendas/pedidos`
- `compras/pedidos`
- `contas-a-pagar`
- `contas-a-receber`

Para esses recursos, use acoes de negocio como `cancelar`, `baixar`, `estornar`, `reabrir`.

### Acoes de negocio em `vendas/pedidos`

Acoes suportadas:

- `aprovar` -> status `aprovado`
- `concluir` -> status `concluido`
- `cancelar` -> status `cancelado`
- `reabrir` -> status `pendente` (quando cancelado)

Status de origem (resumo):

- `aprovar`: `pendente`
- `concluir`: `pendente`, `aprovado`
- `cancelar`: `pendente`, `aprovado`
- `reabrir`: `cancelado`

### Acoes de negocio em `compras/pedidos`

Acoes suportadas:

- `aprovar` -> status `aprovado`
- `cancelar` -> status `cancelado`
- `reabrir` -> status `em_analise` (quando cancelado)
- `marcar_recebimento_parcial` -> status `recebimento_parcial`
- `marcar_como_recebido` -> status `recebido`

Status de origem (resumo):

- `aprovar`: `rascunho`, `em_analise`
- `cancelar`: `rascunho`, `em_analise`, `aprovado`, `recebimento_parcial`
- `reabrir`: `cancelado`
- `marcar_recebimento_parcial`: `aprovado`
- `marcar_como_recebido`: `aprovado`, `recebimento_parcial`

### Recursos transacionais e tabelas reais (DB)

#### `vendas/pedidos`

- tabela: `vendas.pedidos`
- coluna de status: `status` (`varchar`, `NOT NULL`)
- `CHECK` ativo: `pedidos_status_chk`

Status permitidos:

- `pendente`
- `aprovado`
- `concluido`
- `cancelado`

#### `compras/pedidos`

- tabela real: `compras.compras`
- coluna de status: `status` (`varchar`, `NOT NULL`)
- `CHECK` ativo: `compras_status_chk`

Status permitidos:

- `rascunho`
- `em_analise`
- `aprovado`
- `recebimento_parcial`
- `recebido`
- `cancelado`

Compatibilidade na tool (normalizacao):

- `pendente` -> `em_analise`
- `concluido` -> `recebido`

#### `contas-a-pagar`

- tabela real: `financeiro.contas_pagar`
- coluna de status: `status` (`varchar`, `NOT NULL`)
- `CHECK` ativo: `contas_pagar_status_chk`
- default de status: `pendente`

Valores aceitos hoje no banco (canonicos + compat):

- Canonicos:
  - `pendente`
  - `vencido`
  - `parcial`
  - `pago`
  - `cancelado`
- Compat (legado/alias):
  - `aberto`
  - `em_aberto`
  - `em aberto`
  - `baixado`
  - `liquidado`

Normalizacao na tool:

- `aberto`, `em_aberto`, `em aberto` -> `pendente`
- `baixado`, `liquidado` -> `pago`

#### `contas-a-receber`

- tabela real: `financeiro.contas_receber`
- coluna de status: `status` (`varchar`, `NOT NULL`)
- `CHECK` ativo: `contas_receber_status_chk`
- default de status: `pendente`

Valores aceitos hoje no banco (canonicos + compat):

- Canonicos:
  - `pendente`
  - `vencido`
  - `parcial`
  - `recebido`
  - `cancelado`
- Compat (legado/alias):
  - `aberto`
  - `em_aberto`
  - `em aberto`
  - `pago`
  - `baixado`
  - `liquidado`

Normalizacao na tool:

- `aberto`, `em_aberto`, `em aberto` -> `pendente`
- `pago`, `baixado`, `liquidado` -> `recebido`

### Acoes de negocio suportadas (`contas-a-pagar` / `contas-a-receber`)

#### `baixar`

Marca a conta como quitada:

- AP: `-> pago`
- AR: `-> recebido`

Status de origem permitidos:

- `pendente`
- `vencido`
- `parcial`

#### `estornar`

Desfaz a baixa e reabre a conta:

- AP/AR: `-> pendente`

Status de origem permitido:

- AP: `pago`
- AR: `recebido`

#### `cancelar`

Cancela a transacao:

- `-> cancelado`

Status de origem permitidos:

- `pendente`
- `vencido`
- `parcial`

#### `reabrir`

Reabre uma conta cancelada/baixada:

- `-> pendente`

Status de origem permitidos:

- `cancelado`
- AP: `pago`
- AR: `recebido`

### Transicoes de status (AP/AR)

#### `contas-a-pagar`

- `pendente -> vencido | parcial | pago | cancelado`
- `vencido -> parcial | pago | cancelado`
- `parcial -> pendente | vencido | pago | cancelado`
- `pago -> pendente` (via `estornar` / `reabrir`)
- `cancelado -> pendente` (via `reabrir`)

#### `contas-a-receber`

- `pendente -> vencido | parcial | recebido | cancelado`
- `vencido -> parcial | recebido | cancelado`
- `parcial -> pendente | vencido | recebido | cancelado`
- `recebido -> pendente` (via `estornar` / `reabrir`)
- `cancelado -> pendente` (via `reabrir`)

### Campos aceitos em `contas-a-pagar` / `contas-a-receber` (tool `crud`)

#### `criar`

Campos principais aceitos pela tool:

- `fornecedor_id` (AP) / `cliente_id` (AR) - obrigatorio
- `valor` - obrigatorio (`> 0`)
- `data_vencimento` - obrigatorio
- `status` (normalizado para canonico)
- `descricao` / `observacao`
- `data_lancamento`, `data_emissao`, `data_documento`
- `categoria_id`
- `conta_financeira_id`
- `centro_custo_id` / `centro_lucro_id`
- `departamento_id`
- `filial_id`
- `unidade_negocio_id`
- `projeto_id`
- `numero_documento`
- `tipo_documento`

Mapeamentos internos importantes:

- `descricao` -> coluna `observacao`
- `valor` -> `valor_bruto` e `valor_liquido`

#### `atualizar`

Aceita atualizar os mesmos campos principais acima e valida:

- status permitido
- transicao de status permitida

#### `deletar`

`contas-a-pagar` e `contas-a-receber` retornam erro de negocio (bloqueado).

Use:

- `cancelar`
- `baixar`
- `estornar`
- `reabrir`

### Exemplo de payloads (`crud`)

#### Baixar conta a receber

```json
{
  "action": "baixar",
  "resource": "contas-a-receber",
  "data": {
    "id": 219,
    "motivo": "recebimento confirmado no banco"
  }
}
```

#### Estornar conta a pagar

```json
{
  "action": "estornar",
  "resource": "contas-a-pagar",
  "data": {
    "id": 40,
    "motivo_estorno": "pagamento duplicado"
  }
}
```

#### Cancelar pedido de compra

```json
{
  "action": "cancelar",
  "resource": "compras/pedidos",
  "data": {
    "id": 19,
    "motivo_cancelamento": "fornecedor indisponivel"
  }
}
```

## Tool `documento`

### O que e

Gera e consulta documentos operacionais:

- `proposta`
- `os`
- `fatura`
- `contrato`
- `nfse`

### Acoes

- `gerar`
- `status`

### Ponto chave para uso diario

Use `save_to_drive=true` quando precisar persistir o arquivo gerado.

#### Payload enxuto (implementado)

Quando `save_to_drive=true`, por padrao a tool **nao retorna** `attachment.content` (base64 do PDF).

Para compatibilidade, pode forcar:

- `include_attachment_content=true`

### Idempotencia

`documento` suporta `idempotency_key`.

Em reexecucoes:

- reaproveita o documento
- reaproveita o arquivo persistido quando possivel (sem duplicar)

## Padrao de resposta (pratico)

As tools tendem a responder com:

- `ok`
- `result`

E dentro de `result`:

- `success`
- `message`
- `data`

Em erros de negocio, sao retornados:

- `code`
- `error`
- `result.success=false`
- detalhes como `allowed_actions`, `allowed_statuses`, `allowed_transitions`

## Boas praticas para uso via agente

1. Prefira acao de negocio em transacoes (`cancelar`, `baixar`, `estornar`, `reabrir`)
2. Evite `deletar` em `vendas`, `compras`, `contas-*`
3. Para documentos, prefira `save_to_drive=true`
4. Em retries, reutilize `idempotency_key` em `documento`
