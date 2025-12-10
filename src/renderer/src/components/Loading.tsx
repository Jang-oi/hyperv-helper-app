import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
  className?: string
}

export default function Loading({ fullScreen = false, message = '로딩 중...', className }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
      <Spinner className="h-5 w-5 text-primary" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  )
}
