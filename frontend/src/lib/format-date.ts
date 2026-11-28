/**
 * Mengubah timestamp `'YYYY-MM-DD HH:MM:SS'` menjadi format Indonesia (WITA),
 * misalnya `28 Nov 2026, 12.03 WITA`.
 */
export function formatIndonesianDate(timestamp: string): string {
  const normalized = timestamp.includes('T')
    ? timestamp
    : timestamp.replace(' ', 'T')
  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) {
    return timestamp
  }

  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(parsed)

  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar',
  }).format(parsed)

  return `${datePart}, ${timePart} WITA`
}

