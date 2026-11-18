import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'

import { apiGet, apiPost } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

// ** Iconify, not @mui/material's Icon — only this one understands `icon='tabler:gift'`.
import Icon from 'src/@core/components/icon'

import { PageToolbar, EmptyState, TableSkeleton } from 'src/@core/components/list-page'

// ! THE INVITE CAMPAIGN'S DASHBOARD, NOT A GIFT COPY OF IT.
//   A gift dispatch and an invite send are the same thing to ChatWise - a
//   campaign with a uid - so the delivery picture is the same screen. Two
//   copies would drift, and the half that drifted would be the one telling
//   somebody their guest got a message.
import CampaignDelivery from 'src/pages/campaign/components/CampaignDelivery'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * One gift event: its template, everybody on its list, and what was sent.
 *
 * The first two tabs mirror the user portal's screen exactly — Gift Details is
 * the template that gets sent, Generate Qr is the people it gets sent to — so
 * an operator moving across does not have to relearn anything. Reports is new.
 *
 * ! THIS EVENT IS NOT A MOBILE-APP FUNCTION OR EVENT.
 *   It is a `whatsappgift_parent` row. Its receivers table calls the parent id
 *   `function_id`, which is a legacy misnomer with nothing behind it — read
 *   the header of admin-nodejs/src/gift-campaign/service.js before writing any
 *   query against these tables.
 *
 * ! TWO BUTTONS HERE DO REAL WORK AND ONE OF THEM SPENDS MONEY.
 *   Generate QR draws an image per guest and uploads it; on a large event that
 *   is minutes. Dispatch hands the list to ChatWise, which charges the wallet
 *   for the whole batch up front and is not reversible. Dispatch therefore
 *   always goes through a preview that costs nothing, and the operator
 *   confirms against real numbers rather than a promise.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "2026-10-16 06:54:32" → "16 Oct 2026, 6:54 AM".
 *
 * ! BY ITS OWN DIGITS, NEVER THROUGH `new Date()`.
 *   The server has already converted these to IST wall-clock and sends them as
 *   text precisely so nothing rebuilds a Date from them. `new Date('2026-10-16
 *   06:54:32')` is read in the BROWSER's zone, and a row stamped at 00:30
 *   would then render as the previous day for anybody west of India. That bug
 *   has shipped in this product twice.
 */
