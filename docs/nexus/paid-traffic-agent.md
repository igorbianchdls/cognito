# Fluxo do Agente Paid Traffic (Supabase + UI)

Este documento descreve como o agente **`paidTrafficAgent`** funciona do ponto de vista de dados, ferramentas de análise e componentes de interface. O objetivo é orientar quem precisa manter ou evoluir o fluxo de tráfego pago dentro do Nexus.

---

## 1. Visão Geral

1. O usuário seleciona o agente *Paid Traffic* na interface do Nexus (`src/app/nexus/page.tsx`), que chama a rota API `/api/claudeAgents/paid-traffic`.
2. A rota `route.ts` instancia o pipeline de mensagens usando o modelo Claude, expõe as ferramentas especializadas em tráfego pago e injeta as instruções de análise.
3. Quando a IA precisa de dados ou cálculos, ela aciona uma das tools definidas em `src/tools/paidTrafficTools.ts`. Essas tools executam consultas no Supabase (schema `trafego_pago`) e retornam JSON estruturado.
4. O resultado de cada tool é interceptado por `RespostaDaIA` (`src/components/nexus/RespostaDaIA.tsx`) e renderizado em componentes visuais específicos (cards, tabelas, rankings) localizados em `src/components/tools/paid-traffic`.

---

## 2. Supabase e Estrutura de Dados

Os datasets do schema `trafego_pago` são documentados em `src/data/supabaseDatasets.ts` e ficam disponíveis na área `/tables`. Eles formam a base dos insights do agente:

- `contas_ads`: Contas conectadas (Google, Meta, TikTok, LinkedIn) com metadados de integração.
- `campanhas`: Campaign settings (objetivo, orçamento, status, início/fim).
- `grupos_de_anuncios`: Estrutura de ad sets com público-alvo e orçamento diário.
- `anuncios_criacao`: Pipeline criativo (hook, copy, status de aprovação).
- `anuncios_colaboradores`: Histórico de colaboração e comentários por criativo.
- `anuncios_publicados`: Mapeamento dos criativos aprovados para as plataformas.
- `metricas_anuncios`: Métricas diárias completas (gasto, CTR, conversões, ROAS, engajamento).
- `resumos_campanhas`: Consolidação de resultados por campanha.

Essas tabelas são consumidas diretamente pelas tools via cliente Supabase inicializado com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3. Tools Disponíveis

### 3.1 `getPaidTrafficData`
- **Entrada**: tabela alvo, limite de registros, filtros (plataforma, status, objetivo, datas, ROAS mínimo etc.).
- **Processamento**: consulta genérica no Supabase usando o schema `trafego_pago`, aplica filtros por coluna e ordena usando a coluna mais relevante para cada tabela.
- **Uso**: fornece dados crus para a IA e alimenta a tabela genérica `PaidTrafficDataTable`.

### 3.2 `analyzeCampaignROAS`
- Agrupa as métricas de `metricas_anuncios` por `campanha_id`.
- Calcula gasto total, receita, conversões, CTR e ROAS; classifica o desempenho (Excelente/Bom/Regular/Ruim).
- Resultado renderizado por `CampaignROASResult`.

### 3.3 `compareAdsPlatforms`
- Soma KPIs por plataforma (Meta, Google, TikTok, LinkedIn).
- Calcula ROAS, CTR, taxa de conversão e classifica a eficiência de cada canal.
- UI: `AdsPlatformsResult` com cards de melhor/pior performance.

### 3.4 `analyzeCreativePerformance`
- Analisa a distribuição de status em `anuncios_criacao`.
- Retorna total de criativos, taxa de aprovação e contagens por status.
- UI: `CreativePerformanceResult`.

### 3.5 `identifyTopAds`
- Filtra métricas com pelo menos uma conversão.
- Agrupa por anúncio (campos `anuncio_id`, `plataforma`) e ranqueia por ROAS.
- UI: `TopAdsResult` com medalhas e destaques para top performers.

### 3.6 `analyzeSpendingTrends`
- Consolida `gasto` e `receita` por dia.
- Calcula média, máximos/mínimos e tendência comparando primeiras e últimas semanas.
- UI: `SpendingTrendsResult`.

### 3.7 `calculateCostMetrics`
- Resume CPM, CPC, CPA e CTR para o período.
- Classifica eficiência com base em benchmarks e retorna totais agregados.
- UI: `CostMetricsResult`.

### 3.8 `forecastAdPerformance`
- Usa médias históricas para estimar gasto, receita, conversões e ROAS futuros.
- Permite configurar janela histórica (`lookback_days`) e horizonte de previsão (`forecast_days`).
- UI: `AdPerformanceForecastResult`.

---

## 4. Renderização na Interface

`src/components/nexus/RespostaDaIA.tsx` registra handlers para cada `tool-*`. Quando uma tool retorna dados:

1. O componente `Tool` mostra o input enviado e o estado (loading, erro, sucesso).
2. Em caso de sucesso, o tipo de output é cast para o tipo específico definido no arquivo (ex.: `AnalyzeCampaignROASToolOutput`) e o resultado é entregue ao componente de UI correspondente na pasta `src/components/tools/paid-traffic`.
3. Os componentes utilizam os elementos visuais padronizados (`Card`, `Badge`, etc.) para criar painéis, rankings e insights textuais.

