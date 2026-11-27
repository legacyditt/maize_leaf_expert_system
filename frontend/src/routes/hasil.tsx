import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import { Button } from '@/components/ui/button'
import type { EvaluateResponse } from '@/lib/api'
import {
  clearDiagnosisSession,
  loadCnnContext,
  loadFinalResult,
  type CnnContext,
} from '@/lib/diagnosis-storage'

export const Route = createFileRoute('/hasil')({
  component: ResultPage,
})

function ResultPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [cnnCtx, setCnnCtx] = useState<CnnContext>({
    prediction: null,
    fileName: null,
    useCnn: false,
  })

  useEffect(() => {
    setResult(loadFinalResult())
    setCnnCtx(loadCnnContext())
  }, [])

  if (!result) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-xs">
        <h2 className="text-xl font-bold text-zinc-950">Belum Ada Hasil Diagnosis</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Silakan unggah foto daun jagung dan jawab pertanyaan gejala terlebih dahulu.
        </p>
        <Button className="mt-5" onClick={() => void navigate({ to: '/' })}>
          Mulai Diagnosis Baru
        </Button>
      </div>
    )
  }

  return (
    <ResultDetailCard
      result={result}
      cnnCtx={cnnCtx}
      onRetrySymptoms={() => void navigate({ to: '/diagnosis' })}
      onNewDiagnosis={() => {
        clearDiagnosisSession()
        void navigate({ to: '/' })
      }}
    />
  )
}

