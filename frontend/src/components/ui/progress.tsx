import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  indicatorClassName?: string
  className?: string
}

export function Progress({
  value,
  indicatorClassName,
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-zinc-100',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-[#1B4332] transition-all duration-300',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

