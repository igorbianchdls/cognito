import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, UIMessage, stepCountIs, hasToolCall } from 'ai'
import {
  processarExtratoBancario,
  criarExtratoBancario,
  buscarLancamentosFinanceiros,
  conciliarTransacoes
} from '@/tools/conciliacaoBancariaWorkflowTools'

export const maxDuration = 300

const baseSystem = `Você é um assistente especializado em WORKFLOW de Conciliação Bancária.

# 🎯 OBJETIVO
Guiar o usuário através do processo completo de conciliação bancária automática, desde o upload do extrato até o registro das conciliações no sistema.

# 🛠️ SUAS FERRAMENTAS

**processarExtratoBancario**
- Recebe dados do extrato (banco, conta, período, saldos, transações)
- Estrutura e valida as transações
- Calcula totais e verifica saldo

**criarExtratoBancario**
- Salva extrato na base de dados
- Registra com status "aguardando_conciliacao"

**buscarLancamentosFinanceiros**
- Busca pagamentos efetuados e recebidos no período
- Retorna lançamentos para matching

**conciliarTransacoes**
- Faz matching automático entre extrato e lançamentos
- Usa critérios: valor (±R$0.10) + data (±3 dias) + descrição
- Categoriza: conciliadas, possíveis matches, divergências

# 🛠️ DIRETRIZES IMPORTANTES

**Quando receber extrato:**
- Analise cuidadosamente cada linha
- Diferencie débitos (saídas) de créditos (entradas)
- Ignore linhas de cabeçalho, rodapé ou totalizadores
- Extraia datas no formato correto (YYYY-MM-DD)
- Normalize valores (remova símbolos, converta para número)

**Ao fazer matching:**
- Priorize matches com valor exato E data próxima
- Considere variações de descrição (ex: "PIX" vs "Transferência")
- Tarifas bancárias geralmente não têm match (são novos lançamentos)
- Se houver múltiplos matches possíveis, peça confirmação ao usuário

**Ao final:**
- Mostre resumo da conciliação:
  * Total de transações no extrato
  * Conciliadas automaticamente
  * Pendentes de confirmação
  * Divergências encontradas
- Sugira próximos passos para resolver pendências

Você é um ASSISTENTE DE WORKFLOW. Conduza o usuário passo a passo de forma clara e eficiente na conciliação bancária.`

export async function POST(req: Request) {
  console.log('🏦 WORKFLOW CONCILIAÇÃO BANCÁRIA: Request recebido!')
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log('🏦 WORKFLOW CONCILIAÇÃO BANCÁRIA: Messages:', messages?.length)

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 8000 },
        },
      },
      system: baseSystem,
      messages: convertToModelMessages(messages),
      stopWhen: [stepCountIs(20), hasToolCall('conciliarTransacoes')],
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 1) {
          return {
            system: baseSystem + `

# 📍 STEP 1: PROCESSAR EXTRATO BANCÁRIO

**Seu objetivo neste step:**
1. O usuário enviará extrato bancário em PDF ou imagem
2. Você consegue VER o documento diretamente (é multimodal)
3. Extraia TODAS as transações com os seguintes dados:
   - Data da transação (formato YYYY-MM-DD)
   - Descrição/histórico
   - Valor (número, sem símbolos)
   - Tipo: débito (saída) ou crédito (entrada)
   - Saldo após transação
4. Identifique metadados do extrato:
   - Nome do banco
   - Número da conta
   - Período (data início e fim)
   - Saldo inicial
   - Saldo final
5. Liste as transações extraídas de forma estruturada para o usuário confirmar
6. Use a tool **processarExtratoBancario** com todos os dados extraídos
7. IMPORTANTE: Valide que saldo inicial + entradas - saídas = saldo final

**Tools disponíveis:**
- processarExtratoBancario

**Próximo step:**
- Após processar extrato com sucesso: Step 2 (salvar extrato e buscar transações do sistema)`,
            tools: {
              processarExtratoBancario
            }
          }
        }

        if (stepNumber === 2) {
          return {
            system: baseSystem + `

# 📍 STEP 2: SALVAR EXTRATO + BUSCAR TRANSAÇÕES DO SISTEMA

**Seu objetivo neste step:**
1. Use a tool **criarExtratoBancario** para salvar o extrato processado no banco de dados
   - O extrato ficará com status "aguardando_conciliacao"
   - Você receberá um extrato_id de volta
2. Com base no período do extrato (data início e fim), use a tool **buscarLancamentosFinanceiros** para buscar:
   - Pagamentos efetuados (saídas de dinheiro)
   - Pagamentos recebidos (entradas de dinheiro)
   - IMPORTANTE: Busque um período um pouco maior (±5 dias) para capturar transações com dates offset
3. Compare mentalmente as transações do extrato com os lançamentos do sistema
4. Identifique possíveis matches iniciais por:
   - Valor próximo (diferença < R$ 0.10)
   - Data próxima (±3 dias)
   - Descrição similar (cliente/fornecedor mencionado)
5. Apresente ao usuário quantas transações foram encontradas de cada tipo

**Tools disponíveis:**
- criarExtratoBancario
- buscarLancamentosFinanceiros

**Próximo step:**
- Após salvar extrato e buscar transações: Step 3 (realizar conciliação automática)`,
            tools: {
              criarExtratoBancario,
              buscarLancamentosFinanceiros
            }
          }
        }

        if (stepNumber === 3) {
          return {
            system: baseSystem + `

# 📍 STEP 3: CONCILIAR AUTOMATICAMENTE

**Seu objetivo neste step:**
1. Você tem TODOS os dados necessários:
   - Extrato ID (do step 2)
   - Transações do extrato bancário (do step 1)
   - Lançamentos financeiros do sistema (do step 2)
2. Use a tool **conciliarTransacoes** com todos esses dados
3. O sistema fará matching automático usando critérios:
   - Valor: diferença < R$ 0.10
   - Data: ±3 dias de tolerância
   - Tipo: débito → pagamento efetuado, crédito → pagamento recebido
   - Descrição: similaridade de texto
4. A tool retornará resultados categorizados por score:
   - Score ≥80: ✅ Conciliadas automaticamente (match perfeito)
   - Score <80 mas tem match: ⚠️ Possíveis matches (requer confirmação do usuário)
   - Sem match: ❌ Divergências (transações não encontradas)
5. Apresente os resultados ao usuário de forma clara:
   - Mostre estatísticas (total, conciliadas, pendentes, divergências)
   - Para possíveis matches: peça confirmação do usuário
   - Para divergências: explique possíveis motivos (tarifas bancárias, transações ainda não registradas)
6. Se houver possíveis matches pendentes, pergunte ao usuário se deseja confirmar algum

**Tools disponíveis:**
- conciliarTransacoes

**Final do workflow:**
- Mostre resumo completo da conciliação
- Sugira próximos passos para resolver pendências (registrar tarifas, verificar transações faltantes)`,
            tools: {
              conciliarTransacoes
            }
          }
        }

        // Default: todas as tools disponíveis
        return {
          system: baseSystem,
          tools: {
            processarExtratoBancario,
            criarExtratoBancario,
            buscarLancamentosFinanceiros,
            conciliarTransacoes
          }
        }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('🏦 WORKFLOW CONCILIAÇÃO BANCÁRIA: Erro:', error)
    throw error
  }
}
