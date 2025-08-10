import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      displayWeather: tool({
        description: 'Get weather information for a specific location and display it in a beautiful weather card',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          // Simulate weather data
          const temperature = 72 + Math.floor(Math.random() * 21) - 10;
          return {
            location,
            temperature
          };
        },
      }),
      getDatasets: tool({
        description: 'Get list of BigQuery datasets available in a project',
        inputSchema: z.object({
          projectId: z.string().optional().describe('The project ID to get datasets from'),
        }),
        execute: async ({ projectId }) => {
          // Mock datasets data
          const datasets = [
            {
              id: 'ecommerce_data',
              friendlyName: 'E-commerce Analytics',
              description: 'Customer transactions, product catalog, and sales data',
              location: 'US',
              creationTime: '2024-01-15T10:30:00Z',
              lastModifiedTime: '2024-08-10T14:22:00Z'
            },
            {
              id: 'user_behavior',
              friendlyName: 'User Behavior Tracking',
              description: 'Website clicks, page views, and user journey analytics',
              location: 'EU',
              creationTime: '2024-02-20T16:45:00Z',
              lastModifiedTime: '2024-08-09T09:15:00Z'
            },
            {
              id: 'financial_reports',
              friendlyName: 'Financial Data',
              description: 'Revenue, costs, and financial performance metrics',
              location: 'US',
              creationTime: '2024-03-10T11:20:00Z',
              lastModifiedTime: '2024-08-08T17:30:00Z'
            },
            {
              id: 'marketing_campaigns',
              friendlyName: 'Marketing Analytics',
              description: 'Campaign performance, ad spend, and conversion data',
              location: 'US',
              creationTime: '2024-04-05T13:15:00Z',
              lastModifiedTime: '2024-08-07T12:45:00Z'
            }
          ];

          return {
            datasets,
            success: true,
            projectId: projectId || 'default-project'
          };
        },
      }),
      getTables: tool({
        description: 'Get list of tables in a specific BigQuery dataset',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID to get tables from'),
        }),
        execute: async ({ datasetId }) => {
          // Mock tables data based on dataset
          const tablesByDataset: Record<string, Array<{
            tableId: string;
            description: string;
            numRows: number;
            numBytes: number;
            creationTime: string;
          }>> = {
            'ecommerce_data': [
              {
                tableId: 'customers',
                description: 'Customer information and demographics',
                numRows: 150000,
                numBytes: 45000000,
                creationTime: '2024-01-20T09:15:00Z'
              },
              {
                tableId: 'orders',
                description: 'Customer orders and transaction data',
                numRows: 500000,
                numBytes: 120000000,
                creationTime: '2024-01-20T09:20:00Z'
              },
              {
                tableId: 'products',
                description: 'Product catalog with pricing and categories',
                numRows: 25000,
                numBytes: 8000000,
                creationTime: '2024-01-20T09:25:00Z'
              },
              {
                tableId: 'order_items',
                description: 'Individual items within each order',
                numRows: 1200000,
                numBytes: 180000000,
                creationTime: '2024-01-20T09:30:00Z'
              }
            ],
            'user_behavior': [
              {
                tableId: 'page_views',
                description: 'Website page view tracking data',
                numRows: 2500000,
                numBytes: 350000000,
                creationTime: '2024-02-25T11:00:00Z'
              },
              {
                tableId: 'sessions',
                description: 'User session information and duration',
                numRows: 800000,
                numBytes: 95000000,
                creationTime: '2024-02-25T11:10:00Z'
              },
              {
                tableId: 'events',
                description: 'Custom events and user interactions',
                numRows: 5000000,
                numBytes: 650000000,
                creationTime: '2024-02-25T11:20:00Z'
              }
            ],
            'financial_reports': [
              {
                tableId: 'revenue_daily',
                description: 'Daily revenue breakdown by channel',
                numRows: 3650,
                numBytes: 1200000,
                creationTime: '2024-03-15T14:30:00Z'
              },
              {
                tableId: 'expenses',
                description: 'Operating expenses and cost tracking',
                numRows: 12000,
                numBytes: 2800000,
                creationTime: '2024-03-15T14:35:00Z'
              },
              {
                tableId: 'profit_loss',
                description: 'Monthly profit and loss statements',
                numRows: 120,
                numBytes: 450000,
                creationTime: '2024-03-15T14:40:00Z'
              }
            ]
          };

          const tables = tablesByDataset[datasetId] || [];
          
          return {
            tables,
            datasetId,
            success: true
          };
        },
      }),
      getData: tool({
        description: 'Get data from a specific BigQuery table',
        inputSchema: z.object({
          datasetId: z.string().describe('The dataset ID'),
          tableId: z.string().describe('The table ID to get data from'),
          limit: z.number().optional().describe('Maximum number of rows to return (default: 100)')
        }),
        execute: async ({ datasetId, tableId, limit = 100 }) => {
          // Mock data based on table
          const mockDataByTable: Record<string, {
            schema: Array<{ name: string; type: string; mode: string }>;
            data: Array<Record<string, unknown>>;
          }> = {
            'customers': {
              schema: [
                { name: 'customer_id', type: 'INTEGER', mode: 'REQUIRED' },
                { name: 'name', type: 'STRING', mode: 'REQUIRED' },
                { name: 'email', type: 'STRING', mode: 'REQUIRED' },
                { name: 'age', type: 'INTEGER', mode: 'NULLABLE' },
                { name: 'city', type: 'STRING', mode: 'NULLABLE' },
                { name: 'signup_date', type: 'DATE', mode: 'REQUIRED' }
              ],
              data: [
                { customer_id: 1001, name: 'Ana Silva', email: 'ana@email.com', age: 28, city: 'São Paulo', signup_date: '2024-01-15' },
                { customer_id: 1002, name: 'João Santos', email: 'joao@email.com', age: 34, city: 'Rio de Janeiro', signup_date: '2024-01-16' },
                { customer_id: 1003, name: 'Maria Costa', email: 'maria@email.com', age: 45, city: 'Belo Horizonte', signup_date: '2024-01-17' },
                { customer_id: 1004, name: 'Pedro Lima', email: 'pedro@email.com', age: 29, city: 'Salvador', signup_date: '2024-01-18' },
                { customer_id: 1005, name: 'Carla Oliveira', email: 'carla@email.com', age: 52, city: 'Brasília', signup_date: '2024-01-19' }
              ]
            },
            'orders': {
              schema: [
                { name: 'order_id', type: 'INTEGER', mode: 'REQUIRED' },
                { name: 'customer_id', type: 'INTEGER', mode: 'REQUIRED' },
                { name: 'order_date', type: 'DATE', mode: 'REQUIRED' },
                { name: 'total_amount', type: 'FLOAT', mode: 'REQUIRED' },
                { name: 'status', type: 'STRING', mode: 'REQUIRED' }
              ],
              data: [
                { order_id: 5001, customer_id: 1001, order_date: '2024-08-01', total_amount: 299.99, status: 'completed' },
                { order_id: 5002, customer_id: 1002, order_date: '2024-08-02', total_amount: 159.50, status: 'completed' },
                { order_id: 5003, customer_id: 1003, order_date: '2024-08-03', total_amount: 89.99, status: 'pending' },
                { order_id: 5004, customer_id: 1001, order_date: '2024-08-04', total_amount: 450.00, status: 'completed' },
                { order_id: 5005, customer_id: 1004, order_date: '2024-08-05', total_amount: 199.99, status: 'shipped' }
              ]
            },
            'page_views': {
              schema: [
                { name: 'session_id', type: 'STRING', mode: 'REQUIRED' },
                { name: 'page_url', type: 'STRING', mode: 'REQUIRED' },
                { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
                { name: 'duration_seconds', type: 'INTEGER', mode: 'NULLABLE' },
                { name: 'device_type', type: 'STRING', mode: 'NULLABLE' }
              ],
              data: [
                { session_id: 'sess_001', page_url: '/home', timestamp: '2024-08-10T10:30:00Z', duration_seconds: 45, device_type: 'desktop' },
                { session_id: 'sess_002', page_url: '/products', timestamp: '2024-08-10T10:31:00Z', duration_seconds: 120, device_type: 'mobile' },
                { session_id: 'sess_003', page_url: '/about', timestamp: '2024-08-10T10:32:00Z', duration_seconds: 30, device_type: 'tablet' },
                { session_id: 'sess_001', page_url: '/products/123', timestamp: '2024-08-10T10:33:00Z', duration_seconds: 90, device_type: 'desktop' },
                { session_id: 'sess_004', page_url: '/contact', timestamp: '2024-08-10T10:34:00Z', duration_seconds: 15, device_type: 'mobile' }
              ]
            }
          };

          const tableData = mockDataByTable[tableId] || { schema: [], data: [] };
          const limitedData = tableData.data.slice(0, limit);

          return {
            data: limitedData,
            schema: tableData.schema,
            totalRows: tableData.data.length,
            executionTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
            success: true,
            datasetId,
            tableId
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}