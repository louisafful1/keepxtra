import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { buildSeo } from '@/lib/seo'
import { PageHeader } from '@/components/portal/PageHeader'
import { useSubmitStorageRequest } from '@/hooks/useFarmerQueries'

const storageRequestSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  quantityKg: z
    .string()
    .min(1, 'Quantity is required')
    .refine((v) => Number(v) > 0, 'Enter a quantity greater than 0'),
  harvestDate: z.string().min(1, 'Harvest date is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  preferredPickupDate: z.string().min(1, 'Preferred pickup date is required'),
  notes: z.string().optional(),
})

type StorageRequestValues = z.infer<typeof storageRequestSchema>

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
const labelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'

export default function StorageRequestsPage() {
  const seo = buildSeo({ title: 'Storage Request', description: 'Request cold storage for your next harvest.' })
  const { mutate, isPending, isSuccess, reset } = useSubmitStorageRequest()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<StorageRequestValues>({ resolver: zodResolver(storageRequestSchema) })

  function onSubmit(values: StorageRequestValues) {
    mutate(
      { ...values, quantityKg: Number(values.quantityKg) },
      { onSuccess: () => resetForm() },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <PageHeader title="Storage Request" description="Tell us what's coming in and we'll arrange pickup and storage." />

      {isSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <CheckCircle2 className="size-5 shrink-0" />
          <div className="flex-1">
            Your storage request has been submitted. Track it under Pickup Requests.
          </div>
          <button type="button" onClick={() => reset()} className="text-xs font-medium underline">
            Dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 gap-5 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-soft sm:grid-cols-2"
      >
        <div>
          <label htmlFor="crop" className={labelClass}>Crop</label>
          <input id="crop" className={inputClass} placeholder="e.g. Tomatoes" {...register('crop')} />
          {errors.crop && <p className="mt-1.5 text-xs text-red-500">{errors.crop.message}</p>}
        </div>

        <div>
          <label htmlFor="quantityKg" className={labelClass}>Quantity (kg)</label>
          <input id="quantityKg" type="number" className={inputClass} placeholder="e.g. 500" {...register('quantityKg')} />
          {errors.quantityKg && <p className="mt-1.5 text-xs text-red-500">{errors.quantityKg.message}</p>}
        </div>

        <div>
          <label htmlFor="harvestDate" className={labelClass}>Harvest Date</label>
          <input id="harvestDate" type="date" className={inputClass} {...register('harvestDate')} />
          {errors.harvestDate && <p className="mt-1.5 text-xs text-red-500">{errors.harvestDate.message}</p>}
        </div>

        <div>
          <label htmlFor="preferredPickupDate" className={labelClass}>Preferred Pickup Date</label>
          <input id="preferredPickupDate" type="date" className={inputClass} {...register('preferredPickupDate')} />
          {errors.preferredPickupDate && <p className="mt-1.5 text-xs text-red-500">{errors.preferredPickupDate.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pickupLocation" className={labelClass}>Pickup Location</label>
          <input id="pickupLocation" className={inputClass} placeholder="e.g. Nsawam Farm Gate" {...register('pickupLocation')} />
          {errors.pickupLocation && <p className="mt-1.5 text-xs text-red-500">{errors.pickupLocation.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClass}>Special Notes</label>
          <textarea id="notes" rows={4} className={inputClass} placeholder="Anything we should know?" {...register('notes')} />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-primary-500 px-6 py-3 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
