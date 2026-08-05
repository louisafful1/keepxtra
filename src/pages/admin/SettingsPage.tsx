import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, Lock } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { StatusBadge } from '@/components/portal/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useWarehouses } from '@/hooks/useAdminQueries'
import { operationsRoles, ROLE_PERMISSIONS } from '@/types/permissions'
import { cn } from '@/lib/cn'

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

function SavableSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
      <h2 className="font-display text-base font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
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

type SettingsTab = 'company' | 'warehouses' | 'pickup-rules' | 'storage-fees' | 'payment-settings' | 'notifications' | 'roles'

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'company', label: 'Company Profile' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'pickup-rules', label: 'Pickup Rules' },
  { id: 'storage-fees', label: 'Storage Fees' },
  { id: 'payment-settings', label: 'Payment Settings' },
  { id: 'notifications', label: 'Notification Preferences' },
  { id: 'roles', label: 'User Roles' },
]

export default function SettingsPage() {
  const seo = buildSeo({ title: 'Settings', description: 'Company profile, warehouses, fees, and platform preferences.' })
  const { user } = useAuth()
  const { can, operationsRole } = usePermissions()
  const { data: warehouses } = useWarehouses()
  const [activeTab, setActiveTab] = useState<SettingsTab>('company')

  const tabPermission: Partial<Record<SettingsTab, boolean>> = {
    'payment-settings': can('settings.payment-config'),
    roles: can('settings.roles'),
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Settings" description="Company profile, warehouses, fees, and platform preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((tab) => {
            const locked = tabPermission[tab.id] === false
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors',
                  activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100',
                )}
              >
                {tab.label}
                {locked && <Lock className="size-3.5 text-neutral-300" />}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-6">
          {activeTab === 'company' && (
            <>
              <SavableSection title="Company Profile" description="Public-facing details for KeepXtra.">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input className={inputClass} defaultValue="KeepXtra" />
                  </div>
                  <div>
                    <label className={labelClass}>Support Email</label>
                    <input type="email" className={inputClass} defaultValue="info@keepxtra.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Support Phone</label>
                    <input className={inputClass} defaultValue="+233 59 141 4352" />
                  </div>
                  <div>
                    <label className={labelClass}>Headquarters</label>
                    <input className={inputClass} defaultValue="256 Avenue, North Kaneshie Street, Ghana" />
                  </div>
                </div>
              </SavableSection>

              <SavableSection title="Your Account">
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
            </>
          )}

          {activeTab === 'warehouses' && (
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
              <h2 className="font-display text-base font-semibold text-neutral-900">Warehouses</h2>
              <p className="mt-1 text-sm text-neutral-500">Manage warehouse network settings. Edit capacity and cold rooms from the Warehouses page.</p>
              <div className="mt-4 flex flex-col divide-y divide-neutral-100">
                {warehouses?.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{w.name}</p>
                      <p className="text-xs text-neutral-400">{w.code} · {w.address}</p>
                    </div>
                    <p className="text-sm text-neutral-500">{w.coldRooms.length} cold rooms</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pickup-rules' && (
            <SavableSection title="Pickup Rules" description="Default rules applied when scheduling and approving pickups.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Minimum Notice Period (hours)</label>
                  <input type="number" className={inputClass} defaultValue={24} />
                </div>
                <div>
                  <label className={labelClass}>Maximum Pickup Radius (km)</label>
                  <input type="number" className={inputClass} defaultValue={60} />
                </div>
                <div>
                  <label className={labelClass}>Default Pickup Window</label>
                  <input className={inputClass} defaultValue="6:00am – 10:00am" />
                </div>
                <div>
                  <label className={labelClass}>Auto-approve requests under (kg)</label>
                  <input type="number" className={inputClass} defaultValue={0} placeholder="0 = manual review for all" />
                </div>
              </div>
            </SavableSection>
          )}

          {activeTab === 'storage-fees' && (
            <SavableSection title="Storage Fees" description="Rates used to calculate farmer storage charges.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Standard Rate (GHS / kg / week)</label>
                  <input className={inputClass} defaultValue="0.20" />
                </div>
                <div>
                  <label className={labelClass}>Grace Period (days)</label>
                  <input type="number" className={inputClass} defaultValue={3} />
                </div>
                <div>
                  <label className={labelClass}>Grade A Discount</label>
                  <input className={inputClass} defaultValue="0%" />
                </div>
                <div>
                  <label className={labelClass}>Long-Term Storage Surcharge (30+ days)</label>
                  <input className={inputClass} defaultValue="+15%" />
                </div>
              </div>
            </SavableSection>
          )}

          {activeTab === 'payment-settings' && (
            tabPermission['payment-settings'] ? (
              <SavableSection title="Payment Settings" description="Commission rates and payout configuration.">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Standard Commission Rate</label>
                    <input className={inputClass} defaultValue="20%" />
                  </div>
                  <div>
                    <label className={labelClass}>Minimum Payout Amount (GHS)</label>
                    <input type="number" className={inputClass} defaultValue={50} />
                  </div>
                  <div>
                    <label className={labelClass}>Default Payout Method</label>
                    <select className={inputClass} defaultValue="Mobile Money">
                      <option>Mobile Money</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Payout Processing Time</label>
                    <input className={inputClass} defaultValue="1–2 business days" />
                  </div>
                </div>
              </SavableSection>
            ) : (
              <RestrictedNotice section="Payment Settings" />
            )
          )}

          {activeTab === 'notifications' && (
            <SavableSection title="Notification Preferences" description="What operations should be notified about.">
              <div className="flex flex-col gap-3">
                {['New farmer registrations', 'Pickup requests awaiting approval', 'Low cold storage capacity', 'Failed payouts', 'Produce nearing expiry'].map((label) => (
                  <label key={label} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <input type="checkbox" defaultChecked className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400" />
                    {label}
                  </label>
                ))}
              </div>
            </SavableSection>
          )}

          {activeTab === 'roles' && (
            tabPermission.roles ? (
              <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft">
                <h2 className="font-display text-base font-semibold text-neutral-900">User Roles</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  You're signed in as <StatusBadge status={operationsRole ?? 'Super Admin'} />. Only one admin account exists today — additional
                  operations roles are ready to assign as the team grows.
                </p>
                <div className="mt-5 flex flex-col divide-y divide-neutral-100">
                  {operationsRoles.map((role) => (
                    <div key={role} className="flex items-center justify-between gap-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{role}</p>
                        <p className="text-xs text-neutral-400">{ROLE_PERMISSIONS[role].length} permissions</p>
                      </div>
                      {role === operationsRole && <StatusBadge status="Active" />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <RestrictedNotice section="User Roles" />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function RestrictedNotice({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Lock className="size-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-medium text-neutral-600">You don't have access to {section}</p>
        <p className="mt-1 text-sm text-neutral-400">Ask a Super Admin or Manager to grant you access.</p>
      </div>
    </div>
  )
}
