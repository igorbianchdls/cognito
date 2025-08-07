'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@nanostores/react';
import { ColDef, CellValueChangedEvent, RowSelectedEvent, ModuleRegistry, themeQuartz, FirstDataRenderedEvent } from 'ag-grid-community';
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
  initializeDefaultDataset
} from '@/stores/sheetsStore';
import TableHeader from './TableHeader';

// Configure AG Grid Enterprise License
LicenseManager.setLicenseKey('[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-090576}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{31 August 2025}____[v3]_[0102]_MTc1NjU5NDgwMDAwMA==055771d37eabf862ce4b35dbb0d2a1df');

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([
  AllEnterpriseModule,
  RangeSelectionModule,
  MenuModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)
]);

// Custom theme
const myTheme = themeQuartz.withParams({
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: true,
  headerFontSize: 14,
  rowBorder: true,
  wrapperBorder: false,
  wrapperBorderRadius: 0
});

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
  
  useEffect(() => {
    setIsClient(true);
    // Initialize default dataset if not already loaded
    initializeDefaultDataset();
  }, []);
  
  // Dynamic row data from store
  const rowData = activeDataset?.data || [];

  // Dynamic column definitions from store
  const colDefs = activeDataset?.columnDefs || [];

  // Grid options
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
    menuTabs: ['filterMenuTab', 'generalMenuTab'],
    suppressHeaderMenuButton: false,
    suppressHeaderFilterButton: false
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

  // Auto-size columns based on content when data loads
  const onFirstDataRendered = useCallback((params: FirstDataRenderedEvent) => {
    params.api.autoSizeAllColumns();
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table Header */}
      <TableHeader />
      
      {/* AG Grid - Ocupando o resto da tela */}
      {isClient ? (
        <div className="w-full flex-1">
          <AgGridReact
            theme={myTheme}
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
            sideBar={false}
            pivotMode={false}
            rowGroupPanelShow={'never'}
            onCellValueChanged={onCellValueChanged}
            onRowSelected={onRowSelected}
            onFirstDataRendered={onFirstDataRendered}
          />
        </div>
      ) : (
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando planilha...</p>
          </div>
        </div>
      )}
      
    </div>
  );
}