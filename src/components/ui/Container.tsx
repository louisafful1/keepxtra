import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  as?: ElementType
  narrow?: boolean
}

export function Container({ children, className, as: Tag = 'div', narrow = false }: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-6 sm:px-8 lg:px-12',
        narrow ? 'max-w-3xl' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
