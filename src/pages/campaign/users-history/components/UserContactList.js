import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid2 as Grid,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

import Icon from 'src/@core/components/icon'
import { apiGet } from 'src/hooks/axios'
import { reportUserContacts } from 'src/services/pathConst'
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
 */
const SOURCE_LABEL = {
  added: 'Added by user',
  acquired: 'Acquired'
}

const joinParts = (...parts) =>
  parts
    .map(p => (p == null ? '' : String(p).trim()))
    .filter(Boolean)
    .join(', ')

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

const SummaryCard = ({ title, value, color }) => (
  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
    <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant='caption' color='text.secondary'>
          {title}
        </Typography>
        <Typography variant='h5' fontWeight={600} sx={{ color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
)

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
      {/* SUMMARY — the whole list, not the page, and not affected by search. */}
      <Grid container spacing={2} mb={3}>
        <SummaryCard title='Guests' value={summary.total ?? 0} color='#f2a429' />
        <SummaryCard title='Added by user' value={summary.added ?? 0} color='#2196f3' />
        <SummaryCard title='Acquired' value={summary.acquired ?? 0} color='#9c27b0' />
        <SummaryCard title='On the app' value={summary.app_users ?? 0} color='#00897b' />
        <SummaryCard title='They invited' value={summary.invited_by_user ?? 0} color='#4caf50' />
        <SummaryCard title='Invited them' value={summary.invited_the_user ?? 0} color='#5c6bc0' />
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
