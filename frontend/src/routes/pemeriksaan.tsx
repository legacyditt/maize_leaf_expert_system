import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ImageUploadCard } from '@/components/diagnosis/ImageUploadCard'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import {
  evaluateExpertSession,
  type EvaluateResponse,
  type PredictResponse,
} from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

type ExamStep = 'examine' | 'result'

export const Route = createFileRoute('/pemeriksaan')({
  component: PemeriksaanPage,
})

/**
 * Tab 2: Alur terpadu Upload Foto + Validasi Gejala dalam 1 halaman -> Hasil Akhir.
 */
function PemeriksaanPage() {
  const [step, setStep] = useState<ExamStep>('examine')
  const [cnnCtx, setCnnCtx] = useState<CnnContext>({
    prediction: null,
    fileName: null,
    useCnn: false,
  })
  const [known, setKnown] = useState<Record<string, 'ya' | 'tidak'>>({})
  const [expertState, setExpertState] = useState<EvaluateResponse | null>(null)
  const [finalResult, setFinalResult] = useState<EvaluateResponse | null>(null)
  const [loading, setLoading] = useState(false)
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
        cnn_probabilities: ctx.prediction?.probabilities ?? null,
        image_name: ctx.fileName,
        image_url: ctx.prediction?.image_url ?? null,
        log_history: true,
      })
      if (res.is_complete) {
        setFinalResult(res)
        setStep('result')
        return
      }
      setExpertState(res)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengevaluasi gejala.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleImagePredicted(prediction: PredictResponse, fileName: string) {
    const nextCtx: CnnContext = { prediction, fileName, useCnn: true }
    setCnnCtx(nextCtx)
    setKnown({})
    setFinalResult(null)
    void runEvaluate({}, nextCtx)
  }

  function handleSkipToExpert() {
    const nextCtx: CnnContext = { prediction: null, fileName: null, useCnn: false }
    setCnnCtx(nextCtx)
    setKnown({})
    setFinalResult(null)
    void runEvaluate({}, nextCtx)
  }

  function handleAnswer(factId: string, answer: 'ya' | 'tidak') {
    const nextKnown = { ...known, [factId]: answer }
    setKnown(nextKnown)
    void runEvaluate(nextKnown, cnnCtx)
  }

  function handleRetrySymptoms() {
    setKnown({})
    setFinalResult(null)
    setExpertState(null)
    setStep('examine')
    void runEvaluate({}, cnnCtx)
  }

  function handleNewDiagnosis() {
    setCnnCtx({ prediction: null, fileName: null, useCnn: false })
    setKnown({})
    setExpertState(null)
    setFinalResult(null)
    setError(null)
    setStep('examine')
  }

  if (step === 'examine') {
    return (
      <ImageUploadCard
        expertState={expertState}
        expertLoading={loading}
        expertError={error}
        hasStarted={cnnCtx.useCnn || expertState !== null || loading}
        onImagePredicted={handleImagePredicted}
        onSkipToExpert={handleSkipToExpert}
        onAnswer={handleAnswer}
      />
    )
  }

  if (!finalResult) return null

  return (
    <ResultDetailCard
      result={finalResult}
      cnnCtx={cnnCtx}
      onRetrySymptoms={handleRetrySymptoms}
      onNewDiagnosis={handleNewDiagnosis}
    />
  )
}
