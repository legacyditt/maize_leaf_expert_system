import type { HistoryResponse, KnowledgeBaseData } from '@/lib/api'
import { formatIndonesianDate } from '@/lib/format-date'

interface AdminDashboardViewProps {
  kb: KnowledgeBaseData
  history: HistoryResponse | null
  onNavigateTab: (
    tab: 'dashboard' | 'symptoms' | 'rules' | 'model' | 'history',
  ) => void
}

/**
 * Menu Dashboard Admin: 3 KPI ringkas dan 5 pemeriksaan terbaru.
 */
export function AdminDashboardView({
  kb,
  history,
  onNavigateTab,
}: AdminDashboardViewProps) {
  const total = history?.total ?? 0
  const sesuaiPct = history?.sesuai_pct ?? 0
  const symptomCount = Object.keys(kb.facts).length
  const recent = history?.entries.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E4DF] bg-white p-5">
          <p className="text-xs text-zinc-500">Total Pemeriksaan</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#111814]">
            {total}
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4DF] bg-white p-5">
          <p className="text-xs text-zinc-500">Kesesuaian CNN &amp; Gejala</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1B4332]">
            {sesuaiPct.toFixed(1)}%
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('symptoms')}
          className="cursor-pointer rounded-xl border border-[#E4E4DF] bg-white p-5 text-left transition-colors hover:border-[#1B4332]/40"
        >
          <p className="text-xs text-zinc-500">Variabel Gejala</p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#111814]">
            {symptomCount}
          </p>
        </button>
      </div>

      <div className="rounded-xl border border-[#E4E4DF] bg-white p-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-sm font-semibold text-[#111814]">
            Pemeriksaan Terbaru
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="cursor-pointer text-xs font-medium text-[#1B4332] hover:underline"
          >
            Lihat semua →
          </button>
        </div>

        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Belum ada riwayat pemeriksaan.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="py-2.5 pr-4 font-medium">Waktu</th>
                  <th className="py-2.5 pr-4 font-medium">Citra</th>
                  <th className="py-2.5 pr-4 font-medium">CNN</th>
                  <th className="py-2.5 pr-4 font-medium">Gejala</th>
                  <th className="py-2.5 pr-4 font-medium">CF</th>
                  <th className="py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recent.map((row, idx) => (
                  <tr key={`${row.timestamp}-${idx}`}>
                    <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-600">
                      {formatIndonesianDate(row.timestamp)}
                    </td>
                    <td className="max-w-[140px] truncate py-2.5 pr-4 font-mono text-[#111814]">
                      {row.image_name || '-'}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-[#111814]">
                      {row.cnn_label}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-[#111814]">
                      {row.expert_label}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[#1B4332]">
                      {(row.expert_cf * 100).toFixed(0)}%
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
    </div>
  )
}
