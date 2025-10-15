import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 300;

// Schema base com summary
const baseSchema = z.object({
  summary: z.string().describe('Resumo executivo do documento em 2-3 frases'),
});

// Schema para Nota Fiscal (NF-e)
const notaFiscalSchema = baseSchema.extend({
  documentType: z.literal('Nota Fiscal (NF-e)'),
  numeroDaNFe: z.string().optional().describe('Número da NF-e'),
  serie: z.string().optional().describe('Série'),
  chaveDeAcesso: z.string().optional().describe('Chave de acesso (44 dígitos)'),
  dataDeEmissao: z.string().optional().describe('Data de emissão'),
  cfop: z.string().optional().describe('CFOP'),
  emitente: z.string().optional().describe('Nome do emitente'),
  cnpjCpfEmitente: z.string().optional().describe('CNPJ/CPF do emitente'),
  destinatario: z.string().optional().describe('Nome do destinatário'),
  cnpjCpfDestinatario: z.string().optional().describe('CNPJ/CPF do destinatário'),
  valorTotal: z.string().optional().describe('Valor total'),
  totalDeImpostos: z.string().optional().describe('Total de impostos'),
  status: z.string().optional().describe('Status do documento'),
});

// Schema para Recibo
const reciboSchema = baseSchema.extend({
  documentType: z.literal('Recibo'),
  numeroDoRecibo: z.string().optional().describe('Número do recibo'),
  data: z.string().optional().describe('Data'),
  valor: z.string().optional().describe('Valor'),
  recebedor: z.string().optional().describe('Nome do recebedor'),
  cpfCnpjRecebedor: z.string().optional().describe('CPF/CNPJ do recebedor'),
  pagador: z.string().optional().describe('Nome do pagador'),
  cpfCnpjPagador: z.string().optional().describe('CPF/CNPJ do pagador'),
  descricaoReferenteA: z.string().optional().describe('Descrição/Referente a'),
});

// Schema para Fatura
const faturaSchema = baseSchema.extend({
  documentType: z.literal('Fatura'),
  numeroDaFatura: z.string().optional().describe('Número da fatura'),
  dataDeEmissao: z.string().optional().describe('Data de emissão'),
  dataDeVencimento: z.string().optional().describe('Data de vencimento'),
  cliente: z.string().optional().describe('Nome do cliente'),
  cnpjCpfCliente: z.string().optional().describe('CNPJ/CPF do cliente'),
  valorTotal: z.string().optional().describe('Valor total'),
  status: z.string().optional().describe('Status'),
  observacoes: z.string().optional().describe('Observações'),
});

// Schema para Duplicata
const duplicataSchema = baseSchema.extend({
  documentType: z.literal('Duplicata'),
  numeroDaDuplicata: z.string().optional().describe('Número da duplicata'),
  dataDeEmissao: z.string().optional().describe('Data de emissão'),
  dataDeVencimento: z.string().optional().describe('Data de vencimento'),
  sacado: z.string().optional().describe('Nome do sacado'),
  cnpjCpfSacado: z.string().optional().describe('CNPJ/CPF do sacado'),
  valor: z.string().optional().describe('Valor'),
  pracaDePagamento: z.string().optional().describe('Praça de pagamento'),
});

// Schema para Contrato
const contratoSchema = baseSchema.extend({
  documentType: z.literal('Contrato'),
  numeroDoContrato: z.string().optional().describe('Número do contrato'),
  contratante: z.string().optional().describe('Nome do contratante'),
  contratado: z.string().optional().describe('Nome do contratado'),
  dataDeInicio: z.string().optional().describe('Data de início'),
  dataDeTermino: z.string().optional().describe('Data de término'),
  valor: z.string().optional().describe('Valor'),
  objetoDoContrato: z.string().optional().describe('Objeto do contrato'),
});

// Schema para uma transação individual do extrato
const transacaoExtratoSchema = z.object({
  data: z.string().describe('Data da transação (formato DD/MM/YYYY)'),
  descricao: z.string().describe('Descrição da transação'),
  valor: z.string().describe('Valor da transação (use número negativo para débitos, positivo para créditos)'),
  tipo: z.enum(['credito', 'debito']).describe('Tipo: "credito" para entradas, "debito" para saídas'),
});

