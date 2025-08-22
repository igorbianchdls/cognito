import { tool } from 'ai';
import { z } from 'zod';


export const criarGrafico = tool({
  description: 'Create data visualizations and charts from getData results. CRITICAL INSTRUCTIONS: 1) You MUST first use getData tool to get table data, 2) Copy the EXACT "data" array from getData output, 3) Paste it as tableData parameter - DO NOT make new queries or type data manually',
  inputSchema: z.object({
    tableData: z.array(z.record(z.unknown())).describe('PASTE the exact "data" array from previous getData tool output here. This should be an array of objects like [{col1: value1, col2: value2}, ...]. NEVER type this manually - always copy from getData results.'),
    chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'area', 'heatmap', 'radar', 'funnel', 'treemap', 'stream']).describe('Type of chart to create'),
    xColumn: z.string().describe('Column name for X-axis'),
    yColumn: z.string().describe('Column name for Y-axis (should be numeric for most charts)'),
    title: z.string().optional().describe('Chart title'),
    groupBy: z.string().optional().describe('Optional column to group/aggregate by - useful for pie charts')
  }),
  execute: async ({ tableData, chartType, xColumn, yColumn, title, groupBy }) => {
    console.log('📊 ===== CRIAR GRAFICO DEBUG START =====');
    console.log('📊 Raw parameters received:', { 
      hasTableData: !!tableData,
      tableDataType: typeof tableData,
      isArray: Array.isArray(tableData),
      dataLength: tableData ? tableData.length : 0, 
      chartType, 
      xColumn, 
      yColumn, 
      title, 
      groupBy 
    });
    
    // EXTENSIVE DEBUG: Log complete data structure
    if (tableData) {
      console.log('📊 TableData full structure (first 200 chars):', JSON.stringify(tableData, null, 2).substring(0, 200));
      
      if (Array.isArray(tableData) && tableData.length > 0) {
        console.log('📊 First row complete:', JSON.stringify(tableData[0], null, 2));
        console.log('📊 Available columns:', Object.keys(tableData[0]));
        console.log('📊 Total rows in tableData:', tableData.length);
        console.log('📊 Sample values from first row:');
        Object.entries(tableData[0]).forEach(([key, value]) => {
          console.log(`   - ${key}: ${value} (${typeof value})`);
        });
      } else if (!Array.isArray(tableData)) {
        console.log('❌ CRITICAL ERROR: tableData is not an array!', typeof tableData);
        console.log('📊 Actual tableData value:', tableData);
      } else {
        console.log('❌ CRITICAL ERROR: tableData is empty array');
      }
    } else {
      console.log('❌ CRITICAL ERROR: tableData is null/undefined');
    }
    
    try {
      // ENHANCED VALIDATION with detailed error messages
      if (!tableData) {
        console.error('❌ VALIDATION FAILED: tableData is null/undefined');
        return {
          success: false,
          error: 'ERROR: No tableData provided. You must copy the "data" array from a previous getData tool result and paste it as the tableData parameter. Do not type it manually.',
          chartType,
          xColumn,
          yColumn,
          debugInfo: 'tableData was null/undefined'
        };
      }
      
      if (!Array.isArray(tableData)) {
        console.error('❌ VALIDATION FAILED: tableData is not an array, received:', typeof tableData);
        return {
          success: false,
          error: `ERROR: tableData must be an array, but received ${typeof tableData}. Copy the exact "data" array from getData results.`,
          chartType,
          xColumn,
          yColumn,
          debugInfo: `tableData type: ${typeof tableData}, value: ${JSON.stringify(tableData).substring(0, 100)}`
        };
      }
      
      if (tableData.length === 0) {
        console.error('❌ VALIDATION FAILED: tableData array is empty');
        return {
          success: false,
          error: 'ERROR: tableData array is empty. Make sure to copy the "data" array from a getData result that contains actual data.',
          chartType,
          xColumn,
          yColumn,
          debugInfo: 'tableData was empty array []'
        };
      }

      // Validate columns exist in data
      const firstRow = tableData[0];
      if (!firstRow.hasOwnProperty(xColumn)) {
        return {
          success: false,
          error: `Column '${xColumn}' not found in table data. Available columns: ${Object.keys(firstRow).join(', ')}`,
          chartType,
          xColumn,
          yColumn
        };
      }

      if (!firstRow.hasOwnProperty(yColumn)) {
        return {
          success: false,
          error: `Column '${yColumn}' not found in table data. Available columns: ${Object.keys(firstRow).join(', ')}`,
          chartType,
          xColumn,
          yColumn
        };
      }

      let processedData: Array<{ x: string; y: number; label: string; value: number }> = [];

      // Process data based on chart type and groupBy
      if (chartType === 'pie' || groupBy) {
        const aggregateColumn = groupBy || xColumn;
        const valueColumn = yColumn;

        // Group and aggregate data
        const grouped: Record<string, number> = {};
        
        tableData.forEach(row => {
          const key = String(row[aggregateColumn] || 'Unknown');
          const value = chartType === 'pie' ? 1 : Number(row[valueColumn]) || 0;
          grouped[key] = (grouped[key] || 0) + value;
        });

        // Convert to chart data format and sort by value
        processedData = Object.entries(grouped)
          .map(([key, value]) => ({
            x: key,
            y: value,
            label: key,
            value: value
          }))
          .sort((a, b) => b.y - a.y)
          .slice(0, 10); // Limit to top 10

      } else {
        // For scatter/line/bar charts, use raw data
        processedData = tableData
          .filter(row => 
            row[xColumn] != null && 
            row[yColumn] != null &&
            !isNaN(Number(row[yColumn]))
          )
          .map((row) => ({
            x: String(row[xColumn]),
            y: Number(row[yColumn]) || 0,
            label: String(row[xColumn]),
            value: Number(row[yColumn]) || 0
          }))
          .slice(0, 20); // Limit to 20 points for performance
      }

      if (processedData.length === 0) {
        return {
          success: false,
          error: `No valid data points found for chart. Check if column '${yColumn}' contains numeric values.`,
          chartType,
          xColumn,
          yColumn
        };
      }

      console.log('📊 Chart data processed successfully:', {
        originalRows: tableData.length,
        processedPoints: processedData.length,
        sampleProcessedData: processedData.slice(0, 3),
        chartType,
        columnsUsed: { xColumn, yColumn, groupBy }
      });
      console.log('📊 ===== CRIAR GRAFICO DEBUG SUCCESS =====');

      return {
        success: true,
        chartData: processedData,
        chartType,
        xColumn,
        yColumn,
        title: title || `${yColumn} por ${xColumn}`,
        metadata: {
          totalDataPoints: processedData.length,
          generatedAt: new Date().toISOString(),
          executionTime: Date.now() - Date.now(), // Instant since no query
          dataSource: 'table-data'
        }
      };

    } catch (error) {
      console.error('❌ EXCEPTION in criarGrafico:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('📊 ===== CRIAR GRAFICO DEBUG FAILED =====');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chart from table data',
        chartType,
        xColumn,
        yColumn,
        debugInfo: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          tableDataReceived: !!tableData,
          tableDataType: typeof tableData,
          tableDataLength: tableData ? tableData.length : 'N/A'
        }
      };
    }
  },
});

