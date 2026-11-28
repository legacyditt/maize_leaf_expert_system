import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/** Top navigation bar dengan tepat 3 tab: Dashboard, Pemeriksaan, Riwayat. */
export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDashboard = pathname === '/'
  const isExam = pathname === '/pemeriksaan'
  const isHistory = pathname === '/riwayat'

  return (
    <header className="sticky top-0 z-30 border-b border-[#E4E4DF] bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 text-[#111814] no-underline">
          <svg
            width="24"
            height="28"
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
          <span className="text-base font-semibold tracking-tight">
            MaizeCare
          </span>
        </Link>

        <nav className="flex items-center gap-8 text-sm">
          <Link
            to="/"
            className={cn(
              'py-5 transition-colors',
              isDashboard
                ? 'border-b-2 border-[#1B4332] font-semibold text-[#111814]'
                : 'text-zinc-500 hover:text-[#111814]',
            )}
          >
            Dashboard
          </Link>
          <Link
            to="/pemeriksaan"
            className={cn(
              'py-5 transition-colors',
              isExam
                ? 'border-b-2 border-[#1B4332] font-semibold text-[#111814]'
                : 'text-zinc-500 hover:text-[#111814]',
            )}
          >
            Pemeriksaan
          </Link>
          <Link
            to="/riwayat"
            className={cn(
              'py-5 transition-colors',
              isHistory
                ? 'border-b-2 border-[#1B4332] font-semibold text-[#111814]'
                : 'text-zinc-500 hover:text-[#111814]',
            )}
          >
            Riwayat
          </Link>
        </nav>

        <span className="text-xs font-medium text-zinc-500">Mode User</span>
      </div>
    </header>
  )
}
