export function formatCurrency(amount: number, currency = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-GH').format(value)
}

export function formatKg(value: number) {
  return `${formatNumber(value)} kg`
}

export function formatDate(value: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-GH', opts)
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
