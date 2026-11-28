export interface PredictResponse {
  label: 'Hawar' | 'Karat' | 'Sehat' | string
  confidence: number
  probabilities: Record<string, number>
  image_url?: string | null
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
  image_url?: string | null
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

export interface HistoryEntry {
  timestamp: string
  image_name: string
  cnn_label: string
  cnn_confidence: number
  expert_label: string
  expert_cf: number
  status_match: string
  final_decision: string
  image_url?: string | null
}

export interface HistoryResponse {
  total: number
  sesuai_count: number
  mismatch_count: number
  sesuai_pct: number
  entries: HistoryEntry[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

/** Mengubah path relatif API (mis. `/api/uploads/xxx.jpg`) menjadi URL lengkap. */
export function getApiAssetUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE_URL}${path}`
}

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

/** Mengambil daftar riwayat diagnosis dari endpoint FastAPI `/api/history`. */
export async function fetchDiagnosisHistory(): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/history`)

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const detail =
      typeof errBody?.detail === 'string'
        ? errBody.detail
        : `Server mengembalikan status ${response.status}`
    throw new Error(detail)
  }

  return (await response.json()) as HistoryResponse
}
