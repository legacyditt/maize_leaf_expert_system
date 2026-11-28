/**
 * Mengubah deskripsi gejala menjadi kalimat tanya alami berbahasa Indonesia
 * (diawali "Apakah ..." dan diakhiri "?") jika belum berbentuk pertanyaan.
 */
export function formatSymptomQuestion(text?: string | null): string {
  const trimmed = (text ?? '').trim().replace(/\?+$/, '')
  if (!trimmed) return ''

  if (/^(apakah|adakah|apa|bagaimana|berapa)\b/i.test(trimmed)) {
    return `${trimmed}?`
  }

  const lowerFirst = trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
  return `Apakah ${lowerFirst}?`
}

