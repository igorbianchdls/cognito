const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

async function createSheetWithData() {
  try {
    // Initialize Google Sheets API
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Create a new spreadsheet
    console.log('Creating new spreadsheet...');
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Dados Básicos - Exemplo',
        },
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    
    console.log(`✅ Spreadsheet created successfully!`);
    console.log(`📋 ID: ${spreadsheetId}`);
    console.log(`🔗 URL: ${url}`);

    // 2. Add headers and sample data
    console.log('\nAdding data to spreadsheet...');
    
    const sampleData = [
      ['Nome', 'Idade', 'Cidade', 'Profissão', 'Salário'],
      ['Ana Silva', '28', 'São Paulo', 'Desenvolvedora', 'R$ 8.500'],
      ['Carlos Oliveira', '35', 'Rio de Janeiro', 'Designer', 'R$ 6.200'],
      ['Maria Santos', '42', 'Belo Horizonte', 'Gerente de Projetos', 'R$ 12.000'],
      ['João Pereira', '30', 'Porto Alegre', 'Analista de Dados', 'R$ 7.800'],
      ['Fernanda Costa', '26', 'Brasília', 'UX Designer', 'R$ 5.900']
    ];

    const writeResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1:E6',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: sampleData,
      },
    });

    console.log(`✅ Data added successfully! ${writeResponse.data.updatedCells} cells updated.`);

    // 3. Format the header row (make it bold)
    console.log('\nFormatting header row...');
    
    const formatResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 5
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9
                  }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }
        ]
      }
    });

    console.log('✅ Header formatting applied successfully!');
    
    console.log('\n🎉 All done! Your spreadsheet is ready.');
    console.log(`🔗 Access it here: ${url}`);
    
    return {
      spreadsheetId,
      url,
      title: 'Dados Básicos - Exemplo'
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the function
createSheetWithData()
  .then(result => {
    console.log('\n📊 Final result:', result);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });