# BigQuery Integration Documentation

## Visão Geral

Este documento descreve a integração completa do Google BigQuery no projeto, incluindo serviços, hooks e componentes implementados.

## Arquitetura

### 1. Service Layer (`src/services/bigquery.ts`)
- **Singleton service** para gerenciar conexões BigQuery
- **Detecção automática de ambiente** (desenvolvimento vs produção)
- **Cache de queries** com TTL configurável
- **Tratamento robusto de erros**

### 2. API Routes (`src/app/api/bigquery/`)
- **GET endpoint**: Listar datasets, tabelas e esquemas
- **POST endpoint**: Executar queries customizadas
- **Console logs detalhados** para debugging

### 3. Hooks (`src/hooks/useBigQuery.ts`)
- **Hooks reutilizáveis** similares ao CUBE.js
- **Gerenciamento automático de estado** (loading, error, data)
- **Type-safe** com TypeScript

### 4. UI Components
- **Tabelas HTML simples** com Tailwind CSS
- **Interface de teste** em `/bigquery-test`
- **Página demo** em `/bigquery-demo`

## Configuração

### Ambiente de Desenvolvimento
```bash
# Arquivo local de credenciais
./credentials/creatto.json
```

### Ambiente de Produção (Vercel)
```bash
# Variáveis de ambiente
GOOGLE_APPLICATION_CREDENTIALS_JSON="{...json content...}"
GOOGLE_PROJECT_ID=creatto-463117
```

## Hooks Disponíveis

### `useBigQuery<T>(endpoint, options)`
Hook genérico para fazer chamadas à API BigQuery.

```typescript
const { data, loading, error, execute } = useBigQuery('/api/bigquery', {
  method: 'POST',
  body: { action: 'execute', query: 'SELECT * FROM table' }
});
```

### `useBigQueryDatasets()`
Lista todos os datasets do projeto.

```typescript
const { data: datasets, loading, error } = useBigQueryDatasets();
// data: Array<{ id, friendlyName, description, location, creationTime }>
```

### `useBigQueryTables(datasetId)`
Lista tabelas de um dataset específico.

```typescript
const { data: tables } = useBigQueryTables('biquery_data');
// data: Array<{ datasetId, tableId, description, numRows, numBytes }>
```

### `useBigQueryTableData(dataset, table, limit?)`
Busca dados de uma tabela específica.

```typescript
const { data: tableData } = useBigQueryTableData('biquery_data', 'minha_tabela', 100);
// data: { data: Record<string, unknown>[] }
```

### `useBigQueryQuery(query, parameters?)`
Executa uma query customizada.

```typescript
const result = useBigQueryQuery(`
  SELECT * FROM \`creatto-463117.biquery_data.tabela\` 
  WHERE data > @start_date
  LIMIT 50
`, { start_date: '2024-01-01' });
```

### `useBigQueryConnection()`
Testa a conexão com BigQuery.

```typescript
const { data: status, execute: testConnection } = useBigQueryConnection();
```

## API Endpoints

### GET `/api/bigquery`

#### Listar Datasets
```bash
GET /api/bigquery?action=datasets
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "biquery_data",
      "friendlyName": "My Dataset",
      "description": "Dataset description",
      "location": "southamerica-east1",
      "creationTime": "2025-06-16T18:08:13.626Z"
    }
  ]
}
```

#### Listar Tabelas
```bash
GET /api/bigquery?action=tables&dataset=biquery_data
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "datasetId": "biquery_data",
      "tableId": "minha_tabela",
      "description": "Table description",
      "numRows": 1000,
      "numBytes": 50000
    }
  ]
}
```

#### Obter Schema
```bash
GET /api/bigquery?action=schema&dataset=biquery_data&table=minha_tabela
```

### POST `/api/bigquery`

#### Executar Query
```bash
POST /api/bigquery
Content-Type: application/json

{
  "action": "execute",
  "query": "SELECT * FROM `creatto-463117.biquery_data.tabela` LIMIT 10",
  "parameters": {}
}
```

#### Query com Parâmetros
```bash
POST /api/bigquery
Content-Type: application/json

