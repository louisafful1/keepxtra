import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2 } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { AsyncState } from '@/components/portal/AsyncState'
import { useFarmerProfile, useUpdateFarmerProfile } from '@/hooks/useFarmerQueries'
import type { FarmerProfile } from '@/types/farmer'

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

export default function ProfilePage() {
  const seo = buildSeo({ title: 'Profile', description: 'Manage your KeepXtra farmer profile.' })
  const { data, isLoading, isError } = useFarmerProfile()
  const { mutate: updateProfile, isPending, isSuccess } = useUpdateFarmerProfile()
  const [form, setForm] = useState<FarmerProfile | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  function handleChange<K extends keyof FarmerProfile>(key: K, value: FarmerProfile[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form) updateProfile(form)
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Profile" description="Keep your farm and payout details up to date." />

      <AsyncState isLoading={isLoading} isError={isError} errorMessage="Couldn't load your profile right now.">
        {form && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
              <h2 className="font-display text-base font-semibold text-neutral-900">Farmer Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input className={inputClass} value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Farm Location</label>
                  <input className={inputClass} value={form.farmLocation} onChange={(e) => handleChange('farmLocation', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input className={inputClass} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
              <h2 className="font-display text-base font-semibold text-neutral-900">Payout Details</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Preferred Method</label>
                  <input
                    className={inputClass}
                    value={form.preferredPayoutMethod}
                    onChange={(e) => handleChange('preferredPayoutMethod', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account / Mobile Money Number</label>
                  <input
                    className={inputClass}
                    value={form.payoutAccountNumber}
                    onChange={(e) => handleChange('payoutAccountNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
              {isSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-primary-600">
                  <CheckCircle2 className="size-4" /> Saved
                </span>
              )}
            </div>
          </form>
        )}
      </AsyncState>

      <ChangePasswordCard />
    </div>
  )
}

function ChangePasswordCard() {
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <h2 className="font-display text-base font-semibold text-neutral-900">Change Password</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Current Password</label>
          <input type="password" className={inputClass} placeholder="••••••••" />
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <input type="password" className={inputClass} placeholder="••••••••" />
        </div>
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input type="password" className={inputClass} placeholder="••••••••" />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Update Password
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-primary-600">
            <CheckCircle2 className="size-4" /> Updated
          </span>
        )}
      </div>
    </form>
  )
}
