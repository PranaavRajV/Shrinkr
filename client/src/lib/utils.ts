export function cn(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(' ')
}

export function formatDateTime(input: string | Date | null | undefined) {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d)
}

