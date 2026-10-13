/**
 * Reading a WhatsApp campaign's delivery counts.
 *
 * Pure arithmetic and naming, no React — the part worth testing, kept away from
 * the part that just draws boxes.
 *
 * ── The nine statuses, and what they actually mean ────────────────────────
 *
 * They are not a simple funnel and pretending otherwise misleads the person
 * reading the screen. `queued` and `processing` are still moving. `sent`,
 * `delivered` and `read` are three points on one journey — a message that has
 * been read was also delivered, but the panel counts it in ONE bucket, the
 * furthest it reached. So "delivered" on this screen means "delivered and not
 * yet read", and the honest headline number is delivered + read together.
 */

export const STATUS_META = {
  read:       { label: 'Read',       colour: 'success.main', tone: 'good',  note: 'opened by the guest' },
  delivered:  { label: 'Delivered',  colour: 'success.main', tone: 'good',  note: 'on their phone, not opened yet' },
  sent:       { label: 'Sent',       colour: 'info.main',    tone: 'good',  note: 'left WhatsApp, not confirmed delivered' },
  accepted:   { label: 'Accepted',   colour: 'info.main',    tone: 'moving', note: 'WhatsApp took it' },
  processing: { label: 'Processing', colour: 'warning.main', tone: 'moving', note: 'still being worked through' },
  queued:     { label: 'Queued',     colour: 'warning.main', tone: 'moving', note: 'waiting its turn' },
  failed:     { label: 'Failed',     colour: 'error.main',   tone: 'bad',   note: 'not delivered' },
  expired:    { label: 'Expired',    colour: 'error.main',   tone: 'bad',   note: 'ran out of time before sending' },
  aborted:    { label: 'Aborted',    colour: 'error.main',   tone: 'bad',   note: 'stopped before sending' },
}

/** Display order: where a message ended up, best outcome first. */
export const STATUS_ORDER = [
  'read', 'delivered', 'sent', 'accepted', 'processing', 'queued', 'failed', 'expired', 'aborted',
]

const n = (value) => {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0
}

/**
 * @param {object} counts  the panel's own counts object
 * @returns a summary the screen can print without doing sums of its own
 */
export const summarise = (counts = {}) => {
  const by = {}
  for (const key of STATUS_ORDER) by[key] = n(counts[key])

  // The panel sends `total`; it is trusted when present because it counts rows
  // this screen may not have a bucket for, and a percentage against a total
  // that is too small is a percentage over 100.
  const summed = STATUS_ORDER.reduce((acc, key) => acc + by[key], 0)
  const total = Math.max(n(counts.total), summed)

  // Reached the guest's phone at all. read is the furthest point, delivered the
  // one before it — added together because a read message was also delivered
  // and counting only `delivered` would make a well-read campaign look poor.
  const reached = by.read + by.delivered
  const inFlight = by.queued + by.processing + by.accepted
  const bad = by.failed + by.expired + by.aborted

  const pct = (value) => (total > 0 ? (value / total) * 100 : 0)

  return {
    by,
    total,
    reached,
    inFlight,
    bad,
    sent: by.sent,
    reachedPct: pct(reached),
    readPct: pct(by.read),
    failedPct: pct(bad),
    inFlightPct: pct(inFlight),
    // Nothing left moving: every message has arrived somewhere final.
    settled: total > 0 && inFlight === 0,
  }
}

/**
 * Should this campaign still be polled?
 *
 * Only while something can still change. A settled campaign polled every thirty
 * seconds for an afternoon is a lot of calls for an answer that will not move,
 * and the panel is shared with everything else this account sends.
 */
export const isStillMoving = (counts = {}) => {
  const { total, inFlight } = summarise(counts)

  return total === 0 || inFlight > 0
}

/** The proportional bar under the tiles, as widths that always add to 100. */
export const deliveryBar = (counts = {}) => {
  const s = summarise(counts)
  if (!s.total) return []

  return [
    { key: 'read', value: s.by.read, colour: '#2E7D32' },
    { key: 'delivered', value: s.by.delivered, colour: '#66BB6A' },
    { key: 'sent', value: s.by.sent, colour: '#42A5F5' },
    { key: 'moving', value: s.inFlight, colour: '#FFB74D' },
    { key: 'failed', value: s.bad, colour: '#E53935' },
  ]
    .filter((part) => part.value > 0)
    .map((part) => ({ ...part, pct: (part.value / s.total) * 100 }))
}

/** What a CSV of failures is called, so the name says which campaign it is. */
export const failureFileName = (campaign) => {
  const base = String(campaign?.title || campaign?.template_name || 'campaign')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'campaign'

  return `${base}-failed.csv`
}

/** One CSV row per failure, quoted so a comma in an error message is safe. */
export const toCsv = (rows) => {
  const headers = ['phone_number', 'full_name', 'status', 'error_message', 'messaged_at']
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => cell(r[h])).join(',')),
  ].join('\n')
}
