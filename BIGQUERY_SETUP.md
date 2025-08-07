# Configuração do BigQuery

## 1. Configuração no Google Cloud

### 1.1 Criar um Projeto (se necessário)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID** (ex: `meu-projeto-123`)

### 1.2 Ativar a API do BigQuery
1. No Google Cloud Console, vá para **APIs & Services > Library**
2. Procure por "BigQuery API" e clique em **Enable**

### 1.3 Criar uma Service Account
1. Vá para **IAM & Admin > Service Accounts**
2. Clique em **Create Service Account**
3. Preencha os detalhes:
   - **Name**: `bigquery-reader`
   - **Description**: `Service account para acessar BigQuery`
4. Clique em **Create and Continue**
5. Adicione as seguintes roles:
   - `BigQuery Data Viewer`
   - `BigQuery Job User` 
   - `BigQuery User`
6. Clique em **Continue** e depois **Done**

### 1.4 Gerar Chave da Service Account
1. Na lista de Service Accounts, clique na conta criada
2. Vá para a aba **Keys**
3. Clique em **Add Key > Create New Key**
4. Escolha **JSON** e clique em **Create**
5. O arquivo JSON será baixado automaticamente
6. **⚠️ IMPORTANTE**: Guarde este arquivo com segurança!

## 2. Configuração Local (Desenvolvimento)

### 2.1 Estrutura de Pastas
```
seu-projeto/
├── credentials/              # Para desenvolvimento
│   └── bigquery-key.json    # Arquivo baixado
├── .env.local               # Variáveis locais
├── .env.example            # Template
└── .gitignore              # Ignorar credenciais
```

### 2.2 Configurar Variáveis de Ambiente
Edite o arquivo `.env.local`:

```env
# BigQuery Configuration
GOOGLE_PROJECT_ID=meu-projeto-123
GOOGLE_APPLICATION_CREDENTIALS=./credentials/bigquery-key.json
BIGQUERY_DATASET_ID=meu_dataset
BIGQUERY_LOCATION=US
```

### 2.3 Colocar o Arquivo de Credenciais
```bash
# Criar pasta para credenciais
mkdir credentials

# Mover arquivo baixado
mv ~/Downloads/meu-projeto-xxx-yyy.json ./credentials/bigquery-key.json
```

## 3. Configuração Vercel (Produção)

### ⚠️ NUNCA coloque o arquivo JSON no Vercel!

### 3.1 Preparar Credenciais
No seu terminal local, copie o conteúdo do arquivo JSON:

```bash
# Método 1: Copiar conteúdo
cat ./credentials/bigquery-key.json

# Método 2: Base64 (alternativa)
base64 -i ./credentials/bigquery-key.json
```

### 3.2 Configurar no Vercel Dashboard
1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings > Environment Variables**
3. Adicione as seguintes variáveis:

```
GOOGLE_PROJECT_ID = meu-projeto-123
BIGQUERY_DATASET_ID = meu_dataset  
BIGQUERY_LOCATION = US
GOOGLE_APPLICATION_CREDENTIALS_JSON = {"type":"service_account","project_id":"meu-projeto-123",...}
```

**Para `GOOGLE_APPLICATION_CREDENTIALS_JSON`:**
- Cole o conteúdo **completo** do arquivo JSON
- Mantenha como uma única linha
- Inclua todas as aspas e chaves

### 3.3 Deploy
```bash
# Deploy para produção
vercel --prod
```

## 4. Configuração de Segurança

### 4.1 Atualizar .gitignore
```gitignore
# BigQuery Credentials
credentials/
*.json
!package*.json

# Environment files
.env.local
.env*.local

# Vercel
.vercel
```

## 5. Teste da Configuração

### 5.1 Verificar Configuração
O sistema detecta automaticamente o ambiente e configurações:

```bash
# Verificar se está funcionando
npm run dev

# Abrir no browser
http://localhost:3000/api/bigquery?action=tables
```

### 5.2 API Endpoints Disponíveis

