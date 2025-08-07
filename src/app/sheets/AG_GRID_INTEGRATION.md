# AG Grid Integration - Complete Documentation

## 🎯 Overview

This document provides comprehensive documentation of the AG Grid integration within the Sheets application, covering data flow, store management, BigQuery integration, and component architecture.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Store Management](#store-management)
3. [Data Flow](#data-flow)
4. [BigQuery Integration](#bigquery-integration)
5. [Component Structure](#component-structure)
6. [Column Definitions](#column-definitions)
7. [Data Types & Formatting](#data-types--formatting)
8. [Import/Export Systems](#importexport-systems)
9. [API Endpoints](#api-endpoints)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

The Sheets AG Grid integration follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    SHEETS ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│  UI Layer        │  Store Layer    │  Service Layer         │
│  ┌─────────────┐  │  ┌────────────┐ │  ┌───────────────────┐ │
│  │ AGGridSheet │  │  │ NanoStores │ │  │ BigQuery Service  │ │
│  │ RightPanel  │  │  │ sheetsStore│ │  │ CSV Import        │ │
│  │ Sidebar     │  │  │            │ │  │ API Routes        │ │
│  └─────────────┘  │  └────────────┘ │  └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Components:
- **AGGridSheet**: Main grid component with AG Grid Enterprise features
- **DatasetsSidebar**: Dataset management and BigQuery integration
- **RightPanel**: Tabbed interface for datasets and chat
- **Store Management**: Reactive state using NanoStores
- **BigQuery Service**: Modular BigQuery integration with auto-location detection

---

## 🗄️ Store Management

### Core Stores (`src/stores/sheetsStore.ts`)

```typescript
// Primary stores
export const availableDatasetsStore = atom<DatasetInfo[]>(MOCK_DATASETS)
export const activeDatasetIdStore = atom<string>('produtos')
export const activeDatasetStore = atom<ActiveDataset | null>(null)
export const sheetDataStore = atom<SheetData>(initialSheetData)
export const isSheetLoadingStore = atom<boolean>(false)
```

### Data Types

```typescript
interface DatasetInfo {
  id: string
  name: string
  description: string
  rows: number
  columns: number
  size: string
  type: 'csv' | 'json' | 'bigquery'
  lastModified: Date
  data: Array<Record<string, unknown>>
  columnDefs: ColDef[]
}

interface ActiveDataset {
  id: string
  name: string
  data: Array<Record<string, unknown>>
  columnDefs: ColDef[]
  totalRows: number
  totalCols: number
}
```

### Store Operations

```typescript
// Switch between datasets
export const switchToDataset = (datasetId: string) => {
  const datasets = availableDatasetsStore.get()
  const dataset = datasets.find(ds => ds.id === datasetId)
  
  if (dataset) {
    activeDatasetIdStore.set(datasetId)
    isSheetLoadingStore.set(true)
    
    // Transform data for AG Grid
    const activeDataset: ActiveDataset = {
      id: dataset.id,
      name: dataset.name,
      data: dataset.data || [],
      columnDefs: dataset.columnDefs || [],
      totalRows: dataset.rows,
      totalCols: dataset.columns
    }
    
    activeDatasetStore.set(activeDataset)
    isSheetLoadingStore.set(false)
  }
}
```

---

## 🔄 Data Flow

### 1. Data Source → Store → AG Grid Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│ Data Source │ ─→ │ Dataset      │ ─→ │ Active      │ ─→ │ AG Grid  │
│ (BQ/CSV)    │    │ Store        │    │ Dataset     │    │ Display  │
│             │    │              │    │ Store       │    │          │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────┘
```

### 2. User Interaction Flow

```
User clicks table → Hook loads data → Dataset created → Store updated → AG Grid refreshes
```

### 3. Detailed Flow Example (BigQuery)

```typescript
// 1. User clicks BigQuery table in sidebar
const handleTableSelect = async (table: BigQueryTable) => {
  // 2. Load data using specialized hook
  const tableData = await bigQuery.selectTable(tableId)
  
  // 3. Create dataset with intelligent column definitions
  const newDataset = createBigQueryDataset(tableId, tableData)
  
  // 4. Update store and activate dataset
  const updatedDatasets = [...currentDatasets, newDataset]
  availableDatasetsStore.set(updatedDatasets)
  switchToDataset(newDataset.id)
  
  // 5. AG Grid automatically updates via store subscription
}
```

---

## 🔗 BigQuery Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIGQUERY INTEGRATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ BigQuerySection  │  │ useBigQuerySidebar│  │ BigQuery       │ │
│  │ Component        │  │ Hook              │  │ Service        │ │
│  │                  │  │                  │  │                │ │
│  │ • UI Interface   │  │ • Location       │  │ • Query        │ │
│  │ • Loading States │  │   Detection      │  │   Execution    │ │
│  │ • Table List     │  │ • Data Loading   │  │ • Authentication│ │
│  │                  │  │ • Error Handling │  │ • Metadata     │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ bigQueryUtils    │  │ API Routes       │  │ Environment    │ │
│  │                  │  │                  │  │                │ │
│  │ • Type Detection │  │ • GET /bigquery  │  │ • Credentials  │ │
│  │ • Column Defs    │  │ • POST /bigquery │  │ • Project ID   │ │
│  │ • Formatting     │  │ • Dataset Info   │  │ • Location     │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. BigQuerySection Component

**Location**: `src/components/sheets/BigQuerySection.tsx`

**Features**:
- Collapsible section with table count
- Location detection and display
- Loading states for location and data
- Error handling and display
- Debug information in development

```typescript
export default function BigQuerySection({ onDatasetLoad }: BigQuerySectionProps) {
  const bigQuery = useBigQuerySidebar('biquery_data')
  
  const handleTableSelect = async (table: BigQueryTable) => {
    const tableData = await bigQuery.selectTable(tableId)
    if (tableData) {
      const newDataset = createBigQueryDataset(tableId, tableData)
      onDatasetLoad?.(newDataset)
    }
  }
  
  // Render interface with tables list, loading states, etc.
}
```

#### 2. useBigQuerySidebar Hook

**Location**: `src/hooks/useBigQuerySidebar.ts`

**Features**:
- Automatic location detection on mount
- Table data loading with correct location
- Error handling and state management
- Integration with existing table listing

```typescript
export function useBigQuerySidebar(datasetId: string) {
  const [state, setState] = useState<BigQuerySidebarState>({
    selectedTable: '',
    datasetLocation: null,
    locationDetected: false,
    // ... other state
  })

  const detectLocation = useCallback(async () => {
    const response = await fetch(`/api/bigquery?action=dataset-info&dataset=${datasetId}`)
    // Handle response and update state
  }, [datasetId])

  const selectTable = useCallback(async (tableId: string) => {
    // Load table data with detected location
    const query = `SELECT * FROM \`creatto-463117.${datasetId}.${tableId}\` LIMIT 1000`
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      body: JSON.stringify({
        action: 'execute',
        query,
        location: state.datasetLocation
      })
    })
    // Process and return data
  }, [datasetId, state.datasetLocation])

  return { /* state and actions */ }
}
```

#### 3. BigQuery Utilities

**Location**: `src/utils/bigQueryUtils.ts`

**Features**:
- Intelligent type detection for columns
- AG Grid column definition creation
- Data formatting functions
- Dataset creation utilities

```typescript
// Detect data types from samples
export const detectColumnType = (key: string, data: Record<string, unknown>[]) => {
  const samples = data.slice(0, 10).map(row => row[key]).filter(val => val != null)
  
  if (samples.every(val => typeof val === 'boolean' || /* boolean checks */)) return 'boolean'
  if (samples.every(val => !isNaN(Number(val)) && isFinite(Number(val)))) return 'number'
  if (samples.every(val => /* date validation */)) return 'date'
  return 'string'
}

// Create AG Grid column definitions
export const createBigQueryColumnDefs = (data: Record<string, unknown>[]): ColDef[] => {
  return keys.map(key => {
    const type = detectColumnType(key, data)
    // Return appropriate ColDef based on type
  })
}
```

### BigQuery Service Integration

**Location**: `src/services/bigquery.ts`

**Key Features**:
- Location-aware query execution
- Automatic credential handling (local/production)
- Connection testing and validation
- Dataset metadata retrieval

```typescript
class BigQueryService {
  async executeQuery(options: QueryOptions): Promise<QueryResult> {
    const queryOptions = {
      query: options.query,
      location: options.location || this.config?.location || 'US',
      params: options.parameters || {},
      jobTimeoutMs: options.jobTimeoutMs || 30000,
    }

    const [job] = await this.client.createQueryJob(queryOptions)
    const [rows] = await job.getQueryResults()
    
    return {
      data: rows as Record<string, unknown>[],
      totalRows: rows.length,
      schema: jobMetadata.configuration?.query?.destinationTable?.schema?.fields || [],
      executionTime: Date.now() - startTime
    }
  }

  async getDatasetInfo(datasetId: string) {
    const dataset = this.client.dataset(datasetId)
    const [metadata] = await dataset.getMetadata()
    
    return {
      id: metadata.id,
      location: metadata.location,
      // ... other metadata
    }
  }
}
```

---

## 🏗️ Component Structure

### Main Sheets Page

**Location**: `src/app/sheets/page.tsx`

```typescript
export default function SheetsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content - AG Grid */}
      <div className="flex-1 flex flex-col">
        <TableHeader />
        <div className="flex-1">
          <AGGridSheet />
        </div>
      </div>
      
      {/* Right Panel - Datasets & Chat */}
      <div className="w-80 xl:w-96 border-l border-gray-200 bg-white">
        <RightPanel />
      </div>
    </div>
  )
}
```

### AG Grid Component

**Location**: `src/components/sheets/AGGridSheet.tsx`

```typescript
export default function AGGridSheet() {
  const activeDataset = useStore(activeDatasetStore)
  const isLoading = useStore(isSheetLoadingStore)

  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    editable: true,
  }

  const autoGroupColumnDef: ColDef = {
    headerName: 'Group',
    minWidth: 170,
    field: 'ag-Grid-AutoColumn',
    cellRenderer: 'agGroupCellRenderer',
  }

  return (
    <div className="ag-theme-alpine h-full w-full">
      <AgGridReact
        columnDefs={activeDataset?.columnDefs || []}
        rowData={activeDataset?.data || []}
        defaultColDef={defaultColDef}
        autoGroupColumnDef={autoGroupColumnDef}
        
        // Enterprise Features
        enableRangeSelection={true}
        enableRangeHandle={true}
        enableFillHandle={true}
        enableCharts={true}
        
        // Grid Options
        animateRows={true}
        enableCellChangeFlash={true}
        rowSelection="multiple"
        
        // Event Handlers
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        onSelectionChanged={onSelectionChanged}
      />
    </div>
  )
}
```

### Right Panel Structure

**Location**: `src/components/sheets/RightPanel.tsx`

```typescript
export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<'chat' | 'datasets'>('datasets')

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'datasets' && <DatasetsSidebar />}
        {activeTab === 'chat' && <SheetsChat />}
      </div>
    </div>
  )
}
```

---

## 📊 Column Definitions

### Intelligent Type Detection

The system automatically detects column types and creates appropriate AG Grid column definitions:

#### Number Columns
```typescript
case 'number':
  return {
    filter: 'agNumberColumnFilter',
    enableValue: true,
    aggFunc: key.toLowerCase().includes('id') ? 'count' : 'sum',
    valueFormatter: (params: ValueFormatterParams) => {
      const num = Number(params.value)
      return key.toLowerCase().includes('price') 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
        : new Intl.NumberFormat('pt-BR').format(num)
    },
    cellStyle: { textAlign: 'right' }
  }