Para dados tabulares, `PaidTrafficDataTable` adapta as colunas dinamicamente conforme a tabela solicitada, aplicando formatações (moeda, percentuais, badges de status) e ordenação por meio de TanStack Table.

---

## 5. Fluxo de Execução Resumido

1. **Seleção do agente**: o estado global `currentAgent` passa a ser `paidTrafficAgent`, e o hook `useChat` passa a usar `/api/claudeAgents/paid-traffic`.
2. **Prompt do usuário**: a mensagem é enviada à API do agente.
3. **Claude + Tools**: o modelo avalia a instrução. Quando precisa de dados, chama `getPaidTrafficData` ou uma das tools analíticas.
4. **Consulta Supabase**: a tool executa a query e devolve JSON estruturado.
5. **Resposta estruturada**: o modelo usa o output das tools para elaborar a resposta final e/ou acionar renderizações personalizadas.
6. **UI no Nexus**: `RespostaDaIA` intercepta cada `tool-call`, exibe o input, o output e renderiza componentes dedicados para visualização.

---

## 6. Boas Práticas e Extensões

- **Novas análises**: adicione a lógica em `src/tools/paidTrafficTools.ts`, exponha a nova tool em `route.ts` e crie um componente em `src/components/tools/paid-traffic` com o formato desejado.
- **Novas tabelas**: mapeie o dataset no `/tables` ajustando `src/data/supabaseDatasets.ts` e atualize `PaidTrafficDataTable` caso seja preciso personalizar colunas.
- **Observabilidade**: os logs na rota (`💰 PAID TRAFFIC AGENT`) ajudam a rastrear chamadas e diagnosticar erros de Supabase.
- **Variáveis de ambiente**: garanta que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estejam configuradas no runtime do Next.js para evitar falhas de conexão.

---

## 7. Referências Rápidas

- **API do agente**: `src/app/api/claudeAgents/paid-traffic/route.ts`
- **Tools**: `src/tools/paidTrafficTools.ts`
- **Componentes de UI**: `src/components/tools/paid-traffic/*`
- **Tabela genérica**: `src/components/tools/PaidTrafficDataTable.tsx`
- **Catalogo /tables**: `src/data/supabaseDatasets.ts`
- **Integrador do chat**: `src/app/nexus/page.tsx`

Este mapa cobre todo o pipeline do agente Paid Traffic, desde a seleção na UI até a entrega de dashboards e insights específicos de tráfego pago.

---

## 8. Diagrama de Fluxo (Visão Linear)

```
[Usuário no Nexus]
        |
        v
[Seleciona paidTrafficAgent]
        |
        v
/api/claudeAgents/paid-traffic
        |
        v
[Claude + Prompt + Tools]
        |
        +--> getPaidTrafficData ┐
        |                        |
        +--> analyzeCampaignROAS |
        +--> compareAdsPlatforms |---> Supabase (schema trafego_pago)
        +--> ... outras tools   |
                                ┘
        |
        v
[Outputs estruturados JSON]
        |
        v
[RespostaDaIA mapeia tool-*]
        |
        v
[Componentes UI em src/components/tools/paid-traffic]
        |
        v
[Dashboards e insights para o usuário]
```

---

## 9. Exemplos de Chamadas de Tools

> Exemplos com payloads fictícios apenas para demonstrar formato de entrada e saída.

### 9.1 `getPaidTrafficData`

**Entrada enviada pela IA:**

```json
{
  "table": "metricas_anuncios",
  "limit": 10,
  "plataforma": "Meta",
  "data_de": "2024-06-01",
  "data_ate": "2024-06-30",
  "roas_minimo": 1.5
}
```

**Resposta da tool:**

```json
{
  "success": true,
  "count": 10,
  "table": "metricas_anuncios",
  "message": "✅ 10 registros encontrados em metricas_anuncios",
  "data": [
    {
      "id": "9876",
      "anuncio_publicado_id": "fb-123",
      "conta_ads_id": "meta-ac-01",
      "data": "2024-06-30",
      "plataforma": "Meta",
      "impressao": 15432,
      "cliques": 312,
      "ctr": 0.0202,
      "cpc": 1.85,
      "conversao": 21,
      "gasto": 577.2,
      "receita": 1490.0,
      "cpa": 27.48,
      "roas": 2.58
    }
  ]
}
```

### 9.2 `analyzeCampaignROAS`

**Entrada enviada pela IA:**

```json
{
  "date_range_days": 14,
  "plataforma": "Google"
}
```

**Resposta da tool:**

```json
{
  "success": true,
  "message": "Análise de 4 campanhas",
  "periodo_dias": 14,
  "plataforma": "Google",
  "total_campanhas": 4,
  "melhor_campanha": "google-cpc-conversao-01",
  "campanhas": [
    {
      "campanha_id": "google-cpc-conversao-01",
      "gasto": "842.50",
      "receita": "3120.00",
      "conversoes": 58,
      "roas": "3.70",
      "custo_por_conversao": "14.53",
      "ctr": "4.21%",
      "classificacao": "Excelente"
    },
    {
      "campanha_id": "google-display-remarketing",
      "gasto": "420.00",
      "receita": "620.00",
      "conversoes": 12,
      "roas": "1.48",
      "custo_por_conversao": "35.00",
      "ctr": "1.02%",
      "classificacao": "Regular"
    }
  ]
}
```

Esses formatos são usados pela camada de visualização para montar cards, rankings e tabelas sem duplicar lógica no frontend.