export const criarDashboard = tool({
  description: 'Create interactive dashboards with multiple visualizations and KPIs',
  inputSchema: z.object({
    datasetIds: z.array(z.string()).describe('Array of dataset IDs to include'),
    title: z.string().describe('Dashboard title'),
    dashboardType: z.enum(['executive', 'operational', 'analytical']).describe('Type of dashboard'),
    kpis: z.array(z.string()).optional().describe('Key performance indicators to include')
  }),
  execute: async ({ datasetIds, title, dashboardType, kpis = [] }) => {
    // Mock dashboard components
    const dashboardTypes = {
      executive: {
        widgets: [
          {
            type: 'kpi',
            title: 'Total Revenue',
            value: 'R$ 2.4M',
            trend: '+12%',
            color: 'green'
          },
          {
            type: 'kpi',
            title: 'Active Customers',
            value: '15.2K',
            trend: '+8%',
            color: 'blue'
          },
          {
            type: 'chart',
            title: 'Revenue Trend',
            chartType: 'line',
            size: 'large'
          }
        ]
      },
      operational: {
        widgets: [
          {
            type: 'metric',
            title: 'Orders Today',
            value: '1,247',
            target: '1,200'
          },
          {
            type: 'chart',
            title: 'Hourly Orders',
            chartType: 'bar',
            size: 'medium'
          },
          {
            type: 'table',
            title: 'Top Products',
            rows: 10
          }
        ]
      },
      analytical: {
        widgets: [
          {
            type: 'chart',
            title: 'Customer Segmentation',
            chartType: 'pie',
            size: 'medium'
          },
          {
            type: 'chart',
            title: 'Correlation Analysis',
            chartType: 'scatter',
            size: 'large'
          },
          {
            type: 'insights',
            title: 'Key Insights',
            items: ['Pattern A identified', 'Anomaly in dataset B']
          }
        ]
      }
    };

    return {
      dashboardId: `dashboard_${Date.now()}`,
      title,
      dashboardType,
      datasetIds,
      widgets: dashboardTypes[dashboardType].widgets,
      kpis: kpis.length > 0 ? kpis : ['Revenue', 'Growth', 'Conversion'],
      layout: {
        columns: dashboardType === 'executive' ? 2 : 3,
        theme: 'modern',
        autoRefresh: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      },
      success: true
    };
  },
});

