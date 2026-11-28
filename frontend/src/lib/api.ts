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
  cnn_probabilities?: Record<string, number> | null
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
  cnn_probabilities?: Record<string, number> | null
  results?: HypothesisResult[] | null
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

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface KnowledgeBaseData {
  facts: Record<string, string>
  mb_md: Record<string, Record<string, [number, number]>>
  goal_order: string[]
  cf_accept: number
  cf_dugaan: number
}

export interface ModelStatusData {
  exists: boolean
  filename: string
  size_mb: number
  keras_version: string
  input_size: number
  class_names: string[]
}

export class UnauthorizedError extends Error {
  constructor(message = 'Sesi Admin berakhir. Silakan login kembali.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  const errBody = await response.json().catch(() => ({}))
  return typeof errBody?.detail === 'string'
    ? errBody.detail
    : `Server mengembalikan status ${response.status}`
}

/** Login Admin ke endpoint FastAPI `/api/auth/login`. */
export async function adminLogin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorDetail(response))
  }

  return (await response.json()) as LoginResponse
}

async function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401 || response.status === 403) {
    throw new UnauthorizedError(await parseErrorDetail(response))
  }
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response))
  }

  return (await response.json()) as T
}

export function fetchAdminKb(token: string): Promise<KnowledgeBaseData> {
  return adminFetch<KnowledgeBaseData>('/api/admin/kb', token)
}

export function updateAdminKb(
  token: string,
  payload: KnowledgeBaseData,
): Promise<KnowledgeBaseData> {
  return adminFetch<KnowledgeBaseData>('/api/admin/kb', token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function resetAdminKb(token: string): Promise<KnowledgeBaseData> {
  return adminFetch<KnowledgeBaseData>('/api/admin/kb/reset', token, {
    method: 'POST',
  })
}

export function fetchAdminModelStatus(token: string): Promise<ModelStatusData> {
  return adminFetch<ModelStatusData>('/api/admin/model/status', token)
}

export function fetchAdminHistory(token: string): Promise<HistoryResponse> {
  return adminFetch<HistoryResponse>('/api/admin/history', token)
}

export async function uploadAdminModel(
  token: string,
  file: File,
): Promise<ModelStatusData> {
  const formData = new FormData()
  formData.append('file', file)
  return adminFetch<ModelStatusData>('/api/admin/model/upload', token, {
    method: 'POST',
    body: formData,
  })
}

export function clearAdminHistory(token: string): Promise<{ status: string }> {
  return adminFetch<{ status: string }>('/api/admin/history', token, {
    method: 'DELETE',
  })
}

export async function downloadAdminHistoryCsv(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/history/csv`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 401 || response.status === 403) {
    throw new UnauthorizedError(await parseErrorDetail(response))
  }
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response))
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'riwayat_diagnosis_jagung.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
