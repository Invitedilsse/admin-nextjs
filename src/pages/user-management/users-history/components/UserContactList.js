import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid2 as Grid,
  IconButton,
  Stack,
  TextField,
  // ToggleButton and ToggleButtonGroup go back in with the source toggle below.
  // ToggleButton,
  // ToggleButtonGroup,
  Typography
} from '@mui/material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

import Icon from 'src/@core/components/icon'
import { apiGet } from 'src/hooks/axios'
import { reportUserContacts, reportUserContactInvites } from 'src/services/pathConst'
import { formatDateTime } from 'src/utils/reminderUtils'

/**
 * Every guest one app user has saved — the admin's copy of their My Guests
 * list.
 *
 * The same rows the phone shows, from the same query: de-duplicated on
 * (mobile, country code), with the two invite counts computed the way the app
 * computes them, so a number here and a number on their phone cannot disagree.
 *
 * Two kinds of row, told apart by `source`:
 *   added    — the user saved this guest themselves.
 *   acquired — the row belongs to another host and reached this user through
 *              contact_host_id, which is how somebody who invited them lands
 *              in their list.
 *
 * Paged on the server: a large account is tens of thousands of guests, and
 * this tab opens inside a page that has already made several calls of its own.
 *
 * Opening a row also pulls that guest's invites — the same block the app shows
 * on a guest's page — with the covers and gifts recorded against each. That
 * call is made once per row, on first expand, and cached for the life of the
 * tab: a page of 25 rows would otherwise be 25 requests nobody asked for.
 */
const SOURCE_LABEL = {
  added: 'Added by user',
  acquired: 'Acquired'
}

/** The four slots on a guest's page, in the app's own words. */
const RECORD_LABEL = {
  coverGiven: 'COVER GIVEN',
  coverReceived: 'COVER RECEIVED',
  giftGiven: 'GIFT YOU GAVE',
  giftReceived: 'GIFT YOU RECEIVED'
}

const RECORD_COLOR = {
  coverGiven: '#e57373',
  coverReceived: '#4caf50',
  giftGiven: '#ba68c8',
  giftReceived: '#4dabf5'
}

const joinParts = (...parts) =>
  parts
    .map(p => (p == null ? '' : String(p).trim()))
    .filter(Boolean)
    .join(', ')

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

/**
 * A calendar day, without moving it.
 *
 * Some of these columns are stored naive — a wedding at 19:00 IST is written
 * "2026-11-15 19:00:00" with no zone. Handing that to `new Date()` in a browser
 * behind IST reads it as UTC and prints the 16th. So when the string carries no
 * zone, the day is read straight off it; only a real instant is converted.
 */
const formatDay = value => {
  if (!value) return '-'
  const raw = String(value)
  const naive = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(raw)
  if (naive && !/(Z|[+-]\d{2}:?\d{2})$/.test(raw.trim())) {
    const [, y, m, d] = naive

    return `${d} ${MONTHS[Number(m) - 1] || m} ${y}`
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'

  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** ₹ with Indian grouping — 11000 reads as ₹11,000, the way the app writes it. */
const formatAmount = value => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount === 0) return ''

  return `₹${amount.toLocaleString('en-IN')}`
}

/** One labelled value in the expanded row. */
const Field = ({ label, value }) => (
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Typography
      variant='caption'
      color='text.secondary'
      sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {label}
    </Typography>
    <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
      {value === null || value === undefined || value === '' ? '-' : value}
    </Typography>
  </Grid>
)

/**
 * A number over the list. `onClick` makes it a filter as well as a number —
 * clicking narrows the list to exactly the rows it counted, clicking again
 * clears it, so the two can never drift apart.
 */