{
  "action": "execute",
  "query": "SELECT * FROM `creatto-463117.biquery_data.tabela` WHERE id = @user_id",
  "parameters": { "user_id": 123 }
}
```

## Utilidades

### `bigQueryUtils.buildTableRef(project, dataset, table)`
Constrói referência completa da tabela.
```typescript
const tableRef = bigQueryUtils.buildTableRef('creatto-463117', 'biquery_data', 'minha_tabela');
// Result: `creatto-463117.biquery_data.minha_tabela`
```

### `bigQueryUtils.buildSelectQuery(table, options)`
Constrói query SELECT com filtros.
```typescript
const query = bigQueryUtils.buildSelectQuery(tableRef, {
  columns: ['id', 'name', 'email'],
  where: 'status = "active"',
  orderBy: 'created_at DESC',
  limit: 100,
  offset: 0
});
```

### `bigQueryUtils.buildAggregationQuery(table, options)`
Constrói query de agregação.
```typescript
const query = bigQueryUtils.buildAggregationQuery(tableRef, {
  groupBy: ['category'],
  aggregations: [
    { column: 'price', func: 'SUM', alias: 'total_price' },
    { column: '*', func: 'COUNT', alias: 'count' }
  ],
  where: 'status = "completed"',
  orderBy: 'total_price DESC'
});
```

## Componentes de UI

### Tabela de Dados
Componente para renderizar dados em tabela HTML:

```typescript
const renderTableData = (data: Record<string, unknown>[], title: string) => {
  // Renderiza tabela HTML com Tailwind CSS
  // - Headers automáticos baseados nas colunas
  // - Scroll horizontal/vertical
  // - Zebra striping para readability
  // - Sticky header
}
```

## Páginas de Teste

### `/bigquery-test`
Página principal de testes com:
- ✅ **Teste de Conexão**: Verifica se BigQuery conecta
- ✅ **Lista de Datasets**: Mostra todos os datasets  
- ✅ **Tabelas por Dataset**: Lista tabelas de qualquer dataset
- ✅ **Dados do biquery_data**: Seção especial para o dataset principal
- ✅ **Query Customizada**: Executa SQL personalizado

### `/bigquery-demo` 
Página de demonstração dos hooks:
- Exemplos práticos de uso
- Código comentado
- Cases de uso comuns

## Fluxo de Desenvolvimento

### Como usar em uma nova página:

1. **Importar hooks**:
```typescript
import { useBigQueryQuery, useBigQueryDatasets } from '@/hooks/useBigQuery';
```

2. **Usar o hook**:
```typescript
const { data, loading, error, execute } = useBigQueryQuery(`
  SELECT nome, email, data_cadastro 
  FROM \`creatto-463117.biquery_data.usuarios\` 
  WHERE ativo = true
  ORDER BY data_cadastro DESC
  LIMIT 50
`);
```

3. **Renderizar dados**:
```typescript
{loading && <div>Carregando...</div>}
{error && <div>Erro: {error}</div>}
{data && <MinhaTabela dados={data.data} />}
```

## Debug e Logs

### Console Logs Disponíveis
O sistema inclui logs detalhados para debugging:

```bash
# Ambiente detectado
🔍 Environment debug:
- VERCEL: 1
- NODE_ENV: production
- GOOGLE_PROJECT_ID: creatto-463117
- Has GOOGLE_APPLICATION_CREDENTIALS_JSON: true

# Inicialização do serviço
🔧 Checking if BigQuery service needs initialization...
⚡ Initializing BigQuery service...
✅ BigQuery service initialized successfully

# Execução de queries
🔍 Attempting to list datasets...
✅ Datasets retrieved successfully: 2 datasets found
```

## Tratamento de Erros

### Tipos de Erro Comuns:
- **Credenciais inválidas**: Verificar variáveis ambiente
- **Tabela não encontrada**: Verificar nome da tabela/dataset
- **Quota excedida**: Implementar throttling
- **Query inválida**: Validar SQL syntax

### Error Boundaries:
Todos os hooks incluem tratamento de erro:
```typescript
{error && (
  <div className="text-red-600">
    ❌ Erro: {error}
  </div>
)}
```

## Performance

### Caching
- **Cache automático** de queries com TTL de 5 minutos
- **Clear cache** disponível no serviço
- **Stats de cache** para monitoramento

### Otimizações
- **Lazy loading** dos dados
- **Paginação** automática para grandes datasets
- **Abort controllers** para cancelar requests

## Próximos Passos

### Possíveis Melhorias:
1. **Query Builder Visual**: Interface para construir queries sem SQL
2. **Real-time Updates**: WebSockets para dados em tempo real  
3. **Export Functions**: CSV, Excel, PDF exports
4. **Dashboard Components**: Gráficos e métricas automáticas
5. **Scheduled Queries**: Queries agendadas e relatórios
6. **Data Validation**: Validação de schema automática

## Datasets Disponíveis

### `biquery_data`
- **Localização**: southamerica-east1
- **Contém**: Dados principais da aplicação
- **Acesso**: Através dos hooks implementados

### `airbyte_internal`  
- **Localização**: southamerica-east1
- **Contém**: Dados internos do Airbyte
- **Uso**: Metadados e configurações

---

## Resumo

✅ **BigQuery totalmente integrado** com hooks similares ao CUBE.js  
✅ **API robusta** com endpoints GET/POST  
✅ **UI components** prontos para uso  
✅ **Detecção automática** de ambiente  
✅ **Type-safe** com TypeScript  
✅ **Debugging** completo com console.logs  
✅ **Cache inteligente** para performance  
✅ **Documentação** completa  

**Como era com CUBE.js:** `useCubeQuery()`  
**Agora com BigQuery:** `useBigQueryQuery()`

A migração foi bem-sucedida mantendo a mesma facilidade de uso! 🚀