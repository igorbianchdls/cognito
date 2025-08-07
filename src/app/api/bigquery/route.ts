import { NextRequest, NextResponse } from 'next/server'
import { bigQueryService } from '@/services/bigquery'

export async function GET(request: NextRequest) {
  console.log('🚀 BigQuery GET endpoint called')
  console.log('🔍 Environment debug:')
  console.log('- VERCEL:', process.env.VERCEL)
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID)
  console.log('- Has GOOGLE_APPLICATION_CREDENTIALS_JSON:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS)
  
  try {
    // Initialize BigQuery service if not already done
    console.log('🔧 Checking if BigQuery service needs initialization...')
    console.log('- Service client exists:', !!bigQueryService['client'])
    
    if (!bigQueryService['client']) {
      console.log('⚡ Initializing BigQuery service...')
      await bigQueryService.initialize()
      console.log('✅ BigQuery service initialized successfully')
    } else {
      console.log('✅ BigQuery service already initialized')
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'tables'
    console.log('🎯 Action requested:', action)

    switch (action) {
      case 'datasets':
        console.log('🔍 Attempting to list datasets...')
        try {
          const datasets = await bigQueryService.listDatasets()
          console.log('✅ Datasets retrieved successfully:', datasets.length, 'datasets found')
          console.log('📊 Dataset details:', datasets)
          return NextResponse.json({ success: true, data: datasets })
        } catch (datasetError) {
          console.error('❌ Error listing datasets:', datasetError)
          console.error('Error details:', {
            message: datasetError instanceof Error ? datasetError.message : 'Unknown error',
            stack: datasetError instanceof Error ? datasetError.stack : undefined
          })
          throw datasetError
        }

      case 'tables':
        const datasetId = searchParams.get('dataset')
        const tables = await bigQueryService.listTables(datasetId || undefined)
        return NextResponse.json({ success: true, data: tables })

      case 'schema':
        const schemaDataset = searchParams.get('dataset')
        const schemaTable = searchParams.get('table')
        
        if (!schemaDataset || !schemaTable) {
          return NextResponse.json(
            { error: 'Dataset and table parameters are required for schema action' },
            { status: 400 }
          )
        }

        const schema = await bigQueryService.getTableSchema(schemaDataset, schemaTable)
        return NextResponse.json({ success: true, data: schema })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: datasets, tables, schema' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('BigQuery API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 BigQuery POST endpoint called')
  console.log('🔍 Environment debug:')
  console.log('- VERCEL:', process.env.VERCEL)
  console.log('- NODE_ENV:', process.env.NODE_ENV)
  console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID)
  console.log('- Has GOOGLE_APPLICATION_CREDENTIALS_JSON:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  
  try {
    // Initialize BigQuery service if not already done
    console.log('🔧 Checking if BigQuery service needs initialization...')
    console.log('- Service client exists:', !!bigQueryService['client'])
    
    if (!bigQueryService['client']) {
      console.log('⚡ Initializing BigQuery service...')
      await bigQueryService.initialize()
      console.log('✅ BigQuery service initialized successfully')
    } else {
      console.log('✅ BigQuery service already initialized')
    }

    const body = await request.json()
    const { query, parameters, action, dataset, table, options } = body

    switch (action) {
      case 'execute':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for execute action' },
            { status: 400 }
          )
        }

        const result = await bigQueryService.executeQuery({
          query,
          parameters,
          location: process.env.BIGQUERY_LOCATION
        })

        return NextResponse.json({ success: true, data: result })

      case 'query-table':
        if (!dataset || !table) {
          return NextResponse.json(
            { error: 'Dataset and table are required for query-table action' },
            { status: 400 }
          )
        }

        const tableResult = await bigQueryService.queryTable(dataset, table, options || {})
        return NextResponse.json({ success: true, data: tableResult })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: execute, query-table' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('BigQuery API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}