const showStamp = value => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!m) return '—'

  const [, year, month, day, hh, mm] = m
  const hour24 = Number(hh)
  const suffix = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${hour12}:${mm} ${suffix}`
}

/** The template's own variables, labelled as the user portal labels them. */
const fieldLines = fields => {
  if (!fields || typeof fields !== 'object') return []

  return Object.keys(fields)
    .filter(k => /^field_\d+$/.test(k))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
    .map(k => ({ label: k.replace('field_', 'Field '), value: String(fields[k] ?? '') }))
}

/** The server's own message, which names the field or the row that failed. */
const errorText = (e, fallback) => e?.response?.data?.message || e?.message || fallback

/**
 * What one receiver's row is actually waiting on.
 *
 * ! DELIVERED AND REDEEMED ARE DIFFERENT QUESTIONS.
 *   Delivered is about the WhatsApp message reaching the phone. Redeemed is
 *   about the gift being handed over at the desk. A row can be redeemed with
 *   the message never delivered (walk-in, scanned from a printed code) and
 *   delivered without ever being redeemed. They are shown as separate things
 *   because operators conflate them constantly.
 */
/** What the panel calls each state, in the words the delivery screen uses. */
const WA_STATE = {
  read: { label: 'Read', color: 'success' },
  delivered: { label: 'Delivered', color: 'primary' },
  sent: { label: 'Sent', color: 'info' },
  accepted: { label: 'Sent', color: 'info' },
  processing: { label: 'Sending', color: 'info' },
  queued: { label: 'Queued', color: 'info' },
  failed: { label: 'Failed', color: 'error' },
  expired: { label: 'Expired', color: 'error' },
  aborted: { label: 'Aborted', color: 'error' }
}

const giftState = row => {
  if (row?.is_redeemed) return { label: 'Redeemed', color: 'success' }
  if (row?.is_scaned) return { label: 'Scanned', color: 'info' }

  /* ! THE PANEL'S OWN WORD WINS OVER OUR BOOLEAN.
       `is_deliverd_wa` is a yes/no, and it counts sent and accepted as
       delivered - so a message the guest has actually OPENED showed here as
       "Delivered" while the delivery dashboard said "Read", and one message
       read as two different things on two screens. `wa_status` holds what
       ChatWise said; when it is a word we recognise, that is the answer. */
  const known = WA_STATE[String(row?.wa_status || '').toLowerCase()]

  if (known) return known

  if (row?.is_deliverd_wa) return { label: 'Delivered', color: 'primary' }
  if (row?.sl_code) return { label: 'Not sent', color: 'warning' }

  return { label: 'No code', color: 'default' }
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'pending', label: 'Not delivered' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'not-redeemed', label: 'Not redeemed' },
  { value: 'scanned', label: 'Scanned' }
]

/** A labelled read-only value, drawn like the user portal's outlined inputs. */
const Detail = ({ label, value, mono }) => (
  <TextField
    label={label}
    value={value || ''}
    fullWidth
    size='small'
    InputProps={{ readOnly: true, sx: mono ? { fontFamily: 'monospace' } : undefined }}
    InputLabelProps={{ shrink: true }}
  />
)

/* ==========================================================================
 * Tab 1 — Gift Details
 * ======================================================================= */

const GiftDetailsTab = ({ event }) => {
  const template = fieldLines(event?.fields)
  const thanks = fieldLines(event?.thankyou_fields)

  return (
    <Box sx={{ p: 6 }}>
      <Typography variant='h6' sx={{ color: 'primary.main', mb: 1 }}>
        Template
      </Typography>
      <Divider sx={{ mb: 5 }} />

      <Typography variant='body2' sx={{ color: 'text.secondary', mb: 3 }}>
        Basic Details
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Detail label='Template Name' value={event?.tempalte_name} />
        </Grid>
        <Grid item xs={12}>
          <Detail label='Event Name' value={event?.eventname} />
        </Grid>
        <Grid item xs={12}>
          <Detail label='Name' value={event?.name} />
        </Grid>
        <Grid item xs={12} sm={8}>
          <Detail label='Mobile' value={event?.mobile} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Detail label='Country Code' value={event?.country_code} />
        </Grid>
        <Grid item xs={12}>
          {/* The WhatsApp business number this event sends from. Its own column
              on the row (`host_bwnum_code`) and not derivable from anything
              else here, which is why it is shown rather than inferred. */}
          <Detail label='Host Number Code' value={event?.host_bwnum_code} mono />
        </Grid>
      </Grid>

      <Typography variant='body2' sx={{ color: 'text.secondary', mt: 6, mb: 2 }}>
        Template Image
      </Typography>
      {event?.tempalte_image_url ? (
        <Box
          component='img'
          src={event.tempalte_image_url}
          alt='Template'
          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
        />
      ) : (
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          none uploaded
        </Typography>
      )}

      <Typography variant='body2' sx={{ color: 'text.secondary', mt: 6, mb: 2 }}>
        Template Fields
      </Typography>
      {template.length ? (
        <Stack spacing={3}>
          {template.map(l => (
            <Detail key={l.label} label={l.label.toUpperCase()} value={l.value} />
          ))}
        </Stack>
      ) : (
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          none set
        </Typography>
      )}

      <Typography variant='body2' sx={{ color: 'text.secondary', mt: 6, mb: 2 }}>
        Thank You Template Image
      </Typography>
      {event?.thankyou_image_url ? (
        <Box
          component='img'
          src={event.thankyou_image_url}
          alt='Thank you template'
          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider' }}
        />
      ) : (
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          none uploaded
        </Typography>
      )}

      <Typography variant='body2' sx={{ color: 'text.secondary', mt: 6, mb: 2 }}>
        Template Thank You Fields
      </Typography>
      {thanks.length ? (
        <Stack spacing={3}>
          {thanks.map(l => (
            <Detail key={l.label} label={l.label.toUpperCase()} value={l.value} />
          ))}
        </Stack>
      ) : (
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          none set
        </Typography>
      )}
    </Box>
  )
}

/* ==========================================================================
 * The dispatch confirmation
 * ======================================================================= */

/**
 * What is about to be sent, and to whom.
 *
 * ! THE NUMBERS COME FROM THE SERVER'S OWN PLANNER, not from the table on
 *   screen. The send runs that same planner, so what is agreed to here is what
 *   goes out. A count worked out in the browser could disagree with the one the
 *   server acts on, and the operator would have authorised something else.
 */
const DispatchDialog = ({ open, eventId, onClose, onSent }) => {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  /**
   * Ask ChatWise what happened, then work the plan out again.
   *
   * ! THE ORDER MATTERS AND IT IS THE WHOLE POINT.
   *   The refresh writes `is_deliverd_wa`, and the planner reads it to decide
   *   who is held back as "already delivered". Not refreshing at all produces
   *   a plan that offers to send again to people who already have the
   *   message - which is money, and which is exactly what the operator opened
   *   this dialog to avoid.
   */
  const refreshStatuses = async () => {
    setRefreshing(true)
    setError('')
    try {
      await apiPost(`${baseURL}gift-campaign/${eventId}/refresh-wa-status`, {})
      setReloadKey(k => k + 1)
    } catch (e) {
      setError(errorText(e, 'Could not read the delivery status.'))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!open || !eventId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      setPreview(null)
      try {
        const res = await apiPost(`${baseURL}gift-campaign/${eventId}/dispatch/preview`, {})
        if (cancelled) return
        setPreview(res?.data?.data || res?.data || null)
      } catch (e) {
        if (cancelled) return
        setError(errorText(e, 'Could not work out what would be sent.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, eventId, reloadKey])

  const send = async () => {
    setSending(true)
    setError('')
    try {
      const res = await apiPost(`${baseURL}gift-campaign/${eventId}/dispatch`, {})
      onSent(res?.data?.data || res?.data || null, res?.data?.message || 'Dispatched.')
    } catch (e) {
      setError(errorText(e, 'The dispatch failed.'))
    } finally {
      setSending(false)
    }
  }

  const sendable = Number(preview?.sendable || 0)
  const reasons = Object.entries(preview?.held_back_reasons || {})

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Dispatch WhatsApp messages</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Stack alignItems='center' sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        {error ? (
          <Alert severity='error' sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : null}

        {preview?.blocked ? (
          <Alert severity='warning' sx={{ mb: 4 }}>
            {preview.blocked}
          </Alert>
        ) : null}

        {preview && !loading ? (
          <Stack spacing={4}>
            <Alert severity={sendable ? 'info' : 'warning'} icon={<Icon icon='tabler:send' />}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {sendable
                  ? `${sendable} message(s) will be sent, in ${preview.calls} campaign call(s).`
                  : 'Nothing would be sent.'}
              </Typography>
              {/* Said plainly, because it is not reversible and it is not free. */}
              {sendable ? (
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  ChatWise charges the wallet for the whole batch up front. This cannot be undone or recalled.
                </Typography>
              ) : null}
            </Alert>

            {/* ! ONLY ON AN EVENT THAT HAS BEEN DISPATCHED BEFORE.
                  On a first send there is nothing to have checked, and an
                  amber strip saying so would be noise on every new event. */}
            {preview.statuses_never_checked > 0 || preview.statuses_checked_at ? (
              <Alert
                severity={preview.statuses_never_checked > 0 ? 'warning' : 'info'}
                action={
                  <Button size='small' onClick={refreshStatuses} disabled={refreshing || sending}>
                    {refreshing ? 'Checking…' : 'Refresh'}
                  </Button>
                }
              >
                <Typography variant='body2'>
                  {preview.statuses_checked_at
                    ? `Delivery statuses last read from ChatWise at ${preview.statuses_checked_at}.`
                    : 'Delivery statuses have never been read from ChatWise for this event.'}
                </Typography>
                {preview.statuses_never_checked > 0 ? (
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    {preview.statuses_never_checked} message(s) from earlier dispatches have not been
                    checked at all, so anyone who has since received theirs is not being held back
                    yet. Refresh before sending.
                  </Typography>
                ) : null}
              </Alert>
            ) : null}

            <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
              <Chip size='small' variant='outlined' label={`Template: ${preview.template_name || 'not set'}`} />
              <Chip size='small' variant='outlined' label={`Language: ${preview.template_language}`} />
              <Chip
                size='small'
                variant='outlined'
                label={`From: ${preview.from_phone_number_id || 'not set'}`}
                color={preview.from_phone_number_id ? 'default' : 'error'}
              />
              <Chip size='small' variant='outlined' label={`${preview.field_count} variable(s)`} />
            </Stack>

            {preview.sample?.length ? (
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  First few recipients
                </Typography>
                {preview.sample.map(s => (
                  <Typography key={s.sl_code || s.mobile} variant='body2'>
                    {s.sl_code ? `${s.sl_code} · ` : ''}
                    {s.name} · {s.mobile}
                  </Typography>
                ))}
              </Box>
            ) : null}

            {reasons.length ? (
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  {preview.held_back} held back
                </Typography>
                {reasons.map(([reason, count]) => (
                  <Typography key={reason} variant='body2' sx={{ color: 'text.secondary' }}>
                    {count} — {reason}
                  </Typography>
                ))}
              </Box>
            ) : null}
          </Stack>
        ) : null}

        {sending ? <LinearProgress sx={{ mt: 4 }} /> : null}
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={send}
          // Disabled unless the server said there is something to send. The
          // confirm button is the last thing between an operator and the
          // wallet, so it is not enabled on hope.
          disabled={sending || loading || !sendable || Boolean(preview?.blocked)}
          startIcon={sending ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:send' />}
        >
          {sending ? 'Sending…' : `Send ${sendable || ''}`.trim()}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ==========================================================================
 * Tab 2 — Generate Qr
 * ======================================================================= */

/**
 * A workbook that arrived as base64 in a JSON body, saved to disk.
 *
 * ! THE EXPORTS ANSWER JSON, NOT A FILE STREAM.
 *   Both the portal's exports and the host portal's own answer
 *   `{ fileName, data }` with the workbook base64-encoded, because the shared
 *   axios wrapper sets no responseType - a streamed body would arrive as a
 *   mangled string and the saved file would not open.
 */
const saveWorkbook = (fileName, base64) => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)

  const url = window.URL.createObjectURL(
    new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  )

  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'export.xlsx'
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Not revoked on the next line: Safari has not finished reading the blob
  // when click() returns, and the download arrives empty.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 10000)
}

const GenerateQrTab = ({ eventId, onDispatched, notify }) => {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [typed, setTyped] = useState('')
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState('all')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  const [generating, setGenerating] = useState(false)
  const [dispatchOpen, setDispatchOpen] = useState(false)

  // Which toolbar action is running, by name. One at a time: these write to
  // the same list, and two at once is how an operator gets a result that
  // describes neither.
  const [busy, setBusy] = useState('')

  // The receiver-list upload, and the report upload. Each holds the chosen
  // File so the confirmed call sends the very bytes that were previewed.
  const [importFile, setImportFile] = useState(null)
  const [importPlan, setImportPlan] = useState(null)
  const [redeemFile, setRedeemFile] = useState(null)
  const [redeemPlan, setRedeemPlan] = useState(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', country_code: '+91', mobile: '' })
  const [addError, setAddError] = useState('')

  // The two that spend the wallet, and the one that does not but still takes
  // minutes. Null when nothing is being confirmed.
  const [confirm, setConfirm] = useState(null)

  /**
   * The sample receiver sheet.
   *
   * ! THE IMPORTER READS BY POSITION, NOT BY HEADER.
   *   readExcelContacts takes row[1] as the name, row[2] as the country
   *   code and row[3] as the mobile, and skips row 1 whatever it says. So
   *   the ORDER of these four columns is the contract - renaming a header
   *   changes nothing, moving one silently loads mobiles into the name
   *   column. A row with fewer than four cells is skipped without comment.
   *
   * ! THE SAME FOUR COLUMNS THE EXPORT WRITES.
   *   Export list produces Code / Name / Country Code / Mobile, and these
   *   two rows are the very ones the backend writes when an event has
   *   nobody on it yet. An exported sheet can therefore be edited and
   *   uploaded straight back.
   *
   * Built in the browser: there is no endpoint for it, and a static file
   * in /public would drift from the importer the first time it changed.
   */
  const downloadSample = async () => {
    const mod = await import('xlsx')
    const XLSX = mod?.default || mod

    const sheet = XLSX.utils.aoa_to_sheet([
      ['Code', 'Name', 'Country Code', 'Mobile'],
      ['-', 'John', '+91', '9123456780'],
      ['-', 'Jane', '+91', '9876543210']
    ])

    sheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }]

    // ! MOBILE STAYS TEXT.
    //   A 10-digit number left as a number loses a leading zero and is
    //   re-saved in scientific notation by some versions of Excel, and the
    //   importer takes whatever the cell says. The backend's own export
    //   forces this same format on that column.
    ;['D2', 'D3'].forEach(ref => {
      if (sheet[ref]) sheet[ref].z = '@'
    })

    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Receivers')
    XLSX.writeFile(book, 'gift-receivers-sample.xlsx')
  }

  /**
   * A chosen file, previewed.
   *
   * ! THE INPUT IS CLEARED FIRST, ALWAYS.
   *   The same input is used again, and a browser fires no change event when
   *   the SAME file is picked twice unless the value is reset - so after a
   *   failed preview the operator could not retry with that file.
   */
  const pickFile = async (e, { kind }) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''

    if (!file) return

    const path = kind === 'contacts' ? 'import/preview' : 'redeemed/preview'

    setBusy(kind === 'contacts' ? 'upload' : 'reports')
    try {
      const data = new FormData()
      data.append('file', file)

      const res = await apiPost(
        `${baseURL}gift-campaign/${eventId}/receivers/${path}`,
        data,
        true
      )

      const plan = res?.data?.data || null

      if (kind === 'contacts') {
        setImportFile(file)
        setImportPlan(plan)
      } else {
        setRedeemFile(file)
        setRedeemPlan(plan)
      }
    } catch (e2) {
      notify(errorText(e2, 'That sheet could not be read.'), 'error')
    } finally {
      setBusy('')
    }
  }

  /** The confirmed upload. Sends the same File the preview was built from. */
  const runUpload = async kind => {
    const file = kind === 'contacts' ? importFile : redeemFile
    const path = kind === 'contacts' ? 'import' : 'redeemed'

    if (!file) return

    setBusy(kind === 'contacts' ? 'upload' : 'reports')
    try {
      const data = new FormData()
      data.append('file', file)

      const res = await apiPost(`${baseURL}gift-campaign/${eventId}/receivers/${path}`, data, true)

      notify(res?.data?.message || 'Done.', 'success')

      if (kind === 'contacts') {
        setImportPlan(null)
        setImportFile(null)
      } else {
        setRedeemPlan(null)
        setRedeemFile(null)
      }

      fetchRows()
      onDispatched()
    } catch (e) {
      notify(errorText(e, 'That upload failed.'), 'error')
    } finally {
      setBusy('')
    }
  }

  /** One name onto the list. */
  const addContact = async () => {
    setAddError('')
    setBusy('add')
    try {
      const res = await apiPost(`${baseURL}gift-campaign/${eventId}/receivers`, {
        name: addForm.name.trim(),
        country_code: addForm.country_code.trim(),
        mobile: addForm.mobile.trim()
      })

      notify(res?.data?.message || 'Added.', 'success')
      setAddOpen(false)
      setAddForm({ name: '', country_code: '+91', mobile: '' })
      fetchRows()
      onDispatched()
    } catch (e) {
      setAddError(errorText(e, 'Could not add that receiver.'))
    } finally {
      setBusy('')
    }
  }

  /**
   * An export.
   *
   * ! THE REPORT CARRIES THE FILTER THAT IS ON SCREEN.
   *   An operator who filtered to "not redeemed" and then exported the whole
   *   event would work from the wrong sheet without ever being told. The
   *   contact list does not take the filter, because it is the sheet the
   *   upload reads back - and uploading a filtered list would soft-delete
   *   everybody it left out.
   */
  const runExport = async kind => {
    setBusy(kind)
    try {
      const url =
        kind === 'export'
          ? `${baseURL}gift-campaign/${eventId}/receivers/export`
          : `${baseURL}gift-campaign/${eventId}/receivers/export-report?status=${status}`

      const res = await apiGet(url)
      const file = res?.data?.data

      if (!file?.data) throw new Error('The export came back empty.')

      saveWorkbook(file.fileName, file.data)
    } catch (e) {
      notify(errorText(e, 'That export failed.'), 'error')
    } finally {
      setBusy('')
    }
  }

  /** Retry Failed, Reminder Message and Update WA Status, once confirmed. */
  const runAction = async action => {
    setConfirm(null)
    setBusy(action.key)
    try {
      const res = await apiPost(`${baseURL}gift-campaign/${eventId}/${action.path}`, {})

      notify(res?.data?.message || 'Done.', 'success')
      fetchRows()
      onDispatched()
    } catch (e) {
      notify(errorText(e, `${action.label} failed.`), 'error')
    } finally {
      setBusy('')
    }
  }

  // One automatic status check per event, per visit to this tab.
  const autoChecked = useRef('')

  const fetchRows = useCallback(async () => {
    if (!eventId) return

    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams({
        status,
        search: searchText,
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize)
      })

      const res = await apiGet(`${baseURL}gift-campaign/${eventId}/receivers?${query.toString()}`)
      const data = res?.data?.data || res?.data || {}

      setRows(data.rows || [])
      setTotal(Number(data.total) || 0)
      setSummary(data.summary || null)
    } catch (e) {
      setError(errorText(e, 'Could not load that list.'))
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [eventId, status, searchText, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  /**
   * Bring the list in line with the panel, without being asked.
   *
   * ! BECAUSE "Queued" HERE AND "Read" ON THE DASHBOARD IS ONE MESSAGE.
   *   The gift list shows a stored copy of the delivery state and the
   *   dashboard reads the panel live, so the two drift apart the moment a
   *   receipt arrives. Nobody should have to know that, or know which button
   *   reconciles them - so the list asks for a check when it opens.
   *
   * ! auto=yes, WHICH IS THROTTLED SERVER-SIDE.
   *   Flicking between tabs must not page every campaign of a large event
   *   against a panel that is also sending. A check made inside the last
   *   minute is answered from what is already stored. Pressing the button is
   *   never throttled.
   *
   * ! A FAILURE HERE IS SILENT.
   *   This is a convenience nobody asked for. If ChatWise is unreachable the
   *   list still renders with the last known state, and the button is still
   *   there to say so properly.
   */
  useEffect(() => {
    if (!eventId || autoChecked.current === eventId) return

    autoChecked.current = eventId

    let cancelled = false

    const check = async () => {
      try {
        const res = await apiPost(
          `${baseURL}gift-campaign/${eventId}/refresh-wa-status?auto=yes`,
          {}
        )

        if (cancelled) return

        // Only when something actually moved: a reload that changes nothing
        // is a flicker in the table for no reason.
        if (Number(res?.data?.data?.updated || 0) > 0) {
          fetchRows()
          onDispatched()
        }
      } catch {
        // Deliberately silent - see above.
      }
    }

    check()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Debounced: an operator searching a mobile number types ten characters, and
  // ten round trips to find one row is how a list feels broken.
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination(p => ({ ...p, pageIndex: 0 }))
      setSearchText(typed.trim())
    }, 300)

    return () => clearTimeout(t)
  }, [typed])

  /**
   * Make the QR codes and the images.
   *
   * No confirmation: it sends nothing, spends nothing, and skips anybody who
   * already has a code. The only cost is time, which the button shows.
   */
  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await apiPost(`${baseURL}gift-campaign/${eventId}/generate-qr`, {})
      const data = res?.data?.data || {}
      notify(
        res?.data?.message ||
          `${data.generated || 0} of ${data.total || 0} generated` + (data.failed ? `, ${data.failed} failed` : ''),
        data.failed ? 'warning' : 'success'
      )
      await fetchRows()
    } catch (e) {
      const message = errorText(e, 'QR generation failed.')
      setError(message)
      notify(message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'serial',
        header: 'S.NO',
        size: 70,
        enableSorting: false,
        // Counted from the page offset, so row 26 on page two reads 26 and not
        // 1. The list is ordered by created_at, which is the order the Excel
        // was uploaded in, so the number means something.
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </Typography>
        )
      },
      {
        accessorKey: 'sl_code',
        header: 'GIFT CODE',
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {row.original.sl_code || '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'name',
        header: 'NAME',
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ color: 'text.primary' }} noWrap title={row.original.name || ''}>
            {row.original.name || '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'mobile',
        header: 'MOBILE',
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {[row.original.country_code, row.original.mobile].filter(Boolean).join('-') || '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'code',
        header: 'QR CODE',
        enableSorting: false,
        Cell: ({ row }) => {
          // `code` is the uuid behind the QR; `image_url` is the finished
          // picture that goes out on WhatsApp. A row can have the first
          // without the second if generation stopped halfway, and that is
          // worth being able to see.
          if (!row.original.code) {
            return (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                —
              </Typography>
            )
          }

          return row.original.image_url ? (
            <Button
              size='small'
              variant='text'
              href={row.original.image_url}
              target='_blank'
              rel='noopener noreferrer'
              startIcon={<Icon icon='tabler:qrcode' />}
            >
              View
            </Button>
          ) : (
            <Chip size='small' label='code only' variant='outlined' />
          )
        }
      },
      {
        accessorKey: 'is_redeemed',
        header: 'GIFT STATUS',
        enableSorting: false,
        Cell: ({ row }) => {
          const state = giftState(row.original)

          return (
            <Stack spacing={0.5}>
              <Chip size='small' label={state.label} color={state.color} variant='outlined' />
              {row.original.wa_status ? (
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  WA: {row.original.wa_status}
                </Typography>
              ) : null}
              {row.original.redeemed_at ? (
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  {showStamp(row.original.redeemed_at)}
                </Typography>
              ) : null}
            </Stack>
          )
        }
      },
      {
        id: 'actions',
        header: 'ACTIONS',
        size: 90,
        enableSorting: false,
        Cell: () => (
          <Tooltip title='Editing a receiver is in the next pass'>
            <span>
              <IconButton size='small' disabled>
                <Icon icon='tabler:edit' fontSize='1.1rem' />
              </IconButton>
            </span>
          </Tooltip>
        )
      },
      {
        accessorKey: 'notes',
        header: 'NOTES',
        enableSorting: false,
        Cell: ({ row }) => (
          <Typography
            variant='caption'
            sx={{ color: 'text.secondary', display: 'block', maxWidth: 220 }}
            noWrap
            title={row.original.notes || ''}
          >
            {row.original.notes || '—'}
          </Typography>
        )
      }
    ],
    [pagination.pageIndex, pagination.pageSize]
  )

  const table = useMaterialReactTable({
    ...tableDefaults,
    columns,
    data: rows,
    rowCount: total,
    manualPagination: true,
    onPaginationChange: setPagination,
    state: { pagination, isLoading: loading }
  })

  // Nobody has an image yet, so a dispatch could only be refused. Checked
  // against the event summary rather than the page on screen, which is a
  // filtered view and would disable the button for the wrong reason.
  const nothingCoded = Boolean(summary) && Number(summary.coded) === 0

  return (
    <Box>
      <PageToolbar
        title='Receivers'
        count={total}
        search={
          <Stack direction='row' spacing={2}>
            <TextField
              size='small'
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder='Name, mobile or gift code'
              sx={{ minWidth: 240 }}
            />
            <TextField
              select
              size='small'
              label='Status'
              value={status}
              onChange={e => {
                setPagination(p => ({ ...p, pageIndex: 0 }))
                setStatus(e.target.value)
              }}
              sx={{ minWidth: 170 }}
            >
              {STATUS_FILTERS.map(o => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
        actions={
          <Stack direction='row' spacing={2}>
            <Button
              variant='outlined'
              onClick={generate}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={16} color='inherit' /> : <Icon icon='tabler:qrcode' />}
            >
              {generating ? 'Generating…' : 'Generate QR'}
            </Button>
            <Tooltip title={nothingCoded ? 'Generate the QR codes first' : 'Send the WhatsApp campaign'}>
              <span>
                <Button
                  variant='contained'
                  onClick={() => setDispatchOpen(true)}
                  disabled={generating || nothingCoded}
                  startIcon={<Icon icon='tabler:send' />}
                >
                  Dispatch Message
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      {generating ? <LinearProgress /> : null}

      {summary ? (
        <Stack direction='row' spacing={2} sx={{ px: 6, pb: 4, flexWrap: 'wrap', rowGap: 2 }}>
          <Chip size='small' variant='outlined' label={`${summary.total} on list`} />
          <Chip
            size='small'
            variant='outlined'
            color={summary.coded === summary.total && summary.total ? 'success' : 'warning'}
            label={`${summary.coded} coded`}
          />
          <Chip
            size='small'
            variant='outlined'
            color={summary.delivered === summary.total && summary.total ? 'success' : 'default'}
            label={`${summary.delivered} delivered`}
          />
          <Chip size='small' variant='outlined' label={`${summary.redeemed} redeemed`} />
          <Chip size='small' variant='outlined' label={`${summary.scanned} scanned`} />
        </Stack>
      ) : null}

      <Stack direction='row' spacing={2} sx={{ px: 6, pb: 4, flexWrap: 'wrap', rowGap: 2 }}>
        {/* Enabled, unlike the row that follows it: this one needs no
            endpoint, and somebody about to upload a list needs to know
            what shape it has to be in before they build it. */}
        <Tooltip title='Code, Name, Country Code, Mobile - in that order. The upload reads the columns by position and ignores the header row.'>
          <Button
            size='small'
            variant='outlined'
            startIcon={<Icon icon='tabler:file-spreadsheet' />}
            onClick={downloadSample}
          >
            Sample Excel
          </Button>
        </Tooltip>

        <Tooltip title='The receiver list. Column B the name, C the country code, D the mobile - and it REPLACES the list, so you are shown what would go before anything is written.'>
          <Button
            component='label'
            size='small'
            variant='outlined'
            disabled={Boolean(busy)}
            startIcon={
              busy === 'upload' ? <CircularProgress size={14} /> : <Icon icon='tabler:upload' />
            }
          >
            Upload
            <input
              type='file'
              hidden
              accept='.xlsx,.xls,.csv'
              onChange={e => pickFile(e, { kind: 'contacts' })}
            />
          </Button>
        </Tooltip>

        <Tooltip title='A filled-in report sheet. Only the Redeemed column and its date are applied - nobody is added or removed.'>
          <Button
            component='label'
            size='small'
            variant='outlined'
            disabled={Boolean(busy)}
            startIcon={
              busy === 'reports' ? <CircularProgress size={14} /> : <Icon icon='tabler:file-import' />
            }
          >
            Upload Reports
            <input
              type='file'
              hidden
              accept='.xlsx,.xls,.csv'
              onChange={e => pickFile(e, { kind: 'reports' })}
            />
          </Button>
        </Tooltip>

        <Button
          size='small'
          variant='outlined'
          disabled={Boolean(busy)}
          startIcon={
            busy === 'retry' ? <CircularProgress size={14} /> : <Icon icon='tabler:refresh' />
          }
          onClick={() =>
            setConfirm({
              key: 'retry',
              path: 'retry-failed',
              label: 'Retry Failed',
              title: 'Re-send to everybody not confirmed delivered?',
              spends: true,
              body:
                'This sends the gift message again to every receiver who has a code and a QR image but no delivery confirmation. ' +
                'It goes one message at a time through the app backend, and the wallet is charged for each.'
            })
          }
        >
          Retry Failed
        </Button>

        <Button
          size='small'
          variant='outlined'
          disabled={Boolean(busy)}
          startIcon={<Icon icon='tabler:user-plus' />}
          onClick={() => {
            setAddError('')
            setAddOpen(true)
          }}
        >
          Add Contact
        </Button>

        <Button
          size='small'
          variant='outlined'
          disabled={Boolean(busy)}
          startIcon={
            busy === 'export' ? <CircularProgress size={14} /> : <Icon icon='tabler:table-export' />
          }
          onClick={() => runExport('export')}
        >
          Export list
        </Button>

        <Tooltip title={status === 'all' ? 'Every receiver on this event.' : `Only the receivers the "${status}" filter is showing.`}>
          <Button
            size='small'
            variant='outlined'
            disabled={Boolean(busy)}
            startIcon={
              busy === 'report' ? <CircularProgress size={14} /> : <Icon icon='tabler:report' />
            }
            onClick={() => runExport('report')}
          >
            Export Reports
          </Button>
        </Tooltip>

        <Button
          size='small'
          variant='outlined'
          disabled={Boolean(busy)}
          startIcon={
            busy === 'reminder' ? <CircularProgress size={14} /> : <Icon icon='tabler:bell' />
          }
          onClick={() =>
            setConfirm({
              key: 'reminder',
              path: 'reminder',
              label: 'Reminder Message',
              title: 'Send the reminder to everybody on this list?',
              spends: true,
              once: true,
              body:
                'This sends the follow-up message to every receiver on the event and charges the wallet for each. ' +
                'The app marks the event as reminded and refuses a second attempt, so a run that only half finishes cannot be resumed from here.'
            })
          }
        >
          Reminder Message
        </Button>

        <Button
          size='small'
          variant='outlined'
          disabled={Boolean(busy)}
          startIcon={
            busy === 'status' ? (
              <CircularProgress size={14} />
            ) : (
              <Icon icon='tabler:cloud-download' />
            )
          }
          onClick={() =>
            setConfirm({
              key: 'status',
              path: 'refresh-wa-status',
              label: 'Update WA Status bulk',
              title: 'Ask ChatWise what happened to each message?',
              spends: false,
              body:
                'This reads every campaign this event was dispatched as and stores what the panel says about each guest - read, delivered, sent, failed, expired, and the reason where there is one. ' +
                'It sends nothing and costs nothing, and it can be run as often as you like: delivery and read receipts arrive over minutes and hours, so the answer changes.'
            })
          }
        >
          Update WA Status bulk
        </Button>

        {/* ! THE ONE THAT STAYS OFF, AND NOT BECAUSE IT WAS FORGOTTEN.
              scan-qrcode records WHO scanned the code in `scanned_by`, which
              is an app user id - portal staff are not app users. It is also a
              gift-desk action: somebody holding a phone at the counter, not
              somebody at this table. Wiring it here would file every
              collection against nobody. */}
        <Tooltip title='Scanning happens at the gift desk, in the app - it records which app user handed the gift over, and portal staff are not app users.'>
          <span>
            <Button size='small' variant='outlined' disabled startIcon={<Icon icon='tabler:scan' />}>
              Scan QR
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Divider />

      {error ? (
        <Alert severity='error' sx={{ m: 6 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <TableSkeleton columns={8} />
      ) : rows.length === 0 ? (
        <EmptyState
          title='Nobody on this list yet'
          subtitle='Upload the receiver list to start generating gift codes.'
        />
      ) : (
        <MaterialReactTable table={table} />
      )}

      {/* ── The receiver-list upload ─────────────────────────────────── */}
      <Dialog
        open={Boolean(importPlan)}
        onClose={busy ? undefined : () => setImportPlan(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Upload receiver list</DialogTitle>
        <DialogContent dividers>
          {importPlan ? (
            <Stack spacing={3}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                {importPlan.file_name} — {importPlan.parsed} row(s) read.
              </Typography>

              {importPlan.blocked ? <Alert severity='error'>{importPlan.blocked}</Alert> : null}

              <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                <Chip size='small' color='success' variant='outlined' label={`${importPlan.adding} new`} />
                <Chip size='small' variant='outlined' label={`${importPlan.updating} already on the list`} />
                {importPlan.restoring ? (
                  <Chip size='small' variant='outlined' label={`${importPlan.restoring} restored`} />
                ) : null}
                <Chip
                  size='small'
                  variant='outlined'
                  color={importPlan.removing ? 'warning' : 'default'}
                  label={`${importPlan.removing} removed`}
                />
              </Stack>

              {/* ! THE REMOVALS ARE THE POINT OF THIS DIALOG.
                    An upload REPLACES the list. Everybody on the event who is
                    not in the file is soft-deleted, and the host portal does
                    this silently. */}
              {importPlan.removing ? (
                <Alert severity={importPlan.removing_delivered || importPlan.removing_redeemed ? 'error' : 'warning'}>
                  <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                    {importPlan.removing} receiver(s) on this list are not in the file and will be
                    removed.
                  </Typography>
                  {importPlan.removing_delivered || importPlan.removing_redeemed ? (
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      {importPlan.removing_delivered} of them have already had the message
                      delivered and {importPlan.removing_redeemed} have already redeemed the gift.
                    </Typography>
                  ) : null}
                  {(importPlan.removing_sample || []).length ? (
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      {importPlan.removing_sample
                        .map(r => `${r.sl_code || '—'} ${r.name}`)
                        .join(', ')}
                      {importPlan.removing > importPlan.removing_sample.length ? ', …' : ''}
                    </Typography>
                  ) : null}
                </Alert>
              ) : null}

              {importPlan.duplicate_count ? (
                <Alert severity='error'>
                  <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                    {importPlan.duplicate_count} repeated mobile number(s).
                  </Typography>
                  <Typography variant='caption' sx={{ display: 'block' }}>
                    {(importPlan.duplicates || [])
                      .slice(0, 6)
                      .map(d => `${d.mobile} on rows ${d.first_line} and ${d.line}`)
                      .join('; ')}
                  </Typography>
                </Alert>
              ) : null}

              {importPlan.skipped_count ? (
                <Alert severity='info'>
                  {importPlan.skipped_count} row(s) skipped —{' '}
                  {(importPlan.skipped || [])
                    .slice(0, 5)
                    .map(x => `row ${x.line}: ${x.reason}`)
                    .join('; ')}
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' disabled={Boolean(busy)} onClick={() => setImportPlan(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={importPlan?.removing ? 'warning' : 'primary'}
            disabled={Boolean(busy) || Boolean(importPlan?.blocked)}
            startIcon={busy === 'upload' ? <CircularProgress size={16} color='inherit' /> : null}
            onClick={() => runUpload('contacts')}
          >
            {importPlan?.removing ? `Replace the list (${importPlan.removing} removed)` : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── The report upload ────────────────────────────────────────── */}
      <Dialog
        open={Boolean(redeemPlan)}
        onClose={busy ? undefined : () => setRedeemPlan(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Upload reports</DialogTitle>
        <DialogContent dividers>
          {redeemPlan ? (
            <Stack spacing={3}>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                {redeemPlan.file_name} — {redeemPlan.parsed} row(s) read.
              </Typography>

              {redeemPlan.blocked ? <Alert severity='error'>{redeemPlan.blocked}</Alert> : null}

              <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                <Chip size='small' color='success' variant='outlined' label={`${redeemPlan.marking} marked redeemed`} />
                {redeemPlan.clearing ? (
                  <Chip size='small' color='warning' variant='outlined' label={`${redeemPlan.clearing} un-redeemed`} />
                ) : null}
                <Chip size='small' variant='outlined' label={`${redeemPlan.unchanged} unchanged`} />
              </Stack>

              {redeemPlan.unknown_count ? (
                <Alert severity='warning'>
                  {redeemPlan.unknown_count} number(s) in the sheet are not on this event and will
                  be ignored. Nobody is added by this upload.
                </Alert>
              ) : null}

              {redeemPlan.skipped_count ? (
                <Alert severity='info'>
                  {redeemPlan.skipped_count} row(s) skipped —{' '}
                  {(redeemPlan.skipped || [])
                    .slice(0, 5)
                    .map(x => `row ${x.line}: ${x.reason}`)
                    .join('; ')}
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' disabled={Boolean(busy)} onClick={() => setRedeemPlan(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={Boolean(busy) || Boolean(redeemPlan?.blocked)}
            startIcon={busy === 'reports' ? <CircularProgress size={16} color='inherit' /> : null}
            onClick={() => runUpload('reports')}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── One name onto the list ───────────────────────────────────── */}
      <Dialog open={addOpen} onClose={busy ? undefined : () => setAddOpen(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Add a receiver</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={4} sx={{ pt: 1 }}>
            {addError ? <Alert severity='error'>{addError}</Alert> : null}
            <TextField
              label='Name'
              size='small'
              fullWidth
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            />
            <Stack direction='row' spacing={2}>
              <TextField
                label='Code'
                size='small'
                sx={{ width: 90 }}
                value={addForm.country_code}
                onChange={e => setAddForm(f => ({ ...f, country_code: e.target.value }))}
              />
              <TextField
                label='Mobile'
                size='small'
                sx={{ flex: 1 }}
                value={addForm.mobile}
                onChange={e =>
                  setAddForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))
                }
              />
            </Stack>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              They get a gift code on the next Generate QR. A number that was removed earlier comes
              back with the code it already had.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' disabled={Boolean(busy)} onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={
              Boolean(busy) || !addForm.name.trim() || addForm.mobile.trim().length < 6 ||
              !addForm.country_code.trim()
            }
            startIcon={busy === 'add' ? <CircularProgress size={16} color='inherit' /> : null}
            onClick={addContact}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Retry / Reminder / Status ────────────────────────────────── */}
      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} fullWidth maxWidth='xs'>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2'>{confirm?.body}</Typography>
          {confirm?.spends ? (
            <Alert severity='warning' sx={{ mt: 3 }}>
              This spends the WhatsApp wallet and cannot be undone.
              {confirm?.once ? ' It can only be run once for this event.' : ''}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={confirm?.spends ? 'warning' : 'primary'}
            onClick={() => runAction(confirm)}
          >
            {confirm?.label}
          </Button>
        </DialogActions>
      </Dialog>

      <DispatchDialog
        open={dispatchOpen}
        eventId={eventId}
        onClose={() => setDispatchOpen(false)}
        onSent={(data, message) => {
          setDispatchOpen(false)
          notify(message, data?.status === 'failed' ? 'error' : 'success')
          fetchRows()
          onDispatched()
        }}
      />
    </Box>
  )
}

/* ==========================================================================
 * Tab 3 — Reports
 * ======================================================================= */

const SEND_STATUS = {
  sent: { label: 'Sent', color: 'success' },
  sent_with_errors: { label: 'Sent with errors', color: 'warning' },
  failed: { label: 'Failed', color: 'error' },
  sending: { label: 'Sending', color: 'info' }
}

/** The receivers inside one dispatch, and what the panel said about them. */
const SendDetail = ({ send, onBack }) => {
  const [rows, setRows] = useState([])
  const [campaignTab, setCampaignTab] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        status,
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize)
      })

      const res = await apiGet(`${baseURL}gift-campaign/send/${send.id}/rows?${query.toString()}`)
      const data = res?.data?.data || res?.data || {}
      setRows(data.rows || [])
      setTotal(Number(data.total) || 0)
    } catch (e) {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [send.id, status, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const columns = useMemo(
    () => [
      { accessorKey: 'sl_code', header: 'GIFT CODE', size: 110 },
      { accessorKey: 'name', header: 'NAME' },
      { accessorKey: 'phone_number', header: 'MOBILE' },
      {
        accessorKey: 'status',
        header: 'STATUS',
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            color={row.original.status === 'queued' ? 'info' : 'error'}
            label={row.original.status}
          />
        )
      },
      {
        /* ! TWO DIFFERENT QUESTIONS, TWO COLUMNS.
             STATUS is what OUR call to the panel did, the moment Dispatch
             ran. DELIVERY is what the panel says happened to the message
             afterwards, and it is blank until somebody presses Update WA
             Status. Collapsing them into one column is how "we sent it"
             gets read as "they got it". */
        accessorKey: 'panel_status',
        header: 'DELIVERY',
        Cell: ({ row }) => {
          const value = row.original.panel_status

          if (!value) {
            return (
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                not checked
              </Typography>
            )
          }

          const good = ['read', 'delivered'].includes(value)
          const bad = ['failed', 'expired', 'aborted'].includes(value)

          return (
            <Tooltip title={row.original.panel_checked_at ? `as at ${row.original.panel_checked_at}` : ''}>
              <Chip
                size='small'
                variant='outlined'
                color={good ? 'success' : bad ? 'error' : 'warning'}
                label={value}
              />
            </Tooltip>
          )
        }
      },
      {
        accessorKey: 'error',
        header: 'WHY NOT',
        Cell: ({ row }) => {
          // The panel's reason first: it is the one that explains a message
          // that left here cleanly and still never arrived.
          const reason = row.original.panel_error || row.original.error

          return (
            <Typography variant='caption' sx={{ color: 'text.secondary' }} title={reason || ''}>
              {reason || '—'}
            </Typography>
          )
        }
      },
      {
        accessorKey: 'campaign_uid',
        header: 'CAMPAIGN',
        Cell: ({ row }) => (
          <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {row.original.campaign_uid || '—'}
          </Typography>
        )
      }
    ],
    []
  )

  const table = useMaterialReactTable({
    ...tableDefaults,
    columns,
    data: rows,
    rowCount: total,
    manualPagination: true,
    onPaginationChange: setPagination,
    state: { pagination, isLoading: loading }
  })

  const held = Array.isArray(send.skipped_rows) ? send.skipped_rows : []
  const panelErrors = Array.isArray(send.panel_errors) ? send.panel_errors : []

  /**
   * The ChatWise campaigns this one dispatch produced.
   *
   * ! EACH ENTRY IS AN OBJECT, NOT A BARE STRING.
   *   dispatch.js stores `{ uid, batch, recipients }` per batch. An older row
   *   written before that shape settled could hold the uid alone, so both are
   *   accepted - a dashboard that silently shows nothing is worse than one
   *   that is a line longer.
   */
  const uids = useMemo(() => {
    const raw = Array.isArray(send.campaign_uids) ? send.campaign_uids : []

    return raw
      .map(entry => (typeof entry === 'string' ? { uid: entry } : entry))
      .filter(entry => entry?.uid)
  }, [send.campaign_uids])

  return (
    <Box>
      <Stack direction='row' spacing={2} alignItems='center' sx={{ px: 6, pt: 5, pb: 3 }}>
        <IconButton size='small' onClick={onBack}>
          <Icon icon='tabler:arrow-left' />
        </IconButton>
        <Box>
          <Typography variant='subtitle1'>{send.title || send.template_name}</Typography>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            {showStamp(send.created_at)} · {send.queued} queued of {send.total}
          </Typography>
        </Box>
      </Stack>

      <Stack direction='row' spacing={2} sx={{ px: 6, pb: 4, flexWrap: 'wrap', rowGap: 2 }} alignItems='center'>
        <Chip size='small' variant='outlined' label={`${send.total} sent to panel`} />
        <Chip size='small' variant='outlined' color='info' label={`${send.queued} queued`} />
        <Chip size='small' variant='outlined' label={`${send.skipped_before} held back`} />
        {send.skipped_by_panel ? (
          <Chip size='small' variant='outlined' color='warning' label={`${send.skipped_by_panel} refused by panel`} />
        ) : null}
        <TextField
          select
          size='small'
          label='Status'
          value={status}
          onChange={e => {
            setPagination(p => ({ ...p, pageIndex: 0 }))
            setStatus(e.target.value)
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value='all'>All</MenuItem>
          <MenuItem value='queued'>Queued</MenuItem>
          <MenuItem value='failed'>Failed</MenuItem>
        </TextField>
      </Stack>

      {panelErrors.length ? (
        <Alert severity='warning' sx={{ mx: 6, mb: 4 }}>
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {panelErrors.length} error(s) from ChatWise
          </Typography>
          {panelErrors.slice(0, 10).map((e, i) => (
            <Typography key={i} variant='caption' sx={{ display: 'block' }}>
              {[e.sl_code, e.name, e.phone_number].filter(Boolean).join(' · ')} — {e.message}
            </Typography>
          ))}
        </Alert>
      ) : null}

      {held.length ? (
        <Box sx={{ mx: 6, mb: 4 }}>
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            Held back before sending
          </Typography>
          {held.slice(0, 15).map((h, i) => (
            <Typography key={i} variant='caption' sx={{ display: 'block', color: 'text.secondary' }}>
              {[h.sl_code, h.name, h.mobile].filter(Boolean).join(' · ')} — {h.reason}
            </Typography>
          ))}
          {held.length > 15 ? (
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              …and {held.length - 15} more
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Divider />

      {loading ? <TableSkeleton columns={6} /> : <MaterialReactTable table={table} />}

      {/* ! WHAT THE PANEL SAYS, UNDER WHAT WE SENT.
            The table above is OUR record: who this portal handed to ChatWise
            and whether the call was accepted. This is the other half - read,
            delivered, failed, and the reason per guest - and it comes
            straight from the panel rather than from anything stored here, so
            it is right the moment it is opened without pressing anything.

            A dispatch of 2,500 is three campaigns, because the panel takes a
            thousand at a time. They are tabs rather than one total: each has
            its own uid and its own failures, and adding them up would hide
            which thousand went wrong. */}
      {uids.length ? (
        <>
          <Divider sx={{ mt: 6 }} />
          <Box sx={{ px: 6, pt: 5 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Delivery
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              Live from ChatWise. Receipts arrive over minutes and hours, so press Refresh rather
              than expecting the first read to be final.
            </Typography>
          </Box>

          {uids.length > 1 ? (
            <Tabs
              value={Math.min(campaignTab, uids.length - 1)}
              onChange={(e, v) => setCampaignTab(v)}
              variant='scrollable'
              sx={{ px: 6, mt: 2 }}
            >
              {uids.map((u, i) => (
                <Tab key={u.uid || i} label={`Campaign ${i + 1} · ${u.recipients || 0}`} />
              ))}
            </Tabs>
          ) : null}

          <Box sx={{ px: 6, pb: 6, pt: 3 }}>
            <CampaignDelivery uid={uids[Math.min(campaignTab, uids.length - 1)]?.uid} />
          </Box>
        </>
      ) : null}
    </Box>
  )
}

const ReportsTab = ({ eventId, reloadKey }) => {
  const [sends, setSends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    if (!eventId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiGet(`${baseURL}gift-campaign/${eventId}/sends?limit=50`)
        if (cancelled) return
        setSends(res?.data?.data?.rows || [])
      } catch (e) {
        if (cancelled) return
        setError(errorText(e, 'Could not load the dispatch history.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [eventId, reloadKey])

  if (open) return <SendDetail send={open} onBack={() => setOpen(null)} />

  if (loading) return <TableSkeleton columns={5} />

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 6 }}>
        {error}
      </Alert>
    )
  }

  if (!sends.length) {
    return (
      <EmptyState
        title='Nothing dispatched yet'
        subtitle='Once you send the campaign, every run shows up here with who got it and who did not.'
      />
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Stack spacing={3}>
        {sends.map(s => {
          const state = SEND_STATUS[s.status] || { label: s.status, color: 'default' }

          return (
            <Card key={s.id} variant='outlined' sx={{ p: 4, cursor: 'pointer' }} onClick={() => setOpen(s)}>
              <Stack direction='row' spacing={3} alignItems='center' sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                <Chip size='small' label={state.label} color={state.color} variant='outlined' />
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {s.title || s.template_name}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    {showStamp(s.created_at)}
                  </Typography>
                </Box>
                <Chip size='small' variant='outlined' label={`${s.queued}/${s.total} queued`} />
                {s.skipped_before ? (
                  <Chip size='small' variant='outlined' label={`${s.skipped_before} held back`} />
                ) : null}
                {s.error_count ? (
                  <Chip size='small' variant='outlined' color='warning' label={`${s.error_count} error(s)`} />
                ) : null}
                <Icon icon='tabler:chevron-right' />
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}

/* ==========================================================================
 * The page
 * ======================================================================= */

const GiftEventPage = () => {
  const router = useRouter()
  const { id } = router.query

  const [tab, setTab] = useState('details')
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [toast, setToast] = useState(null)

  const notify = (message, severity = 'info') => setToast({ message, severity })

  useEffect(() => {
    // `router.query` is empty on the very first render of a dynamic route —
    // Next has not parsed the URL yet. Fetching on that render asks the server
    // for `undefined` and paints a "does not exist" over a page that is fine.
    if (!router.isReady || !id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiGet(`${baseURL}gift-campaign/${id}`)
        if (cancelled) return
        setEvent(res?.data?.data || res?.data || null)
      } catch (e) {
        if (cancelled) return
        setError(errorText(e, 'Could not load that gift event.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [router.isReady, id])

  return (
    <Card>
      <Box sx={{ px: 6, pt: 5, pb: 3 }}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <IconButton size='small' onClick={() => router.push('/gift-campaign')}>
            <Icon icon='tabler:arrow-left' />
          </IconButton>
          <Box>
            <Typography variant='h6'>{event?.eventname || 'Gift event'}</Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {event
                ? [event.name, [event.country_code, event.mobile].filter(Boolean).join('-')].filter(Boolean).join(' · ')
                : ''}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 4 }}>
        <Tab label='Gift Details' value='details' />
        <Tab label='Generate Qr' value='qr' />
        <Tab label='Reports' value='reports' />
      </Tabs>

      {error ? (
        <Alert severity='error' sx={{ m: 6 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <TableSkeleton columns={2} />
      ) : tab === 'details' ? (
        <GiftDetailsTab event={event} />
      ) : tab === 'qr' ? (
        <GenerateQrTab eventId={id} notify={notify} onDispatched={() => setReloadKey(k => k + 1)} />
      ) : (
        <ReportsTab eventId={id} reloadKey={reloadKey} />
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={8000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity || 'info'} onClose={() => setToast(null)} variant='filled'>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default GiftEventPage
