import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/portal/DataTable'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useFarmerAccounts, useRegisterFarmer, useUpdateFarmerStatus } from '@/hooks/useAdminQueries'
import { formatCurrency, formatDate, formatKg } from '@/utils/format'
import type { FarmerAccount } from '@/types/admin'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(1, 'Phone is required'),
  farmLocation: z.string().min(1, 'Farm location is required'),
})
type RegisterValues = z.infer<typeof registerSchema>

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

export default function FarmersPage() {
  const seo = buildSeo({ title: 'Farmers', description: 'Manage every farmer registered with KeepXtra.' })
  const { data, isLoading, isError } = useFarmerAccounts()
  const { mutate: registerFarmer, isPending: isRegistering } = useRegisterFarmer()
  const { mutate: updateStatus } = useUpdateFarmerStatus()
  const [formOpen, setFormOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  function onSubmit(values: RegisterValues) {
    registerFarmer(values, { onSuccess: () => { reset(); setFormOpen(false) } })
  }

  const columns: DataTableColumn<FarmerAccount>[] = [
    { header: 'Name', render: (r) => <span className="font-medium text-neutral-900">{r.name}</span> },
    { header: 'Contact', render: (r) => <span>{r.email}<br /><span className="text-neutral-400">{r.phone}</span></span> },
    { header: 'Farm Location', render: (r) => r.farmLocation },
    { header: 'Produce', render: (r) => formatKg(r.totalProduceKg) },
    { header: 'Earnings', render: (r) => formatCurrency(r.totalEarnings) },
    { header: 'Joined', render: (r) => formatDate(r.joinedAt) },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status !== 'Suspended' ? (
            <button
              type="button"
              onClick={() => updateStatus({ id: r.id, status: 'Suspended' })}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Suspend
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updateStatus({ id: r.id, status: 'Active' })}
              className="rounded-lg border border-primary-200 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
            >
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader
        title="Farmers"
        description="Every farmer registered with the KeepXtra network."
        action={
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600"
          >
            <UserPlus className="size-4" /> Register Farmer
          </button>
        }
      />

      {formOpen && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-5 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name</label>
            <input className={inputClass} placeholder="e.g. Abena Owusu" {...register('name')} />
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} placeholder="farmer@example.com" {...register('email')} />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} placeholder="+233 24 000 0000" {...register('phone')} />
            {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Farm Location</label>
            <input className={inputClass} placeholder="e.g. Techiman, Bono East" {...register('farmLocation')} />
            {errors.farmLocation && <p className="mt-1.5 text-xs text-red-500">{errors.farmLocation.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isRegistering}
              className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRegistering ? 'Registering…' : 'Register Farmer'}
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={data ?? []}
        keyField={(r) => r.id}
        isLoading={isLoading}
        emptyMessage={isError ? "Couldn't load farmers right now." : 'No farmers registered yet.'}
      />
    </div>
  )
}
