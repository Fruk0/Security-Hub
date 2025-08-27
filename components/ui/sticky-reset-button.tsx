'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onClick: () => void
  show?: boolean
  label?: string
  ariaLabel?: string
}

export function StickyResetButton({
  onClick,
  show = true,
  label = 'Reiniciar',
  ariaLabel = 'Reiniciar flujo',
}: Props) {
  if (!show) return null

  return (
    <div
      className={cn(
        'fixed z-50 left-6 bottom-6',
        // Respeta safe area en móviles con notch
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <Button
        onClick={onClick}
        variant="secondary"
        className={cn(
          'rounded-full shadow-lg transition-all border bg-background',
          'hover:shadow-xl hover:-translate-y-0.5',
          'hover:bg-rose-50 text-rose-700 border-rose-200',
          'backdrop-blur-[2px]'
        )}
        title={ariaLabel}
        aria-label={ariaLabel}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </div>
  )
}
