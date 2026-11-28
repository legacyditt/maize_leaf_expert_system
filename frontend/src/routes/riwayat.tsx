import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import { HistoryTable } from '@/components/history/HistoryTable'
import {
  fetchDiagnosisHistory,
  type EvaluateResponse,
  type HistoryEntry,
  type HistoryResponse,
} from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'
import { formatIndonesianDate } from '@/lib/format-date'

export const Route = createFileRoute('/riwayat')({
  component: RiwayatPage,
})

function historyEntryToViewModels(entry: HistoryEntry): {
  result: EvaluateResponse
  cnnCtx: CnnContext
} {
  const hasCnn = entry.cnn_label !== '-'
  const probs =
    entry.cnn_probabilities ??
    (hasCnn ? { [entry.cnn_label]: entry.cnn_confidence } : {})

  const cnnCtx: CnnContext = {
    useCnn: hasCnn,
    fileName: entry.image_name,
    prediction: hasCnn
      ? {
          label: entry.cnn_label,
          confidence: entry.cnn_confidence,
          probabilities: probs,
          image_url: entry.image_url ?? null,
        }
      : null,
  }

  const proven =
    entry.expert_label !== 'Tidak Terbukti' && entry.expert_cf >= 0.6

  const result: EvaluateResponse = {
    is_complete: true,
    current_goal: null,
    next_fact_id: null,
    next_fact_text: null,
    step_index: null,
    total_steps: null,
    results: entry.results ?? [],
    trace: [],
    best:
      entry.expert_label !== 'Tidak Terbukti'
        ? {
            goal: entry.expert_label,
            mb: entry.expert_cf,
            md: 0,
            cf: entry.expert_cf,
            pruned: false,
            proven,
          }
        : null,
    final_decision: entry.final_decision,
    status_match: entry.status_match,
    current_mb: entry.expert_cf,
    current_md: 0,
    current_cf: entry.expert_cf,
  }

  return { result, cnnCtx }
}

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
