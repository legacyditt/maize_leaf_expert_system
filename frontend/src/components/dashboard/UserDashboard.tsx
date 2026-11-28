import { useEffect, useState } from 'react'
import { ArrowRight, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchDiagnosisHistory,
  getApiAssetUrl,
  type HistoryEntry,
} from '@/lib/api'
import { formatIndonesianDate } from '@/lib/format-date'

interface UserDashboardProps {
  onStartExam: () => void
  onOpenHistory: () => void
}

const WORKFLOW_STEPS = [
  { num: '01', text: 'Baca panduan singkat sebelum memulai pemeriksaan.' },
  { num: '02', text: 'Unggah foto daun jagung atau lewati untuk tanya gejala.' },
  { num: '03', text: 'Jawab pertanyaan gejala fisik daun secara bertahap.' },
  { num: '04', text: 'Dapatkan hasil identifikasi dan saran penanganan lapangan.' },
] as const

const CARE_REMINDERS = [
  'Periksa permukaan atas dan bawah daun secara berkala tiap minggu.',
  'Jaga drainase lahan agar kelembapan tidak memicu jamur karat/hawar.',
  'Segera pangkas daun yang menunjukkan bercak berat agar tidak menyebar.',
] as const

function ConfidenceCircle({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const size = 64
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E4E4DF"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1B4332"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute font-mono text-xs font-bold text-[#111814]">
        {clamped.toFixed(0)}%
      </span>
    </div>
  )
}

/**
 * Tab 1: Dashboard User (Forest & Bone solid surface, tanpa gradasi AI slop).
 */
export function UserDashboard({
  onStartExam,
  onOpenHistory,
}: UserDashboardProps) {
  const [latest, setLatest] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    let active = true
    fetchDiagnosisHistory()
      .then((res) => {
        if (active && res.entries.length > 0) {
          setLatest(res.entries[0])
        }
      })
      .catch(() => {
        // Abaikan jika backend belum aktif saat preview awal
      })
    return () => {
      active = false
    }
  }, [])

  const latestThumb = getApiAssetUrl(latest?.image_url)
  const latestPct = latest ? Math.max(0, latest.expert_cf * 100) : 0

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Banner Utama Solid Deep Forest */}
      <section className="flex flex-col justify-between gap-6 rounded-xl bg-[#1B4332] p-7 text-white md:flex-row md:items-center md:p-9">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pantau Kesehatan Daun Jagung Anda
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-emerald-100/90">
            Deteksi dini penyakit Karat Daun, Hawar Daun, atau kondisi Sehat
            melalui analisis foto dan konfirmasi gejala lapangan.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartExam}
          className="shrink-0 bg-[#F8F7F4] text-[#111814] hover:bg-white"
        >
          Mulai Pemeriksaan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* Grid Asimetris: Alur Pemeriksaan (7 col) + Pemeriksaan Terakhir & Tips (5 col) */}
      <div className="grid items-start gap-6 md:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6 md:col-span-7">
          <div>
            <h2 className="text-base font-semibold text-[#111814]">
              Alur Pemeriksaan
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Empat langkah singkat untuk mendapatkan hasil yang akurat.
            </p>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.num} className="flex items-baseline gap-4 py-3.5">
                <span className="font-mono text-xs font-bold text-[#CA8A04]">
                  {item.num}
                </span>
                <p className="text-sm text-zinc-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 md:col-span-5">
          {/* Pemeriksaan Terakhir */}
          <div className="space-y-4 rounded-xl border border-[#E4E4DF] bg-white p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-[#111814]">
                Pemeriksaan Terakhir
              </h2>
              <button
                type="button"
                onClick={onOpenHistory}
                className="cursor-pointer text-xs font-medium text-[#1B4332] hover:underline"
              >
                Lihat Riwayat →
              </button>
            </div>

            {latest ? (
              <div className="space-y-3 border-t border-zinc-100 pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {latestThumb ? (
                      <img
                        src={latestThumb}
                        alt={latest.image_name}
                        className="h-14 w-14 shrink-0 rounded-lg border border-[#E4E4DF] object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] text-zinc-400">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-zinc-500">Hasil Gejala</p>
                      <p className="text-lg font-bold text-[#111814]">
                        {latest.expert_label}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {latest.image_name}
                      </p>
                    </div>
                  </div>

                  <ConfidenceCircle percent={latestPct} />
                </div>

                <p className="border-t border-zinc-100 pt-2.5 text-xs text-zinc-400">
                  {formatIndonesianDate(latest.timestamp)}
                </p>
              </div>
            ) : (
              <p className="border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                Belum ada pemeriksaan tercatat. Klik Mulai Pemeriksaan untuk
                memulai sesi pertama.
              </p>
            )}
          </div>

          {/* Pengingat Perawatan */}
          <div className="space-y-3 rounded-xl border border-[#E4E4DF] bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111814]">
              Tips Perawatan Lahan
            </h2>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-600">
              {CARE_REMINDERS.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4332]" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
