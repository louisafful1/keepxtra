import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface IconTileProps {
  icon: LucideIcon
  className?: string
  size?: 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

const variantMap = {
  primary: 'bg-primary-50 text-primary-600 group-hover:bg-primary-500 group-hover:text-white',
  secondary: 'bg-secondary-50 text-secondary-600 group-hover:bg-secondary-500 group-hover:text-white',
}

const sizeMap = {
  md: 'size-12',
  lg: 'size-14',
}

const iconSizeMap = {
  md: 'size-5',
  lg: 'size-6',
}

export function IconTile({ icon: Icon, className, size = 'md', variant = 'primary' }: IconTileProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl transition-colors duration-300',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      <Icon className={iconSizeMap[size]} strokeWidth={1.75} />
    </div>
  )
}