// Schema para Extrato Bancário
const extratoBancarioSchema = baseSchema.extend({
  documentType: z.literal('Extrato Bancário'),
  banco: z.string().optional().describe('Nome do banco'),
  agencia: z.string().optional().describe('Agência'),
  conta: z.string().optional().describe('Conta'),
  periodoDataInicial: z.string().optional().describe('Período - Data inicial'),
  periodoDataFinal: z.string().optional().describe('Período - Data final'),
  saldoInicial: z.string().optional().describe('Saldo inicial'),
  saldoFinal: z.string().optional().describe('Saldo final'),
  totalDeCreditos: z.string().optional().describe('Total de créditos'),
  totalDeDebitos: z.string().optional().describe('Total de débitos'),
  transacoes: z.array(transacaoExtratoSchema).optional().describe('Array com todas as transações individuais do extrato'),
});

// Schema para Guia de Imposto
const guiaDeImpostoSchema = baseSchema.extend({
  documentType: z.literal('Guia de Imposto'),
  tipoDeGuia: z.string().optional().describe('Tipo de guia (DAS, DARF, GPS, etc)'),
  codigoDeBarras: z.string().optional().describe('Código de barras'),
  periodoDeApuracao: z.string().optional().describe('Período de apuração'),
  dataDeVencimento: z.string().optional().describe('Data de vencimento'),
  contribuinte: z.string().optional().describe('Nome do contribuinte'),
  cnpjCpf: z.string().optional().describe('CNPJ/CPF'),
  valorPrincipal: z.string().optional().describe('Valor principal'),
  multaJuros: z.string().optional().describe('Multa/Juros'),
  valorTotal: z.string().optional().describe('Valor total'),
});

// Union discriminada de todos os schemas (mantido para typing utilitário)
const extractionSchema = z.discriminatedUnion('documentType', [
  notaFiscalSchema,
  reciboSchema,
  faturaSchema,
  duplicataSchema,
  contratoSchema,
  extratoBancarioSchema,
  guiaDeImpostoSchema,
]);

// Mapeamento de campos camelCase para nomes legíveis em português
const fieldLabels: Record<string, string> = {
  // Nota Fiscal
  numeroDaNFe: 'Número da NF-e',
  serie: 'Série',
  chaveDeAcesso: 'Chave de acesso',
  dataDeEmissao: 'Data de emissão',
  cfop: 'CFOP',
  emitente: 'Emitente',
  cnpjCpfEmitente: 'CNPJ/CPF Emitente',
  destinatario: 'Destinatário',
  cnpjCpfDestinatario: 'CNPJ/CPF Destinatário',
  valorTotal: 'Valor total',
  totalDeImpostos: 'Total de impostos',
  status: 'Status',
  // Recibo
  numeroDoRecibo: 'Número do recibo',
  data: 'Data',
  valor: 'Valor',
  recebedor: 'Recebedor',
  cpfCnpjRecebedor: 'CPF/CNPJ Recebedor',
  pagador: 'Pagador',
  cpfCnpjPagador: 'CPF/CNPJ Pagador',
  descricaoReferenteA: 'Descrição/Referente a',
  // Fatura
  numeroDaFatura: 'Número da fatura',
  dataDeVencimento: 'Data de vencimento',
  cliente: 'Cliente',
  cnpjCpfCliente: 'CNPJ/CPF Cliente',
  observacoes: 'Observações',
  // Duplicata
  numeroDaDuplicata: 'Número da duplicata',
  sacado: 'Sacado',
  cnpjCpfSacado: 'CNPJ/CPF Sacado',
  pracaDePagamento: 'Praça de pagamento',
  // Contrato
  numeroDoContrato: 'Número do contrato',
  contratante: 'Contratante',
  contratado: 'Contratado',
  dataDeInicio: 'Data de início',
  dataDeTermino: 'Data de término',
  objetoDoContrato: 'Objeto do contrato',
  // Extrato Bancário
  banco: 'Banco',
  agencia: 'Agência',
  conta: 'Conta',
  periodoDataInicial: 'Período (Data inicial)',
  periodoDataFinal: 'Período (Data final)',
  saldoInicial: 'Saldo inicial',
  saldoFinal: 'Saldo final',
  totalDeCreditos: 'Total de créditos',
  totalDeDebitos: 'Total de débitos',
  // Guia de Imposto
  tipoDeGuia: 'Tipo de guia',
  codigoDeBarras: 'Código de barras',
  periodoDeApuracao: 'Período de apuração',
  contribuinte: 'Contribuinte',
  cnpjCpf: 'CNPJ/CPF',
  valorPrincipal: 'Valor principal',
  multaJuros: 'Multa/Juros',
};

