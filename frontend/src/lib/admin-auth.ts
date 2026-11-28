const ADMIN_TOKEN_KEY = 'maizecare_admin_token'

/** Mengambil token Bearer Admin dari sessionStorage (aman untuk SSR). */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

/** Menyimpan token Bearer Admin ke sessionStorage. */
export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
}

/** Menghapus token Bearer Admin saat logout atau sesi kedaluwarsa. */
export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

