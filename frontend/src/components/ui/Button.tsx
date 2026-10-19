import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'lg'

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  className?: string
  icon?: boolean
}

interface ButtonAsButton extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  to?: undefined
}

interface ButtonAsLink extends BaseProps {
  to: string
  external?: boolean
  download?: boolean | string
}

type ButtonProps = ButtonAsButton | ButtonAsLink

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-700 text-white shadow-glow hover:bg-primary-800',
  secondary:
    'border border-neutral-200 text-neutral-900 bg-white hover:border-neutral-300 hover:bg-neutral-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
}

const sizeStyles: Record<ButtonSize, string> = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', children, className, icon = false } = props
  const classes = cn(baseStyles, variantStyles[variant], sizeStyles[size], className)

  const content = (
    <>
      {children}
      {icon && <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </>
  )

  if ('to' in props && props.to) {
    const { to, external, download } = props
    if (external) {
      return (
        <motion.a
          href={to}
          {...(download
            ? { download: download === true ? '' : download }
            : { target: '_blank', rel: 'noopener noreferrer' })}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={cn(classes, 'group')}
        >
          {content}
        </motion.a>
      )
    }
    return (
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="inline-block">
        <Link to={to} className={cn(classes, 'group')}>
          {content}
        </Link>
      </motion.div>
    )
  }

  const { type = 'button', onClick, disabled, name, value, form, 'aria-label': ariaLabel } = props as ButtonAsButton
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      name={name}
      value={value}
      form={form}
      aria-label={ariaLabel}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={cn(classes, 'group')}
    >
      {content}
    </motion.button>
  )
}
