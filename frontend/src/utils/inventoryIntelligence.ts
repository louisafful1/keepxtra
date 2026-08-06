export interface IntelligenceFlag {
  label: string
  tone: 'red' | 'amber' | 'blue' | 'green'
}

const LOW_STOCK_KG = 300
const OVERSTOCK_KG = 2500
const NEARING_EXPIRY_DAYS = 7
const RECENT_DAYS = 5

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export function shelfLifeRemaining(expiryDate: string, now = new Date()) {
  return daysBetween(new Date(expiryDate), now)
}

export function getIntelligenceFlags(
  item: { quantityKg: number; expiryDate: string; storageDate: string; status: string },
  now = new Date(),
): IntelligenceFlag[] {
  const flags: IntelligenceFlag[] = []
  const daysToExpiry = shelfLifeRemaining(item.expiryDate, now)
  const daysSinceStored = daysBetween(now, new Date(item.storageDate))

  if (item.status !== 'Sold' && item.status !== 'Disposed') {
    if (daysToExpiry < 0) flags.push({ label: 'Expired', tone: 'red' })
    else if (daysToExpiry <= NEARING_EXPIRY_DAYS) flags.push({ label: 'Nearing Expiry', tone: 'amber' })

    if (item.quantityKg <= LOW_STOCK_KG) flags.push({ label: 'Low Stock', tone: 'amber' })
    else if (item.quantityKg >= OVERSTOCK_KG) flags.push({ label: 'Overstock', tone: 'blue' })
  }

  if (daysSinceStored >= 0 && daysSinceStored <= RECENT_DAYS) flags.push({ label: 'Recently Received', tone: 'green' })

  return flags
}

const flagToneClasses: Record<IntelligenceFlag['tone'], string> = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-primary-50 text-primary-700',
}

export function intelligenceFlagClass(tone: IntelligenceFlag['tone']) {
  return flagToneClasses[tone]
}
