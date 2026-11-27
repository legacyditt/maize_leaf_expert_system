import { useState } from 'react'
import { ChevronDown, ChevronUp, Scissors } from 'lucide-react'
import type { HypothesisResult } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ParsedStep {
  kind: 'goal' | 'fact' | 'pruned' | 'summary' | 'raw'
  raw: string
  goal?: string
  premises?: string
  factId?: string
  answer?: 'YA' | 'TIDAK'
  weightNote?: string
  mb?: string
  md?: string
  cf?: string
  pruneNote?: string
}

function parseTraceLine(line: string): ParsedStep {
  const trimmed = line.trim()

  const goalMatch = /^Goal\s+(\w+):\s+premis\s*=\s*(.+)$/.exec(trimmed)
  if (goalMatch) {
    return {
      kind: 'goal',
      raw: line,
      goal: goalMatch[1],
      premises: goalMatch[2],
    }
  }

  const factMatch =
    /^(\w+)\s*=\s*(YA|TIDAK)\s*\(([^)]+)\)\s*->\s*MB=([\d.]+)\s+MD=([\d.]+)\s+CF=([+-]?[\d.]+)$/.exec(
      trimmed,
    )
  if (factMatch) {
    return {
      kind: 'fact',
      raw: line,
      factId: factMatch[1],
      answer: factMatch[2] as 'YA' | 'TIDAK',
      weightNote: factMatch[3],
      mb: factMatch[4],
      md: factMatch[5],
      cf: factMatch[6],
    }
  }

  const pruneMatch = /^=>\s*(\w+)\s+DIPANGKAS\s*\(([^)]+)\)$/.exec(trimmed)
  if (pruneMatch) {
    return {
      kind: 'pruned',
      raw: line,
      goal: pruneMatch[1],
      pruneNote: pruneMatch[2],
    }
  }

  if (trimmed.startsWith('=>')) {
    return { kind: 'summary', raw: trimmed.replace(/^=>\s*/, '') }
  }

  return { kind: 'raw', raw: line }
}

interface ReasoningTraceProps {
  results: HypothesisResult[]
  trace: string[]
}

/**
 * Tampilan Jejak Penalaran Backward Chaining & Certainty Factor
 * dalam format timeline ledger yang bersih dan mudah dipindai.
 */
export function ReasoningTrace({ results, trace }: ReasoningTraceProps) {
  const [showRaw, setShowRaw] = useState(false)
  const steps = trace.map(parseTraceLine)

  return (
    <div className="space-y-4">
      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#E4E4DF] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E4E4DF] bg-[#F8F7F4] text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Hipotesis</th>
                <th className="px-4 py-2.5 font-medium">MB</th>
                <th className="px-4 py-2.5 font-medium">MD</th>
                <th className="px-4 py-2.5 font-medium">CF</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono text-xs">
              {results.map((item) => (
                <tr key={item.goal}>
                  <td className="px-4 py-2.5 font-sans font-semibold text-[#111814]">
                    {item.goal}
                  </td>
                  <td className="px-4 py-2.5">{item.mb.toFixed(3)}</td>
                  <td className="px-4 py-2.5">{item.md.toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1B4332]">
                    {item.cf >= 0 ? '+' : ''}
                    {item.cf.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 font-sans text-zinc-600">
                    {item.pruned
                      ? 'Parsial (Dipangkas)'
                      : item.proven
                        ? 'Terbukti'
                        : 'Tidak Terbukti'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline Ledger Jejak Penalaran */}
      <div className="rounded-xl border border-[#E4E4DF] bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#111814]">
              Alur Inferensi Backward Chaining
            </h3>
            <p className="text-xs text-zinc-500">
              Perhitungan inkremental MYCIN (MB, MD, dan Certainty Factor)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRaw((prev) => !prev)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 hover:text-[#111814]"
          >
            {showRaw ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Log Mentah
          </button>
        </div>

        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            if (step.kind === 'goal') {
              return (
                <div
                  key={`${idx}-${step.raw}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-[#F8F7F4] px-3.5 py-2"
                >
                  <span className="text-xs font-semibold text-[#111814]">
                    Menguji Hipotesis: {step.goal}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    Premis {step.premises}
                  </span>
                </div>
              )
            }

            if (step.kind === 'fact') {
              const isYes = step.answer === 'YA'
              return (
                <div
                  key={`${idx}-${step.raw}`}
                  className="ml-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#E4E4DF] pl-4 py-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isYes ? 'bg-[#1B4332]' : 'bg-zinc-300',
                      )}
                    />
                    <span className="font-mono text-xs font-semibold text-[#111814]">
                      {step.factId}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isYes ? 'text-[#1B4332]' : 'text-zinc-500',
                      )}
                    >
                      {step.answer}
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({step.weightNote})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
                    <span>MB {step.mb}</span>
                    <span>MD {step.md}</span>
                    <span className="font-semibold text-[#111814]">
                      CF {step.cf}
                    </span>
                  </div>
                </div>
              )
            }

            if (step.kind === 'pruned') {
              return (
                <div
                  key={`${idx}-${step.raw}`}
                  className="ml-3 flex items-center gap-2 border-l-2 border-[#CA8A04] pl-4 py-1.5 text-xs text-[#CA8A04]"
                >
                  <Scissors className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>{step.goal} dipangkas:</strong> {step.pruneNote}
                  </span>
                </div>
              )
            }

            if (step.kind === 'summary') {
              return (
                <div
                  key={`${idx}-${step.raw}`}
                  className="ml-3 border-l-2 border-[#1B4332] pl-4 py-1 text-xs font-medium text-[#1B4332]"
                >
                  {step.raw}
                </div>
              )
            }

            return (
              <div
                key={`${idx}-${step.raw}`}
                className="font-mono text-xs text-zinc-500"
              >
                {step.raw}
              </div>
            )
          })}
        </div>

        {showRaw && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-[#111814] p-4 font-mono text-xs leading-relaxed text-zinc-200">
            {trace.join('\n')}
          </pre>
        )}
      </div>
    </div>
  )
}

