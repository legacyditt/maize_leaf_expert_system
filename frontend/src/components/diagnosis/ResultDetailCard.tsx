import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getApiAssetUrl, type EvaluateResponse } from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

interface DiseaseGuide {
  title: string
  summary: string
}

const DISEASE_GUIDES: Record<string, DiseaseGuide> = {
  Karat: {
    title: 'Karat Daun Jagung',
    summary:
      'Daun jagung menunjukkan tanda karat daun, seperti bintik serbuk berwarna cokelat kemerahan pada permukaan daun.',
  },
  Hawar: {
    title: 'Hawar Daun Jagung',
    summary:
      'Daun jagung menunjukkan tanda hawar daun, berupa bercak memanjang berwarna hijau keabu-abuan hingga cokelat.',
  },
  Sehat: {
    title: 'Daun Jagung Sehat',
    summary:
      'Tidak terlihat tanda penyakit karat maupun hawar pada daun jagung.',
  },
}

interface ResultDetailCardProps {
  result: EvaluateResponse
  cnnCtx: CnnContext
  onRetrySymptoms?: () => void
  onNewDiagnosis?: () => void
  onBack?: () => void
  backLabel?: string
  headerSubtitle?: string
}

/**
 * Halaman Hasil Diagnosis: Ringkasan hasil CNN, validasi gejala, dan Certainty Factor.
 */
export function ResultDetailCard({
  result,
  cnnCtx,
  onRetrySymptoms,
  onNewDiagnosis,
  onBack,
  backLabel = 'Kembali',
  headerSubtitle,
}: ResultDetailCardProps) {
  const cfValue = result.best?.cf ?? 0
  const cfPercent = Math.max(0, Math.min(100, cfValue * 100))
  const isConfirmed =
    Boolean(result.best?.proven) && result.status_match !== 'TIDAK SESUAI'

  const diagGoal = result.best?.goal ?? ''
  const guide =
    isConfirmed && diagGoal in DISEASE_GUIDES
      ? DISEASE_GUIDES[diagGoal]
      : {
          title: 'Kondisi Belum Dapat Dipastikan',
          summary:
            'Jawaban gejala yang dipilih belum cukup jelas atau berbeda dengan hasil pembacaan foto.',
        }

  const thumbUrl = getApiAssetUrl(cnnCtx.prediction?.image_url)
  const matchLabel =
    result.status_match === 'SESUAI'
      ? 'Sesuai'
      : result.status_match === 'TIDAK SESUAI'
        ? 'Tidak Sesuai'
        : 'Tanpa Foto'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {onBack && (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </div>
      )}

      {/* Header Verdict */}
      <div className="flex flex-col justify-between gap-6 rounded-xl border border-[#C6DEC9] bg-white p-6 md:flex-row md:items-center md:p-8">
        <div className="flex items-start gap-4">
          {thumbUrl && (
            <img
              src={thumbUrl}
              alt={cnnCtx.fileName ?? 'Foto daun'}
              className="hidden h-20 w-20 shrink-0 rounded-lg border border-[#E4E4DF] object-cover sm:block"
            />
          )}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500">
              {headerSubtitle ?? 'Hasil Pemeriksaan'}
              {result.status_match && result.status_match !== 'MODE PAKAR'
                ? ` · Foto & Jawaban Gejala: ${matchLabel}`
                : ''}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#111814] md:text-3xl">
              {guide.title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
              {guide.summary}
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E4E4DF] pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-xs text-zinc-500">Tingkat Keyakinan</p>
          <p className="font-mono text-3xl font-bold tracking-tight text-[#1B4332]">
            {cfPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Ringkasan Pemeriksaan: Komparasi Foto & Gejala dalam 1 Kartu Seimbang */}
      <div className="rounded-xl border border-[#C6DEC9] bg-white p-6 md:p-8">
        <h2 className="border-b border-zinc-100 pb-3 text-sm font-semibold text-[#111814]">
          Ringkasan Pemeriksaan
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* Kiri: Hasil Pembacaan Foto */}
          <div className="space-y-3">
            {cnnCtx.useCnn && cnnCtx.prediction ? (
              <>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500">Hasil Pemeriksaan Foto</span>
                  <span className="font-mono font-semibold text-[#111814]">
                    {cnnCtx.prediction.label} (
                    {(cnnCtx.prediction.confidence * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="space-y-2.5 pt-1">
                  {Object.entries(cnnCtx.prediction.probabilities).map(
                    ([cls, prob]) => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-600">
                          <span>{cls}</span>
                          <span className="font-mono">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={prob * 100}
                          className="h-1.5"
                          indicatorClassName={
                            cls === cnnCtx.prediction?.label
                              ? 'bg-[#1B4332]'
                              : 'bg-zinc-300'
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500">
                Pemeriksaan dilakukan tanpa mengunggah foto daun.
              </p>
            )}
          </div>

          {/* Kanan: Hasil Jawaban Gejala */}
          <div className="flex flex-col justify-between space-y-3 border-t border-zinc-100 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-500">Hasil Jawaban Gejala</span>
                <span className="font-semibold text-[#111814]">
                  {result.best?.goal ?? 'Belum Terlihat'}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-500">Kesesuaian Foto & Gejala</span>
                <span className="font-semibold text-[#111814]">
                  {matchLabel}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-500">Keyakinan Hasil Akhir</span>
                <span className="font-mono font-semibold text-[#1B4332]">
                  {cfPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      {(onRetrySymptoms || onNewDiagnosis) && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {onRetrySymptoms && (
            <Button variant="outline" onClick={onRetrySymptoms}>
              <RotateCcw className="h-4 w-4" />
              Jawab Ulang Gejala
            </Button>
          )}
          {onNewDiagnosis && (
            <Button onClick={onNewDiagnosis}>Periksa Daun Lain</Button>
          )}
        </div>
      )}
    </div>
  )
}
