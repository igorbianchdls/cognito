import Sidebar from '@/components/navigation/Sidebar'
import AGGridSheet from '@/components/sheets/AGGridSheet'

export default function SheetsPage() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 min-w-0">
        <AGGridSheet />
      </div>
    </div>
  )
}