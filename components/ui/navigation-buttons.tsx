'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type Props = {
  onBack?: () => void
  backHref?: string
}

export function NavigationButtons({ onBack, backHref }: Props) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <Button variant="ghost" className="h-8 px-2" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>
      ) : backHref ? (
        <Button asChild variant="ghost" className="h-8 px-2">
          <a href={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </a>
        </Button>
      ) : (
        <Button variant="ghost" className="h-8 px-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>
      )}
    </div>
  )
}
