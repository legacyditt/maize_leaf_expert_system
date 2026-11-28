import { useState } from 'react'
import {
  Brain,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Sliders,
} from 'lucide-react'
import { AdminDashboardView } from '@/components/admin/AdminDashboardView'
import { AdminHistoryView } from '@/components/admin/AdminHistoryView'
import { AdminModelView } from '@/components/admin/AdminModelView'
import { AdminRulesView } from '@/components/admin/AdminRulesView'
import { AdminSymptomsView } from '@/components/admin/AdminSymptomsView'
import { Button } from '@/components/ui/button'
import type {
  HistoryResponse,
  KnowledgeBaseData,
  ModelStatusData,
} from '@/lib/api'
import { cn } from '@/lib/utils'

type AdminTab = 'dashboard' | 'symptoms' | 'rules' | 'model' | 'history'

const MENU_ITEMS: Array<{
  id: AdminTab
  label: string
  subtitle: string
  icon: typeof LayoutDashboard
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    subtitle: 'Ringkasan aktivitas diagnosis dan data sistem.',
    icon: LayoutDashboard,
  },
  {
    id: 'symptoms',
    label: 'Gejala Penyakit',
    subtitle: 'Kelola daftar variabel gejala untuk backward chaining.',
    icon: ClipboardList,
  },
  {
    id: 'rules',
    label: 'Aturan & MB/MD',
    subtitle: 'Atur gejala penyusun penyakit, bobot MB/MD, dan ambang CF.',
    icon: Sliders,
  },
  {
    id: 'model',
    label: 'Model CNN',
    subtitle: 'Pantau dan perbarui bobot model klasifikasi citra (.keras).',
    icon: Brain,
  },
  {
    id: 'history',
    label: 'Riwayat',
    subtitle: 'Catatan pemeriksaan pengguna dan ekspor CSV.',
    icon: History,
  },
]

interface AdminPanelProps {
  kb: KnowledgeBaseData
  modelStatus: ModelStatusData | null
  history: HistoryResponse | null
  busy: boolean
  message: string | null
  error: string | null
  onSaveKb: (nextKb: KnowledgeBaseData) => void
  onResetKb: () => void
  onUploadModel: (file: File) => void
  onClearHistory: () => void
  onDownloadCsv: () => void
  onLogout: () => void
}

/**
 * Shell Panel Admin: Navbar 1 baris full-width di atas + konten terpusat.
 */
export function AdminPanel({
  kb,
  modelStatus,
  history,
  busy,
  message,
  error,
  onSaveKb,
  onResetKb,
  onUploadModel,
  onClearHistory,
  onDownloadCsv,
  onLogout,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const activeMenu =
    MENU_ITEMS.find((item) => item.id === activeTab) ?? MENU_ITEMS[0]

  return (
    <div>
      {/* Full-width 1-row Top Navbar */}
      <header className="sticky top-0 z-30 -mx-4 -mt-10 mb-8 border-b border-[#C6DEC9] bg-white md:-mx-8">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 md:px-8">
          {/* Kiri: Brand */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E4DF] bg-[#F8F7F4]">
              <svg
                width="18"
                height="20"
                viewBox="0 0 28 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M14 2C20 8 24 16 22 26C16 28 8 24 4 16C2 10 8 4 14 2Z"
                  fill="#1B4332"
                  stroke="#CA8A04"
                  strokeWidth="1.8"
                />
                <path
                  d="M14 6V24M14 12L19 9M14 17L9 14"
                  stroke="#FEF08A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-[#111814]">
              Admin Panel
            </span>
          </div>

          {/* Tengah: Menu Tabs 1 baris */}
          <nav className="flex flex-1 items-center justify-center gap-6 overflow-x-auto text-xs">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = item.id === activeTab
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex h-16 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-1 font-medium transition-colors',
                    isActive
                      ? 'border-[#1B4332] font-semibold text-[#1B4332]'
                      : 'border-transparent text-zinc-500 hover:text-[#111814]',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Kanan: Avatar AD + Keluar */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              title="admin"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E4E4DF] bg-[#F8F7F4] text-xs font-semibold text-[#111814]"
            >
              AD
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#111814]">
            {activeMenu.label}
          </h1>
          <p className="text-xs text-zinc-500">{activeMenu.subtitle}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-[#1B4332]/20 bg-[#1B4332]/5 px-4 py-3 text-sm text-[#1B4332]">
            {message}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboardView
            kb={kb}
            history={history}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'symptoms' && (
          <AdminSymptomsView
            key={`symptoms-${JSON.stringify(kb.facts)}`}
            kb={kb}
            saving={busy}
            onSaveKb={onSaveKb}
          />
        )}

        {activeTab === 'rules' && (
          <AdminRulesView
            key={`rules-${JSON.stringify(kb)}`}
            kb={kb}
            saving={busy}
            onSaveKb={onSaveKb}
            onResetKb={onResetKb}
          />
        )}

        {activeTab === 'model' && (
          <AdminModelView
            modelStatus={modelStatus}
            uploading={busy}
            onUploadModel={onUploadModel}
          />
        )}

        {activeTab === 'history' && (
          <AdminHistoryView
            history={history}
            busy={busy}
            onDownloadCsv={onDownloadCsv}
            onClearHistory={onClearHistory}
          />
        )}
      </div>
    </div>
  )
}
