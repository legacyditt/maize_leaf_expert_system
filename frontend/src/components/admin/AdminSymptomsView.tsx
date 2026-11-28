import { useState } from 'react'
import { Eye, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KnowledgeBaseData } from '@/lib/api'
import { formatSymptomQuestion } from '@/lib/format-question'

interface AdminSymptomsViewProps {
  kb: KnowledgeBaseData
  saving: boolean
  onSaveKb: (nextKb: KnowledgeBaseData) => void
}

/**
 * Menu Gejala Penyakit: Tabel (Kode, Gejala, Aksi) dengan modal Detail relasi penyakit & pertanyaan user.
 */
export function AdminSymptomsView({
  kb,
  saving,
  onSaveKb,
}: AdminSymptomsViewProps) {
  const [facts, setFacts] = useState<Record<string, string>>(kb.facts)
  const [newCode, setNewCode] = useState('')
  const [newText, setNewText] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [detailCode, setDetailCode] = useState<string | null>(null)

  function getLinkedRules(code: string) {
    return Object.entries(kb.mb_md)
      .filter(([, weights]) => code in weights)
      .map(([goal, weights]) => {
        const [mb, md] = weights[code]
        return { goal, mb, md, cf: mb - md }
      })
  }

  function handleAddSymptom() {
    const code = newCode.trim().toUpperCase()
    const text = newText.trim()
    if (!code || !text) {
      setLocalError('Kode dan gejala wajib diisi.')
      return
    }
    if (code in facts) {
      setLocalError(`Kode ${code} sudah ada.`)
      return
    }
    setLocalError(null)
    setFacts((prev) => ({ ...prev, [code]: text }))
    setNewCode('')
    setNewText('')
  }

  function handleDeleteSymptom(code: string) {
    if (detailCode === code) setDetailCode(null)
    setFacts((prev) => {
      const next = { ...prev }
      delete next[code]
      return next
    })
  }

  function handleSave() {
    const cleanedMbMd: KnowledgeBaseData['mb_md'] = {}
    for (const [goal, weights] of Object.entries(kb.mb_md)) {
      cleanedMbMd[goal] = Object.fromEntries(
        Object.entries(weights).filter(([fid]) => fid in facts),
      )
    }
    onSaveKb({
      ...kb,
      facts,
      mb_md: cleanedMbMd,
    })
  }

  const activeText = detailCode ? (facts[detailCode] ?? '') : ''
  const activeQuestion = formatSymptomQuestion(activeText)
  const activeRules = detailCode ? getLinkedRules(detailCode) : []

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E4E4DF] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#111814]">
          Daftar Variabel Gejala
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E4DF] text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="w-20 py-2.5 pr-4 font-semibold">Kode</th>
                <th className="py-2.5 pr-4 font-semibold">Gejala</th>
                <th className="w-36 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {Object.entries(facts).map(([code, text]) => (
                <tr key={code}>
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[#1B4332]">
                    {code}
                  </td>
                  <td className="py-2.5 pr-4">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) =>
                        setFacts((prev) => ({
                          ...prev,
                          [code]: e.target.value,
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 text-sm text-[#111814] focus:border-[#1B4332] focus:bg-white focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailCode(code)}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E4E4DF] bg-white px-2.5 text-xs font-medium text-[#111814] hover:border-[#1B4332] hover:text-[#1B4332]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSymptom(code)}
                        aria-label={`Hapus gejala ${code}`}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E4E4DF] text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-5">
          <p className="mb-3 text-xs font-semibold text-[#111814]">
            Tambah Gejala Baru
          </p>
          {localError && (
            <p className="mb-2 text-xs text-red-600">{localError}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-[100px_1fr_auto]">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Mis. G8"
              className="h-9 rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 font-mono text-sm focus:border-[#1B4332] focus:bg-white focus:outline-none"
            />
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Nama atau deskripsi gejala..."
              className="h-9 rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 text-sm focus:border-[#1B4332] focus:bg-white focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSymptom}
              className="h-9"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={saving} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Gejala'}
        </Button>
      </div>

      {/* Modal Detail Gejala */}
      {detailCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetailCode(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#E4E4DF] bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#1B4332]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#1B4332]">
                  {detailCode}
                </span>
                <h3 className="text-sm font-semibold text-[#111814]">
                  Detail Gejala
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailCode(null)}
                aria-label="Tutup detail"
                className="cursor-pointer rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="space-y-1">
                <p className="font-medium text-zinc-500">Nama / Deskripsi Gejala</p>
                <p className="rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] p-3 text-sm text-[#111814]">
                  {activeText || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-zinc-500">
                  Pertanyaan yang Ditampilkan ke User
                </p>
                <p className="rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] p-3 text-sm font-medium text-[#111814]">
                  {activeQuestion || '-'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-zinc-500">
                  Masuk ke Penyakit &amp; Bobot Aturan
                </p>
                {activeRules.length === 0 ? (
                  <p className="rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] p-3 text-zinc-500">
                    Gejala ini belum terhubung ke aturan penyakit mana pun.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[#E4E4DF]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F7F4] text-[11px] uppercase text-zinc-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Penyakit</th>
                          <th className="px-3 py-2 text-center font-semibold">
                            MB
                          </th>
                          <th className="px-3 py-2 text-center font-semibold">
                            MD
                          </th>
                          <th className="px-3 py-2 text-center font-semibold">
                            CF
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {activeRules.map((rule) => (
                          <tr key={rule.goal}>
                            <td className="px-3 py-2 font-medium text-[#111814]">
                              {rule.goal}
                            </td>
                            <td className="px-3 py-2 text-center font-mono">
                              {rule.mb.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center font-mono">
                              {rule.md.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-semibold text-[#1B4332]">
                              {rule.cf.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailCode(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
