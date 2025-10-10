import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export const maxDuration = 300;

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

    // Chamar Claude Vision usando AI SDK
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: base64,
              mimeType: 'application/pdf',
            },
            {
              type: 'text',
              text: `Analise este documento e extraia TODOS os campos e informações relevantes em formato estruturado.

Para cada campo extraído, retorne um objeto JSON com:
- "key": nome do campo em português (ex: "Número da Nota Fiscal", "Data de Emissão", "CNPJ Fornecedor")
- "value": valor extraído do documento
- "confidence": nível de confiança de 0 a 1

Se for uma nota fiscal/invoice, extraia campos como:
- Número da nota/invoice
- Data de emissão
- Valor total
- Impostos (ICMS, IPI, PIS, COFINS, etc)
- Informações do emitente (nome, CNPJ/CPF, endereço, email, telefone)
- Informações do destinatário (nome, CNPJ/CPF, endereço, email, telefone)
- Descrição de produtos/serviços
- Condições de pagamento
- Chave de acesso (se houver)

Retorne APENAS um JSON válido no formato:
{
  "fields": [
    { "key": "campo1", "value": "valor1", "confidence": 0.95 },
    { "key": "campo2", "value": "valor2", "confidence": 0.98 }
  ]
}

Não adicione explicações, apenas o JSON.`,
            },
          ],
        },
      ],
    });

    console.log('📄 DOC EXTRACTION: Resposta recebida do Claude');

    // Parse do JSON retornado pelo Claude
    const responseText = result.text.trim();

    // Remover possíveis markdown code blocks
    let jsonText = responseText;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const extractedData = JSON.parse(jsonText);

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
