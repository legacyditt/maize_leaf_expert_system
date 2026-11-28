import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import { HistoryTable } from '@/components/history/HistoryTable'
import {
  fetchDiagnosisHistory,
  type HistoryEntry,
  type HistoryResponse,
} from '@/lib/api'
import { formatIndonesianDate } from '@/lib/format-date'
import { historyEntryToViewModels } from '@/lib/history-mapper'

export const Route = createFileRoute('/riwayat')({
  component: RiwayatPage,
})

function RiwayatPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchDiagnosisHistory()
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat riwayat.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2.5 py-16 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
        Memuat riwayat diagnosis...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error ?? 'Data riwayat tidak tersedia.'}
      </div>
    )
  }

  if (selected) {
    const { result, cnnCtx } = historyEntryToViewModels(selected)
    return (
      <ResultDetailCard
        result={result}
        cnnCtx={cnnCtx}
        onBack={() => setSelected(null)}
        backLabel="Kembali ke Daftar Riwayat"
        headerSubtitle={`${selected.image_name} · ${formatIndonesianDate(selected.timestamp)}`}
        onNewDiagnosis={() => void navigate({ to: '/pemeriksaan' })}
      />
    )
  }

  return <HistoryTable data={data} onSelectEntry={setSelected} />
}
