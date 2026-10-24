import { useCallback, useEffect, useMemo, useState } from 'react'
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
const giftState = row => {
  if (row?.is_redeemed) return { label: 'Redeemed', color: 'success' }
  if (row?.is_scaned) return { label: 'Scanned', color: 'info' }
  if (row?.is_deliverd_wa) return { label: 'Delivered', color: 'primary' }
  if (row?.wa_status === 'queued') return { label: 'Queued', color: 'info' }
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
  }, [open, eventId])

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
 * Still unwired, and drawn disabled rather than left out: the row of actions
 * is most of what this screen IS, and hiding them would make the tab look
 * finished when it is not. Each names the endpoint it will call.
 */
const PENDING_ACTIONS = [
  { label: 'Upload', icon: 'tabler:upload', note: 'POST /whatsapp-qr/upload-wa-contacts' },
  { label: 'Upload Reports', icon: 'tabler:file-import', note: 'POST /whatsapp-qr/upload-wa-reports' },
  { label: 'Retry Failed', icon: 'tabler:refresh', note: 'GET /whatsapp-qr/generate-qr-uploded-retry' },
  { label: 'Add Contact', icon: 'tabler:user-plus', note: 'POST /whatsapp-qr/add-single-contact' },
  { label: 'Export list', icon: 'tabler:table-export', note: 'GET /whatsapp-qr/export-excel' },
  { label: 'Export Reports', icon: 'tabler:report', note: 'GET /whatsapp-qr/export-excel-reports' },
  { label: 'Reminder Message', icon: 'tabler:bell', note: 'GET /whatsapp-qr/trigger-reminder' },
  { label: 'Update WA Status bulk', icon: 'tabler:cloud-download', note: 'GET /whatsapp-qr/current-wa-status-bulk' },
  { label: 'Scan QR', icon: 'tabler:scan', note: 'POST /whatsapp-qr/scan-qrcode' }
]

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
        {PENDING_ACTIONS.map(a => (
          <Tooltip key={a.label} title={`Not wired yet — will call ${a.note}`}>
            <span>
              <Button size='small' variant='outlined' disabled startIcon={<Icon icon={a.icon} />}>
                {a.label}
              </Button>
            </span>
          </Tooltip>
        ))}
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
        accessorKey: 'error',
        header: 'WHY NOT',
        Cell: ({ row }) => (
          <Typography variant='caption' sx={{ color: 'text.secondary' }} title={row.original.error || ''}>
            {row.original.error || '—'}
          </Typography>
        )
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
