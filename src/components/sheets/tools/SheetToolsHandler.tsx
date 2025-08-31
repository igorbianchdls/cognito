'use client';

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { sheetToolsStore } from '@/stores/sheets/sheetsStore';

// This component handles tool calls from the API and executes them on the sheet
export default function SheetToolsHandler() {
  const sheetTools = useStore(sheetToolsStore);

  useEffect(() => {
    if (!sheetTools) return;

    // Listen for tool execution requests from the API
    const handleToolExecution = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, toolName, parameters, callId } = event.data;
      
      if (type !== 'EXECUTE_SHEET_TOOL') return;

      try {
        let result;
        
        switch (toolName) {
          case 'addColumn':
            await sheetTools.addColumn(parameters.name, parameters.position);
            result = { success: true, message: `Coluna "${parameters.name}" adicionada` };
            break;
            
          case 'applyFormula':
            await sheetTools.applyFormula(parameters.range, parameters.formula);
            result = { success: true, message: `Fórmula aplicada no range ${parameters.range}` };
            break;
            
          case 'updateCell':
            await sheetTools.updateCell(parameters.row, parameters.col, parameters.value);
            result = { success: true, message: `Célula (${parameters.row}, ${parameters.col}) atualizada` };
            break;
            
          case 'insertRow':
            await sheetTools.insertRow(parameters.position);
            result = { success: true, message: 'Linha inserida' };
            break;
            
          case 'deleteRow':
            await sheetTools.deleteRow(parameters.position);
            result = { success: true, message: `Linha ${parameters.position} deletada` };
            break;
            
          case 'deleteColumn':
            await sheetTools.deleteColumn(parameters.position);
            result = { success: true, message: `Coluna ${parameters.position} deletada` };
            break;
            
          default:
            throw new Error(`Tool desconhecida: ${toolName}`);
        }

        // Send result back to API
        window.postMessage({
          type: 'SHEET_TOOL_RESULT',
          callId,
          result
        }, window.location.origin);

      } catch (error) {
        // Send error back to API
        window.postMessage({
          type: 'SHEET_TOOL_RESULT',
          callId,
          result: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          }
        }, window.location.origin);
      }
    };

    window.addEventListener('message', handleToolExecution);
    
    return () => {
      window.removeEventListener('message', handleToolExecution);
    };
  }, [sheetTools]);

  return null; // This component doesn't render anything
}