const SummaryCard = ({ title, value, color, active, onClick }) => (
  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 3,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        border: theme => `2px solid ${active ? color || theme.palette.primary.main : 'transparent'}`,
        transition: 'border-color .15s ease, transform .15s ease',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : undefined
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <Typography variant='caption' color='text.secondary'>
            {title}
          </Typography>
          {active ? (
            <Icon icon='mdi:filter-check' fontSize={14} />
          ) : onClick ? (
            <Icon icon='mdi:filter-outline' fontSize={14} opacity={0.4} />
          ) : null}
        </Stack>
        <Typography variant='h5' fontWeight={600} sx={{ color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
)

/** One cover or gift, as a tile — the label, the value, the event, the note. */
const RecordTile = ({ record }) => {
  const amount = formatAmount(record.amount)
  const value = amount || record.description || '-'

  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: `4px solid ${RECORD_COLOR[record.kind] || '#90a4ae'}`,
          borderRadius: 1,
          px: 1.5,
          py: 1
        }}
      >
        <Typography
          variant='caption'
          sx={{ letterSpacing: 0.5, color: RECORD_COLOR[record.kind] || 'text.secondary' }}
        >
          {RECORD_LABEL[record.kind] || record.kind}
        </Typography>
        <Typography variant='subtitle1' fontWeight={600}>
          {value}
        </Typography>
        {amount && record.description ? (
          <Typography variant='body2'>{record.description}</Typography>
        ) : null}
        {record.event_label ? (
          <Typography variant='caption' color='text.secondary' display='block'>
            {record.event_label}
          </Typography>
        ) : null}
        {record.note ? (
          <Typography variant='caption' color='text.secondary' display='block'>
            {record.note}
          </Typography>
        ) : null}
      </Box>
    </Grid>
  )
}

