import { NextResponse } from 'next/server'
import { bigQueryConfig } from '@/services/bigquery'

export async function GET() {
  try {
    // Get environment info
    const envInfo = bigQueryConfig.getEnvironmentInfo()
    
    // Test configuration
    const configTest = await bigQueryConfig.testConfiguration()
    
    return NextResponse.json({
      success: true,
      environment: envInfo,
      configuration: configTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('BigQuery test endpoint error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Configuration test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        environment: bigQueryConfig.getEnvironmentInfo(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}