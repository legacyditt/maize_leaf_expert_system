import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SymptomWizard } from '@/components/diagnosis/SymptomWizard'
import { evaluateExpertSession, type EvaluateResponse } from '@/lib/api'
import {
  loadCnnContext,
  saveFinalResult,
  type CnnContext,
} from '@/lib/diagnosis-storage'

export const Route = createFileRoute('/diagnosis')({
  component: DiagnosisPage,
})

function DiagnosisPage() {
  const navigate = useNavigate()
  const [cnnCtx, setCnnCtx] = useState<CnnContext>({
    prediction: null,
    fileName: null,
    useCnn: false,
  })
  const [known, setKnown] = useState<Record<string, 'ya' | 'tidak'>>({})
  const [state, setState] = useState<EvaluateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function runEvaluate(
    nextKnown: Record<string, 'ya' | 'tidak'>,
    ctx: CnnContext,
  ) {
    setLoading(true)
    setError(null)
    try {
      const cnnLabel = ctx.useCnn && ctx.prediction ? ctx.prediction.label : null
      const res = await evaluateExpertSession({
        known: nextKnown,
        cnn_label: cnnLabel,
        cnn_confidence: ctx.prediction?.confidence ?? 0,
        image_name: ctx.fileName,
        log_history: true,
      })
      if (res.is_complete) {
        saveFinalResult(res)
        void navigate({ to: '/hasil' })
        return
      }
      setState(res)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengevaluasi gejala.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ctx = loadCnnContext()
    setCnnCtx(ctx)
    void runEvaluate({}, ctx)
  }, [])

  function handleAnswer(factId: string, answer: 'ya' | 'tidak') {
    const nextKnown = { ...known, [factId]: answer }
    setKnown(nextKnown)
    void runEvaluate(nextKnown, cnnCtx)
  }

  return (
    <SymptomWizard
      cnnCtx={cnnCtx}
      state={state}
      loading={loading}
      error={error}
      onAnswer={handleAnswer}
      onBackToUpload={() => void navigate({ to: '/' })}
    />
  )
}