/** One invite, with whatever was recorded against it. */
const InviteCard = ({ invite, direction, guestName }) => {
  const on = formatDay(invite.sent_on || invite.dispatch_date_time)
  const line =
    direction === 'sent' ? `Sent by you on ${on}` : `Sent by ${guestName || 'them'} on ${on}`

  return (
    <Card variant='outlined' sx={{ mb: 1.5 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant='subtitle2' fontWeight={600}>
          {invite.function_name || 'Function'}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {line}
          {invite.host_name ? ` · host ${invite.host_name}` : ''}
        </Typography>

        {invite.records?.length > 0 ? (
          <Grid container spacing={1} mt={0.5}>
            {invite.records.map((record, index) => (
              <RecordTile key={`${record.kind}-${index}`} record={record} />
            ))}
          </Grid>
        ) : (
          <Typography variant='caption' color='text.disabled' display='block' mt={0.5}>
            Nothing recorded against this invite.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The invites block — what the app shows on a guest's page.
 *
 * Fetched on expand, not with the list: it is two queries and a gift lookup per
 * guest, and almost every row is opened by nobody.
 */
const ContactInvites = ({ contact, state, onLoad }) => {
  useEffect(() => {
    if (!state) onLoad()
  }, [state, onLoad])

  if (!state || state.loading) {
    return (
      <Stack direction='row' spacing={1} alignItems='center' sx={{ py: 2 }}>
        <CircularProgress size={18} />
        <Typography variant='body2' color='text.secondary'>
          Loading invites…
        </Typography>
      </Stack>
    )
  }

  if (state.error) {
    return (
      <Stack direction='row' spacing={1} alignItems='center' sx={{ py: 1 }}>
        <Typography variant='body2' color='error'>
          {state.error}
        </Typography>
        <Chip size='small' label='Try again' onClick={onLoad} />
      </Stack>
    )
  }

  const guestName = joinParts(contact?.name, contact?.last_name).replace(', ', ' ')
  const { sent = [], received = [], orphaned = [] } = state.data || {}

  if (!sent.length && !received.length && !orphaned.length) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ py: 1 }}>
        No invites either way between this user and {guestName || 'this guest'}.
      </Typography>
    )
  }

  return (
    <Grid container spacing={2}>
      {sent.length > 0 ? (
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant='subtitle2' fontWeight={600} mb={1}>
            Invites this user sent {guestName || 'them'} ({sent.length})
          </Typography>
          {sent.map(invite => (
            <InviteCard
              key={`s-${invite.function_id}`}
              invite={invite}
              direction='sent'
              guestName={guestName}
            />
          ))}
        </Grid>
      ) : null}

      {received.length > 0 ? (
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant='subtitle2' fontWeight={600} mb={1}>
            Invites {guestName || 'they'} sent this user ({received.length})
          </Typography>
          {received.map(invite => (
            <InviteCard
              key={`r-${invite.function_id}`}
              invite={invite}
              direction='received'
              guestName={guestName}
            />
          ))}
        </Grid>
      ) : null}

      {orphaned.length > 0 ? (
        <Grid size={{ xs: 12 }}>
          {/* Money somebody recorded against a function that is no longer in
              either list — the invite was withdrawn after the fact. Shown
              rather than dropped. */}
          <Typography variant='subtitle2' fontWeight={600} mb={1}>
            Recorded against a function that is no longer in either list
          </Typography>
          <Grid container spacing={1}>
            {orphaned.map((record, index) => (
              <RecordTile key={`o-${index}`} record={record} />
            ))}
          </Grid>
        </Grid>
      ) : null}
    </Grid>
  )
}

const UserContactList = ({ userId }) => {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [tempSearch, setTempSearch] = useState('')
  const [source, setSource] = useState('')

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  // contactId -> { loading, error, data }. Kept for the life of the tab so
  // collapsing and re-opening a row costs nothing.
  const [invites, setInvites] = useState({})

  // State lands a render late, and in development React runs effects twice —
  // either is enough to fire the same fetch twice. This is the guard that
  // actually holds, because it is written before the await.
  const inFlight = useRef(new Set())

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = [
          `userId=${userId}`,
          `page=${pagination.pageIndex + 1}`,
          `limit=${pagination.pageSize}`,
          search ? `search=${encodeURIComponent(search)}` : '',
          source ? `source=${source}` : ''
        ]
          .filter(Boolean)
          .join('&')

        const res = await apiGet(`${reportUserContacts}?${params}`)
        if (cancelled) return

        setRows(res?.data?.data || [])
        setCount(res?.data?.count || 0)
        setSummary(res?.data?.summary || {})
      } catch (err) {
        console.error('User contact list error:', err)
        if (!cancelled) {
          setError(typeof err === 'string' ? err : 'Could not load this list.')
          setRows([])
          setCount(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId, pagination.pageIndex, pagination.pageSize, search, source])

  const loadInvites = useCallback(
    async contactId => {
      if (!userId || !contactId) return
      if (inFlight.current.has(contactId)) return
      inFlight.current.add(contactId)

      setInvites(prev => ({ ...prev, [contactId]: { loading: true } }))

      try {
        const res = await apiGet(
          `${reportUserContactInvites}?userId=${userId}&contactId=${contactId}`
        )
        setInvites(prev => ({ ...prev, [contactId]: { loading: false, data: res?.data || {} } }))
      } catch (err) {
        console.error('Contact invites error:', err)

        // Let a failed guest be asked for again — the row stays open, and a
        // dropped request should not need the tab reloading.
        inFlight.current.delete(contactId)
        setInvites(prev => ({
          ...prev,
          [contactId]: {
            loading: false,
            error: typeof err === 'string' ? err : 'Could not load this guest’s invites.'
          }
        }))
      }
    },
    [userId]
  )

  // A filter that replaced the rows invalidates nothing about a guest's
  // invites — but the user changing does.
  useEffect(() => {
    inFlight.current = new Set()
    setInvites({})
  }, [userId])

  /** Clicking a count is the same as choosing that filter; clicking it again clears. */
  const toggleSource = value => {
    setSource(current => (current === value ? '' : value))
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'user_contact_id',
        header: 'Code',
        size: 90,
        Cell: ({ row }) => row.original.user_contact_id || '-'
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 220,
        Cell: ({ row }) => {
          const c = row.original

          return (
            <Box>
              <Typography variant='body2' fontWeight={600}>
                {joinParts(c.name, c.last_name).replace(', ', ' ') || '-'}
              </Typography>
              {c.family_name ? (
                <Typography variant='caption' color='text.secondary'>
                  {c.family_name}
                </Typography>
              ) : null}
            </Box>
          )
        }
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        size: 160,
        Cell: ({ row }) => {
          const c = row.original
          const extra = Array.isArray(c.alternate_po) ? c.alternate_po.filter(Boolean) : []

          return (
            <Box>
              <Typography variant='body2'>
                {c.country_code ? `${c.country_code} ` : ''}
                {c.mobile || '-'}
              </Typography>
              {extra.length > 0 ? (
                <Typography variant='caption' color='text.secondary'>
                  +{extra.length} more
                </Typography>
              ) : null}
            </Box>
          )
        }
      },
      {
        accessorKey: 'relation',
        header: 'Relation',
        size: 130,
        Cell: ({ row }) => row.original.relation || '-'
      },
      {
        accessorKey: 'city',
        header: 'Place',
        size: 180,
        Cell: ({ row }) => {
          const c = row.original

          return joinParts(c.city, c.state) || '-'
        }
      },
      {
        accessorKey: 'invite_sent_count',
        header: 'Invites',
        size: 150,
        Cell: ({ row }) => {
          const c = row.original

          return (
            <Stack direction='row' spacing={0.5}>
              <Chip
                size='small'
                variant={c.invite_sent_count > 0 ? 'filled' : 'outlined'}
                color={c.invite_sent_count > 0 ? 'primary' : 'default'}
                label={`sent ${c.invite_sent_count}`}
              />
              <Chip
                size='small'
                variant={c.invite_received_count > 0 ? 'filled' : 'outlined'}
                color={c.invite_received_count > 0 ? 'success' : 'default'}
                label={`got ${c.invite_received_count}`}
              />
            </Stack>
          )
        }
      },
      {
        accessorKey: 'source',
        header: 'Source',
        size: 150,
        Cell: ({ row }) => {
          const c = row.original

          return (
            <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
              <Chip
                size='small'
                variant='outlined'
                color={c.source === 'added' ? 'warning' : 'default'}
                label={SOURCE_LABEL[c.source] || c.source}
              />
              {/* {c.is_app_user ? <Chip size='small' color='info' label='On app' /> : null} */}
            </Stack>
          )
        }
      },
      {
        accessorKey: 'created_at',
        header: 'Saved On',
        size: 150,
        Cell: ({ row }) => formatDateTime(row.original.created_at)
      }
    ],
    []
  )

  const table = useMaterialReactTable({
    columns,
    data: rows,
    // Server-side: the account can be tens of thousands of guests, and this
    // tab sits on a page that has already made several calls of its own.
    manualPagination: true,
    rowCount: count,
    state: { pagination, isLoading: loading },
    onPaginationChange: setPagination,
    getRowId: row => row.id,
    enableTopToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    layoutMode: 'grid-no-grow',
    muiPaginationProps: {
      rowsPerPageOptions: [25, 50, 100, 200],
      showFirstButton: true,
      showLastButton: true
    },
    // Everything the phone holds about a guest, without a table wide enough to
    // need its own scrollbar. The columns above are what an admin scans; this
    // is what they open when one row is the question.
    renderDetailPanel: ({ row }) => {
      const c = row.original
      const extra = Array.isArray(c.alternate_po) ? c.alternate_po.filter(Boolean) : []

      return (
        <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Field label='Contact code' value={c.user_contact_id} />
            <Field label='First name' value={c.name} />
            <Field label='Last name' value={c.last_name} />
            <Field label='Family name' value={c.family_name} />
            <Field
              label='Mobile'
              value={`${c.country_code ? `${c.country_code} ` : ''}${c.mobile || ''}`.trim()}
            />
            <Field label='Other numbers' value={extra.join(', ')} />
            <Field label='Relation' value={c.relation} />
            <Field label='Relation level' value={c.relation_lvl} />
            <Field label='Address' value={c.address} />
            <Field label='Area 1' value={c.area_1} />
            <Field label='Area 2' value={c.area_2} />
            <Field label='City' value={c.city} />
            <Field label='State' value={c.state} />
            <Field label='Pin code' value={c.pin_code} />
            <Field label='Notes' value={c.notes} />
            <Field label='Entry type' value={c.type} />
            <Field label='Source' value={SOURCE_LABEL[c.source] || c.source} />
            <Field label='Registered on the app' value={c.is_app_user ? 'Yes' : 'No'} />
            <Field label='Invites this user sent them' value={c.invite_sent_count} />
            <Field label='Invites they sent this user' value={c.invite_received_count} />
            <Field label='Saved on' value={formatDateTime(c.created_at)} />
            <Field label='Last updated' value={formatDateTime(c.updated_at)} />
            <Field label='Contact id' value={c.id} />
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            Invites
          </Typography>

          <ContactInvites
            contact={c}
            state={invites[c.id]}
            onLoad={() => loadInvites(c.id)}
          />
        </Box>
      )
    }
  })

  if (!userId) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        No user selected.
      </Typography>
    )
  }

  return (
    <Box>
      {/* SUMMARY — the whole list, not the page, and not affected by search.
          The two invite cards are filters as well as numbers: clicking one
          narrows the list to exactly the rows it counted. */}
      <Grid container spacing={2} mb={3}>
        <SummaryCard title='Guests' value={summary.total ?? 0} color='#f2a429' />

        {/* Hidden for now, at Vishaal's request — the numbers are still
            returned by the endpoint and the source filter still accepts
            `added` / `acquired`, so this is three lines away from coming back.
        <SummaryCard
          title='Added by user'
          value={summary.added ?? 0}
          color='#2196f3'
          active={source === 'added'}
          onClick={() => toggleSource('added')}
        />
        <SummaryCard
          title='Acquired'
          value={summary.acquired ?? 0}
          color='#9c27b0'
          active={source === 'acquired'}
          onClick={() => toggleSource('acquired')}
        />
        <SummaryCard title='On the app' value={summary.app_users ?? 0} color='#00897b' />
        */}

        <SummaryCard
          title='They invited'
          value={summary.invited_by_user ?? 0}
          color='#4caf50'
          active={source === 'invited_by_user'}
          onClick={() => toggleSource('invited_by_user')}
        />
        <SummaryCard
          title='Invited them'
          value={summary.invited_the_user ?? 0}
          color='#5c6bc0'
          active={source === 'invited_the_user'}
          onClick={() => toggleSource('invited_the_user')}
        />
      </Grid>

      <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' useFlexGap mb={2}>
        <TextField
          size='small'
          placeholder='Search name, number, code, city or relation'
          value={tempSearch}
          onChange={e => setTempSearch(e.target.value)}
          onKeyDown={ev => {
            if (ev.key === 'Enter') {
              ev.preventDefault()
              setPagination(p => ({ ...p, pageIndex: 0 }))
              setSearch(tempSearch)
            }
          }}
          sx={{ minWidth: 320 }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton
                  size='small'
                  onClick={() => {
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                    setSearch(tempSearch)
                  }}
                >
                  <Icon icon='fluent:search-20-regular' width={20} height={20} />
                </IconButton>
              )
            }
          }}
        />

        {search ? (
          <Chip
            label={`Search: ${search}`}
            onDelete={() => {
              setSearch('')
              setTempSearch('')
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />
        ) : null}

        {/* The active card filter, said in words and clearable from here too —
            a card two rows up going quiet is easy to miss. */}
        {source === 'invited_by_user' || source === 'invited_the_user' ? (
          <Chip
            color='primary'
            label={
              source === 'invited_by_user'
                ? 'Only guests this user invited'
                : 'Only guests who invited this user'
            }
            onDelete={() => {
              setSource('')
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />
        ) : null}

        {/* Source toggle — hidden alongside its two cards, for now.
        <ToggleButtonGroup
          size='small'
          exclusive
          value={source}
          onChange={(e, value) => {
            // Null is the button being switched off; that means "all".
            setSource(value ?? '')
            setPagination(p => ({ ...p, pageIndex: 0 }))
          }}
        >
          <ToggleButton value=''>All</ToggleButton>
          <ToggleButton value='added'>Added by user</ToggleButton>
          <ToggleButton value='acquired'>Acquired</ToggleButton>
        </ToggleButtonGroup>
        */}
      </Stack>

      {error ? (
        <Typography color='error' sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Icon icon='mdi:account-multiple-outline' fontSize={38} />
          <Typography color='text.secondary' mt={1}>
            {search || source
              ? 'No guest matches this filter.'
              : 'This user has not saved any guests.'}
          </Typography>
        </Box>
      ) : (
        <>
          <MaterialReactTable table={table} />
          <Divider sx={{ mt: 2 }} />
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            Duplicates are merged the way the app merges them — one row per mobile number, the
            user&apos;s own copy preferred over a copy acquired from a host.
          </Typography>
        </>
      )}
    </Box>
  )
}

export default UserContactList
