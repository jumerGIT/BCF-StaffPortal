import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const VARIANT: Record<Variant, string> = {
  default: 'badge-neutral badge-outline',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-error',
  info:    'badge-info',
  purple:  'badge-primary',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span className={cn('badge badge-sm font-medium', VARIANT[variant], className)} {...props} />
  )
}
