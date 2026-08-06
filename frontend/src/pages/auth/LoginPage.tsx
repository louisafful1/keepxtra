import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Sprout, Truck, Warehouse } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { fadeUp, staggerContainer } from '@/animation/variants'
import { buildSeo } from '@/lib/seo'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const seo = buildSeo({ title: 'Portal Login', description: 'Log in to your KeepXtra Farmer or Admin portal.' })
  const { login, isLoggingIn, error, clearError, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/portal', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  async function onSubmit(values: LoginValues) {
    try {
      const loggedInUser = await login(values)
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/portal', { replace: true })
    } catch {
      // error state is already surfaced via useAuth().error
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>

      {/* Left: illustration */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-10 lg:flex xl:p-14">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 shadow-glow">
            <Sprout className="size-5 text-white" strokeWidth={2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-neutral-900">KeepXtra</span>
        </Link>

        <motion.div initial="hidden" animate="show" variants={staggerContainer(0.12)} className="flex flex-col gap-6">
          <motion.div variants={fadeUp}>
            <ImageSlot
              alt="Farmers, cold storage, and delivery vehicles working together across the KeepXtra network"
              label="Farmers, Storage & Logistics"
              icon={Warehouse}
              aspectRatio="wide"
              rounded="3xl"
            />
          </motion.div>
          <motion.div variants={fadeUp} className="max-w-md">
            <h1 className="text-balance font-display text-4xl font-medium leading-[1.1] text-primary-800">
              Welcome back.
            </h1>
            <p className="mt-3 text-balance text-lg leading-relaxed text-neutral-600">
              Access your KeepXtra Portal.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex gap-6 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <Sprout className="size-4 text-primary-600" /> Produce &amp; storage
            </span>
            <span className="flex items-center gap-2">
              <Truck className="size-4 text-primary-600" /> Pickups &amp; delivery
            </span>
          </motion.div>
        </motion.div>

        <p className="text-xs text-neutral-400">© {new Date().getFullYear()} KeepXtra. All rights reserved.</p>
      </div>

      {/* Right: form */}
      <div className="flex flex-col justify-center bg-white px-6 py-16 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 shadow-glow">
              <Sprout className="size-5 text-white" strokeWidth={2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-neutral-900">KeepXtra</span>
          </Link>

          <Badge>Portal Login</Badge>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-neutral-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-neutral-500">Access your KeepXtra Portal.</p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 flex flex-col gap-5"
            onChange={() => error && clearError()}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                  {...register('rememberMe')}
                />
                Remember me
              </label>
              <Link to="/contact" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className={cn(
                'mt-1 flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition-colors duration-300 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70',
              )}
            >
              {isLoggingIn ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-500">
            <p className="font-medium text-neutral-600">Demo accounts</p>
            <p className="mt-1">Farmer — farmer@keepxtra.com / password123</p>
            <p>Admin — admin@keepxtra.com / admin123</p>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Need an account?{' '}
            <Link to="/contact" className="font-medium text-primary-600 hover:text-primary-700">
              Contact KeepXtra to register.
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
