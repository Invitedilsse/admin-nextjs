import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Grid2,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress
} from '@mui/material'

// ** Iconify's Icon, not @mui/material's: only this one has an `icon` prop.
import Icon from 'src/@core/components/icon'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import { activeUsersList, activeUsersCheck } from 'src/services/pathConst'

import { PageToolbar, EmptyState } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * Who still has the app installed.
 *
 * The figures are not guesses. Pressing Check sends a SILENT push to every
 * device token on record and Firebase answers per token - installed and live,
 * or gone. Nothing appears on anybody's phone.
 *
 * ! THE CHECK BUTTON TOUCHES EVERY DEVICE THE PRODUCT HAS. It is a write and a
 *   message, not a read, which is why it asks first and says how many devices
 *   it is about to ask. Everything else on this page is read-only.
 *
 * ! ONE ROW IS ONE PERSON, NOT ONE ACCOUNT. `users` carries more than one row
 *   for the same mobile number - an invite creates a placeholder and the person
 *   may later sign up - and the raw list showed those people twice. The
 *   Accounts column is how many rows a line stands for, and the gap between
 *   "Accounts" and "People" in the cards is the duplication in the table.
 */

const DASH = '—'

const n = (value) =>
  value === null || value === undefined ? DASH : Number(value).toLocaleString('en-IN')

const PAGE = { pageIndex: 0, pageSize: 25 }

/**
 * `messaging/registration-token-not-registered` -> `Uninstalled or token
 * expired`.
 *
 * Firebase's codes are the evidence and are kept in the tooltip; these are
 * what they mean to somebody deciding whether a sweep went wrong. A code
 * missing from this map still renders as itself, so a new Firebase error can
 * never blank the line.
 */
const REASONS = {
  'messaging/registration-token-not-registered': 'App removed, or the token expired',
  'messaging/invalid-registration-token': 'The stored token is not a valid one',
  'messaging/invalid-argument': 'The stored token is not a valid one',
  'messaging/mismatched-credential': 'Sent with the wrong Firebase project',
  'messaging/third-party-auth-error': 'Our own Firebase credentials were refused',
  'messaging/server-unavailable': 'Firebase was unavailable - try again',
  'messaging/internal-error': 'Firebase failed internally - try again'
}

