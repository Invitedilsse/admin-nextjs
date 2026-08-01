import { format } from 'date-fns'

/**
 * Shared formatting helpers for the Reminder section.
 *
 * Kept in their own module so the page and its drawers do not import each other
 * — a circular import can leave one side holding `undefined` at init time.
 */

/** Turns a "minutes before" offset into a compact label, e.g. "1w before". */
export const describeOffset = minutes => {
  const value = Number(minutes) || 0
  if (value <= 0) return 'At time'
  if (value % 10080 === 0) return `${value / 10080}w before`
  if (value % 1440 === 0) return `${value / 1440}d before`
  if (value % 60 === 0) return `${value / 60}h before`

  return `${value}m before`
}

export const formatDateTime = value => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return format(date, 'dd MMM yyyy, hh:mm a')
}

export const PRIORITY_COLOR = {
  high: 'error',
  medium: 'warning',
  low: 'success'
}
