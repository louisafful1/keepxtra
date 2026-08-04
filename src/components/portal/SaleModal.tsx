import { useState } from 'react'
import { Modal, formInputClass, formLabelClass } from '@/components/portal/Modal'
import { useCreateSale, useInventory } from '@/hooks/useAdminQueries'
import type { OrderRecord } from '@/types/admin'

const buyerTypes: OrderRecord['buyerType'][] = ['Restaurant', 'Hotel', 'Retailer', 'Wholesaler']

export function SaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: inventory } = useInventory()
  const { mutate, isPending } = useCreateSale()
  const availableItems = inventory?.filter((i) => i.status === 'In Storage' && i.quantityKg > 0) ?? []

  const [form, setForm] = useState({
    inventoryItemId: '',
    buyer: '',
    buyerType: 'Restaurant' as OrderRecord['buyerType'],
    quantityKg: 0,
    sellingPrice: 0,
    deliveryDate: '',
  })

  const selectedItem = availableItems.find((i) => i.id === form.inventoryItemId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.inventoryItemId) return
    mutate(
      {
        inventoryItemId: form.inventoryItemId,
        buyer: form.buyer,
        buyerType: form.buyerType,
        quantityKg: Number(form.quantityKg),
        sellingPrice: Number(form.sellingPrice),
        deliveryDate: form.deliveryDate,
      },
      {
        onSuccess: () => {
          setForm({ inventoryItemId: '', buyer: '', buyerType: 'Restaurant', quantityKg: 0, sellingPrice: 0, deliveryDate: '' })
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Record a Sale" description="Sell produce from cold storage to a buyer.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={formLabelClass}>Produce</label>
          <select
            required
            className={formInputClass}
            value={form.inventoryItemId}
            onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value }))}
          >
            <option value="" disabled>
              {availableItems.length ? 'Select produce in storage' : 'No produce currently available'}
            </option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.crop} · {item.quantityKg}kg available · {item.farmerName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelClass}>Buyer</label>
            <input
              required
              placeholder="e.g. Savanna Bistro"
              className={formInputClass}
              value={form.buyer}
              onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))}
            />
          </div>
          <div>
            <label className={formLabelClass}>Buyer Type</label>
            <select
              className={formInputClass}
              value={form.buyerType}
              onChange={(e) => setForm((f) => ({ ...f, buyerType: e.target.value as OrderRecord['buyerType'] }))}
            >
              {buyerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={formLabelClass}>Quantity (kg)</label>
            <input
              type="number"
              required
              max={selectedItem?.quantityKg}
              className={formInputClass}
              value={form.quantityKg}
              onChange={(e) => setForm((f) => ({ ...f, quantityKg: Number(e.target.value) }))}
            />
            {selectedItem && <p className="mt-1 text-xs text-neutral-400">Max {selectedItem.quantityKg}kg available</p>}
          </div>
          <div>
            <label className={formLabelClass}>Selling Price (GHS)</label>
            <input
              type="number"
              required
              className={formInputClass}
              value={form.sellingPrice}
              onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div>
          <label className={formLabelClass}>Delivery Date</label>
          <input
            type="date"
            required
            className={formInputClass}
            value={form.deliveryDate}
            onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
          />
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
            {isPending ? 'Saving…' : 'Record Sale'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
