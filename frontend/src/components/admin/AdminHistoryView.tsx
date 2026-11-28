import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import { Button } from '@/components/ui/button'
import type { HistoryEntry, HistoryResponse } from '@/lib/api'
import { formatIndonesianDate } from '@/lib/format-date'
import { historyEntryToViewModels } from '@/lib/history-mapper'

interface AdminHistoryViewProps {
  history: HistoryResponse | null
  busy: boolean
  onDownloadCsv: () => void
  onClearHistory: () => void
}

/**
 * Menu Riwayat Diagnosis Admin: Tabel lengkap (klik baris untuk lihat hasil), ekspor CSV, dan hapus riwayat.
 */
export function AdminHistoryView({
  history,
  busy,
  onDownloadCsv,
  onClearHistory,
}: AdminHistoryViewProps) {
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  const entries = history?.entries ?? []

  if (selected) {
    const { result, cnnCtx } = historyEntryToViewModels(selected)
    return (
      <ResultDetailCard
        result={result}
        cnnCtx={cnnCtx}
        onBack={() => setSelected(null)}
        backLabel="Kembali ke Riwayat"
        headerSubtitle={formatIndonesianDate(selected.timestamp)}
      />
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#C6DEC9] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#111814]">
            Riwayat Pemeriksaan Pengguna
          </h2>
          <p className="text-xs text-zinc-500">
            Total {history?.total ?? 0} catatan · Sesuai:{' '}
            {history?.sesuai_count ?? 0} · Tidak Sesuai:{' '}
            {history?.mismatch_count ?? 0} · Klik baris untuk lihat detail
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || entries.length === 0}
            onClick={onDownloadCsv}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || entries.length === 0}
            onClick={() => {
              if (window.confirm('Hapus seluruh riwayat pemeriksaan?')) {
                onClearHistory()
              }
            }}
            className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Riwayat
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          Belum ada catatan riwayat pemeriksaan.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="py-2.5 pr-4 font-medium">Waktu</th>
                <th className="py-2.5 pr-4 font-medium">Nama Citra</th>
                <th className="py-2.5 pr-4 font-medium">Prediksi CNN</th>
                <th className="py-2.5 pr-4 font-medium">Hasil Gejala</th>
                <th className="py-2.5 pr-4 font-medium">CF</th>
                <th className="py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entries.map((row, idx) => (
                <tr
                  key={`${row.timestamp}-${idx}`}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer transition-colors hover:bg-[#F3F9F4]"
                >
                  <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600">
                    {formatIndonesianDate(row.timestamp)}
                  </td>
                  <td className="max-w-[160px] truncate py-2.5 pr-4 font-mono text-[#111814]">
                    {row.image_name || '-'}
                  </td>
                  <td className="py-2.5 pr-4 text-[#111814]">
                    {row.cnn_label} ({(row.cnn_confidence * 100).toFixed(1)}%)
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-[#111814]">
                    {row.expert_label}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[#1B4332]">
                    {(row.expert_cf * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5">
                    <span
                      className={
                        row.status_match === 'SESUAI'
                          ? 'font-semibold text-[#1B4332]'
                          : 'font-semibold text-[#CA8A04]'
                      }
                    >
                      {row.status_match}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
