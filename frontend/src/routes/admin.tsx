import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { AdminLoginCard } from '@/components/admin/AdminLoginCard'
import { AdminPanel } from '@/components/admin/AdminPanel'
import {
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '@/lib/admin-auth'
import {
  clearAdminHistory,
  downloadAdminHistoryCsv,
  fetchAdminHistory,
  fetchAdminKb,
  fetchAdminModelStatus,
  resetAdminKb,
  UnauthorizedError,
  updateAdminKb,
  uploadAdminModel,
  type HistoryResponse,
  type KnowledgeBaseData,
  type ModelStatusData,
} from '@/lib/api'

export const Route = createFileRoute('/admin')({
  component: AdminRoutePage,
})

/**
 * Halaman `/admin`: langsung menampilkan form login jika belum terautentikasi,
 * lalu masuk ke Panel Admin setelah login berhasil.
 */
function AdminRoutePage() {
  const [token, setToken] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [kb, setKb] = useState<KnowledgeBaseData | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatusData | null>(null)
  const [history, setHistory] = useState<HistoryResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function loadAdminData(activeToken: string) {
    try {
      const [kbData, modelData, historyData] = await Promise.all([
        fetchAdminKb(activeToken),
        fetchAdminModelStatus(activeToken),
        fetchAdminHistory(activeToken),
      ])
      setKb(kbData)
      setModelStatus(modelData)
      setHistory(historyData)
      setError(null)
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        clearAdminToken()
        setToken(null)
        setKb(null)
        setLoginError(err.message)
      } else {
        setError(
          err instanceof Error ? err.message : 'Gagal memuat data admin.',
        )
      }
    } finally {
      setCheckingSession(false)
    }
  }

  useEffect(() => {
    const saved = getAdminToken()
    if (!saved) {
      setCheckingSession(false)
      return
    }
    setToken(saved)
    void loadAdminData(saved)
  }, [])

  function handleLoginSuccess(nextToken: string) {
    setAdminToken(nextToken)
    setToken(nextToken)
    setLoginError(null)
    setCheckingSession(true)
    void loadAdminData(nextToken)
  }

  function handleLogout() {
    clearAdminToken()
    setToken(null)
    setKb(null)
    setModelStatus(null)
    setHistory(null)
    setMessage(null)
    setError(null)
  }

  function handleActionError(err: unknown, fallback: string) {
    if (err instanceof UnauthorizedError) {
      handleLogout()
      setLoginError(err.message)
    } else {
      setError(err instanceof Error ? err.message : fallback)
    }
  }

  async function handleSaveKb(nextKb: KnowledgeBaseData) {
    if (!token) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const updated = await updateAdminKb(token, nextKb)
      setKb(updated)
      setMessage('Basis pengetahuan berhasil disimpan.')
    } catch (err) {
      handleActionError(err, 'Gagal menyimpan data.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetKb() {
    if (!token) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const reset = await resetAdminKb(token)
      setKb(reset)
      setMessage('Basis pengetahuan dikembalikan ke nilai default.')
    } catch (err) {
      handleActionError(err, 'Gagal mereset data.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUploadModel(file: File) {
    if (!token) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const updatedModel = await uploadAdminModel(token, file)
      setModelStatus(updatedModel)
      setMessage(`Model ${updatedModel.filename} berhasil diaktifkan.`)
    } catch (err) {
      handleActionError(err, 'Gagal mengunggah model.')
    } finally {
      setBusy(false)
    }
  }

  async function handleClearHistory() {
    if (!token) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await clearAdminHistory(token)
      const refreshed = await fetchAdminHistory(token)
      setHistory(refreshed)
      setMessage('Seluruh riwayat pemeriksaan berhasil dihapus.')
    } catch (err) {
      handleActionError(err, 'Gagal menghapus riwayat.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadCsv() {
    if (!token) return
    setError(null)
    try {
      await downloadAdminHistoryCsv(token)
    } catch (err) {
      handleActionError(err, 'Gagal mengunduh CSV.')
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
        Memeriksa sesi admin...
      </div>
    )
  }

  if (!token || !kb) {
    return (
      <AdminLoginCard
        onSuccess={handleLoginSuccess}
        initialError={loginError}
      />
    )
  }

  return (
    <AdminPanel
      kb={kb}
      modelStatus={modelStatus}
      history={history}
      busy={busy}
      message={message}
      error={error}
      onSaveKb={handleSaveKb}
      onResetKb={handleResetKb}
      onUploadModel={handleUploadModel}
      onClearHistory={handleClearHistory}
      onDownloadCsv={handleDownloadCsv}
      onLogout={handleLogout}
    />
  )
}
