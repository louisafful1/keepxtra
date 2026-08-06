import { cn } from '@/lib/cn'

interface GradientBlobProps {
  color?: 'primary' | 'secondary' | 'mixed'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

const colorMap = {
  primary: 'from-primary-200/40 via-primary-300/20 to-transparent',
  secondary: 'from-secondary-200/35 via-secondary-300/20 to-transparent',
  mixed: 'from-primary-200/30 via-secondary-200/20 to-transparent',
}

const sizeMap = {
  sm: 'size-64',
  md: 'size-96',
  lg: 'size-[32rem]',
  xl: 'size-[44rem]',
}

export function GradientBlob({
  color = 'primary',
  size = 'lg',
  className,
  animate = true,
}: GradientBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full bg-gradient-to-br blur-3xl',
        colorMap[color],
        sizeMap[size],
        animate && 'animate-float-slow',
        className,
      )}
    />
  )
}
