import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-ghost',
  danger:    'btn-error',
  ghost:     'btn-ghost',
  outline:   'btn-outline',
}

const SIZE: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn', VARIANT[variant], SIZE[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
