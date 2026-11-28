import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ImageUploadCard } from '@/components/diagnosis/ImageUploadCard'
import { ResultDetailCard } from '@/components/diagnosis/ResultDetailCard'
import { SymptomWizard } from '@/components/diagnosis/SymptomWizard'
import { DiagnosisGuide } from '@/components/guide/DiagnosisGuide'
import {
  evaluateExpertSession,
  type EvaluateResponse,
  type PredictResponse,
} from '@/lib/api'
import type { CnnContext } from '@/lib/diagnosis-storage'

type ExamStep = 'guide' | 'upload' | 'symptoms' | 'result'

export const Route = createFileRoute('/pemeriksaan')({
  component: PemeriksaanPage,
})

/**
 * Tab 2: Seluruh alur Panduan -> Upload Foto -> Pertanyaan Gejala -> Hasil Akhir
 * berada di dalam satu tab halaman (`/pemeriksaan`).
 */
function PemeriksaanPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<ExamStep>('guide')
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

  function handleContinueWithCnn(prediction: PredictResponse, fileName: string) {
    const nextCtx: CnnContext = { prediction, fileName, useCnn: true }
    setCnnCtx(nextCtx)
    setKnown({})
    setStep('symptoms')
    void runEvaluate({}, nextCtx)
  }

  function handleSkipToExpert() {
    const nextCtx: CnnContext = { prediction: null, fileName: null, useCnn: false }
    setCnnCtx(nextCtx)
    setKnown({})
    setStep('symptoms')
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
    setStep('symptoms')
    void runEvaluate({}, cnnCtx)
  }

  function handleNewDiagnosis() {
    setCnnCtx({ prediction: null, fileName: null, useCnn: false })
    setKnown({})
    setExpertState(null)
    setFinalResult(null)
    setError(null)
    setStep('upload')
  }

  if (step === 'guide') {
    return (
      <DiagnosisGuide
        onStart={() => setStep('upload')}
        onOpenHistory={() => void navigate({ to: '/riwayat' })}
      />
    )
  }

  if (step === 'upload') {
    return (
      <ImageUploadCard
        onContinueWithCnn={handleContinueWithCnn}
        onSkipToExpert={handleSkipToExpert}
      />
    )
  }

  if (step === 'symptoms') {
    return (
      <SymptomWizard
        cnnCtx={cnnCtx}
        state={expertState}
        loading={loading}
        error={error}
        onAnswer={handleAnswer}
        onBackToUpload={() => setStep('upload')}
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

