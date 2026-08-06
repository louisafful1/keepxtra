import { useState } from 'react'
import { Modal, formInputClass, formLabelClass } from '@/components/portal/Modal'
import { useReceiveAtWarehouse, useWarehouses } from '@/hooks/useAdminQueries'
import { useToast } from '@/hooks/useToast'
import type { AdminPickupRequest } from '@/types/admin'

export function ReceivingModal({ pickup, onClose }: { pickup: AdminPickupRequest | null; onClose: () => void }) {
  const { mutate, isPending } = useReceiveAtWarehouse()
  const { data: warehouses } = useWarehouses()
  const toast = useToast()
  const [form, setForm] = useState({
    quantityKg: pickup?.quantityKg ?? 0,
    weightKg: pickup?.quantityKg ?? 0,
    grade: 'A' as 'A' | 'B' | 'C',
    warehouse: '',
    coldRoom: '',
    storageBin: '',
    shelfLifeDays: 21,
    storageDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
  })

  if (!pickup) return null

  const selectedWarehouse = warehouses?.find((w) => w.name === form.warehouse)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup) return
    mutate(
      {
        pickupId: pickup.id,
        crop: pickup.crop,
        quantityKg: Number(form.quantityKg),
        weightKg: Number(form.weightKg),
        grade: form.grade,
        warehouse: form.warehouse,
        coldRoom: form.coldRoom,
        storageBin: form.storageBin,
        shelfLifeDays: Number(form.shelfLifeDays),
        storageDate: form.storageDate,
        expiryDate: form.expiryDate,
      },
      {
        onSuccess: () => {
          toast('Produce received', { variant: 'success', description: `${pickup.crop} added to inventory at ${form.warehouse}.` })
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={Boolean(pickup)} onClose={onClose} title="Receive at Warehouse" description={`${pickup.crop} from ${pickup.farmerName}`}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={formLabelClass}>Quantity (kg)</label>
          <input
            type="number"
            required
            className={formInputClass}
            value={form.quantityKg}
            onChange={(e) => setForm((f) => ({ ...f, quantityKg: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Weight (kg)</label>
          <input
            type="number"
            required
            className={formInputClass}
            value={form.weightKg}
            onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Quality Grade</label>
          <select
            className={formInputClass}
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value as 'A' | 'B' | 'C' }))}
          >
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
        </div>
        <div>
          <label className={formLabelClass}>Warehouse</label>
          <select
            required
            className={formInputClass}
            value={form.warehouse}
            onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value, coldRoom: '' }))}
          >
            <option value="" disabled>
              Select warehouse
            </option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={formLabelClass}>Cold Room</label>
          <select
            required
            disabled={!selectedWarehouse}
            className={formInputClass}
            value={form.coldRoom}
            onChange={(e) => setForm((f) => ({ ...f, coldRoom: e.target.value }))}
          >
            <option value="" disabled>
              {selectedWarehouse ? 'Select cold room' : 'Select a warehouse first'}
            </option>
            {selectedWarehouse?.coldRooms.map((room) => (
              <option key={room.id} value={room.name} disabled={room.status !== 'Operational'}>
                {room.name} {room.status !== 'Operational' ? `(${room.status})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={formLabelClass}>Storage Bin</label>
          <input
            required
            placeholder="e.g. A-14"
            className={formInputClass}
            value={form.storageBin}
            onChange={(e) => setForm((f) => ({ ...f, storageBin: e.target.value }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Shelf Life (days)</label>
          <input
            type="number"
            required
            className={formInputClass}
            value={form.shelfLifeDays}
            onChange={(e) => setForm((f) => ({ ...f, shelfLifeDays: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className={formLabelClass}>Storage Date</label>
          <input
            type="date"
            required
            className={formInputClass}
            value={form.storageDate}
            onChange={(e) => setForm((f) => ({ ...f, storageDate: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Expiry Date</label>
          <input
            type="date"
            required
            className={formInputClass}
            value={form.expiryDate}
            onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
          />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-glow hover:bg-primary-600 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Confirm Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
