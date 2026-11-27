import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ImageUploadCard } from '@/components/diagnosis/ImageUploadCard'
import type { PredictResponse } from '@/lib/api'
import { saveCnnContext } from '@/lib/diagnosis-storage'

export const Route = createFileRoute('/')({
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate()

  function handleContinueWithCnn(prediction: PredictResponse, fileName: string) {
    saveCnnContext({ prediction, fileName, useCnn: true })
    void navigate({ to: '/diagnosis' })
  }

  function handleSkipToExpert() {
    saveCnnContext({ prediction: null, fileName: null, useCnn: false })
    void navigate({ to: '/diagnosis' })
  }

  return (
    <ImageUploadCard
      onContinueWithCnn={handleContinueWithCnn}
      onSkipToExpert={handleSkipToExpert}
    />
  )
}
