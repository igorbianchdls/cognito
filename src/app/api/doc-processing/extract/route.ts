import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 300;

const extractionSchema = z.object({
  fields: z.array(
    z.object({
      key: z.string().describe('Nome do campo em português'),
      value: z.string().describe('Valor extraído do documento'),
      confidence: z.number().min(0).max(1).describe('Nível de confiança de 0 a 1'),
    })
  ),
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

    console.log('📄 DOC EXTRACTION: Enviando para Claude Vision via AI SDK...');

    // Chamar Claude Vision usando AI SDK com generateObject
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: base64,
              mimeType: 'application/pdf',
            } as any, // Type assertion para contornar limitação do tipo TypeScript
            {
              type: 'text',
              text: `Analise este documento e extraia TODOS os campos e informações relevantes.

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
- value: valor extraído
- confidence: seu nível de confiança (0 a 1)`,
            },
          ],
        },
      ],
      schema: extractionSchema,
    });

    console.log('📄 DOC EXTRACTION: Campos extraídos:', result.object.fields?.length);

    return Response.json(result.object);
  } catch (error) {
    console.error('📄 DOC EXTRACTION: Erro:', error);
    return Response.json(
      { error: 'Failed to extract document data', details: String(error) },
      { status: 500 }
    );
  }
}