```

#### Boolean Columns
```typescript
case 'boolean':
  return {
    filter: 'agSetColumnFilter',
    enablePivot: true,
    cellRenderer: (params: ICellRendererParams) => {
      const val = params.value
      if (val === true || val === 'true' || val === 1) return '✓'
      if (val === false || val === 'false' || val === 0) return '✗'
      return String(val || '')
    },
    cellStyle: (params: CellClassParams) => {
      const val = params.value
      const baseStyle = { textAlign: 'center' as const }
      if (val === true || val === 'true' || val === 1) {
        return { ...baseStyle, color: '#2e7d32', fontWeight: 'bold' }
      }
      if (val === false || val === 'false' || val === 0) {
        return { ...baseStyle, color: '#c62828', fontWeight: 'bold' }
      }
      return baseStyle
    }
  }
```

#### Date Columns
```typescript
case 'date':
  return {
    filter: 'agDateColumnFilter',
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.value) return ''
      const date = new Date(String(params.value))
      return isNaN(date.getTime()) 
        ? String(params.value) 
        : date.toLocaleDateString('pt-BR')
    }
  }
```

#### String Columns
```typescript
default: // string
  return {
    filter: 'agTextColumnFilter',
    enableRowGroup: true,
    enablePivot: true
  }
```

---

## 🎨 Data Types & Formatting

### Supported Data Types

| Type | Detection Logic | Formatting | AG Grid Features |
|------|----------------|------------|------------------|
| **Number** | `!isNaN(Number(val)) && isFinite(Number(val))` | Brazilian locale, Currency for prices | Right-aligned, Sum aggregation |
| **Boolean** | `val === true/false/'true'/'false'/1/0` | ✓/✗ with colors | Center-aligned, Set filter |
| **Date** | `!isNaN(Date.parse(val)) && contains('-'/'/')` | dd/mm/yyyy format | Date filter, No grouping |
| **String** | Default fallback | As-is | Text filter, Grouping, Pivot |

### Formatting Examples

```typescript
// Currency formatting (for price/valor columns)
"R$ 25.999,99"

