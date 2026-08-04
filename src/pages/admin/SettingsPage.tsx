import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2 } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { useAuth } from '@/hooks/useAuth'

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

function SavableSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4">{children}</div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Save Changes
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-primary-600">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const seo = buildSeo({ title: 'Settings', description: 'Admin account and platform preferences.' })
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Settings" description="Manage your admin account and platform preferences." />

      <SavableSection title="Admin Account">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name</label>
            <input className={inputClass} defaultValue={user?.name} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} defaultValue={user?.email} />
          </div>
        </div>
      </SavableSection>

      <SavableSection title="Platform Preferences">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Default Currency</label>
            <select className={inputClass} defaultValue="GHS">
              <option value="GHS">Ghanaian Cedi (GHS)</option>
              <option value="USD">US Dollar (USD)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Standard Storage Fee (per kg / week)</label>
            <input className={inputClass} defaultValue="GHS 0.80" />
          </div>
        </div>
      </SavableSection>

      <SavableSection title="Notification Preferences">
        <div className="flex flex-col gap-3">
          {['New farmer registrations', 'Pickup requests awaiting approval', 'Low cold storage capacity', 'Failed payouts'].map((label) => (
            <label key={label} className="flex items-center gap-2.5 text-sm text-neutral-600">
              <input type="checkbox" defaultChecked className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400" />
              {label}
            </label>
          ))}
        </div>
      </SavableSection>

      <SavableSection title="Change Password">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
      </SavableSection>
    </div>
  )
}
