import Sidebar from '@/components/navigation/Sidebar'
import AGGridSheet from '@/components/sheets/AGGridSheet'
import RightPanel from '@/components/sheets/RightPanel'

export default function SheetsPage() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Esquerda */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Planilha Central */}
      <div className="flex-1 min-w-0">
        <AGGridSheet />
      </div>
      
      {/* Painel Direito com Tabs - Oculto em telas pequenas */}
      <div className="hidden md:block w-80 lg:w-96 border-l border-gray-200 bg-white">
        <RightPanel />
      </div>
    </div>
  )
}