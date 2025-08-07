# 🐍 Integração Daytona para Análise de Dados

## Visão Geral

Esta implementação integra o **Daytona Sandbox** com o sistema GraphRAG para análise segura de dados usando Python. A IA pode executar código Python isoladamente na nuvem para análises avançadas de dados.

## 🚀 Funcionalidades

- **Sandbox Seguro**: Código Python executa isoladamente no Daytona
- **Análise Automática**: IA gera e executa código pandas/matplotlib
- **Visualizações**: Gráficos automáticos extraídos como artifacts
- **Dados Hardcoded**: Dados de vendas de exemplo para demonstração
- **UI Rica**: Componente especializado para exibir resultados

## 📋 Como Usar

### 1. Configuração

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Configurar as chaves API no .env.local
ANTHROPIC_API_KEY=sua_chave_anthropic
DAYTONA_API_KEY=sua_chave_daytona
```

### 2. Comandos de Análise

Na interface do GraphRAG, use comandos como:

- **"analisar vendas"** - Executa análise completa
- **"análise python"** - Força uso do Daytona
- **"gráficos de vendas"** - Foca em visualizações
- **"estatísticas dos dados"** - Análise estatística

### 3. Exemplo de Uso

```
Usuário: "Quero analisar as vendas com python"
```

A IA vai:
1. Detectar solicitação de análise
2. Criar sandbox Daytona
3. Executar código Python com pandas/matplotlib
4. Retornar insights e visualizações
5. Limpar sandbox automaticamente

## 🔧 Arquitetura Técnica

```
Frontend (Next.js) → GraphRAG Chat → Daytona API → Python Sandbox
                                  ↓
                            Análise + Gráficos
```

## 📊 Dados de Exemplo

O sistema usa dados hardcoded de vendas:

```python
vendas_data = {
    'data': ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
    'vendas': [15000, 18000, 22000, 19000, 25000, 28000],
    'regiao': ['SP', 'RJ', 'SP', 'MG', 'RJ', 'SP'],
    'produto': ['A', 'B', 'A', 'C', 'B', 'A']
}
```

## 🛡️ Segurança

- **Sandbox Isolado**: Código executa em ambiente controlado
- **Timeout**: Execução limitada a 5 minutos
- **Cleanup Automático**: Sandboxes são destruídos após uso
- **API Segura**: Todas as chamadas autenticadas

## 🎯 Próximos Passos

1. **Upload CSV Real**: Substituir dados hardcoded por uploads
2. **Mais Visualizações**: Expandir tipos de gráficos
3. **Caching**: Cache de resultados para análises repetidas
4. **Export**: Permitir download de resultados

## 📁 Arquivos Criados

- `src/app/api/daytona-analysis/route.ts` - API Daytona
- `src/components/chat/DaytonaAnalysisResult.tsx` - Componente UI
- Modificações em `graphrag-chat/route.ts` e `RespostaDaIA.tsx`