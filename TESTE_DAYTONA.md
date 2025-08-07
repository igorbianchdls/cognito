# 🧪 Como Testar a Integração Daytona

## 🎯 **Comandos de Teste**

### **1. Comando Forçado (Sempre Funciona):**
```
daytona_test
```
ou
```
teste_python
```

### **2. Comandos Naturais:**
```
analisar dados
```
```
análise de vendas
```
```
gráficos python
```
```
estatísticas dos dados
```

## 📋 **Como Verificar os Logs**

### **Terminal do Servidor (npm run dev):**
Procure por:
- `🌟🌟🌟 GRAPHRAG CHAT API CALLED 🌟🌟🌟`
- `=== DAYTONA DETECTION DEBUG ===`
- `🚀🚀🚀 DAYTONA ANALYSIS TRIGGERED 🚀🚀🚀`
- `⚡⚡⚡ DAYTONA ANALYSIS API CALLED ⚡⚡⚡`

### **Console do Navegador (F12):**
- Abra DevTools (F12)
- Vá para aba "Console"
- Procure por erros ou logs relacionados

## 🔍 **O que Esperar**

### **Se Funcionar:**
1. Logs aparecerão no terminal
2. Componente visual com dados da análise
3. Sandbox ID e insights

### **Se Não Funcionar:**
1. Logs mostrarão onde parou
2. Mensagem de erro detalhada
3. Fallback para resposta normal

## 🚨 **Troubleshooting**

1. **Nenhum log aparece**: API não está sendo chamada
2. **Detection debug aparece**: Detecção funcionou
3. **Daytona API called**: Chamada chegou até API
4. **Simulation mode**: Executando modo mock (esperado)

## ⚡ **Teste Rápido**

1. Vá para `/graphrag`
2. Digite: `daytona_test`  
3. Verifique logs no terminal
4. Componente deve aparecer na UI