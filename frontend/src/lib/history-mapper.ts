import type { EvaluateResponse, HistoryEntry } from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

/**
 * Mengonversi satu baris HistoryEntry menjadi props untuk ResultDetailCard.
 */
export function historyEntryToViewModels(entry: HistoryEntry): {
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

