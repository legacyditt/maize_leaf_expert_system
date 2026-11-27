import type { EvaluateResponse, PredictResponse } from '@/lib/api'

export interface CnnContext {
  prediction: PredictResponse | null
  fileName: string | null
  useCnn: boolean
}

const CNN_CTX_KEY = 'maize_cnn_context'
const RESULT_KEY = 'maize_final_result'

export function saveCnnContext(ctx: CnnContext): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CNN_CTX_KEY, JSON.stringify(ctx))
}

export function loadCnnContext(): CnnContext {
  if (typeof window === 'undefined') {
    return { prediction: null, fileName: null, useCnn: false }
  }
  const raw = sessionStorage.getItem(CNN_CTX_KEY)
  if (!raw) return { prediction: null, fileName: null, useCnn: false }
  try {
    return JSON.parse(raw) as CnnContext
  } catch {
    return { prediction: null, fileName: null, useCnn: false }
  }
}

export function saveFinalResult(result: EvaluateResponse): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

export function loadFinalResult(): EvaluateResponse | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(RESULT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as EvaluateResponse
  } catch {
    return null
  }
}

export function clearDiagnosisSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CNN_CTX_KEY)
  sessionStorage.removeItem(RESULT_KEY)
}