// Função para converter objeto estruturado em array de campos para o frontend
function convertToFieldsArray(extractedData: z.infer<typeof extractionSchema>) {
  const fields: Array<{ key: string; value: string; confidence?: number }> = [];

  // Adicionar o tipo de documento como primeiro campo
  fields.push({
    key: 'Tipo de documento',
    value: extractedData.documentType,
    confidence: 1,
  });

  // Extrair transações se existirem (para extrato bancário)
  let transacoes: Array<{ data: string; descricao: string; valor: string; tipo: string }> | undefined;
  if ('transacoes' in extractedData && extractedData.transacoes) {
    transacoes = extractedData.transacoes;
  }

  // Iterar sobre as propriedades do objeto (exceto summary, documentType e transacoes)
  Object.entries(extractedData).forEach(([key, value]) => {
    if (key !== 'summary' && key !== 'documentType' && key !== 'transacoes' && value) {
      const label = fieldLabels[key] || key;
      fields.push({
        key: label,
        value: String(value),
        confidence: 0.9, // Confiança padrão
      });
    }
  });

  return {
    summary: extractedData.summary,
    fields,
    transacoes, // Retornar transações separadamente
  };
}

export async function POST(req: Request) {
  console.log('📄 DOC EXTRACTION: Request recebido');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = (formData.get('documentType') as string | null) || '';

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo selecionado (agora obrigatório, sem auto-detecção)
    const allowedTypes = ['Fatura', 'Extrato Bancário', 'Nota Fiscal (NF-e)'];
    if (!documentType || !allowedTypes.includes(documentType)) {
      return Response.json({ error: 'documentType inválido ou ausente' }, { status: 400 });
    }

    console.log('📄 DOC EXTRACTION: Processando arquivo:', file.name);

    // Converter arquivo para Buffer (não para base64 string)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('📄 DOC EXTRACTION: Enviando para Claude Vision via AI SDK...');

    // Escolher schema e prompt conforme seleção do usuário
    let schema: z.ZodTypeAny;
    let instructions: string;

    switch (documentType) {
      case 'Nota Fiscal (NF-e)':
        schema = notaFiscalSchema;
        instructions = `Você é um extrator de dados para Nota Fiscal (NF-e) brasileira. Extraia APENAS os campos do schema a seguir quando estiverem claramente presentes e confiáveis. Resuma o documento em 2-3 frases.`;
        break;
      case 'Extrato Bancário':
        schema = extratoBancarioSchema;
        instructions = `Você é um extrator de dados para Extrato Bancário brasileiro. Extraia todas as transações do extrato (cada linha de movimentação). Se não encontrar algum campo, omita. O campo transacoes deve conter todas as movimentações com data (DD/MM/YYYY), descricao, valor (negativo para débito, positivo para crédito) e tipo (credito|debito). Inclua também um resumo executivo em 2-3 frases.`;
        break;
      case 'Fatura':
        schema = faturaSchema;
        instructions = `Você é um extrator de dados para Fatura. Extraia os campos pertinentes ao schema (emitente/cliente, datas, valores, status, observações) quando presentes com segurança e inclua um resumo executivo em 2-3 frases.`;
        break;
      default:
        return Response.json({ error: 'documentType não suportado' }, { status: 400 });
    }

    // Chamar Claude Vision com prompt específico
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'file', data: buffer, mediaType: 'application/pdf' },
            { type: 'text', text: instructions },
          ],
        },
      ],
      schema,
    });

    console.log('📄 DOC EXTRACTION: Tipo selecionado (forçado):', documentType);

    // Converter objeto estruturado para formato de array de campos
    // Garante que o documentType do objeto corresponda ao selecionado
    const withType = { ...(result.object as any), documentType } as z.infer<typeof extractionSchema>;
    const responseData = convertToFieldsArray(withType);

    console.log('📄 DOC EXTRACTION: Campos extraídos:', responseData.fields?.length);

    return Response.json(responseData);
  } catch (error) {
    console.error('📄 DOC EXTRACTION: Erro:', error);
    return Response.json(
      { error: 'Failed to extract document data', details: String(error) },
      { status: 500 }
    );
  }
}