const ActiveUsers = () => {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const [scope, setScope] = useState('last_sweep')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState(PAGE)

  const [confirming, setConfirming] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const query = new URLSearchParams({
        scope,
        limit: String(pagination.pageSize),
        page: String(pagination.pageIndex + 1)
      })

      if (search) query.set('search', search)

      const response = await apiGet(`${activeUsersList}?${query.toString()}`)

      // ! `response` IS THE AXIOS RESPONSE, NOT THE BODY. apiGet returns
      //   axios.get(...) unwrapped by nothing, so the API's own object is at
      //   `.data` and the rows are at `.data.data`. Reading `response.data` as
      //   the rows gives an array-shaped object and an empty table that looks
      //   like "nobody is active" - the one wrong answer this page can give.
      const body = response?.data || {}

      setRows(body.data || [])
      setCount(body.count || 0)
      setSummary(body.summary || null)
    } catch (error) {
      // Surfaced, never swallowed: a page that silently shows nothing reads as
      // "nobody is active", which is the one wrong answer here.
      toast.error(error?.response?.data?.message || 'Could not load the active users')
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [scope, search, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    load()
  }, [load])

  /** The sweep. Asks every phone on record whether it is still there. */
  const runCheck = async () => {
    setConfirming(false)
    setChecking(true)
    setResult(null)

    try {
      const response = await apiPost(activeUsersCheck, {})
      const body = response?.data || {}

      setResult(body)
      toast.success(body.message || 'Check finished')

      // Back to the newest sweep, which is what was just measured.
      setScope('last_sweep')
      setPagination((p) => ({ ...p, pageIndex: 0 }))
      await load()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'The check could not be run')
    } finally {
      setChecking(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ row }) => {
          const value = row.original.name

          return (
            <Stack direction='row' spacing={2} alignItems='center'>
              <Typography variant='body2'>{value || DASH}</Typography>
              {row.original.reg_type === 'auto' ? (
                <Tooltip
                  title={
                    'This person has never signed up - the row was created by an ' +
                    'invitation, so the name is whatever the host typed.'
                  }
                >
                  <Chip size='small' variant='outlined' label='Invited' />
                </Tooltip>
              ) : null}
            </Stack>
          )
        }
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        Cell: ({ row }) => {
          const { country_code: code, mobile } = row.original
          const shown = `${code || ''} ${mobile || ''}`.trim()

          return <Typography variant='body2'>{shown || DASH}</Typography>
        }
      },
      {
        accessorKey: 'accounts',
        header: 'Accounts',
        Cell: ({ cell }) => {
          const value = cell.getValue()

          if (!value || value === 1) return <Typography variant='body2'>1</Typography>

          return (
            <Tooltip
              title={
                `This mobile number has ${value} rows in the users table. They are ` +
                'shown once, under the signed-up account.'
              }
            >
              <Chip size='small' color='warning' variant='outlined' label={value} />
            </Tooltip>
          )
        }
      },
      {
        accessorKey: 'devices',
        header: 'Devices',
        Cell: ({ cell }) => <Typography variant='body2'>{n(cell.getValue())}</Typography>
      },
      {
        accessorKey: 'signed_in_devices',
        header: 'Signed in',
        Cell: ({ cell }) => <Typography variant='body2'>{n(cell.getValue())}</Typography>
      },
      {
        accessorKey: 'last_active_ist',
        header: 'Last answered (IST)',
        Cell: ({ cell }) => (
          <Typography variant='body2' sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {cell.getValue() || DASH}
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
    rowCount: count,
    manualPagination: true,
    onPaginationChange: setPagination,
    enableSorting: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    state: { pagination, isLoading: loading },
    muiTableBodyRowProps: { hover: true }
  })

  /**
   * ! THE FIRST TWO CARDS COUNT PEOPLE; THE REST COUNT ROWS AND PHONES.
   *   They are captioned as such rather than lined up as five equal figures,
   *   because "4 users" above a table of 4 lines and "7 accounts" beside it
   *   are only confusing if nothing says which is which.
   */
  const cards = [
    {
      label: 'Answered the last check',
      value: summary?.reachable_last_sweep,
      hint: 'People whose phone replied to the most recent check.'
    },
    {
      label: 'Answered at some point',
      value: summary?.reachable_ever,
      hint: 'People whose phone has replied to any check we have run.'
    },
    {
      label: 'Accounts behind them',
      value: summary?.active_accounts,
      hint:
        'Rows in the active list before duplicate mobile numbers are merged. ' +
        'The gap between this and the figure to its left is the duplication.'
    },
    {
      label: 'Devices on record',
      value: summary?.tokens,
      hint: 'Device tokens the next check would ask about.'
    },
    {
      label: 'Still unreachable',
      value: summary?.unreachable_devices,
      hint:
        'Devices that failed the last check they were in and have not answered ' +
        'since. A reinstall clears a device from this count.'
    }
  ]

  const reasonRows = Object.entries(result?.reasons || {}).sort((a, b) => b[1] - a[1])

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card>
            <PageToolbar
              title='Active Users'
              subtitle={
                summary?.last_sweep_at
                  ? `Last checked ${summary.last_sweep_at} IST`
                  : 'Nobody has run a check yet'
              }
              count={count}
              actions={
                <Stack direction='row' spacing={2} alignItems='center'>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={load}
                    disabled={loading || checking}
                    startIcon={<Icon icon='tabler:refresh' />}
                  >
                    Refresh
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    onClick={() => setConfirming(true)}
                    disabled={checking}
                    startIcon={
                      checking ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <Icon icon='tabler:device-mobile-message' />
                      )
                    }
                  >
                    {checking ? 'Checking…' : 'Check who is active'}
                  </Button>
                </Stack>
              }
            />

            <Divider sx={{ m: '0 !important' }} />

            <CardContent>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 3 }}>
                Measured by asking the phones, not inferred from app usage. The first two
                figures count people; the rest count rows and devices.
              </Typography>

              <Grid2 container spacing={3}>
                {cards.map((card) => (
                  <Grid2 key={card.label} size={{ xs: 6, md: 2.4 }}>
                    <Tooltip title={card.hint}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 1,
                          bgcolor: 'customColors.surfaceSunken',
                          textAlign: 'center',
                          height: '100%'
                        }}
                      >
                        <Typography variant='h5' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {n(card.value)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {card.label}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Grid2>
                ))}
              </Grid2>
            </CardContent>

            {result ? (
              <CardContent sx={{ pt: 0 }}>
                <Alert
                  severity={result.unreachable_devices ? 'warning' : 'success'}
                  onClose={() => setResult(null)}
                >
                  <AlertTitle sx={{ mb: 1 }}>{result.message}</AlertTitle>
                  <Typography variant='body2'>
                    {n(result.checked)} devices asked · {n(result.reachable_devices)} answered ·{' '}
                    {n(result.unreachable_devices)} did not
                    {result.recovered ? ` · ${n(result.recovered)} came back` : ''}
                  </Typography>
                  {reasonRows.length ? (
                    <Stack direction='row' spacing={2} sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
                      {reasonRows.map(([code, times]) => (
                        <Tooltip key={code} title={code}>
                          <Chip
                            size='small'
                            variant='outlined'
                            label={`${REASONS[code] || code} · ${n(times)}`}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  ) : null}
                </Alert>
              </CardContent>
            ) : null}

            <Divider sx={{ m: '0 !important' }} />

            <Box
              sx={{
                px: 4,
                py: 4,
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <ToggleButtonGroup
                size='small'
                exclusive
                value={scope}
                onChange={(event, value) => {
                  if (!value) return
                  setScope(value)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
              >
                <ToggleButton value='last_sweep'>Last check</ToggleButton>
                <ToggleButton value='all'>Everyone ever</ToggleButton>
              </ToggleButtonGroup>

              <Box sx={{ flex: 1, minWidth: 200 }} />

              <TextField
                size='small'
                label='Search name or mobile'
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
                sx={{ minWidth: 260 }}
              />
            </Box>

            {rows.length === 0 && !loading ? (
              <EmptyState
                title={
                  search
                    ? 'Nobody matches that search'
                    : scope === 'last_sweep'
                      ? 'No phone has answered a check yet'
                      : 'No phone has ever answered a check'
                }
                subtitle={
                  search
                    ? 'Clear the search to see everyone in this list.'
                    : 'Press "Check who is active" to ask every device on record.'
                }
              />
            ) : (
              <MaterialReactTable table={table} />
            )}
          </Card>
        </Grid2>
      </Grid2>

      {/*
        The confirmation is not ceremony. This button sends a push to every
        device token the product holds, so the dialog says how many that is
        before anybody presses it.
      */}
      <Dialog open={confirming} onClose={() => setConfirming(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Check who is active?</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            <Typography variant='body2' sx={{ mb: 3 }}>
              This sends a silent message to{' '}
              <strong>{n(summary?.tokens)} device{summary?.tokens === 1 ? '' : 's'}</strong> and
              records which ones answer. Nothing appears on anybody&apos;s phone.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              It takes a few seconds per 500 devices, and it replaces the figures above.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant='contained' onClick={runCheck}>
            Run the check
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

ActiveUsers.acl = { action: 'read', subject: 'activeusers' }

export default ActiveUsers
