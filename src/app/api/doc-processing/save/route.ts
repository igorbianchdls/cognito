import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de tipo de documento para tabela do BigQuery
const documentTypeToTable: Record<string, string> = {
  'Nota Fiscal (NF-e)': 'gestaofinanceira.documentos',
  'Recibo': 'gestaofinanceira.documentos',
  'Fatura': 'gestaofinanceira.documentos',
  'Duplicata': 'gestaofinanceira.documentos',
  'Contrato': 'gestaofinanceira.contratos',
  'Extrato Bancário': 'gestaofinanceira.movimentos',
  'Guia de Imposto': 'gestaofinanceira.documentos',
};

export async function POST(req: Request) {
  console.log('💾 DOC SAVE: Request recebido');

  try {
    const { documentType, fields, summary } = await req.json();

    if (!documentType) {
      return Response.json({ error: 'Tipo de documento não fornecido' }, { status: 400 });
    }

    if (!fields || fields.length === 0) {
      return Response.json({ error: 'Nenhum campo fornecido' }, { status: 400 });
    }

    // Determinar tabela de destino
    const tableName = documentTypeToTable[documentType];

    if (!tableName) {
      return Response.json({ error: `Tipo de documento "${documentType}" não mapeado` }, { status: 400 });
    }

    console.log('💾 DOC SAVE: Tipo:', documentType);
    console.log('💾 DOC SAVE: Tabela:', tableName);
    console.log('💾 DOC SAVE: Campos:', fields.length);

    // Converter array de campos para objeto
    const documentData: Record<string, any> = {
      tipo_documento: documentType,
      resumo: summary,
    };

    // Mapear campos extraídos para colunas do banco
    fields.forEach((field: { key: string; value: string }) => {
      // Converter nome do campo para snake_case para o banco
      const columnName = field.key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[\/\s\-()]/g, '_') // Substitui / espaços - () por _
        .replace(/_+/g, '_') // Remove underscores duplicados
        .replace(/^_|_$/g, ''); // Remove underscores do início e fim

      documentData[columnName] = field.value;
    });

    console.log('💾 DOC SAVE: Dados preparados:', Object.keys(documentData));

    // Inserir no banco de dados
    const { data, error } = await supabase
      .from(tableName)
      .insert([documentData])
      .select();

    if (error) {
      console.error('💾 DOC SAVE: Erro ao inserir:', error);
      throw error;
    }

    console.log('💾 DOC SAVE: Documento salvo com sucesso!');

    return Response.json({
      success: true,
      data: data?.[0],
      message: `Documento ${documentType} salvo com sucesso!`,
    });
  } catch (error) {
    console.error('💾 DOC SAVE: Erro:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao salvar documento no sistema',
      },
      { status: 500 }
    );
  }
}
