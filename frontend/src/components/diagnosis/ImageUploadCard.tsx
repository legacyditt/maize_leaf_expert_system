import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ArrowRight, ImagePlus, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { predictLeafImage, type PredictResponse } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ImageUploadCardProps {
  onContinueWithCnn: (prediction: PredictResponse, fileName: string) => void
  onSkipToExpert: () => void
}

/**
 * Halaman 1 User: Upload foto daun jagung dan hasil klasifikasi CNN (256x256).
 */
export function ImageUploadCard({
  onContinueWithCnn,
  onSkipToExpert,
}: ImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictResponse | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setFileName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
    setLoading(true)
    try {
      const result = await predictLeafImage(file)
      setPrediction(result)
    } catch (err) {
      setPrediction(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi server FastAPI.',
      )
    } finally {
      setLoading(false)
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-500">Langkah 1 dari 3</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">
          Unggah Foto Daun Jagung
        </h1>
        <p className="max-w-xl text-sm text-zinc-500">
          Sistem akan memeriksa indikasi Hawar, Karat, atau kondisi Sehat dari
          foto daun sebelum konfirmasi gejala.
        </p>
      </div>

      <div className="grid gap-8 rounded-xl border border-[#E4E4DF] bg-white p-6 md:grid-cols-2 md:p-8">
        {/* Kolom Kiri: Dropzone & Preview */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors',
            isDragging
              ? 'border-[#1B4332] bg-[#1B4332]/5'
              : 'border-[#E4E4DF] bg-[#F8F7F4] hover:border-zinc-400',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />

          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt={fileName}
                className="mx-auto max-h-48 rounded-md border border-zinc-200 object-contain"
              />
              <p className="text-xs font-medium text-zinc-600">
                {fileName} — klik untuk ganti foto
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <UploadCloud className="mx-auto h-7 w-7 text-zinc-400" strokeWidth={1.75} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900">
                  Pilih atau tarik foto daun ke sini
                </p>
                <p className="text-xs text-zinc-500">JPG, PNG, atau WEBP</p>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Output CNN */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-zinc-100 pb-2.5">
              <span className="text-sm font-semibold text-[#111814]">
                Hasil Analisis Foto
              </span>
            </div>

            {loading && (
              <div className="flex items-center gap-2.5 py-6 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
                Menganalisis foto daun...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !prediction && !error && (
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                <ImagePlus className="mb-2 h-5 w-5 text-zinc-400" strokeWidth={1.75} />
                Hasil prediksi akan tampil setelah foto diunggah.
              </div>
            )}

            {prediction && !loading && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Penyakit Terdeteksi</p>
                    <p className="text-2xl font-bold tracking-tight text-[#111814]">
                      {prediction.label}
                    </p>
                  </div>
                  <span className="font-mono text-xl font-bold text-[#1B4332]">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-2.5 border-t border-zinc-100 pt-3">
                  {Object.entries(prediction.probabilities).map(([cls, prob]) => (
                    <div key={cls} className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>{cls}</span>
                        <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={prob * 100}
                        className="h-1.5"
                        indicatorClassName={
                          cls === prediction.label ? 'bg-[#1B4332]' : 'bg-zinc-300'
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            size="lg"
            disabled={!prediction || loading}
            onClick={() => prediction && onContinueWithCnn(prediction, fileName)}
            className="w-full"
          >
            Lanjut ke Validasi Gejala
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onSkipToExpert}>
          Lewati foto, langsung tanya gejala →
        </Button>
      </div>
    </div>
  )
}
