import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminLogin } from '@/lib/api'

interface AdminLoginCardProps {
  onSuccess: (token: string) => void
  initialError?: string | null
}

/**
 * Form login khusus Admin (`/admin`) dengan validasi username & password.
 */
export function AdminLoginCard({
  onSuccess,
  initialError = null,
}: AdminLoginCardProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await adminLogin(username.trim(), password)
      onSuccess(res.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login Admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center">
      <div className="rounded-xl border border-[#C6DEC9] bg-white p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#B7D7BD] bg-[#DCEFE0]">
            <svg
              width="32"
              height="36"
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
          <div>
            <p className="text-base font-bold leading-none tracking-tight text-[#111814]">
              MaizeCare Admin
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Masuk untuk mengelola basis pengetahuan
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="admin-username"
              className="block text-xs font-medium text-[#111814]"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username admin"
              disabled={loading}
              className="h-10 w-full rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] px-3 text-sm text-[#111814] outline-none transition-colors focus:border-[#1B4332] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-[#111814]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                disabled={loading}
                className="h-10 w-full rounded-lg border border-[#E4E4DF] bg-[#F8F7F4] pl-3 pr-10 text-sm text-[#111814] outline-none transition-colors focus:border-[#1B4332] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? 'Sembunyikan password' : 'Lihat password'
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-2 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Masuk
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