// Number formatting
"1.234.567"

// Boolean formatting
✓ (green, bold)
✗ (red, bold)

// Date formatting
"25/12/2023"
```

---

## 📥📤 Import/Export Systems

### CSV Import System

**Components**:
- `CSVImportPlugin`: Core import functionality
- `CSVImportButton`: UI component
- `CSVPreviewModal`: Preview before import

**Flow**:
```typescript
// 1. User selects CSV file
const csvData = await csvPlugin.triggerFileSelect()

// 2. Plugin parses CSV data
const parsedData = {
  headers: string[],
  rows: unknown[][],
  fileName: string,
  fileSize: number,
  rowCount: number,
  columnCount: number
}

// 3. Create dataset
addDataset({
  headers: csvData.headers,
  rows: csvData.rows,
  fileName: csvData.fileName,
  // ... other properties
})

// 4. Dataset automatically appears in sidebar and can be activated
```

### Export System

**Supported Formats**:
- CSV export
- Excel export (planned)
- JSON export (via AG Grid)

```typescript
const handleExport = () => {
  const csvContent = [
    sheetData.headers.join(','),
    ...sheetData.rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'data.csv'
  link.click()
}
```

---

## 🔌 API Endpoints

### BigQuery API Routes

**Location**: `src/app/api/bigquery/route.ts`

#### GET Endpoints

```typescript
// List datasets
GET /api/bigquery?action=datasets
Response: { success: true, data: Dataset[] }

// List tables in dataset
GET /api/bigquery?action=tables&dataset=biquery_data
Response: { success: true, data: Table[] }

// Get table schema
GET /api/bigquery?action=schema&dataset=biquery_data&table=car_prices
Response: { success: true, data: Schema[] }

// Get dataset information (location detection)
GET /api/bigquery?action=dataset-info&dataset=biquery_data
Response: { 
  success: true, 
  data: { 
    id: string,
    location: string,
    creationTime: Date,
    // ... other metadata
  }
}
```

#### POST Endpoints

```typescript
// Execute query
POST /api/bigquery
Body: {
  action: 'execute',
  query: 'SELECT * FROM `project.dataset.table` LIMIT 1000',
  location?: 'US' | 'us-central1' | 'europe-west1', // Optional, auto-detected
  parameters?: Record<string, unknown>
}
Response: {
  success: true,
  data: {
    data: Record<string, unknown>[],
    totalRows: number,
    schema: SchemaField[],
    executionTime: number,
    bytesProcessed?: number
  }
}

// Query specific table
POST /api/bigquery
Body: {
  action: 'query-table',
  dataset: 'biquery_data',
  table: 'car_prices',
  options: {
    columns?: string[],
    where?: string,
    orderBy?: string,
    limit?: number,
    offset?: number
  }
}
```

### Error Handling

All API endpoints return consistent error format:
```typescript
{
  success: false,
  error: "Error message",
  message?: "Detailed error description",
  details?: "Stack trace or additional info"
}
```

---

## 🧪 Testing & Development

### Test Endpoints

**BigQuery Test Page**: `src/app/bigquery-test/page.tsx`

**Features**:
- Connection testing
- Dataset listing
- Table exploration
- Custom query execution
- Location detection
- Direct table data testing

**Usage**:
1. Navigate to `/bigquery-test`
2. Test connection with credentials
3. List available datasets
4. Explore tables in `biquery_data`
5. Test specific table data loading
6. Detect dataset location
7. Execute custom queries

### Debug Features

**Development Mode**:
- Console logging for data flow
- Debug info panels in BigQuery section
- Error details in API responses
- Location detection status

**Environment Variables**:
```bash
# Required
GOOGLE_PROJECT_ID=creatto-463117
BIGQUERY_DATASET_ID=biquery_data

# Location (auto-detected if not set)
BIGQUERY_LOCATION=us-central1

# Credentials
# Local: GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
# Production: GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Dataset not found in location US"

**Problem**: Dataset is in different region than expected
**Solution**: 
- Use location detection: Click "🔍 Detectar Location" in BigQuery section
- Configure `BIGQUERY_LOCATION` environment variable with correct region
- Common locations: `us-central1`, `US`, `europe-west1`

#### 2. BigQuery Tables Not Loading

**Checklist**:
- [ ] Credentials properly configured
- [ ] Project ID matches (`creatto-463117`)
- [ ] Dataset exists (`biquery_data`)
- [ ] Network connectivity to BigQuery API
- [ ] Location detected correctly

#### 3. AG Grid Not Updating

**Checklist**:
- [ ] Store subscription working
- [ ] Dataset has valid data
- [ ] Column definitions created
- [ ] No console errors
- [ ] Component re-rendering

#### 4. Import/Export Issues

**CSV Import**:
- File size limits
- Encoding issues (UTF-8)
- Invalid CSV format
- Memory constraints for large files

### Debugging Tools

#### Store Inspector

```typescript
// In browser console
import { availableDatasetsStore, activeDatasetStore } from '@/stores/sheetsStore'

// Check current datasets
console.log('Datasets:', availableDatasetsStore.get())

// Check active dataset
console.log('Active:', activeDatasetStore.get())
```

#### BigQuery Debug

```typescript
// In BigQuerySection component
{process.env.NODE_ENV === 'development' && (
  <details>
    <summary>🔧 Debug Info</summary>
    <div>
      Location: {bigQuery.datasetLocation}
      Location Detected: {bigQuery.locationDetected ? '✅' : '❌'}
      Selected Table: {bigQuery.selectedTable || 'None'}
      Tables Count: {bigQuery.tablesData?.length || 0}
    </div>
  </details>
)}
```

### Performance Optimization

#### Large Datasets

**Strategies**:
- Pagination: `LIMIT` and `OFFSET` in queries
- Virtual scrolling in AG Grid
- Lazy loading of column definitions
- Data streaming for real-time updates

**AG Grid Configuration**:
```typescript
// For large datasets
const gridOptions = {
  rowBuffer: 10,
  rowSelection: 'multiple',
  rowMultiSelectWithClick: true,
  suppressRowDeselection: true,
  enableRangeSelection: true,
  
  // Virtual scrolling
  rowModelType: 'infinite',
  paginationAutoPageSize: true,
  cacheBlockSize: 100,
  maxBlocksInCache: 10,
}
```

#### Memory Management

**Best Practices**:
- Clear unused datasets from store
- Implement data cleanup on component unmount
- Use WeakMap for temporary data storage
- Monitor store size in development

```typescript
// Store cleanup utility
export const cleanupOldDatasets = () => {
  const datasets = availableDatasetsStore.get()
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  
  const recent = datasets.filter(ds => 
    ds.lastModified.getTime() > oneHourAgo
  )
  
  availableDatasetsStore.set(recent)
}
```

---

## 🔄 Migration Guide

### From CUBE.js to BigQuery

**Previous Implementation**:
```typescript
// Old CUBE.js approach
const { data, loading, error } = useCubeQuery({
  measures: ['Orders.count'],
  dimensions: ['Orders.createdAt.granularity.day']
})
```

**New BigQuery Implementation**:
```typescript
// New BigQuery approach
const bigQuery = useBigQuerySidebar('biquery_data')
const tableData = await bigQuery.selectTable('orders')
const dataset = createBigQueryDataset('orders', tableData)
```

**Migration Steps**:
1. Replace CUBE.js hooks with BigQuery hooks
2. Update data transformation logic
3. Migrate query definitions to SQL
4. Update column definitions
5. Test data flow and formatting

### Breaking Changes

**v1.0 → v2.0**:
- `useCubeQuery` → `useBigQuerySidebar`
- Measure/dimension config → SQL queries
- CUBE.js schema → BigQuery table schema
- Time dimensions → SQL date functions

---

## 📚 Additional Resources

### Documentation Links
- [AG Grid Documentation](https://www.ag-grid.com/documentation/)
- [Google BigQuery API](https://cloud.google.com/bigquery/docs/reference/rest)
- [NanoStores Guide](https://github.com/nanostores/nanostores)
- [Next.js App Router](https://nextjs.org/docs/app)

### Code Examples
- BigQuery Test Page: `/bigquery-test`
- Full Sheets Implementation: `/sheets`
- Component Examples: `src/components/sheets/`

### Support
- GitHub Issues: Project repository issues
- Development Console: Browser dev tools
- Logs: Check browser console and server logs

---

## 📝 Changelog

### v2.0.0 - BigQuery Integration
- ✅ Added BigQuery service and API integration
- ✅ Implemented location auto-detection
- ✅ Created modular component architecture
- ✅ Added intelligent column type detection
- ✅ Implemented Brazilian localization
- ✅ Added comprehensive error handling

### v1.0.0 - Initial Release
- ✅ Basic AG Grid integration
- ✅ CSV import/export functionality
- ✅ Store management with NanoStores
- ✅ Sidebar dataset management
- ✅ Mock data system

---

*Generated automatically from codebase analysis*
*Last updated: $(date)*