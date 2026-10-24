import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import {
  Card,
  Box,
  Chip,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Alert
} from '@mui/material'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'

import { apiGet, apiPost, apiPatch } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

// ** Iconify, not @mui/material's Icon. The two are different components with the
//    same name and only this one understands `icon='tabler:gift'`.
import Icon from 'src/@core/components/icon'

// ** The portal's shared list-page chrome.
import { PageToolbar, EmptyState, TableSkeleton } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * Gift Campaign — the gift events, and how far each one has got.
 *
 * ! THESE ARE NOT THE MOBILE APP'S FUNCTIONS OR EVENTS.
 *   A gift event is a `whatsappgift_parent` row and the gift system has no
 *   connection to `function` or `event` at all. Its receivers table calls the
 *   parent id `function_id`, which is a legacy misnomer — see the header of
 *   admin-nodejs/src/gift-campaign/service.js before writing a query here.
 *
 * Read-only for now. Creating and editing a gift event still happens in the
 * user portal, which is staying where it is.
 */

/**
 * "2026-10-16 06:54:32.305788" → "16 Oct 2026, 6:54 AM".
 *
 * ! BY ITS OWN DIGITS, NEVER THROUGH `new Date()`.
 *   The server sends these as `::text` precisely so nothing rebuilds a Date
 *   from them. `new Date('2026-10-16 06:54:32')` is parsed in the browser's
 *   zone, and an event created at 00:30 then renders as the previous day for
 *   anybody west of the server. That exact bug has shipped in this product
 *   twice and is written up in my-guests-api.md.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const showStamp = value => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!m) return '—'

  const [, year, month, day, hh, mm] = m
  const hour24 = Number(hh)
  const suffix = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${hour12}:${mm} ${suffix}`
}

/** The template's own variables, as the user portal labels them: Field 0, 1, 2. */
const fieldLines = fields => {
  if (!fields || typeof fields !== 'object') return []

  return Object.keys(fields)
    .filter(k => /^field_\d+$/.test(k))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
    .map(k => ({ label: k.replace('field_', 'Field '), value: String(fields[k] ?? '') }))
}

/**
 * Create or edit a gift event.
 *
 * ! `template_feild` IS THE PAYLOAD KEY, MISSPELLED ON PURPOSE.
 *   The user portal's own `/add-gift-template` already names it that, and the
 *   two backends write the same row while both exist. Correcting the spelling
 *   here would make one body work against one backend and not the other.
 *
 * The variables are `field_0, field_1, …` — the storage numbering, which is
 * what both screens show. The send maps them to the template's {{1}}, {{2}}
 * one higher; that translation lives in the dispatcher, not here, so nobody
 * has to hold the off-by-one in their head while filling this in.
 */
