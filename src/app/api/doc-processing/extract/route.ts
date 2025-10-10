import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  console.log('📄 DOC EXTRACTION: Request recebido');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📄 DOC EXTRACTION: Processando arquivo:', file.name);

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    console.log('📄 DOC EXTRACTION: Enviando para Claude Vision...');

    // Chamar Claude Vision com Tools para resposta estruturada
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      tools: [
        {
          name: 'extract_document_fields',
          description: 'Extract structured fields from a document',
          input_schema: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                description: 'Array of extracted fields from the document',
                items: {
                  type: 'object',
                  properties: {
                    key: {
                      type: 'string',
                      description: 'Nome do campo em português (ex: "Número da Nota Fiscal", "CNPJ Emitente")',
                    },
                    value: {
                      type: 'string',
                      description: 'Valor extraído do documento',
                    },
                    confidence: {
                      type: 'number',
                      description: 'Nível de confiança da extração de 0 a 1',
                      minimum: 0,
                      maximum: 1,
                    },
                  },
                  required: ['key', 'value', 'confidence'],
                },
              },
            },
            required: ['fields'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_document_fields' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analise este documento e extraia TODOS os campos e informações relevantes usando a ferramenta extract_document_fields.

Se for uma nota fiscal/invoice, extraia campos como:
- Número da nota/invoice
- Data de emissão
- Valor total e subtotais
- Impostos (ICMS, IPI, PIS, COFINS, ISS, etc)
- Informações do emitente (nome, CNPJ/CPF, endereço, email, telefone)
- Informações do destinatário (nome, CNPJ/CPF, endereço, email, telefone)
- Descrição de produtos/serviços
- Condições de pagamento
- Chave de acesso (se houver)
- Qualquer outro campo relevante

Para cada campo extraído, forneça:
- key: nome descritivo do campo em português
- value: valor exato extraído do documento
- confidence: seu nível de confiança (0 a 1)`,
            },
          ],
        },
      ],
    });

    console.log('📄 DOC EXTRACTION: Resposta recebida do Claude');

    // Extrair dados da tool response
    const toolUse = message.content.find((block) => block.type === 'tool_use');

    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('No tool use in response');
    }

    const extractedData = toolUse.input as { fields: Array<{ key: string; value: string; confidence: number }> };

    console.log('📄 DOC EXTRACTION: Campos extraídos:', extractedData.fields?.length);

    return Response.json(extractedData);
  } catch (error) {
    console.error('📄 DOC EXTRACTION: Erro:', error);
    return Response.json(
      { error: 'Failed to extract document data', details: String(error) },
      { status: 500 }
    );
  }
}
