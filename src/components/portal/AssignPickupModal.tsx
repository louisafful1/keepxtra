import { useState } from 'react'
import { Modal, formInputClass, formLabelClass } from '@/components/portal/Modal'
import { useUpdatePickupAssignment } from '@/hooks/useAdminQueries'
import { useToast } from '@/hooks/useToast'
import type { AdminPickupRequest } from '@/types/admin'

export function AssignPickupModal({ pickup, onClose }: { pickup: AdminPickupRequest | null; onClose: () => void }) {
  const { mutate, isPending } = useUpdatePickupAssignment()
  const toast = useToast()
  const [form, setForm] = useState({
    driverName: pickup?.driverName ?? '',
    vehiclePlate: pickup?.vehiclePlate ?? '',
    pickupDate: pickup?.pickupDate ?? pickup?.preferredPickupDate ?? '',
    notes: pickup?.notes ?? '',
  })

  if (!pickup) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup) return
    mutate(
      { id: pickup.id, ...form },
      {
        onSuccess: () => {
          toast('Pickup assigned', { variant: 'success', description: `${form.driverName} will collect ${pickup.crop} on ${form.pickupDate}.` })
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={Boolean(pickup)} onClose={onClose} title="Assign Pickup" description={`${pickup.crop} · ${pickup.farmerName}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={formLabelClass}>Driver</label>
          <input
            required
            placeholder="e.g. Samuel Owusu"
            className={formInputClass}
            value={form.driverName}
            onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Vehicle</label>
          <input
            required
            placeholder="e.g. GT 4521-24"
            className={formInputClass}
            value={form.vehiclePlate}
            onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Pickup Date</label>
          <input
            type="date"
            required
            className={formInputClass}
            value={form.pickupDate}
            onChange={(e) => setForm((f) => ({ ...f, pickupDate: e.target.value }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Notes</label>
          <textarea
            rows={3}
            placeholder="Optional notes for the driver"
            className={formInputClass}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-glow hover:bg-primary-600 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
