import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KnowledgeBaseData } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AdminRulesViewProps {
  kb: KnowledgeBaseData
  saving: boolean
  onSaveKb: (nextKb: KnowledgeBaseData) => void
  onResetKb: () => void
}

/**
 * Menu Aturan & Bobot MB/MD: Tabel aturan per penyakit, MB/MD, CF threshold, dan prioritas hipotesis.
 */
export function AdminRulesView({
  kb,
  saving,
  onSaveKb,
  onResetKb,
}: AdminRulesViewProps) {
  const [draft, setDraft] = useState<KnowledgeBaseData>(kb)
  const goals = draft.goal_order.length
    ? draft.goal_order
    : Object.keys(draft.mb_md)
  const [selectedGoal, setSelectedGoal] = useState<string>(goals[0] ?? 'Karat')

  const activeWeights = draft.mb_md[selectedGoal] ?? {}
  const availableFacts = Object.keys(draft.facts).filter(
    (fid) => !(fid in activeWeights),
  )

  function updateWeight(factId: string, index: 0 | 1, raw: string) {
    const val = Math.max(0, Math.min(1, Number(raw) || 0))
    setDraft((prev) => {
      const curr = prev.mb_md[selectedGoal]?.[factId] ?? [0, 0]
      const updated: [number, number] =
        index === 0 ? [val, curr[1]] : [curr[0], val]
      return {
        ...prev,
        mb_md: {
          ...prev.mb_md,
          [selectedGoal]: {
            ...prev.mb_md[selectedGoal],
            [factId]: updated,
          },
        },
      }
    })
  }

  function addSymptomToRule(factId: string) {
    setDraft((prev) => ({
      ...prev,
      mb_md: {
        ...prev.mb_md,
        [selectedGoal]: {
          ...prev.mb_md[selectedGoal],
          [factId]: [0.5, 0.05],
        },
      },
    }))
  }

  function removeSymptomFromRule(factId: string) {
    setDraft((prev) => {
      const nextRule = { ...prev.mb_md[selectedGoal] }
      delete nextRule[factId]
      return {
        ...prev,
        mb_md: {
          ...prev.mb_md,
          [selectedGoal]: nextRule,
        },
      }
    })
  }

  function moveGoal(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= goals.length) return
    const nextOrder = [...goals]
    const [item] = nextOrder.splice(index, 1)
    nextOrder.splice(target, 0, item)
    setDraft((prev) => ({ ...prev, goal_order: nextOrder }))
  }

  return (
    <div className="space-y-6">
      {/* Pilih Penyakit & Tabel Aturan MB/MD */}
      <div className="rounded-xl border border-[#E4E4DF] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <h2 className="text-sm font-semibold text-[#111814]">
            Aturan &amp; Bobot MB / MD per Penyakit
          </h2>
          <div className="flex gap-1.5">
            {goals.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGoal(g)}
                className={cn(
                  'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedGoal === g
                    ? 'bg-[#1B4332] text-white'
                    : 'border border-[#E4E4DF] bg-[#F8F7F4] text-zinc-600 hover:text-[#111814]',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E4DF] text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="w-16 py-2.5 pr-4 font-semibold">Kode</th>
                <th className="py-2.5 pr-4 font-semibold">Deskripsi Gejala</th>
                <th className="w-28 py-2.5 pr-4 font-semibold">MB (Belief)</th>
                <th className="w-28 py-2.5 pr-4 font-semibold">
                  MD (Disbelief)
                </th>
                <th className="w-24 py-2.5 pr-4 text-center font-semibold">
                  CF (MB−MD)
                </th>
                <th className="w-14 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {Object.entries(activeWeights).map(([factId, [mb, md]]) => {
                const cf = mb - md
                return (
                  <tr key={factId}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1B4332]">
                      {factId}
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-700">
                      {draft.facts[factId] ?? '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={mb}
                        onChange={(e) => updateWeight(factId, 0, e.target.value)}
                        className="h-8 w-full rounded-md border border-[#E4E4DF] bg-[#F8F7F4] px-2.5 font-mono text-xs focus:border-[#1B4332] focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={md}
                        onChange={(e) => updateWeight(factId, 1, e.target.value)}
                        className="h-8 w-full rounded-md border border-[#E4E4DF] bg-[#F8F7F4] px-2.5 font-mono text-xs focus:border-[#1B4332] focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4 text-center font-mono text-xs font-semibold text-[#1B4332]">
                      {cf.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeSymptomFromRule(factId)}
                        aria-label={`Hapus ${factId} dari ${selectedGoal}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#E4E4DF] bg-white text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {availableFacts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
            <span className="text-xs text-zinc-500">
              Tambah gejala ke aturan {selectedGoal}:
            </span>
            {availableFacts.map((fid) => (
              <button
                key={fid}
                type="button"
                onClick={() => addSymptomToRule(fid)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#E4E4DF] bg-white px-2.5 py-1 font-mono text-xs text-[#111814] hover:border-[#1B4332]"
              >
                <Plus className="h-3 w-3 text-[#1B4332]" />
                {fid}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prioritas Hipotesis & Threshold CF */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[#E4E4DF] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#111814]">
            Urutan Prioritas Backward Chaining
          </h2>
          <div className="space-y-2 border-t border-zinc-100 pt-3">
            {goals.map((g, idx) => (
              <div
                key={g}
                className="flex items-center justify-between rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 py-2 text-xs"
              >
                <span className="font-medium text-[#111814]">
                  {idx + 1}. {g}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveGoal(idx, -1)}
                    className="cursor-pointer rounded border border-[#E4E4DF] bg-white p-1 disabled:opacity-40"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === goals.length - 1}
                    onClick={() => moveGoal(idx, 1)}
                    className="cursor-pointer rounded border border-[#E4E4DF] bg-white p-1 disabled:opacity-40"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#E4E4DF] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#111814]">
            Ambang Batas Certainty Factor
          </h2>
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">
                CF Diterima (cf_accept)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="0.99"
                value={draft.cf_accept}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cf_accept: Number(e.target.value) || 0.6,
                  }))
                }
                className="h-9 w-full rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">
                CF Dugaan (cf_dugaan)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                max="0.95"
                value={draft.cf_dugaan}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cf_dugaan: Number(e.target.value) || 0.3,
                  }))
                }
                className="h-9 w-full rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={saving} onClick={onResetKb}>
          <RotateCcw className="h-4 w-4" />
          Reset Default
        </Button>
        <Button disabled={saving} onClick={() => onSaveKb(draft)}>
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Aturan & Bobot'}
        </Button>
      </div>
    </div>
  )
}
