import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Modal, formInputClass, formLabelClass } from '@/components/portal/Modal'
import { useCreateInspection, useInventory } from '@/hooks/useAdminQueries'
import { useToast } from '@/hooks/useToast'
import type { InspectionOutcome } from '@/types/admin'

export function InspectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: inventory } = useInventory()
  const { mutate, isPending } = useCreateInspection()
  const toast = useToast()
  const pendingItems = inventory?.filter((i) => i.status === 'Pending Inspection') ?? []

  const [form, setForm] = useState({
    inventoryItemId: '',
    inspector: '',
    grade: 'A' as 'A' | 'B' | 'C',
    outcome: 'Approved' as InspectionOutcome,
    notes: '',
    acceptedQuantityKg: 0,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.inventoryItemId) return
    mutate(
      {
        inventoryItemId: form.inventoryItemId,
        inspector: form.inspector,
        grade: form.grade,
        outcome: form.outcome,
        notes: form.notes,
        acceptedQuantityKg: form.outcome === 'Partial Acceptance' ? Number(form.acceptedQuantityKg) : undefined,
      },
      {
        onSuccess: () => {
          toast('Inspection saved', {
            variant: form.outcome === 'Rejected' ? 'error' : 'success',
            description: `Outcome: ${form.outcome}`,
          })
          setForm({ inventoryItemId: '', inspector: '', grade: 'A', outcome: 'Approved', notes: '', acceptedQuantityKg: 0 })
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="New Inspection" description="Record a quality inspection for produce awaiting review.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={formLabelClass}>Produce Batch</label>
          <select
            required
            className={formInputClass}
            value={form.inventoryItemId}
            onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value }))}
          >
            <option value="" disabled>
              {pendingItems.length ? 'Select a batch awaiting inspection' : 'No batches awaiting inspection'}
            </option>
            {pendingItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.crop} · {item.quantityKg}kg · {item.farmerName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelClass}>Inspector</label>
            <input
              required
              placeholder="e.g. Ama Serwaa"
              className={formInputClass}
              value={form.inspector}
              onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
            />
          </div>
          <div>
            <label className={formLabelClass}>Inspection Date</label>
            <input type="date" disabled className={formInputClass} value={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelClass}>Grade</label>
            <select className={formInputClass} value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value as 'A' | 'B' | 'C' }))}>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
          <div>
            <label className={formLabelClass}>Outcome</label>
            <select
              className={formInputClass}
              value={form.outcome}
              onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value as InspectionOutcome }))}
            >
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Partial Acceptance">Partial Acceptance</option>
            </select>
          </div>
        </div>

        {form.outcome === 'Partial Acceptance' && (
          <div>
            <label className={formLabelClass}>Accepted Quantity (kg)</label>
            <input
              type="number"
              required
              className={formInputClass}
              value={form.acceptedQuantityKg}
              onChange={(e) => setForm((f) => ({ ...f, acceptedQuantityKg: Number(e.target.value) }))}
            />
          </div>
        )}

        <div>
          <label className={formLabelClass}>Notes</label>
          <textarea
            rows={3}
            required
            placeholder="Condition, color, firmness, any defects observed..."
            className={formInputClass}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div>
          <label className={formLabelClass}>Photos</label>
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400">
            <Camera className="size-4" />
            2 mock photos will be attached to this inspection
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !form.inventoryItemId}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-glow hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Save Inspection'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
