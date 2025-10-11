import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 300;

const extractionSchema = z.object({
  summary: z.string().describe('Resumo executivo do documento em 2-3 frases'),
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

    // Converter arquivo para Buffer (não para base64 string)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
              data: buffer,
              mediaType: 'application/pdf',
            },
            {
              type: 'text',
              text: `Analise este documento fiscal/financeiro brasileiro e:

1. **IDENTIFIQUE o tipo de documento**: NF-e (Nota Fiscal Eletrônica), NFS-e (Nota Fiscal de Serviço), Boleto Bancário, Recibo, Fatura, Conta de Serviço, Guia de Imposto, ou outro tipo

2. **RESUMA** o documento em 2-3 frases (tipo, valor, partes envolvidas, finalidade)

3. **EXTRAIA os campos relevantes** baseado no tipo detectado:

**Para NF-e (Nota Fiscal Eletrônica):**
- Tipo de documento: "NF-e"
- Número do documento
- Série
- Chave de acesso (44 dígitos)
- Data de emissão
- Valor total
- Total de impostos (ICMS + IPI + PIS + COFINS somados)
- Nome do emitente
- CNPJ/CPF do emitente
- Nome do destinatário
- CNPJ/CPF do destinatário
- Descrição/Observações (principais produtos/serviços)
- Status do documento (Normal, Cancelada, etc)

**Para NFS-e (Nota Fiscal de Serviço):**
- Tipo de documento: "NFS-e"
- Número do documento
- Data de emissão
- Valor total
- Total de impostos (ISS principalmente)
- Nome do emitente (prestador)
- CNPJ/CPF do emitente
- Nome do destinatário (tomador)
- CNPJ/CPF do destinatário
- Descrição/Observações (descrição do serviço)

**Para Boleto Bancário:**
- Tipo de documento: "Boleto"
- Número do documento (nosso número ou número do boleto)
- Código de barras (linha digitável completa)
- Data de emissão
- Data de vencimento
- Valor total
- Nome do emitente (beneficiário/cedente)
- CNPJ/CPF do emitente
- Nome do destinatário (pagador/sacado)
- CNPJ/CPF do destinatário
- Status do documento (se indicado: Pago, Vencido, etc)

**Para Recibo:**
- Tipo de documento: "Recibo"
- Número do documento (se houver)
- Data de emissão
- Valor total
- Nome do emitente (quem recebeu o pagamento)
- CPF/CNPJ do emitente
- Nome do destinatário (quem pagou)
- CPF/CNPJ do destinatário
- Descrição/Observações (referente a quê)

**Para Fatura/Conta (Luz, Água, Telefone, Internet, etc):**
- Tipo de documento: "Fatura" ou específico "Conta de Luz", "Conta de Água", etc
- Número do documento (número da fatura)
- Data de emissão
- Data de vencimento
- Valor total
- Código de barras (para pagamento)
- Nome do emitente (prestador do serviço)
- CNPJ do emitente
- Nome do destinatário (cliente)
- CPF/CNPJ do destinatário
- Descrição/Observações (período de referência, consumo, etc)

**IMPORTANTE:**
- Retorne APENAS os campos que conseguir extrair com confiança
- Não invente valores - se não encontrar, não retorne o campo
- Use nomes de campos EXATAMENTE como especificado acima
- Para cada campo: key (nome do campo), value (valor extraído), confidence (0 a 1)`,
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