**GET `/api/bigquery`:**
```bash
# Listar todas as tabelas
curl "http://localhost:3000/api/bigquery?action=tables"

# Listar tabelas de dataset específico
curl "http://localhost:3000/api/bigquery?action=tables&dataset=meu_dataset"

# Obter schema de uma tabela
curl "http://localhost:3000/api/bigquery?action=schema&dataset=meu_dataset&table=minha_tabela"
```

**POST `/api/bigquery`:**
```bash
# Executar query personalizada
curl -X POST http://localhost:3000/api/bigquery \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute",
    "query": "SELECT * FROM `meu-projeto.meu_dataset.minha_tabela` LIMIT 10"
  }'

# Query com parâmetros
curl -X POST http://localhost:3000/api/bigquery \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute", 
    "query": "SELECT * FROM `projeto.dataset.tabela` WHERE coluna = @valor LIMIT @limite",
    "parameters": {"valor": "teste", "limite": 5}
  }'

# Query tabela com filtros
curl -X POST http://localhost:3000/api/bigquery \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query-table",
    "dataset": "meu_dataset",
    "table": "minha_tabela",
    "options": {
      "columns": ["id", "nome", "email"],
      "where": "status = \"ativo\"",
      "orderBy": "created_at DESC",
      "limit": 20
    }
  }'
```

## 6. Estrutura das Tabelas BigQuery

Para o melhor funcionamento com o sistema de sheets, organize suas tabelas com:

- **Colunas bem nomeadas**: Use nomes descritivos
- **Tipos de dados adequados**: STRING, INTEGER, FLOAT, DATE, BOOLEAN
- **Descrições**: Adicione descrições às tabelas e colunas
- **Particionamento**: Para tabelas grandes, considere particionamento por data

## 7. Recursos Avançados

### 7.1 Cache Inteligente
O sistema implementa cache automático:
- **TTL padrão**: 5 minutos
- **Chave baseada**: query + parâmetros
- **Controle**: `clearCache()` para limpar

### 7.2 Detecção de Ambiente
```javascript
import { bigQueryConfig } from '@/services/bigquery'

// Verificar configuração
const config = bigQueryConfig.getEnvironmentInfo()
console.log(config)
// { environment: 'development', hasProjectId: true, credentialsType: 'file' }

// Testar conexão
const test = await bigQueryConfig.testConfiguration()
console.log(test)
// { success: true, message: 'BigQuery configuration is valid' }
```

## 8. Solução de Problemas

### 8.1 Erro de Autenticação
```
❌ Failed to initialize BigQuery client: Error: Unable to detect a Project Id in the current environment
```
**Solução**: Verifique `GOOGLE_PROJECT_ID` nas variáveis de ambiente.

### 8.2 Erro de Credenciais (Local)
```
❌ Error: ENOENT: no such file or directory, open './credentials/bigquery-key.json'
```
**Solução**: 
1. Verifique se o arquivo existe no caminho especificado
2. Confirme permissões de leitura
3. Use caminho absoluto se necessário

### 8.3 Erro de Credenciais (Vercel)
```
❌ Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format
```
**Solução**:
1. Verifique se o JSON está válido
2. Cole o conteúdo completo sem quebras de linha
3. Teste o JSON em um validador online

### 8.4 Erro de Permissões
```
❌ Access Denied: BigQuery: User does not have permission to query table
```
**Solução**:
1. Verifique roles da Service Account
2. Confirme acesso ao dataset/tabela
3. Teste com `BigQuery Data Viewer` primeiro

## 9. Monitoramento e Custos

### 9.1 Monitorar Uso
- Google Cloud Console > BigQuery > Query History
- Monitore bytes processados por query
- Configure alertas de custos

### 9.2 Otimização
- Use `LIMIT` em queries de teste
- Implemente paginação para dados grandes
- Cache results para queries repetitivas
- Considere materializar views frequentes

## 10. Próximos Passos

✅ **Concluído**: Serviço BigQuery + Configuração  
🔄 **Próximo**: Criar hook `useBigQuery` para React  
⏳ **Depois**: Integrar com sistema de sheets  

### Quick Start para Desenvolvedores:
1. Configure as variáveis de ambiente
2. Teste: `http://localhost:3000/api/bigquery?action=tables`
3. Se funcionar, está pronto para usar!