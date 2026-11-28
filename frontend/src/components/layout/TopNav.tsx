import { Link } from '@tanstack/react-router'

/** Header minimal tanpa tab navigasi karena hanya ada 1 halaman pemeriksaan. */
export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E4E4DF] bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          to="/pemeriksaan"
          className="flex items-center gap-2.5 text-[#111814] no-underline"
        >
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
      </div>
    </header>
  )
}
