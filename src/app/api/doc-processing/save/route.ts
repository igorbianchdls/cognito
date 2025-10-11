import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de tipo de documento para tabela específica do BigQuery
const documentTypeToSpecificTable: Record<string, string> = {
  'Nota Fiscal (NF-e)': 'gestaodocumentos.notas_fiscais',
  'Recibo': 'gestaodocumentos.recibos',
  'Fatura': 'gestaodocumentos.faturas',
  'Duplicata': 'gestaodocumentos.duplicatas',
  'Contrato': 'gestaodocumentos.contratos',
  'Extrato Bancário': 'gestaodocumentos.extratos_bancarios',
  'Guia de Imposto': 'gestaodocumentos.guias_imposto',
};

// Campos comuns que vão para a tabela mestre (documentos)
const commonFields = [
  'numero_documento',
  'numero_da_nf_e',
  'numero_do_recibo',
  'numero_da_fatura',
  'numero_da_duplicata',
  'numero_do_contrato',
  'data_emissao',
  'data_de_emissao',
  'data',
  'valor_total',
  'valor',
  'status',
  'observacoes',
  'descricao',
  'arquivo_pdf_url',
  'arquivo_xml_url'
];

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

    // Determinar tabela específica de destino
    const specificTableName = documentTypeToSpecificTable[documentType];

    if (!specificTableName) {
      return Response.json({ error: `Tipo de documento "${documentType}" não mapeado` }, { status: 400 });
    }

    console.log('💾 DOC SAVE: Tipo:', documentType);
    console.log('💾 DOC SAVE: Tabela específica:', specificTableName);
    console.log('💾 DOC SAVE: Campos:', fields.length);

    // Converter array de campos para objeto e separar campos comuns vs específicos
    const allFieldsData: Record<string, string | undefined> = {};

    fields.forEach((field: { key: string; value: string }) => {
      // Converter nome do campo para snake_case para o banco
      const columnName = field.key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[\/\s\-()]/g, '_') // Substitui / espaços - () por _
        .replace(/_+/g, '_') // Remove underscores duplicados
        .replace(/^_|_$/g, ''); // Remove underscores do início e fim

      allFieldsData[columnName] = field.value;
    });

    // Separar campos comuns (tabela mestre) vs específicos
    const masterData: Record<string, string | undefined> = {
      tipo_documento: documentType,
    };
    const specificData: Record<string, string | undefined> = {};

    // Distribuir campos
    Object.entries(allFieldsData).forEach(([key, value]) => {
      if (commonFields.includes(key)) {
        // Normalizar nomes de campos para a tabela mestre
        if (key.includes('numero_')) {
          masterData.numero_documento = value;
        } else if (key === 'data' || key === 'data_de_emissao') {
          masterData.data_emissao = value;
        } else if (key === 'valor') {
          masterData.valor_total = value;
        } else {
          masterData[key] = value;
        }
      } else {
        // Campos específicos vão para a tabela especializada
        specificData[key] = value;
      }
    });

    // Adicionar resumo à tabela mestre se disponível
    if (summary) {
      masterData.descricao = summary;
    }

    console.log('💾 DOC SAVE: Dados mestre:', Object.keys(masterData));
    console.log('💾 DOC SAVE: Dados específicos:', Object.keys(specificData));

    // ETAPA 1: Inserir na tabela mestre (documentos)
    const { data: masterDoc, error: masterError } = await supabase
      .from('gestaodocumentos.documentos')
      .insert([masterData])
      .select();

    if (masterError) {
      console.error('💾 DOC SAVE: Erro ao inserir na tabela mestre:', masterError);
      throw masterError;
    }

    if (!masterDoc || masterDoc.length === 0) {
      throw new Error('Documento mestre não foi criado');
    }

    const documentoId = masterDoc[0].id;
    console.log('💾 DOC SAVE: Documento mestre criado com ID:', documentoId);

    // ETAPA 2: Inserir na tabela específica com documento_id
    specificData.documento_id = documentoId;

    const { data: specificDoc, error: specificError } = await supabase
      .from(specificTableName)
      .insert([specificData])
      .select();

    if (specificError) {
      console.error('💾 DOC SAVE: Erro ao inserir na tabela específica:', specificError);
      // Tentar reverter (deletar documento mestre)
      await supabase.from('gestaodocumentos.documentos').delete().eq('id', documentoId);
      throw specificError;
    }

    console.log('💾 DOC SAVE: Documento salvo com sucesso!');

    return Response.json({
      success: true,
      data: {
        master: masterDoc[0],
        specific: specificDoc?.[0],
      },
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
