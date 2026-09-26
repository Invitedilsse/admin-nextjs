/**
 * Formatters and labels shared by the WhatsApp Bot Management page, its tabs
 * and its drawer.
 *
 * Kept in their own module so the page and its components do not import each
 * other — a circular import can leave one side holding `undefined` at init
 * time. Same reason reminderUtils.js exists.
 */

import { format } from 'date-fns'

const parse = value => {
  if (!value) return null
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

/** "23 Sep 2026, 05:25 pm" */
export const formatDateTime = value => {
  const date = parse(value)

  return date ? format(date, 'dd MMM yyyy, hh:mm a') : '-'
}

/** "23 Sep 2026" */
export const formatDate = value => {
  const date = parse(value)

  return date ? format(date, 'dd MMM yyyy') : '-'
}

/** Day heading inside the transcript. */
export const formatDayHeading = value => {
  const date = parse(value)

  return date ? format(date, 'EEE, dd MMM yyyy') : ''
}

/** "05:25 pm" — the timestamp under a chat bubble. */
export const formatClock = value => {
  const date = parse(value)

  return date ? format(date, 'hh:mm a') : ''
}

export const fullName = row => [row?.name, row?.last_name].filter(Boolean).join(' ')

export const fmtNumber = n => (n == null ? '-' : Number(n).toLocaleString('en-IN'))

/** What wa_bot_actions.action means in the UI. */
export const ACTION_LABEL = {
  'offline-function': 'Offline function',
  reminder: 'Reminder',
  'family-member': 'Family member',
  'family-invite': 'Add-back invite'
}

export const ACTION_COLOR = {
  'offline-function': 'primary',
  reminder: 'success',
  'family-member': 'info',
  'family-invite': 'warning'
}

/**
 * The one-line description under an event's title.
 *
 * Built from wa_bot_actions.detail, which the bot wrote at save time, so it
 * reads correctly even for a row whose underlying record has since been
 * deleted.
 */
export const describeAction = row => {
  const parts = []
  const detail = row?.detail || {}

  if (detail.occasion) parts.push(detail.occasion)
  if (detail.event_count) parts.push(`${detail.event_count} events`)
  if (detail.date_range) parts.push(detail.date_range)
  if (row?.remind_at) parts.push(`due ${formatDateTime(row.remind_at)}`)

  if (row?.action === 'family-invite') {
    // Sent to the NEW member, asking whether they want to add the inviter
    // back. status is written by the bot when they answer.
    if (detail.inviter_name) parts.push(`invited by ${detail.inviter_name}`)
    if (detail.channel) parts.push(detail.channel === 'template' ? 'template' : 'in-chat buttons')
    parts.push(
      { accepted: 'added back', ignored: 'declined' }[detail.status] || 'awaiting a reply'
    )
  }

  if (row?.action === 'family-member') {
    // relation comes from the ledger so it survives the member being removed;
    // family_verified is joined live, because verification happens later.
    if (detail.relation) parts.push(detail.relation)
    if (detail.country_code && detail.mobile) parts.push(`${detail.country_code} ${detail.mobile}`)

    const shares = [detail.share_invite && 'online', detail.share_offinvite && 'offline'].filter(Boolean)

    parts.push(shares.length ? `sharing ${shares.join(' + ')}` : 'no sharing')
    parts.push(row.family_verified ? 'verified' : 'awaiting verification')
  }

  return parts.join(' · ')
}

/** A media message has no text of its own; name the attachment instead. */
export const describeMedia = media =>
  media?.file_name || media?.mime_type || media?.type || 'attachment'
