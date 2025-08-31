import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  console.log('=== SHEETS CHAT API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  
  try {
    const { messages, files, sheetData, hasSheetTools } = await req.json();
    console.log('Messages received:', messages?.length || 0);
    console.log('Files received:', files?.length || 0);
    console.log('Sheet data received:', !!sheetData);
    console.log('Has sheet tools:', hasSheetTools);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured',
        details: 'Please set ANTHROPIC_API_KEY in your environment variables'
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    let systemPrompt = `Você é um assistente especializado em planilhas e análise de dados. Você está integrado a uma interface de planilhas (Univer Sheets) e pode manipular a planilha diretamente através de ferramentas.

1. **Análise de dados**: Interpretar dados de planilhas, identificar padrões e tendências
2. **Fórmulas e funções**: Sugerir e explicar fórmulas para cálculos específicos
3. **Formatação**: Orientações sobre formatação condicional, estilos e layouts
4. **Visualização**: Sugestões para gráficos e visualizações adequadas aos dados
5. **Organização**: Melhores práticas para estruturação de planilhas
6. **Importação/Exportação**: Ajuda com formatos CSV, Excel e outros
7. **Automação**: Sugestões para automatizar tarefas repetitivas

${hasSheetTools ? `
**FERRAMENTAS DISPONÍVEIS:**
Você pode manipular a planilha diretamente usando estas ferramentas:

- \`addColumn\`: Adiciona uma nova coluna
  Parâmetros: name (string), position (number, opcional)
  
- \`applyFormula\`: Aplica uma fórmula em um range de células
  Parâmetros: range (string, ex: "A1:B10"), formula (string, ex: "=SUM(A1:A10)")
  
- \`updateCell\`: Atualiza o valor de uma célula específica
  Parâmetros: row (number), col (number), value (any)
  
- \`insertRow\`: Insere uma nova linha
  Parâmetros: position (number, opcional)
  
- \`deleteRow\`: Deleta uma linha
  Parâmetros: position (number)
  
- \`deleteColumn\`: Deleta uma coluna
  Parâmetros: position (number)

Quando o usuário pedir para fazer algo na planilha, USE ESSAS FERRAMENTAS para executar a ação diretamente.
` : ''}

Seja conciso, prático e focado em soluções aplicáveis diretamente na planilha. Sempre que possível, forneça exemplos específicos de fórmulas ou procedimentos.`;

    // Add file context if files are provided
    if (files && files.length > 0) {
      const fileContext = files.map((file: { name?: string; fileType?: string; summary?: string; rowCount?: number; columnCount?: number; content?: string }) => {
        let context = `\n\n**Arquivo: ${file.name}** (${file.fileType?.toUpperCase() || 'UNKNOWN'})`;
        
        if (file.summary) {
          context += `\nResumo: ${file.summary}`;
        }
        
        if (file.rowCount && file.columnCount) {
          context += `\nDimensões: ${file.rowCount} linhas x ${file.columnCount} colunas`;
        }
        
        if (file.content) {
          context += `\nConteúdo:\n${file.content.substring(0, 2000)}${file.content.length > 2000 ? '...' : ''}`;
        }
        
        return context;
      }).join('\n');
      
      systemPrompt += `\n\n**CONTEXTO DOS ARQUIVOS ENVIADOS:**${fileContext}`;
    }

    // Add current sheet context if available
    if (sheetData && sheetData.headers && sheetData.headers.length > 0) {
      const sheetContext = `\n\n**PLANILHA ATUAL:**
Dimensões: ${sheetData.totalRows} linhas x ${sheetData.totalCols} colunas
Colunas: ${sheetData.headers.join(', ')}

${sheetData.sampleRows && sheetData.sampleRows.length > 0 ? 
  `Primeiras linhas de dados:\n${sheetData.sampleRows.map((row: unknown[], i: number) => 
    `Linha ${i + 1}: ${row.join(' | ')}`
  ).join('\n')}` : 'Planilha vazia'}`;
      
      systemPrompt += sheetContext;
    }

    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 200) + '...');

    const tools = hasSheetTools ? {
      addColumn: {
        description: 'Adiciona uma nova coluna à planilha',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Nome da coluna'
            },
            position: {
              type: 'number',
              description: 'Posição onde inserir a coluna (opcional)'
            }
          },
          required: ['name']
        }
      },
      applyFormula: {
        description: 'Aplica uma fórmula em um range de células',
        parameters: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              description: 'Range de células (ex: A1:B10)'
            },
            formula: {
              type: 'string', 
              description: 'Fórmula a aplicar (ex: =SUM(A1:A10))'
            }
          },
          required: ['range', 'formula']
        }
      },
      updateCell: {
        description: 'Atualiza o valor de uma célula específica',
        parameters: {
          type: 'object',
          properties: {
            row: {
              type: 'number',
              description: 'Número da linha (começando em 0)'
            },
            col: {
              type: 'number',
              description: 'Número da coluna (começando em 0)'
            },
            value: {
              type: ['string', 'number'],
              description: 'Valor a inserir na célula'
            }
          },
          required: ['row', 'col', 'value']
        }
      },
      insertRow: {
        description: 'Insere uma nova linha na planilha',
        parameters: {
          type: 'object',
          properties: {
            position: {
              type: 'number',
              description: 'Posição onde inserir a linha (opcional)'
            }
          }
        }
      },
      deleteRow: {
        description: 'Deleta uma linha da planilha',
        parameters: {
          type: 'object',
          properties: {
            position: {
              type: 'number',
              description: 'Posição da linha a deletar'
            }
          },
          required: ['position']
        }
      },
      deleteColumn: {
        description: 'Deleta uma coluna da planilha',
        parameters: {
          type: 'object',
          properties: {
            position: {
              type: 'number',
              description: 'Posição da coluna a deletar'
            }
          },
          required: ['position']
        }
      }
    } : undefined;

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      tools: tools,
      temperature: 0.7,
      maxRetries: 3,
    });

    console.log('Stream result created successfully');
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Detailed error in sheets-chat API:', error);
    console.error('Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error in sheets chat',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}