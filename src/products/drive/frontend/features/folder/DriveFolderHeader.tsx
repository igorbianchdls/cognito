import { type RefObject } from "react"
import { ArrowLeft, Upload } from "lucide-react"

type DriveFolderHeaderProps = {
  folderName: string
  filesCount: number
  canUpload: boolean
  isUploading: boolean
  onBack: () => void
  onUploadClick: () => void
  uploadInputRef: RefObject<HTMLInputElement | null>
  onUploadFiles: (files: FileList | null) => void | Promise<void>
}

export default function DriveFolderHeader({
  folderName,
  filesCount,
  canUpload,
  isUploading,
  onBack,
  onUploadClick,
  uploadInputRef,
  onUploadFiles,
}: DriveFolderHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="px-6 py-2 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-1 inline size-3" /> Voltar
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">{folderName}</h1>
            <span className="text-xs text-gray-500">
              {filesCount} {filesCount === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUploadClick}
              disabled={!canUpload || isUploading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="size-3.5" />
              {isUploading ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void onUploadFiles(event.target.files)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
