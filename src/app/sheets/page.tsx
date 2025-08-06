import UniverSheet from '@/components/sheets/UniverSheet'
import SheetsChat from '@/components/sheets/SheetsChat'
import Sidebar from '@/components/navigation/Sidebar'
import SheetToolsHandler from '@/components/sheets/SheetToolsHandler'

export default function SheetsPage() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <SheetToolsHandler />
      
      <div className="flex flex-1">
        <div className="flex-1 min-w-0">
          <UniverSheet />
        </div>
        
        <div className="w-80 border-l border-gray-200 flex flex-col">
          <SheetsChat />
        </div>
      </div>
    </div>
  )
}