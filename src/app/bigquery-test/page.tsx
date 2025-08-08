'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/navigation/Sidebar';
import { useBigQueryTables, useBigQueryTableData } from '@/hooks/useBigQuery';

interface BigQueryTestResult {
  success: boolean;
  data?: Record<string, unknown>[] | Record<string, unknown> | string | null;
  message?: string;
  error?: string;
}

export default function BigQueryTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<BigQueryTestResult | null>(null);
  const [datasets, setDatasets] = useState<BigQueryTestResult | null>(null);
  const [tables, setTables] = useState<BigQueryTestResult | null>(null);
  const [queryResult, setQueryResult] = useState<BigQueryTestResult | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [carPricesResult, setCarPricesResult] = useState<BigQueryTestResult | null>(null);
  const [datasetInfoResult, setDatasetInfoResult] = useState<BigQueryTestResult | null>(null);
  
  // Daytona Sandbox states
  const [sandbox, setSandbox] = useState<{ id: string; status: string; language?: string } | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle');
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python'>('typescript');
  const [command, setCommand] = useState<string>('echo "Hello from Daytona!"');
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<boolean>(false);
  const [cells, setCells] = useState<Array<{
    id: string;
    code: string;
    output: string;
    isRunning: boolean;
  }>>([]);
  
  // Use the new hooks
  const tablesHook = useBigQueryTables('biquery_data');
  const tableDataHook = useBigQueryTableData('biquery_data', selectedTable, 100) as {
    data: { data: Record<string, unknown>[] } | null;
    loading: boolean;
    error: string | null;
    execute: () => Promise<void>;
    refetch: () => Promise<void>;
  };

  // Execute table data hook when selectedTable changes (and is valid)
  useEffect(() => {
    if (selectedTable && selectedTable.trim() !== '') {
      tableDataHook.execute();
    }
  }, [selectedTable, tableDataHook]);

  const setLoadingState = (key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  const testConnection = async () => {
    setLoadingState('connection', true);
    try {
      const response = await fetch('/api/bigquery/test');
      const result = await response.json();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    } finally {
      setLoadingState('connection', false);
    }
  };



  const listDatasets = async () => {
    setLoadingState('datasets', true);
    try {
      const response = await fetch('/api/bigquery?action=datasets');
      const result = await response.json();
      setDatasets(result);
    } catch (error) {
      setDatasets({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list datasets'
      });
    } finally {
      setLoadingState('datasets', false);
    }
  };

  const listTables = async (datasetId: string) => {
    if (!datasetId) return;
    
    setLoadingState('tables', true);
    try {
      const response = await fetch(`/api/bigquery?action=tables&dataset=${datasetId}`);
      const result = await response.json();
      setTables(result);
      setSelectedDataset(datasetId);
    } catch (error) {
      setTables({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tables'
      });
    } finally {
      setLoadingState('tables', false);
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) return;
    
    setLoadingState('query', true);
    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: customQuery
        })
      });
      const result = await response.json();
      setQueryResult(result);
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setLoadingState('query', false);
    }
  };

  const testCarPrices = async () => {
    const query = 'SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 10';
    console.log('🚗 Testing car_prices with query:', query);
    
    setLoadingState('carPrices', true);
    setCarPricesResult(null);
    
    try {
      console.log('📤 Sending POST request to /api/bigquery');
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: query
        })
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Result:', result);
      
      setCarPricesResult(result);
    } catch (error) {
      console.error('❌ Error testing car_prices:', error);
      setCarPricesResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoadingState('carPrices', false);
    }
  };

  const detectDatasetLocation = async () => {
    const datasetId = 'biquery_data';
    console.log('🔍 Detecting location for dataset:', datasetId);
    
    setLoadingState('datasetInfo', true);
    setDatasetInfoResult(null);
    
    try {
      console.log('📤 Sending GET request to detect dataset location');
      const response = await fetch(`/api/bigquery?action=dataset-info&dataset=${datasetId}`);
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Dataset info result:', result);
      
      if (result.success && result.data?.location) {
        console.log('🎯 Dataset location detected:', result.data.location);
      }
      
      setDatasetInfoResult(result);
    } catch (error) {
      console.error('❌ Error detecting dataset location:', error);
      setDatasetInfoResult({
        success: false,
        error: error instanceof Error ? error.message : 'Location detection failed'
      });
    } finally {
      setLoadingState('datasetInfo', false);
    }
  };

  // Daytona Sandbox functions
  const createSandbox = async () => {
    console.log('🏗️ Creating Daytona sandbox with language:', selectedLanguage);
    setSandboxStatus('creating');
    setCommandOutput('');
    setAnalysisMode(false);
    setCells([]);
    
    try {
      const action = selectedLanguage === 'python' ? 'create-python' : 'create';
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const result = await response.json();
      console.log('📊 Sandbox creation result:', result);
      
      if (result.success) {
        setSandbox({ 
          id: result.sandboxId, 
          status: 'ready',
          language: selectedLanguage 
        });
        setSandboxStatus('ready');
        setCommandOutput(`✅ ${selectedLanguage.toUpperCase()} Sandbox created successfully!\nSandbox ID: ${result.sandboxId}`);
      } else {
        setSandboxStatus('error');
        setCommandOutput('❌ Error creating sandbox: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating sandbox:', error);
      setSandboxStatus('error');
      setCommandOutput('❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to create sandbox'));
    }
  };

  const executeCommand = async () => {
    if (!sandbox?.id || !command.trim()) return;
    
    console.log('⚡ Executing command:', command);
    setLoadingState('commandExecution', true);
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          command: command.trim(),
          sandboxId: sandbox.id
        })
      });
      
      const result = await response.json();
      console.log('📊 Command execution result:', result);
      
      if (result.success) {
        setCommandOutput(prev => prev + '\n\n$ ' + command + '\n' + (result.output || 'Command executed successfully'));
      } else {
        setCommandOutput(prev => prev + '\n\n$ ' + command + '\n❌ Error: ' + (result.error || 'Command failed'));
      }
    } catch (error) {
      console.error('❌ Error executing command:', error);
      setCommandOutput(prev => prev + '\n\n$ ' + command + '\n❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to execute'));
    } finally {
      setLoadingState('commandExecution', false);
    }
  };

  // Add a new cell
  const addCell = () => {
    const newCell = {
      id: Date.now().toString(),
      code: '',
      output: '',
      isRunning: false
    };
    setCells(prev => [...prev, newCell]);
  };

  // Remove a cell
  const removeCell = (cellId: string) => {
    setCells(prev => prev.filter(cell => cell.id !== cellId));
  };

  // Update cell code
  const updateCellCode = (cellId: string, code: string) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId ? { ...cell, code } : cell
    ));
  };

  // Execute a Python cell
  const executePythonCell = async (cellId: string) => {
    if (!sandbox?.id) return;
    
    const cell = cells.find(c => c.id === cellId);
    if (!cell || !cell.code.trim()) return;
    
    // Set cell as running
    setCells(prev => prev.map(c => 
      c.id === cellId ? { ...c, isRunning: true, output: '' } : c
    ));
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          command: `python3 -c "${cell.code.replace(/"/g, '\\"')}"`,
          sandboxId: sandbox.id
        })
      });
      
      const result = await response.json();
      
      // Update cell with result
      setCells(prev => prev.map(c => 
        c.id === cellId ? {
          ...c,
          isRunning: false,
          output: result.success ? (result.output || 'Executed successfully') : 
                  `Error: ${result.error || 'Execution failed'}`
        } : c
      ));
    } catch (error) {
      setCells(prev => prev.map(c => 
        c.id === cellId ? {
          ...c,
          isRunning: false,
          output: `Network Error: ${error instanceof Error ? error.message : 'Failed to execute'}`
        } : c
      ));
    }
  };

  // Auto-install pandas and start analysis mode
  const startAnalysisMode = async () => {
    if (!sandbox?.id) return;
    
    setAnalysisMode(true);
    setCommandOutput(prev => prev + '\n\n🔬 Starting Analysis Mode...');
    
    // First install pandas and dependencies
    try {
      const installResponse = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          command: 'pip install pandas numpy matplotlib seaborn plotly',
          sandboxId: sandbox.id
        })
      });
      
      const installResult = await installResponse.json();
      setCommandOutput(prev => prev + '\n\n📦 Installing analysis packages...');
      
      if (installResult.success) {
        setCommandOutput(prev => prev + '\n✅ Pandas, NumPy, Matplotlib, Seaborn & Plotly installed!');
      }
    } catch (error) {
      setCommandOutput(prev => prev + `\n⚠️ Warning: Failed to auto-install packages (${error instanceof Error ? error.message : 'unknown error'}). You may need to install them manually.`);
    }
    
    // Add initial cell with imports
    const initialCell = {
      id: 'initial-' + Date.now().toString(),
      code: 'import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nprint("📊 Analysis environment ready!")\nprint(f"Pandas version: {pd.__version__}")\nprint("💡 Tip: Use matplotlib templates for static charts, Plotly for interactive ones!")',
      output: '',
      isRunning: false
    };
    setCells([initialCell]);
  };

  // Analysis templates
  const analysisTemplates = {
    'data-load': {
      name: '📁 Load CSV Data',
      code: `# Load CSV data\ndf = pd.read_csv('your_file.csv')\nprint(f"Shape: {df.shape}")\nprint(df.head())`
    },
    'data-summary': {
      name: '📊 Data Summary', 
      code: `# Data summary\nprint("Dataset Info:")\nprint(df.info())\nprint("\nBasic Statistics:")\nprint(df.describe())\nprint("\nMissing Values:")\nprint(df.isnull().sum())`
    },
    'visualization': {
      name: '📈 Quick Visualization',
      code: `# Create basic plots with file output (much simpler!)\nimport matplotlib\nmatplotlib.use('Agg')  # Non-interactive backend for sandbox\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\nplt.figure(figsize=(12, 4))\n\n# Histogram\nplt.subplot(1, 2, 1)\ndf.select_dtypes(include=[np.number]).hist(bins=20)\nplt.title('Numeric Columns Distribution')\n\n# Correlation heatmap\nplt.subplot(1, 2, 2)\nsns.heatmap(df.corr(), annot=True, cmap='coolwarm')\nplt.title('Correlation Matrix')\n\nplt.tight_layout()\n\n# Save chart to file (no base64 needed!)\nchart_file = f'/tmp/visualization_{int(time.time())}.png'\nplt.savefig(chart_file, dpi=100, bbox_inches='tight')\nplt.close()\n\nprint("📊 Chart generated successfully!")\nprint(f"CHART_SAVED:{chart_file}")`
    },
    'filtering': {
      name: '🔍 Filter & Group',
      code: `# Data filtering and grouping examples\n# Filter data\nfiltered_df = df[df['column_name'] > value]\nprint(f"Filtered rows: {len(filtered_df)}")\n\n# Group by analysis\ngrouped = df.groupby('category_column').agg({'numeric_column': ['mean', 'sum', 'count']})\nprint(grouped)`
    },
    'simple-chart': {
      name: '📊 Simple Chart',
      code: `# Create a simple chart with file output\nimport matplotlib\nmatplotlib.use('Agg')  # Non-interactive backend\nimport matplotlib.pyplot as plt\nimport time\n\n# Example data (replace with your own)\ndata = {'A': [1, 2, 3, 4], 'B': [2, 3, 4, 5]}\ndf_temp = pd.DataFrame(data)\n\nplt.figure(figsize=(8, 5))\nplt.plot(df_temp['A'], label='Series A', marker='o')\nplt.plot(df_temp['B'], label='Series B', marker='s')\nplt.title('Simple Line Chart')\nplt.xlabel('Index')\nplt.ylabel('Values')\nplt.legend()\nplt.grid(True, alpha=0.3)\n\n# Save to file (much simpler than base64!)\nchart_file = f'/tmp/simple_chart_{int(time.time())}.png'\nplt.savefig(chart_file, dpi=100, bbox_inches='tight')\nplt.close()\n\nprint("📊 Simple chart created!")\nprint(f"CHART_SAVED:{chart_file}")`
    },
    'plotly-interactive': {
      name: '🎯 Interactive Plotly',
      code: `# Interactive Plotly chart (install first: pip install plotly)\ntry:\n    import plotly.graph_objects as go\n    import plotly.offline as pyo\n    \n    # Example data\n    x = [1, 2, 3, 4, 5]\n    y = [2, 4, 3, 5, 6]\n    \n    fig = go.Figure()\n    fig.add_trace(go.Scatter(x=x, y=y, mode='lines+markers', name='Data'))\n    fig.update_layout(\n        title='Interactive Plotly Chart',\n        xaxis_title='X Axis',\n        yaxis_title='Y Axis',\n        template='plotly_white'\n    )\n    \n    # Generate HTML for web display\n    html_str = pyo.plot(fig, output_type='div', include_plotlyjs=True)\n    print("🎯 Interactive chart created!")\n    print(f"HTML_CONTENT:{html_str}")\n    \nexcept ImportError:\n    print("❌ Plotly not installed. Run: pip install plotly")`
    },
    'plotly-bar': {
      name: '📊 Plotly Bar Chart',
      code: `# Interactive bar chart with Plotly\ntry:\n    import plotly.graph_objects as go\n    import plotly.offline as pyo\n    \n    # Example data - replace with your own\n    categories = ['A', 'B', 'C', 'D']\n    values = [20, 35, 30, 25]\n    \n    fig = go.Figure([\n        go.Bar(x=categories, y=values, \n               marker_color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'])\n    ])\n    \n    fig.update_layout(\n        title='Interactive Bar Chart',\n        xaxis_title='Categories',\n        yaxis_title='Values',\n        template='plotly_white',\n        showlegend=False\n    )\n    \n    html_str = pyo.plot(fig, output_type='div', include_plotlyjs=True)\n    print("📊 Interactive bar chart created!")\n    print(f"HTML_CONTENT:{html_str}")\n    \nexcept ImportError:\n    print("❌ Plotly not installed. Run: pip install plotly")`
    },
    'vendas-custos-test': {
      name: '🧪 Test: Vendas vs Custos',
      code: `# Test case: Your exact sales vs costs example with file output (SUPER SIMPLE!)\nimport matplotlib\nmatplotlib.use('Agg')  # Non-interactive backend for sandbox\nimport matplotlib.pyplot as plt\nimport pandas as pd\nimport numpy as np\nimport time\n\n# Criar um DataFrame com dados fictícios (seu exemplo)\nnp.random.seed(42)  # para reproduzibilidade\ndados = pd.DataFrame({\n    \"Mês\": [\"Jan\", \"Fev\", \"Mar\", \"Abr\", \"Mai\", \"Jun\"],\n    \"Vendas\": np.random.randint(100, 500, size=6),\n    \"Custos\": np.random.randint(50, 300, size=6)\n})\n\nprint(\"📊 Dados:\")\nprint(dados)\nprint()  # linha em branco\n\n# Criar gráfico\nplt.figure(figsize=(10, 6))\nwidth = 0.35\nx = np.arange(len(dados[\"Mês\"]))\n\nplt.bar(x - width/2, dados[\"Vendas\"], width, label=\"Vendas\", color=\"skyblue\")\nplt.bar(x + width/2, dados[\"Custos\"], width, label=\"Custos\", color=\"salmon\")\n\nplt.title(\"Vendas vs Custos por Mês\", fontsize=14)\nplt.ylabel(\"Valor (R$)\")\nplt.xlabel(\"Mês\")\nplt.xticks(x, dados[\"Mês\"])\nplt.legend()\nplt.tight_layout()\n\n# Save to file instead of plt.show() - NO BASE64 NEEDED!\nchart_file = f'/tmp/vendas_custos_{int(time.time())}.png'\nplt.savefig(chart_file, format=\"png\", dpi=150, bbox_inches=\"tight\")\nplt.close()\n\nprint(\"🎯 Gráfico criado! Agora você pode ver a visualização:\")\nprint(f\"CHART_SAVED:{chart_file}\")`
    }
  };

  // Add template cell
  const addTemplateCell = (templateKey: string) => {
    const template = analysisTemplates[templateKey as keyof typeof analysisTemplates];
    const newCell = {
      id: Date.now().toString(),
      code: template.code,
      output: '',
      isRunning: false
    };
    setCells(prev => [...prev, newCell]);
  };

  // Chart File Renderer Component
  const ChartFileRenderer = ({ filePath, textOutput }: { filePath: string; textOutput: string }) => {
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      const loadChart = async () => {
        if (!sandbox?.id) {
          setError('No sandbox available');
          setLoading(false);
          return;
        }
        
        try {
          const response = await fetch('/api/daytona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'read-file',
              filePath,
              sandboxId: sandbox.id
            })
          });
          
          const result = await response.json();
          if (result.success && result.output) {
            setImageBase64(result.output.trim());
          } else {
            setError(result.error || 'Failed to load chart file');
          }
        } catch (err) {
          console.error('Failed to load chart file:', err);
          setError('Network error loading chart');
        } finally {
          setLoading(false);
        }
      };
      
      loadChart();
    }, [filePath]); // sandbox?.id intentionally omitted as it's checked inside the function
    
    return (
      <div>
        {textOutput && (
          <div className="mb-3">
            <pre className="whitespace-pre-wrap">{textOutput}</pre>
          </div>
        )}
        <div className="bg-white p-2 rounded border">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-600">Loading chart...</span>
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm p-4 text-center">
              ❌ Error: {error}
            </div>
          )}
          {imageBase64 && (
            <img 
              src={`data:image/png;base64,${imageBase64}`}
              alt="Generated chart"
              className="max-w-full h-auto rounded"
              style={{ maxHeight: '400px' }}
            />
          )}
        </div>
      </div>
    );
  };

  // Render cell output with image, HTML and file support
  const renderCellOutput = (output: string, cellId?: string) => {
    // Check if output contains chart file path
    const chartMatch = output.match(/CHART_SAVED:([^\s]+)/);
    
    if (chartMatch) {
      const filePath = chartMatch[1];
      const textOutput = output.replace(/CHART_SAVED:[^\s]+/, '').trim();
      
      return <ChartFileRenderer filePath={filePath} textOutput={textOutput} />;
    }
    
    // Check if output contains base64 image
    const imageMatch = output.match(/IMAGE_BASE64:([A-Za-z0-9+/=]+)/);
    
    if (imageMatch) {
      const base64Image = imageMatch[1];
      const textOutput = output.replace(/IMAGE_BASE64:[A-Za-z0-9+/=]+/, '').trim();
      
      return (
        <div>
          {textOutput && (
            <div className="mb-3">
              <pre className="whitespace-pre-wrap">{textOutput}</pre>
            </div>
          )}
          <div className="bg-white p-2 rounded border">
            <img 
              src={`data:image/png;base64,${base64Image}`}
              alt="Generated chart"
              className="max-w-full h-auto rounded"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>
      );
    }
    
    // Check if output contains HTML content (for Plotly)
    const htmlMatch = output.match(/HTML_CONTENT:([\s\S]*)/);
    
    if (htmlMatch) {
      const htmlContent = htmlMatch[1];
      const textOutput = output.replace(/HTML_CONTENT:[\s\S]*$/, '').trim();
      
      return (
        <div>
          {textOutput && (
            <div className="mb-3">
              <pre className="whitespace-pre-wrap">{textOutput}</pre>
            </div>
          )}
          <div className="bg-white p-2 rounded border">
            <div 
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="plotly-container"
            />
          </div>
        </div>
      );
    }
    
    // Regular text output
    return <pre className="whitespace-pre-wrap">{output}</pre>;
  };

  const destroySandbox = async () => {
    if (!sandbox?.id) return;
    
    console.log('🗑️ Destroying sandbox:', sandbox.id);
    setLoadingState('destroySandbox', true);
    
    try {
      const response = await fetch('/api/daytona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'destroy',
          sandboxId: sandbox.id
        })
      });
      
      const result = await response.json();
      console.log('📊 Sandbox destroy result:', result);
      
      if (result.success) {
        setSandbox(null);
        setSandboxStatus('idle');
        setAnalysisMode(false);
        setCells([]);
        setCommandOutput(prev => prev + '\n\n🗑️ Sandbox destroyed successfully!');
      } else {
        setCommandOutput(prev => prev + '\n\n❌ Error destroying sandbox: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error destroying sandbox:', error);
      setCommandOutput(prev => prev + '\n\n❌ Network error: ' + (error instanceof Error ? error.message : 'Failed to destroy'));
    } finally {
      setLoadingState('destroySandbox', false);
    }
  };

  const renderTableData = (data: Record<string, unknown>[], title: string) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">{title} ({data.length} rows)</h4>
        <div className="overflow-auto max-h-96 border rounded">
          <table className="min-w-full a divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map(column => (
                  <th 
                    key={column}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map(column => (
                    <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {String(row[column] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 20 && (
          <p className="text-xs text-gray-500 mt-2">
            Showing first 20 results. Total: {data.length} rows
          </p>
        )}
      </div>
    );
  };

  const renderResult = (result: BigQueryTestResult | null, title: string) => {
    if (!result) return null;

    return (
      <Card className="p-4 mt-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        {result.success ? (
          <div>
            <div className="text-green-600 mb-2">✅ Success</div>
            {result.message && <p className="text-sm text-gray-600 mb-2">{result.message}</p>}
            
            {result.data && (
              <>
                {/* Check if data is array of objects (tabular data) */}
                {Array.isArray(result.data) && result.data.length > 0 && typeof result.data[0] === 'object' && result.data[0] !== null ? (
                  renderTableData(result.data as Record<string, unknown>[], 'Query Results')
                ) : (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">View Raw Data</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="text-red-600 mb-2">❌ Error</div>
            <p className="text-sm text-red-800">{result.error || result.message}</p>
          </div>
        )}
      </Card>
    );
  };

  const renderDatasetsCards = (datasetsResult: BigQueryTestResult | null) => {
    if (!datasetsResult?.success || !Array.isArray(datasetsResult.data)) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium mb-3">Available Datasets ({datasetsResult.data.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(datasetsResult.data as { id: string; friendlyName?: string; description?: string; location?: string }[]).map((dataset) => (
            <div
              key={dataset.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedDataset(dataset.id);
                listTables(dataset.id);
              }}
            >
              <div className="font-medium text-sm text-blue-600">{dataset.id}</div>
              {dataset.friendlyName && (
                <div className="text-xs text-gray-600 mt-1">{dataset.friendlyName}</div>
              )}
              {dataset.description && (
                <div className="text-xs text-gray-500 mt-1 truncate">{dataset.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {dataset.location && `📍 ${dataset.location}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">BigQuery Test Console</h1>
          
          {/* Connection Test Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔗 Connection Test</h2>
            <p className="text-gray-600 mb-4">
              Test if BigQuery is properly configured with your credentials.
            </p>
            <Button 
              onClick={testConnection} 
              disabled={loading.connection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading.connection ? 'Testing...' : 'Test Connection'}
            </Button>
            {renderResult(connectionStatus, 'Connection Status')}
          </Card>


          {/* Datasets Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 Datasets</h2>
            <p className="text-gray-600 mb-4">
              List all datasets available in your BigQuery project.
            </p>
            <Button 
              onClick={listDatasets} 
              disabled={loading.datasets}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading.datasets ? 'Loading...' : 'List Datasets'}
            </Button>
            {datasets?.success ? (
              renderDatasetsCards(datasets)
            ) : datasets ? (
              renderResult(datasets, 'Available Datasets')
            ) : null}
          </Card>

          {/* Tables Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Tables</h2>
            <p className="text-gray-600 mb-4">
              List tables in a specific dataset.
            </p>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Enter dataset name..."
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={() => listTables(selectedDataset)} 
                disabled={loading.tables || !selectedDataset}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading.tables ? 'Loading...' : 'List Tables'}
              </Button>
            </div>
            {renderResult(tables, `Tables in Dataset: ${selectedDataset}`)}
          </Card>

          {/* BigQuery Data Tables Section */}
          <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">🗂️ Tabelas do biquery_data</h2>
            <p className="text-gray-600 mb-4">
              Listar e visualizar dados das tabelas dentro do dataset <code className="bg-gray-200 px-2 py-1 rounded">biquery_data</code>.
            </p>
            
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => tablesHook.execute()} 
                disabled={tablesHook.loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {tablesHook.loading ? 'Carregando...' : 'Listar Tabelas'}
              </Button>
            </div>

            {/* Show error if any */}
            {tablesHook.error && (
              <div className="text-red-600 mb-4">❌ Erro: {tablesHook.error}</div>
            )}

            {/* Show tables list */}
            {tablesHook.data && Array.isArray(tablesHook.data) && tablesHook.data.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">📊 Tabelas encontradas ({tablesHook.data.length}):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tablesHook.data.map((table: {
                    DATASETID?: string;
                    TABLEID?: string;
                    PROJECTID?: string;
                    NUMROWS?: number;
                    NUMBYTES?: number;
                    CREATIONTIME?: string;
                    // Legacy format support
                    datasetId?: string;
                    tableId?: string;
                    projectId?: string;
                    description?: string;
                    numRows?: number;
                    numBytes?: number;
                    creationTime?: Date;
                    lastModifiedTime?: Date;
                  }) => {
                    // Support both API response formats
                    const tableId = table.TABLEID || table.tableId || '';
                    const numRows = table.NUMROWS || table.numRows;
                    
                    return (
                    <div
                      key={tableId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTable === tableId 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedTable(tableId);
                        // Execute will be called automatically when selectedTable changes
                      }}
                    >
                      <div className="font-medium text-blue-600">{tableId}</div>
                      {table.description && (
                        <div className="text-xs text-gray-600 mt-1">{table.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {numRows && `📄 ${numRows.toLocaleString()} linhas`}
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {/* Show table data */}
            {selectedTable && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold">📋 Dados da tabela: {selectedTable}</h3>
                  <Button 
                    onClick={() => tableDataHook.execute()} 
                    disabled={tableDataHook.loading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {tableDataHook.loading ? 'Carregando...' : 'Atualizar Dados'}
                  </Button>
                </div>

                {tableDataHook.error && (
                  <div className="text-red-600 mb-4">❌ Erro ao carregar dados: {tableDataHook.error}</div>
                )}

                {tableDataHook.data && (
                  <div className="bg-white p-4 rounded border">
                    {Array.isArray(tableDataHook.data.data) && tableDataHook.data.data.length > 0 ? (
                      renderTableData(tableDataHook.data.data, `Dados da tabela ${selectedTable}`)
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Nenhum dado encontrado na tabela {selectedTable}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Custom Query Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔍 Custom Query</h2>
            <p className="text-gray-600 mb-4">
              Execute a custom SQL query on your BigQuery data.
            </p>
            <div className="mb-4">
              <textarea
                placeholder="SELECT * FROM `project.dataset.table` LIMIT 10"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <Button 
              onClick={executeQuery} 
              disabled={loading.query || !customQuery.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading.query ? 'Executing...' : 'Execute Query'}
            </Button>
            {renderResult(queryResult, 'Query Results')}
          </Card>

          {/* Car Prices Direct Test */}
          <Card className="p-6 mb-6 border-2 border-green-200 bg-green-50">
            <h2 className="text-xl font-semibold mb-4">🚗 Teste Direto: car_prices</h2>
            <p className="text-gray-600 mb-4">
              Teste específico para carregar dados da tabela <code className="bg-gray-200 px-2 py-1 rounded">car_prices</code> 
              com query hardcoded.
            </p>
            
            <div className="mb-4">
              <code className="bg-gray-100 p-2 rounded text-sm block">
                SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 10
              </code>
            </div>

            <Button 
              onClick={testCarPrices} 
              disabled={loading.carPrices}
              className="bg-green-600 hover:bg-green-700 mb-4"
            >
              {loading.carPrices ? '🔄 Testando...' : '🚗 Testar car_prices'}
            </Button>

            {/* Show error if any */}
            {carPricesResult?.error && (
              <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <strong>❌ Erro:</strong> {carPricesResult.error}
              </div>
            )}

            {/* Show success result */}
            {carPricesResult?.success && carPricesResult.data && (
              <div className="mb-4">
                <div className="text-green-600 mb-2">
                  <strong>✅ Sucesso!</strong> Dados carregados da tabela car_prices
                </div>
                
                {/* Render table data if it's an array */}
                {(() => {
                  const data = carPricesResult.data;
                  
                  // Check if data has a 'data' property with array
                  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data) && data.data.length > 0) {
                    return (
                      <div className="bg-white p-4 rounded border">
                        {renderTableData(data.data, 'Dados da tabela car_prices')}
                      </div>
                    );
                  }
                  
                  // Check if data itself is an array
                  if (Array.isArray(data) && data.length > 0) {
                    return (
                      <div className="bg-white p-4 rounded border">
                        {renderTableData(data, 'Dados da tabela car_prices')}
                      </div>
                    );
                  }
                  
                  // Show raw data
                  return (
                    <div className="bg-gray-100 p-4 rounded">
                      <strong>Dados retornados:</strong>
                      <pre className="mt-2 text-sm overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Show raw result for debugging */}
            {carPricesResult && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  🔍 Ver resultado completo (debug)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(carPricesResult, null, 2)}
                </pre>
              </details>
            )}
          </Card>

          {/* Dataset Location Detection */}
          <Card className="p-6 mb-6 border-2 border-yellow-200 bg-yellow-50">
            <h2 className="text-xl font-semibold mb-4">🔍 Detectar Location do Dataset</h2>
            <p className="text-gray-600 mb-4">
              Descubra a location (região) real do dataset <code className="bg-gray-200 px-2 py-1 rounded">biquery_data</code>. 
              Isso vai resolver o erro de &quot;Not found in location US&quot;.
            </p>

            <Button 
              onClick={detectDatasetLocation} 
              disabled={loading.datasetInfo}
              className="bg-yellow-600 hover:bg-yellow-700 mb-4"
            >
              {loading.datasetInfo ? '🔄 Detectando...' : '🔍 Detectar Location'}
            </Button>

            {/* Show error if any */}
            {datasetInfoResult?.error && (
              <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <strong>❌ Erro:</strong> {datasetInfoResult.error}
              </div>
            )}

            {/* Show success result */}
            {datasetInfoResult?.success && datasetInfoResult.data && (
              <div className="mb-4">
                <div className="text-green-600 mb-2">
                  <strong>✅ Dataset encontrado!</strong>
                </div>
                
                <div className="bg-white p-4 rounded border">
                  {(() => {
                    const data = datasetInfoResult.data as Record<string, unknown>; // Type assertion for dataset info
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Key information */}
                          <div>
                            <h4 className="font-semibold text-lg mb-2">📍 Informações Principais</h4>
                            <div className="space-y-1 text-sm">
                              <div><strong>Location:</strong> <code className="bg-green-100 px-2 py-1 rounded text-green-800">{String(data.location || 'N/A')}</code></div>
                              <div><strong>ID:</strong> <code>{String(data.id || 'N/A')}</code></div>
                              <div><strong>Nome Amigável:</strong> {String(data.friendlyName || 'N/A')}</div>
                              <div><strong>Descrição:</strong> {String(data.description || 'N/A')}</div>
                            </div>
                          </div>

                          {/* Timing information */}
                          <div>
                            <h4 className="font-semibold text-lg mb-2">⏰ Datas</h4>
                            <div className="space-y-1 text-sm">
                              <div><strong>Criado:</strong> {data.creationTime ? new Date(String(data.creationTime)).toLocaleString('pt-BR') : 'N/A'}</div>
                              <div><strong>Modificado:</strong> {data.lastModifiedTime ? new Date(String(data.lastModifiedTime)).toLocaleString('pt-BR') : 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Location highlight */}
                        {data.location && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎯</span>
                              <div>
                                <div className="font-semibold text-green-800">Location Detectada:</div>
                                <div className="text-green-700">
                                  Configure <code className="bg-green-100 px-2 py-1 rounded">BIGQUERY_LOCATION={String(data.location)}</code> no Vercel
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Show raw result for debugging */}
            {datasetInfoResult && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  🔍 Ver resultado completo (debug)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(datasetInfoResult, null, 2)}
                </pre>
              </details>
            )}
          </Card>

          {/* Daytona Sandbox */}
          <Card className="p-6 mb-6 border-2 border-indigo-200 bg-indigo-50">
            <h2 className="text-xl font-semibold mb-4">🏗️ Daytona Sandbox (Beta)</h2>
            <p className="text-gray-600 mb-4">
              Create and manage a cloud sandbox environment for testing commands and code execution.
            </p>

            {/* Language Selection */}
            <div className="mb-4 p-3 bg-white border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Language:</span>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="typescript"
                      checked={selectedLanguage === 'typescript'}
                      onChange={(e) => setSelectedLanguage(e.target.value as 'typescript' | 'python')}
                      disabled={sandboxStatus !== 'idle'}
                      className="mr-2"
                    />
                    <span className="text-sm">🟦 TypeScript</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="python"
                      checked={selectedLanguage === 'python'}
                      onChange={(e) => setSelectedLanguage(e.target.value as 'typescript' | 'python')}
                      disabled={sandboxStatus !== 'idle'}
                      className="mr-2"
                    />
                    <span className="text-sm">🐍 Python</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div className="mb-4 p-3 bg-white border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Status: </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    sandboxStatus === 'idle' ? 'bg-gray-100 text-gray-800' :
                    sandboxStatus === 'creating' ? 'bg-yellow-100 text-yellow-800' :
                    sandboxStatus === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sandboxStatus === 'idle' && '⭕ Idle'}
                    {sandboxStatus === 'creating' && '🔄 Creating...'}
                    {sandboxStatus === 'ready' && '✅ Ready'}
                    {sandboxStatus === 'error' && '❌ Error'}
                  </span>
                </div>
                {sandbox?.id && (
                  <div className="text-xs text-gray-500">
                    ID: {sandbox.id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={createSandbox}
                disabled={sandboxStatus === 'creating' || sandboxStatus === 'ready'}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sandboxStatus === 'creating' ? '🔄 Creating...' : 
                 selectedLanguage === 'python' ? '🐍 Create Python Sandbox' : '🟦 Create TypeScript Sandbox'}
              </Button>
              
              <Button
                onClick={destroySandbox}
                disabled={sandboxStatus !== 'ready' || loading.destroySandbox}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {loading.destroySandbox ? '🔄 Destroying...' : '🗑️ Destroy Sandbox'}
              </Button>
            </div>

            {/* Python-specific Analysis Mode */}
            {sandboxStatus === 'ready' && sandbox?.language === 'python' && !analysisMode && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">🔬 Python Analysis</h3>
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={startAnalysisMode}
                    disabled={loading.commandExecution}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading.commandExecution ? '📦 Setting up...' : '🔬 Start Analysis Mode'}
                  </Button>
                </div>
                <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                  💡 <strong>Analysis Mode:</strong> Cell-based Python execution with auto-installed pandas, numpy, matplotlib, seaborn & plotly.
                  <br/>
                  🚀 <strong>Templates:</strong> Use quick templates for data analysis tasks - matplotlib for static charts, Plotly for interactive ones.
                  <br/>
                  ⚡ <strong>Tip:</strong> Press Ctrl+Enter in cells to run them quickly.
                </div>
              </div>
            )}

            {/* Cell-based Analysis Interface */}
            {sandboxStatus === 'ready' && sandbox?.language === 'python' && analysisMode && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">🔬 Python Analysis Cells</h3>
                  <div className="flex gap-2">
                    <Button onClick={addCell} size="sm" variant="outline">
                      ➕ Add Cell
                    </Button>
                    <Button 
                      onClick={() => { setAnalysisMode(false); setCells([]); }}
                      size="sm" 
                      variant="outline"
                      className="text-red-600"
                    >
                      🔄 Exit Analysis
                    </Button>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-medium text-purple-800 mb-2">🚀 Quick Templates:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysisTemplates).map(([key, template]) => (
                      <Button
                        key={key}
                        onClick={() => addTemplateCell(key)}
                        size="sm"
                        variant="outline"
                        className="text-xs text-purple-700 border-purple-300 hover:bg-purple-100"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Render Cells */}
                <div className="space-y-4">
                  {cells.map((cell, index) => (
                    <div key={cell.id} className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-3 py-2 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cell {index + 1}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => executePythonCell(cell.id)}
                            disabled={cell.isRunning}
                            size="sm"
                            className="text-xs bg-green-600 hover:bg-green-700"
                          >
                            {cell.isRunning ? '⏳ Running...' : '▶️ Run'}
                          </Button>
                          <Button
                            onClick={() => removeCell(cell.id)}
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      
                      {/* Code Input */}
                      <textarea
                        value={cell.code}
                        onChange={(e) => updateCellCode(cell.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.ctrlKey && e.key === 'Enter' && !cell.isRunning) {
                            e.preventDefault();
                            executePythonCell(cell.id);
                          }
                        }}
                        placeholder="# Enter Python code here\nimport pandas as pd\nprint('Hello, analysis!')\n\n# Press Ctrl+Enter to run" 
                        rows={4}
                        className="w-full p-3 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={cell.isRunning}
                      />
                      
                      {/* Output Display */}
                      {cell.output && (
                        <div className="bg-gray-900 text-green-400 p-3 font-mono text-sm">
                          <div className="text-xs text-gray-500 mb-1">Output:</div>
                          {renderCellOutput(cell.output, cell.id)}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* No cells message */}
                  {cells.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No analysis cells yet. Click &quot;Add Cell&quot; to start coding!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Command Execution */}
            {sandboxStatus === 'ready' && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">💻 Execute Command</h3>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Enter command to execute..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading.commandExecution && executeCommand()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading.commandExecution}
                  />
                  <Button
                    onClick={executeCommand}
                    disabled={!command.trim() || loading.commandExecution}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading.commandExecution ? '⏳ Running...' : '▶️ Execute'}
                  </Button>
                </div>

                {/* Quick Command Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={() => setCommand('echo "Hello from Daytona!"')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Echo Test
                  </Button>
                  <Button
                    onClick={() => setCommand('node --version')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Node Version
                  </Button>
                  <Button
                    onClick={() => setCommand('ls -la')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    List Files
                  </Button>
                  <Button
                    onClick={() => setCommand('pwd')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Current Dir
                  </Button>
                  <Button
                    onClick={() => setCommand('whoami')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Who Am I
                  </Button>
                </div>
              </div>
            )}

            {/* Output Display */}
            {commandOutput && (
              <div className="mb-4">
                <h4 className="font-medium mb-3">📤 Output</h4>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  <pre className="text-green-400 whitespace-pre-wrap">{commandOutput}</pre>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">💡 How to use:</h4>
              <div className="text-sm text-indigo-800 space-y-1">
                <p>1. Select <strong>TypeScript</strong> or <strong>Python</strong> language</p>
                <p>2. Click <strong>&quot;Create Sandbox&quot;</strong> to create environment</p>
                <p>3. For Python: Click <strong>&quot;Install Jupyter&quot;</strong> → <strong>&quot;Start Jupyter&quot;</strong> → <strong>&quot;Open Notebook&quot;</strong></p>
                <p>4. Use command input for custom terminal commands</p>
                <p>5. Click <strong>&quot;Destroy Sandbox&quot;</strong> when done to clean up</p>
                <p><strong>⚠️ Beta:</strong> Requires DAYTONA_API_KEY environment variable</p>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1. Test Connection:</strong> Verify your BigQuery credentials are working</p>
              <p><strong>2. List Datasets:</strong> See all datasets in your project</p>
              <p><strong>3. List Tables:</strong> Enter a dataset name to see its tables</p>
              <p><strong>4. Custom Query:</strong> Run SQL queries (be careful with LIMIT to avoid costs)</p>
              <p><strong>5. Direct Tests:</strong> Test specific tables and detect dataset locations</p>
              <p><strong>6. Daytona Sandbox:</strong> Create cloud sandbox environments for testing (Beta)</p>
              <p><strong>7. Python Analysis:</strong> Use cell-based Python execution with pandas for data analysis (like Google Colab)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}