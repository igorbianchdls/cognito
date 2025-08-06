import UniverSheet from '@/components/sheets/UniverSheet'

export default function SheetsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Planilhas
        </h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <UniverSheet />
        </div>
      </div>
    </div>
  )
}