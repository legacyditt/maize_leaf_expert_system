import { useRef, useState, type ChangeEvent } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ModelStatusData } from '@/lib/api'

interface AdminModelViewProps {
  modelStatus: ModelStatusData | null
  uploading: boolean
  onUploadModel: (file: File) => void
}

/**
 * Menu Model CNN (.keras): Info bobot model aktif dan unggah file .keras baru.
 */
export function AdminModelView({
  modelStatus,
  uploading,
  onUploadModel,
}: AdminModelViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6">
        <h2 className="border-b border-zinc-100 pb-3 text-sm font-semibold text-[#111814]">
          Informasi Model CNN Aktif
        </h2>
        {modelStatus ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Nama File</span>
              <span className="font-mono font-medium text-[#111814]">
                {modelStatus.filename}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="font-semibold text-[#1B4332]">
                {modelStatus.exists ? 'Aktif' : 'Tidak ditemukan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ukuran File</span>
              <span className="font-mono text-[#111814]">
                {modelStatus.size_mb} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Versi Keras</span>
              <span className="font-mono text-[#111814]">
                {modelStatus.keras_version}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ukuran Input Citra</span>
              <span className="font-mono text-[#111814]">
                {modelStatus.input_size}×{modelStatus.input_size} px
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Kelas Target</span>
              <span className="font-medium text-[#111814]">
                {modelStatus.class_names.join(', ')}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Memuat status model...</p>
        )}
      </div>

      <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6">
        <div className="space-y-4">
          <h2 className="border-b border-zinc-100 pb-3 text-sm font-semibold text-[#111814]">
            Perbarui Model (.keras)
          </h2>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#E4E4DF] bg-[#F8F7F4] p-5 text-center hover:border-[#1B4332]"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".keras"
              className="hidden"
              onChange={onFileChange}
            />
            <UploadCloud className="mb-2 h-6 w-6 text-[#1B4332]" />
            <p className="text-sm font-medium text-[#111814]">
              {selectedFile ? selectedFile.name : 'Pilih file bobot .keras'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Format yang didukung: .keras
            </p>
          </div>
        </div>

        <Button
          disabled={!selectedFile || uploading}
          onClick={() => selectedFile && onUploadModel(selectedFile)}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengunggah Model...
            </>
          ) : (
            'Unggah & Aktifkan Model'
          )}
        </Button>
      </div>
    </div>
  )
}

