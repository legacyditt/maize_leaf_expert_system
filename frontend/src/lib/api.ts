export interface PredictResponse {
  label: 'Hawar' | 'Karat' | 'Sehat' | string
  confidence: number
  probabilities: Record<string, number>
}

export interface HypothesisResult {
  goal: string
  mb: number
  md: number
  cf: number
  pruned: boolean
  proven: boolean
}

export interface EvaluateRequest {
  known: Record<string, 'ya' | 'tidak'>
  cnn_label: string | null
  cnn_confidence?: number
  image_name?: string | null
  log_history?: boolean
}

export interface EvaluateResponse {
  is_complete: boolean
  current_goal: string | null
  next_fact_id: string | null
  next_fact_text: string | null
  step_index: number | null
  total_steps: number | null
  results: HypothesisResult[]
  trace: string[]
  best: HypothesisResult | null
  final_decision: string
  status_match: 'SESUAI' | 'TIDAK SESUAI' | string | null
  current_mb: number
  current_md: number
  current_cf: number
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

/** Mengirim gambar daun jagung ke endpoint FastAPI `/api/predict`. */
export async function predictLeafImage(file: File): Promise<PredictResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const detail =
      typeof errBody?.detail === 'string'
        ? errBody.detail
        : `Server mengembalikan status ${response.status}`
    throw new Error(detail)
  }

  return (await response.json()) as PredictResponse
}

/** Mengevaluasi state backward chaining & Certainty Factor via `/api/expert/evaluate`. */
export async function evaluateExpertSession(
  payload: EvaluateRequest,
): Promise<EvaluateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/expert/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const detail =
      typeof errBody?.detail === 'string'
        ? errBody.detail
        : `Server mengembalikan status ${response.status}`
    throw new Error(detail)
  }

  return (await response.json()) as EvaluateResponse
}
