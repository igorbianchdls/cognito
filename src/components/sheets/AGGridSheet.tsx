'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@nanostores/react';
import { ColDef, CellValueChangedEvent, RowSelectedEvent, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { 
  LicenseManager, 
  AllEnterpriseModule,
  RangeSelectionModule,
  MenuModule,
  IntegratedChartsModule 
} from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { 
  activeDatasetStore, 
  isSheetLoadingStore, 
  initializeDefaultDataset,
  getActiveDatasetInfo
} from '@/stores/sheetsStore';

// Configure AG Grid Enterprise License
LicenseManager.setLicenseKey('[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-090576}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{31 August 2025}____[v3]_[0102]_MTc1NjU5NDgwMDAwMA==055771d37eabf862ce4b35dbb0d2a1df');

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([
  AllEnterpriseModule,
  RangeSelectionModule,
  MenuModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)
]);

// Dynamic import for AG Grid to avoid SSR issues
const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Carregando planilha...</p>
      </div>
    </div>
  }
);

// AG Grid CSS now imported in globals.css

export default function AGGridSheet() {
  const [isClient, setIsClient] = useState(false);
  
  // Store subscriptions
  const activeDataset = useStore(activeDatasetStore);
  const isLoading = useStore(isSheetLoadingStore);
  
  useEffect(() => {
    setIsClient(true);
    // Initialize default dataset if not already loaded
    initializeDefaultDataset();
  }, []);

  // Get current dataset info for display
  const datasetInfo = getActiveDatasetInfo();
  
  // Dynamic row data from store
  const rowData = activeDataset?.data || [];

  // Dynamic column definitions from store
  const colDefs = activeDataset?.columnDefs || [];

  // Grid options
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true
  };

  // Callbacks
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    console.log('Célula alterada:', {
      field: event.colDef.field,
      oldValue: event.oldValue,
      newValue: event.newValue,
      data: event.data
    });
  }, []);

  const onRowSelected = useCallback((event: RowSelectedEvent) => {
    if (event.node.isSelected()) {
      console.log('Linha selecionada:', event.data);
    }
  }, []);

  return (
    <div className="w-full h-full p-3">
      {/* Header - Dinâmico baseado no dataset ativo */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#172b4d]">
            {datasetInfo?.name || 'Planilha'} 
          </h2>
          {isLoading && (
            <div className="w-4 h-4 border border-[#0052cc] border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* AG Grid - Altura ajustada para layout de 3 colunas */}
      {isClient ? (
        <div className="w-full" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
          <AgGridReact
            theme={themeQuartz}
            loadThemeGoogleFonts={true}
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            rowSelection={'multiple'}
            suppressRowClickSelection={false}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            enableRangeSelection={true}
            enableCharts={true}
            allowContextMenuWithControlKey={true}
            sideBar={true}
            pivotMode={false}
            rowGroupPanelShow={'always'}
            onCellValueChanged={onCellValueChanged}
            onRowSelected={onRowSelected}
          />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando planilha...</p>
          </div>
        </div>
      )}
      
      {/* Debug info - Compacto e dinâmico */}
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <span><strong>Debug:</strong> {rowData.length} linhas • {colDefs.length} colunas</span>
        {datasetInfo && (
          <span className="ml-2">• Dataset: {datasetInfo.id}</span>
        )}
      </div>
    </div>
  );
}