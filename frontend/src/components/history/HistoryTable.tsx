import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getApiAssetUrl, type HistoryEntry, type HistoryResponse } from '@/lib/api'
import { formatIndonesianDate } from '@/lib/format-date'
import { cn } from '@/lib/utils'

const FILTERS = ['Semua', 'Karat', 'Hawar', 'Sehat', 'Tidak Terbukti'] as const

interface HistoryTableProps {
  data: HistoryResponse
}

/**
 * Daftar riwayat diagnosis daun jagung dengan gaya Forest & Bone minimalis.
 */
export function HistoryTable({ data }: HistoryTableProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Semua')
  const [selected, setSelected] = useState<HistoryEntry | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.entries.filter((item) => {
      const matchesFilter =
        filter === 'Semua' || item.expert_label === filter
      const matchesQuery =
        !q ||
        item.image_name.toLowerCase().includes(q) ||
        item.cnn_label.toLowerCase().includes(q) ||
        item.expert_label.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [data.entries, filter, query])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E4E4DF] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111814] md:text-3xl">
            Riwayat Diagnosis
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Catatan hasil analisis foto daun dan pemeriksaan gejala.
          </p>
        </div>

        <div className="flex items-center gap-6 text-right font-mono text-xs">
          <div>
            <p className="font-sans text-zinc-500">Total Sesi</p>
            <p className="text-lg font-bold text-[#111814]">{data.total}</p>
          </div>
          <div className="border-l border-[#E4E4DF] pl-6">
            <p className="font-sans text-zinc-500">Hasil Sesuai</p>
            <p className="text-lg font-bold text-[#1B4332]">{data.sesuai_pct}%</p>
          </div>
          <div className="border-l border-[#E4E4DF] pl-6">
            <p className="font-sans text-zinc-500">Tidak Sesuai</p>
            <p className="text-lg font-bold text-[#CA8A04]">
              {data.mismatch_count}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === item
                  ? 'bg-[#1B4332] text-white'
                  : 'border border-[#E4E4DF] bg-white text-zinc-600 hover:text-[#111814]',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari foto atau penyakit..."
            className="w-full rounded-lg border border-[#E4E4DF] bg-white py-2 pl-9 pr-3 text-xs text-[#111814] placeholder:text-zinc-400 focus:border-[#1B4332] focus:outline-none"
          />
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="overflow-hidden rounded-xl border border-[#E4E4DF] bg-white">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Belum ada data riwayat yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E4E4DF] bg-[#F8F7F4] text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                  <th className="px-4 py-3 font-medium">Foto</th>
                  <th className="px-4 py-3 font-medium">Analisis Foto</th>
                  <th className="px-4 py-3 font-medium">Hasil Gejala</th>
                  <th className="px-4 py-3 font-medium">Keyakinan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((entry, idx) => {
                  const isActive =
                    selected?.timestamp === entry.timestamp &&
                    selected?.image_name === entry.image_name
                  return (
                    <tr
                      key={`${entry.timestamp}-${entry.image_name}-${idx}`}
                      onClick={() => setSelected(isActive ? null : entry)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-[#F8F7F4]',
                        isActive && 'bg-[#F8F7F4]',
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                        {formatIndonesianDate(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#111814]">
                        {entry.image_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {entry.cnn_label === '-'
                          ? 'Tanpa Foto'
                          : `${entry.cnn_label} (${(entry.cnn_confidence * 100).toFixed(1)}%)`}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#111814]">
                        {entry.expert_label}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1B4332]">
                        {Math.max(0, entry.expert_cf * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={cn(
                            'font-medium',
                            entry.status_match === 'SESUAI'
                              ? 'text-[#1B4332]'
                              : entry.status_match === 'TIDAK SESUAI'
                                ? 'text-[#CA8A04]'
                                : 'text-zinc-500',
                          )}
                        >
                          {entry.status_match}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ringkasan Baris Terpilih */}
      {selected && (
        <div className="flex items-center gap-4 rounded-xl border border-[#E4E4DF] bg-white p-5 text-sm">
          {getApiAssetUrl(selected.image_url) && (
            <img
              src={getApiAssetUrl(selected.image_url) ?? ''}
              alt={selected.image_name}
              className="h-16 w-16 shrink-0 rounded-lg border border-[#E4E4DF] object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-[#111814]">
                Detail: {selected.image_name}
              </p>
              <span className="text-xs text-zinc-500">
                {formatIndonesianDate(selected.timestamp)}
              </span>
            </div>
            <p className="mt-1.5 text-zinc-600">
              {selected.final_decision || 'Tidak ada keputusan akhir tercatat.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

