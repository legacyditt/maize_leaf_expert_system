import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EvaluateResponse } from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

const SYMPTOM_HINTS: Record<string, string> = {
  G1: 'Ciri khas karat daun: bintik serbuk cokelat kemerahan yang mudah menempel jika disentuh.',
  G2: 'Biasanya terlihat bila serangan sudah meluas hingga warna daun memudar atau mengering.',
  G3: 'Periksa sisi atas dan balik daun jagung untuk memastikan sebaran bintik serbuk.',
  G4: 'Ciri khas hawar daun: bercak memanjang berbentuk elips atau seperti cerutu.',
  G5: 'Sering muncul sebagai bercak tahap awal sebelum melebar dan mengering.',
  G6: 'Daun terlihat hijau normal tanpa bintik cokelat ataupun bercak memanjang.',
  G7: 'Seluruh helai daun tampak segar dan utuh.',
}

interface SymptomWizardProps {
  cnnCtx: CnnContext
  state: EvaluateResponse | null
  loading: boolean
  error: string | null
  onAnswer: (factId: string, answer: 'ya' | 'tidak') => void
  onBackToUpload: () => void
}

/**
 * Halaman 2 User: Kuesioner interaktif pemeriksaan kondisi daun jagung.
 */
export function SymptomWizard({
  cnnCtx,
  state,
  loading,
  error,
  onAnswer,
  onBackToUpload,
}: SymptomWizardProps) {
  const factId = state?.next_fact_id ?? ''
  const goal = state?.current_goal ?? ''

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 pb-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            Langkah 2 dari 3 •{' '}
            {cnnCtx.useCnn && cnnCtx.prediction
              ? `Dugaan Awal Foto: ${cnnCtx.prediction.label} (${(cnnCtx.prediction.confidence * 100).toFixed(1)}%)`
              : 'Pemeriksaan Menyeluruh'}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111814]">
            Pemeriksaan Kondisi Daun
          </h1>
        </div>
        {state && (
          <span className="font-mono text-xs text-zinc-500">
            Keyakinan {Math.max(0, state.current_cf * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[#E4E4DF] bg-white p-6 md:p-8">
        {loading && !state ? (
          <div className="flex items-center justify-center gap-2.5 py-12 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
            Memuat pertanyaan...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium text-[#1B4332]">
                Pemeriksaan Kondisi · {goal}
              </span>
              {state?.step_index && state?.total_steps && (
                <span>
                  Pertanyaan {state.step_index} dari {state.total_steps}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold leading-snug text-[#111814] md:text-2xl">
                {state?.next_fact_text}?
              </h2>
              <p className="text-sm text-zinc-500">
                {SYMPTOM_HINTS[factId] ?? 'Jawab sesuai kondisi fisik daun yang diamati.'}
              </p>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading || !factId}
                onClick={() => onAnswer(factId, 'ya')}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-[#1B4332] bg-[#1B4332] px-5 py-3.5 text-left text-white transition-colors hover:bg-[#143326] active:scale-[0.99] disabled:opacity-50"
              >
                <span className="text-sm font-semibold">Ya, Benar</span>
                <Check className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={loading || !factId}
                onClick={() => onAnswer(factId, 'tidak')}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-[#E4E4DF] bg-white px-5 py-3.5 text-left text-[#111814] transition-colors hover:bg-[#F8F7F4] active:scale-[0.99] disabled:opacity-50"
              >
                <span className="text-sm font-medium">Tidak</span>
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center text-xs text-zinc-500">
        <Button variant="ghost" size="sm" onClick={onBackToUpload}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
    </div>
  )
}
