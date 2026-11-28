import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getApiAssetUrl, type EvaluateResponse } from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

interface DiseaseGuide {
  title: string
  summary: string
  actions: string[]
}

const DISEASE_GUIDES: Record<string, DiseaseGuide> = {
  Karat: {
    title: 'Karat Daun Jagung (Common Rust)',
    summary:
      'Infeksi jamur Puccinia sorghi ditandai pustula cokelat kemerahan berisi spora pada permukaan daun.',
    actions: [
      'Pangkas dan musnahkan daun yang terinfeksi berat untuk menekan sebaran spora.',
      'Jaga jarak tanam dan gulma agar sirkulasi udara antar tanaman tetap kering.',
      'Pantau blok lahan sekitar tiap 3–5 hari terutama saat kelembapan tinggi.',
    ],
  },
  Hawar: {
    title: 'Hawar Daun Jagung (Northern Corn Leaf Blight)',
    summary:
      'Infeksi Exserohilum turcicum membentuk lesi memanjang seperti cerutu berwarna hijau keabu-abuan hingga cokelat.',
    actions: [
      'Bersihkan residu daun terinfeksi setelah panen agar patogen tidak bertahan di lahan.',
      'Perbaiki drainase lahan untuk mencegah genangan dan kelembapan berlebih.',
      'Pertimbangkan fungisida anjuran apabila lesi mulai menyerang daun di sekitar tongkol.',
    ],
  },
  Sehat: {
    title: 'Daun Jagung Sehat',
    summary:
      'Tidak ditemukan tanda khas pustula karat maupun lesi memanjang hawar pada permukaan daun.',
    actions: [
      'Pertahankan pemupukan berimbang (N, P, K) sesuai fase pertumbuhan jagung.',
      'Lakukan pengamatan visual rutin minimal seminggu sekali.',
      'Jaga kebersihan gulma di sekitar pangkal batang.',
    ],
  },
}

interface ResultDetailCardProps {
  result: EvaluateResponse
  cnnCtx: CnnContext
  onRetrySymptoms?: () => void
  onNewDiagnosis: () => void
  onBack?: () => void
  backLabel?: string
  headerSubtitle?: string
}

/**
 * Halaman 3 User & Detail Riwayat: Ringkasan diagnosis Forest & Bone.
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
            'Gejala fisik yang dipilih belum cukup kuat atau berbeda dengan prediksi visual.',
          actions: [
            'Ambil ulang foto daun dengan pencahayaan merata dan fokus pada bercak.',
            'Ulangi pemeriksaan kedua sisi daun (atas dan bawah).',
            'Konsultasikan sampel daun ke penyuluh atau pakar pertanian setempat.',
          ],
        }

  const thumbUrl = getApiAssetUrl(cnnCtx.prediction?.image_url)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {onBack && (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </div>
      )}

      {/* Header Verdict Solid & Bersih */}
      <div className="flex flex-col justify-between gap-6 rounded-xl border border-[#E4E4DF] bg-white p-6 md:flex-row md:items-center md:p-8">
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
              {headerSubtitle ?? 'Langkah 3 dari 3'}
              {result.status_match && result.status_match !== 'MODE PAKAR'
                ? ` · Analisis Foto & Gejala: ${result.status_match === 'SESUAI' ? 'Sesuai' : 'Tidak Sesuai'}`
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

      {/* Komparasi Analisis Foto vs Gejala & Rekomendasi Lapangan */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6 md:col-span-5">
          <h2 className="text-sm font-semibold text-[#111814]">
            Ringkasan Pemeriksaan
          </h2>

          {cnnCtx.useCnn && cnnCtx.prediction ? (
            <div className="space-y-3 border-t border-zinc-100 pt-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-500">Analisis Foto</span>
                <span className="font-mono font-semibold text-zinc-900">
                  {cnnCtx.prediction.label} (
                  {(cnnCtx.prediction.confidence * 100).toFixed(1)}%)
                </span>
              </div>
              {Object.entries(cnnCtx.prediction.probabilities).map(
                ([cls, prob]) => (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>{cls}</span>
                      <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
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
          ) : (
            <p className="border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              Pemeriksaan dijalankan tanpa foto daun.
            </p>
          )}

          <div className="flex items-baseline justify-between border-t border-zinc-100 pt-3 text-xs">
            <span className="text-zinc-500">Hasil Gejala</span>
            <span className="font-semibold text-[#111814]">
              {result.best?.goal ?? 'Tidak Terbukti'}
            </span>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6 md:col-span-7">
          <h2 className="text-sm font-semibold text-[#111814]">
            Rekomendasi Tindakan Lapangan
          </h2>
          <ol className="divide-y divide-zinc-100 border-t border-zinc-100">
            {guide.actions.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 py-3 text-sm text-zinc-700"
              >
                <span className="font-mono text-xs font-semibold text-[#CA8A04]">
                  0{index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {onRetrySymptoms && (
          <Button variant="outline" onClick={onRetrySymptoms}>
            <RotateCcw className="h-4 w-4" />
            Ulangi Gejala
          </Button>
        )}
        <Button onClick={onNewDiagnosis}>Diagnosis Daun Baru</Button>
      </div>
    </div>
  )
}
