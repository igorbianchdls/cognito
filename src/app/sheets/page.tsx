'use client';

import { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar'
import AGGridSheet from '@/components/sheets/AGGridSheet'
import RightPanel from '@/components/sheets/RightPanel'
import TableHeader from '@/components/sheets/TableHeader'
import CollapseButton from '@/components/sheets/CollapseButton'

export default function SheetsPage() {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Esquerda */}
      <Sidebar />
      
      {/* Área Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TableHeader - Ocupando 100% da largura */}
        <TableHeader />
        
        {/* Área inferior: AG Grid + RightPanel lado a lado */}
        <div className="flex-1 min-h-0 flex">
          {/* AG Grid - Área central */}
          <div className="flex-1 min-w-0 relative">
            <AGGridSheet />
            
            {/* Collapse Button - Visível apenas em md+ */}
            <div className="hidden md:block">
              <CollapseButton 
                isCollapsed={isRightPanelCollapsed}
                onToggle={toggleRightPanel}
              />
            </div>
          </div>
          
          {/* Painel Direito com Tabs - Oculto em telas pequenas */}
          <div className={`
            hidden md:block border-l border-gray-200 bg-white
            transition-all duration-300 ease-in-out overflow-hidden
            ${isRightPanelCollapsed ? 'w-0 border-l-0' : 'w-80'}
          `}>
            <div className={`
              w-80 h-full
              transition-opacity duration-300 ease-in-out
              ${isRightPanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}>
              <RightPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}