const GiftEventDialog = ({ open, row, onClose, onSaved }) => {
  const editing = Boolean(row?.id)

  const [form, setForm] = useState({})
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    setError('')
    setForm({
      eventname: row?.eventname || '',
      name: row?.name || '',
      mobile: row?.mobile || '',
      country_code: row?.country_code || '+91',
      tempalte_name: row?.template_name || row?.tempalte_name || '',
      tempalte_image_url: row?.template_image_url || row?.tempalte_image_url || ''
    })

    const existing = fieldLines(row?.fields)
    // Three is what the approved `thank_you_main` template declares, so a new
    // event starts with three empty ones rather than a blank list nobody knows
    // the shape of.
    setFields(existing.length ? existing.map(l => l.value) : ['', '', ''])
  }, [open, row])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const template_feild = {}
      fields.forEach((v, i) => {
        template_feild[`field_${i}`] = v
      })

      const body = { ...form, template_feild }

      if (editing) {
        await apiPatch(`${baseURL}gift-campaign/${row.id}`, body)
      } else {
        await apiPost(`${baseURL}gift-campaign/create`, body)
      }

      onSaved()
    } catch (e) {
      // The server's own message, not a generic one: it names the field that
      // failed validation, which is the only useful thing to show here.
      setError(e?.response?.data?.message || e?.message || 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  const blankVariables = fields.filter(v => !String(v).trim()).length

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{editing ? 'Edit gift event' : 'New gift event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ pt: 1 }}>
          {error ? <Alert severity='error'>{error}</Alert> : null}

          <TextField
            label='Event name'
            value={form.eventname || ''}
            onChange={e => set('eventname', e.target.value)}
            fullWidth
            size='small'
            required
          />

          <Stack direction='row' spacing={2}>
            <TextField
              label='Host name'
              value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              size='small'
              sx={{ flex: 2 }}
              required
            />
            <TextField
              label='Code'
              value={form.country_code || ''}
              onChange={e => set('country_code', e.target.value)}
              size='small'
              sx={{ width: 90 }}
              required
            />
            <TextField
              label='Mobile'
              value={form.mobile || ''}
              onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))}
              size='small'
              sx={{ flex: 2 }}
              required
            />
          </Stack>

          <TextField
            label='WhatsApp template name'
            value={form.tempalte_name || ''}
            onChange={e => set('tempalte_name', e.target.value)}
            size='small'
            fullWidth
            helperText='Exactly as approved in Meta, e.g. thank_you_main'
          />

          <TextField
            label='Template image URL'
            value={form.tempalte_image_url || ''}
            onChange={e => set('tempalte_image_url', e.target.value)}
            size='small'
            fullWidth
            helperText='https only — WhatsApp fetches it unauthenticated when the message is sent'
          />

          <Divider />

          <Box>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              Template values
            </Typography>
            <Stack spacing={2}>
              {fields.map((value, i) => (
                <TextField
                  key={i}
                  label={`Field ${i}`}
                  value={value}
                  onChange={e => setFields(list => list.map((v, j) => (j === i ? e.target.value : v)))}
                  size='small'
                  fullWidth
                />
              ))}
            </Stack>

            <Stack direction='row' spacing={2} sx={{ mt: 2 }} alignItems='center'>
              <Button size='small' onClick={() => setFields(l => [...l, ''])}>
                Add a field
              </Button>
              {fields.length > 1 ? (
                <Button size='small' color='secondary' onClick={() => setFields(l => l.slice(0, -1))}>
                  Remove the last
                </Button>
              ) : null}
            </Stack>

            {/* A blank variable is not a cosmetic problem: the dispatcher
                refuses to send a campaign whose template has one, because the
                old one-at-a-time path put the literal text "Missing Field 1"
                in the message body and sent it. Said here, where it can still
                be fixed in a second. */}
            {blankVariables ? (
              <Alert severity='warning' sx={{ mt: 3 }}>
                {blankVariables} of {fields.length} values are blank. A campaign will refuse to send until every one is
                filled.
              </Alert>
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={save} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const GiftCampaign = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [typed, setTyped] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet(
        `${baseURL}gift-campaign/list?limit=${pagination.pageSize}` +
          `&offset=${pagination.pageIndex * pagination.pageSize}` +
          `&search=${encodeURIComponent(searchText)}`
      )

      // controllerHandler does a bare res.json(result), so the controller's own
      // `data` key sits inside axios's `data`. Hence data.data — the same shape
      // travel-plan returns.
      setRows(res?.data?.data?.rows || [])
      setTotal(res?.data?.data?.total || 0)
    } catch (e) {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Typing is debounced rather than firing a query per keystroke; an operator
  // searching a mobile number types ten of them.
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination(p => ({ ...p, pageIndex: 0 }))
      setSearchText(typed.trim())
    }, 300)

    return () => clearTimeout(t)
  }, [typed])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'eventname',
        header: 'Event',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
              {row.original.eventname || '—'}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {row.original.template_name || 'no template'}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'name',
        header: 'Host',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {row.original.name || '—'}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {[row.original.country_code, row.original.mobile].filter(Boolean).join(' ')}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'fields',
        header: 'Template values',
        enableSorting: false,
        Cell: ({ row }) => {
          const lines = fieldLines(row.original.fields)
          if (!lines.length) {
            return (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                none set
              </Typography>
            )
          }

          return (
            <Box sx={{ maxWidth: 320 }}>
              {lines.map(l => (
                <Typography
                  key={l.label}
                  variant='caption'
                  sx={{ display: 'block', color: 'text.secondary' }}
                  noWrap
                  title={l.value}
                >
                  <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {l.label}:
                  </Box>{' '}
                  {l.value || <em>blank</em>}
                </Typography>
              ))}
            </Box>
          )
        }
      },
      {
        accessorKey: 'receiver_count',
        header: 'Receivers',
        Cell: ({ row }) => {
          const { receiver_count: all, coded_count: coded, sent_count: sent } = row.original

          // The three numbers the old screen does not show, and the operator's
          // first question: how many are on the list, how many have a code,
          // how many have actually gone out.
          if (!all) {
            return (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                none uploaded
              </Typography>
            )
          }

          return (
            <Stack direction='row' spacing={1} alignItems='center'>
              <Chip size='small' label={`${all} on list`} variant='outlined' />
              <Chip
                size='small'
                label={`${coded} coded`}
                color={coded === all ? 'success' : 'warning'}
                variant='outlined'
              />
              <Chip
                size='small'
                label={`${sent} sent`}
                color={sent === all ? 'success' : 'default'}
                variant='outlined'
              />
            </Stack>
          )
        }
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 100,
        Cell: ({ row }) => (
          <Stack direction='row' spacing={0} onClick={e => e.stopPropagation()}>
            {/* Open before Edit: opening the event is what an operator does
                twenty times a day and editing the template is what they do
                once, so the common action sits first. */}
            <Tooltip title='Open this gift event'>
              <IconButton size='small' onClick={() => router.push(`/gift-campaign/${row.original.id}`)}>
                <Icon icon='tabler:external-link' fontSize='1.25rem' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit this gift event'>
              <IconButton
                size='small'
                onClick={() => {
                  setEditingRow(row.original)
                  setDialogOpen(true)
                }}
              >
                <Icon icon='tabler:edit' fontSize='1.25rem' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {showStamp(row.original.created_at)}
          </Typography>
        )
      }
    ],
    // `router` is in here because the actions cell closes over it. An empty
    // list captures the first render's router for the life of the page, which
    // is the stale-closure bug that makes a button work once and then stop.
    [router]
  )

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. The page's own options below still
    //    win, because they are spread after these.
    ...tableDefaults,
    columns,
    data: rows,
    manualPagination: true,
    rowCount: total,
    state: { pagination },
    onPaginationChange: setPagination,
    enableRowSelection: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableTopToolbar: false,

    /**
     * The whole row opens the event.
     *
     * The actions cell stops propagation on its own buttons below, so Edit
     * opens the dialog rather than doing both — a row click that fires while
     * a dialog is opening leaves the operator on a different page than the
     * one they are typing into.
     */
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => router.push(`/gift-campaign/${row.original.id}`),
      sx: { cursor: 'pointer' }
    })
  })

  return (
    <Card>
      <PageToolbar
        title='Gift Campaign'
        // Never a bare 0 while loading — that reads as "there are none".
        count={loading ? undefined : total}
        actions={
          <Button
            variant='contained'
            startIcon={<Icon icon='tabler:plus' />}
            onClick={() => {
              setEditingRow(null)
              setDialogOpen(true)
            }}
          >
            New gift event
          </Button>
        }
        search={
          <TextField
            size='small'
            value={typed}
            placeholder='Search event, host or number'
            onChange={e => setTyped(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
            InputProps={{
              startAdornment: <Icon icon='tabler:search' fontSize='1.25rem' style={{ marginRight: 8 }} />
            }}
          />
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon='tabler:gift'
          title={searchText ? 'No gift events match that search' : 'No gift events yet'}
          description={
            searchText
              ? 'Try the host’s name, or their mobile number without the country code.'
              : 'Gift events are created in the user portal. One will appear here as soon as it exists.'
          }
        />
      ) : (
        <MaterialReactTable table={table} />
      )}

      <GiftEventDialog
        open={dialogOpen}
        row={editingRow}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false)
          fetchRows()
        }}
      />
    </Card>
  )
}

export default GiftCampaign