export const criarKPI = tool({
  description: 'Create Key Performance Indicator metrics with calculations and targets',
  inputSchema: z.object({
    name: z.string().describe('KPI name'),
    datasetId: z.string().describe('Source dataset ID'),
    tableId: z.string().describe('Source table ID'),
    metric: z.enum(['sum', 'count', 'avg', 'min', 'max', 'ratio']).describe('Type of calculation'),
    calculation: z.string().describe('Calculation formula or column name'),
    target: z.number().optional().describe('Target value for the KPI'),
    unit: z.string().optional().describe('Unit of measurement (%, $, count, etc)')
  }),
  execute: async ({ name, datasetId, tableId, metric, calculation, target, unit = 'count' }) => {
    // Mock KPI calculation
    const baseValue = Math.floor(Math.random() * 10000) + 1000;
    const currentValue = target ? (baseValue % target) + (target * 0.7) : baseValue;
    // const previousValue = currentValue * (0.85 + Math.random() * 0.3);
    
    const kpiData = {
      revenue: { current: 245000, target: 250000, unit: '$' },
      conversion: { current: 3.2, target: 4.0, unit: '%' },
      customers: { current: 15240, target: 18000, unit: 'count' },
      satisfaction: { current: 4.7, target: 5.0, unit: 'rating' }
    };

    const mockKey = Object.keys(kpiData)[Math.floor(Math.random() * Object.keys(kpiData).length)] as keyof typeof kpiData;
    const mockData = kpiData[mockKey];

    return {
      kpiId: `kpi_${Date.now()}`,
      name,
      datasetId,
      tableId,
      metric,
      calculation,
      currentValue: mockData.current,
      previousValue: mockData.current * 0.92,
      target: target || mockData.target,
      unit: unit || mockData.unit,
      change: ((mockData.current - (mockData.current * 0.92)) / (mockData.current * 0.92)) * 100,
      trend: 'increasing',
      status: mockData.current >= (target || mockData.target) ? 'on-target' : 'below-target',
      timeRange: 'last-30-days',
      visualization: {
        chartType: 'gauge',
        color: mockData.current >= (target || mockData.target) ? 'green' : 'orange',
        showTrend: true,
        showTarget: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        refreshRate: 'daily',
        dataSource: `${datasetId}.${tableId}`
      },
      success: true
    };
  },
});

export const criarTabela = tool({
  description: 'Create new BigQuery tables with custom schema definition',
  inputSchema: z.object({
    datasetId: z.string().describe('Dataset ID where table will be created'),
    tableName: z.string().describe('Name of the table to create'),
    schema: z.array(z.object({
      name: z.string(),
      type: z.enum(['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP']),
      mode: z.enum(['REQUIRED', 'NULLABLE', 'REPEATED']).optional()
    })).describe('Table schema definition'),
    description: z.string().optional().describe('Table description')
  }),
  execute: async ({ datasetId, tableName, schema, description }) => {
    // Mock table creation
    const tableId = `${tableName}_${Date.now()}`;
    const creationTime = new Date().toISOString();
    
    return {
      datasetId,
      tableName,
      tableId,
      schema: schema.map(col => ({
        ...col,
        mode: col.mode || 'NULLABLE'
      })),
      description: description || `Table created: ${tableName}`,
      location: 'US',
      creationTime,
      lastModifiedTime: creationTime,
      numRows: 0,
      numBytes: 0,
      expirationTime: null,
      labels: {},
      metadata: {
        tableType: 'TABLE',
        createdBy: 'BigQuery Tool',
        version: '1.0'
      },
      success: true
    };
  },
});