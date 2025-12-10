import { createPortal } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
  className?: string
}

export default function Loading({ fullScreen = false, message = '로딩 중...', className }: LoadingProps) {
  if (fullScreen) {
    const loadingElement = (
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    )

    // Portal을 사용하여 body에 직접 렌더링
    return createPortal(loadingElement, document.body)
  }

  return (
    <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
      <Spinner className="h-5 w-5 text-primary" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  )
}
