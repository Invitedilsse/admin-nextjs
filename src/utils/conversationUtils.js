import { format, isValid } from 'date-fns'

/**
 * Shared helpers for the Function Conversations views.
 *
 * Kept in their own module so the panel and the drawer do not import each
 * other — a circular import can leave one side holding `undefined` at init.
 */

const toDate = value => {
  if (!value) return null
  const date = new Date(value)

  return isValid(date) ? date : null
}

export const formatDateTime = value => {
  const date = toDate(value)

  return date ? format(date, 'dd MMM yyyy, hh:mm a') : '-'
}

export const formatTime = value => {
  const date = toDate(value)

  return date ? format(date, 'hh:mm a') : ''
}

export const formatDay = value => {
  const date = toDate(value)

  return date ? format(date, 'EEEE, dd MMM yyyy') : ''
}

/** Stable key for grouping a transcript into date separators. */
export const dayKey = value => {
  const date = toDate(value)

  return date ? format(date, 'yyyy-MM-dd') : ''
}

export const initials = name => {
  const clean = String(name || '').trim()
  if (!clean) return '?'

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Deterministic avatar colour per person, so the same member keeps the same
 * colour everywhere in the section without storing anything.
 */
const AVATAR_COLORS = [
  '#f2a429',
  '#2196f3',
  '#4caf50',
  '#d64550',
  '#9c27b0',
  '#00897b',
  '#5c6bc0',
  '#ff7043'
]

export const avatarColor = seed => {
  const key = String(seed || '')
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 997

  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export const MESSAGE_TYPE_ICON = {
  text: 'mdi:message-text-outline',
  image: 'mdi:image-outline',
  video: 'mdi:video-outline',
  audio: 'mdi:microphone-outline',
  file: 'mdi:paperclip',
  system: 'mdi:information-outline'
}

export const MESSAGE_TYPE_LABEL = {
  text: 'Text',
  image: 'Photo',
  video: 'Video',
  audio: 'Voice',
  file: 'File',
  system: 'System'
}

/** One-line description of a message, for list rows and search matching. */
export const describeMessage = message => {
  if (!message) return ''
  if (message.message && message.message.trim()) return message.message.trim()
  switch (message.message_type) {
    case 'image':
      return 'Photo'
    case 'video':
      return 'Video'
    case 'audio':
      return 'Voice message'
    case 'file':
      return message.media?.name || 'Document'
    default:
      return ''
  }
}

/** "2:31" from a duration in milliseconds; empty when there isn't one. */
export const formatDuration = ms => {
  const value = Number(ms)
  if (!Number.isFinite(value) || value <= 0) return ''
  const total = Math.round(value / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const formatFileSize = size => {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const SCOPE_LABEL = {
  online: 'Online invite',
  offline: 'Offline invite'
}
