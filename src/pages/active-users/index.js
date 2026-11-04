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

/** What the table underneath is showing, named the same way the card is. */
const SCOPE_TITLE = {
  last_sweep: 'Active users',
  all: 'Ever active users',
  accounts: 'Accounts',
  devices: 'Total devices',
  active_devices: 'Active devices',
  unreachable: 'Inactive devices'
}

const SCOPE_EMPTY = {
  last_sweep: 'No phone answered the last check',
  all: 'No phone has ever answered a check',
  accounts: 'No accounts are on the active list',
  devices: 'No device tokens are on record',
  active_devices: 'No phone answered the last check',
  unreachable: 'No device is currently unreachable'
}

/** What a device row is saying about itself, and how it should read. */
const DEVICE_STATE = {
  answered: { label: 'Active', color: 'success' },
  unreachable: { label: 'Inactive', color: 'error' },
  'never asked': { label: 'Not checked yet', color: 'default' }
}

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

  /**
   * Which shape the table is in. Mirrors `shapeOf` in the service - the API
   * decides what the rows ARE, this decides how they are drawn, and the two
   * agree on the same six scope names.
   *
   * ! DECLARED HERE, ABOVE EVERYTHING THAT READS IT.
   *   `columns` is a useMemo that branches on this. A const read before its
   *   declaration throws at render, and the User Activity page in this same
   *   portal shipped exactly that once.
   */
  const shape =
    scope === 'accounts'
      ? 'account'
      : ['devices', 'active_devices', 'unreachable'].includes(scope)
        ? 'device'
        : 'person'

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
      // Person and account lists only. A device row carries no account
      // count, and an undefined one rendered as a confident "1".
      ...(shape === 'device'
        ? []
        : [
            {
              accessorKey: 'accounts',
              header: 'Accounts',
              Cell: ({ cell }) => {
                const value = cell.getValue()

                if (!value || value === 1) return <Typography variant='body2'>1</Typography>

                return (
                  <Tooltip
                    title={
                      `This mobile number has ${value} rows in the users table. ` +
                      (shape === 'account'
                        ? 'Each one is listed separately here.'
                        : 'They are shown once, under the signed-up account.')
                    }
                  >
                    <Chip size='small' color='warning' variant='outlined' label={value} />
                  </Tooltip>
                )
              }
            }
          ]),
      // Person-shaped lists only: a device row stands for one phone, so
      // "3 devices" against it would be the owner's total and not this row's.
      ...(shape === 'person'
        ? [
            {
              accessorKey: 'devices',
              header: 'Devices',
              Cell: ({ cell }) => <Typography variant='body2'>{n(cell.getValue())}</Typography>
            },
            {
              accessorKey: 'signed_in_devices',
              header: 'Signed in',
              Cell: ({ cell }) => <Typography variant='body2'>{n(cell.getValue())}</Typography>
            }
          ]
        : []),

      // Device-shaped lists: which phone, and what it last said.
      ...(shape === 'device'
        ? [
            {
              accessorKey: 'device_state',
              header: 'Status',
              Cell: ({ row }) => {
                const state = DEVICE_STATE[row.original.device_state] || {
                  label: row.original.device_state || DASH,
                  color: 'default'
                }

                return (
                  <Tooltip
                    // The Firebase code is the evidence and stays readable,
                    // but it is not what the word on the chip should be.
                    title={row.original.failure_reason || ''}
                    disableHoverListener={!row.original.failure_reason}
                  >
                    <Chip size='small' variant='outlined' color={state.color} label={state.label} />
                  </Tooltip>
                )
              }
            },
            {
              accessorKey: 'failure_reason',
              header: 'Why',
              Cell: ({ cell }) => {
                const code = cell.getValue()

                if (!code) return <Typography variant='body2'>{DASH}</Typography>

                return (
                  <Tooltip title={code}>
                    <Typography variant='body2'>{REASONS[code] || code}</Typography>
                  </Tooltip>
                )
              }
            },
            {
              accessorKey: 'device_id',
              header: 'Device',
              Cell: ({ cell }) => (
                <Tooltip title={cell.getValue() || ''}>
                  <Typography
                    variant='body2'
                    sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {cell.getValue() || DASH}
                  </Typography>
                </Tooltip>
              )
            },
            {
              accessorKey: 'signed_out',
              header: 'Signed in',
              Cell: ({ cell }) => (
                <Typography variant='body2'>{cell.getValue() ? 'No' : 'Yes'}</Typography>
              )
            }
          ]
        : []),

      {
        accessorKey: 'last_active_ist',
        // A device that has never answered has nothing to put here, and a
        // blank is the honest version of that.
        header: shape === 'device' ? 'Last answered (IST)' : 'Last answered (IST)',
        Cell: ({ cell }) => (
          <Typography variant='body2' sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {cell.getValue() || DASH}
          </Typography>
        )
      }
    ],
    [shape]
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
   * ! COUNTING PEOPLE AND COUNTING PHONES ARE DIFFERENT QUESTIONS.
   *   They used to sit in one row of five, captioned "the first two count
   *   people; the rest count rows and devices" - which is a sentence asking
   *   the reader to remember which card is which. Two labelled groups say it
   *   without being read.
   *
   * ! EVERY CARD IS A BUTTON, AND ITS `scope` IS THE LIST BEHIND IT.
   *   The figure and the list come from one name end to end - the card, this
   *   scope, the API's whitelist, one query in the service. A card reading
   *   5,140 cannot open a list of anything else, because there is nowhere
   *   for the two to be defined separately.
   */
  const groups = [
    {
      group: 'People',
      cards: [
        {
          scope: 'last_sweep',
          label: 'Active users',
          value: summary?.reachable_last_sweep,
          hint: 'People whose phone answered the most recent check.'
        },
        {
          scope: 'all',
          label: 'Ever active users',
          value: summary?.reachable_ever,
          hint: 'People whose phone has answered any check we have run.'
        },
        {
          scope: 'accounts',
          label: 'Accounts',
          value: summary?.active_accounts,
          hint:
            'Rows in the users table behind those people, before duplicate ' +
            'mobile numbers are merged. The gap between this and the figure ' +
            'to its left is the duplication. Click to see which ones.'
        }
      ]
    },
    {
      group: 'Devices',
      cards: [
        {
          scope: 'devices',
          label: 'Total devices',
          value: summary?.tokens,
          hint:
            'Every phone we hold a token for - the app was installed on it at ' +
            'some point. This is what the next check asks.'
        },
        {
          scope: 'active_devices',
          label: 'Active devices',
          value: summary?.active_devices_last_sweep,
          hint:
            'Phones that answered the most recent check, so the app is still ' +
            'installed. Recorded per device only from the next check onward, ' +
            'so this reads 0 until one has been run.'
        },
        {
          scope: 'unreachable',
          label: 'Inactive devices',
          value: summary?.unreachable_devices,
          hint:
            'Phones that failed the last check they were in and have not ' +
            'answered since - the app was most likely removed. A reinstall ' +
            'clears a device from this count.'
        }
      ]
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
                Measured by asking the phones, not guessed from app usage. Click any figure
                to see the list behind it.
              </Typography>

              {groups.map((section) => (
                <Box key={section.group} sx={{ mb: 4, '&:last-of-type': { mb: 0 } }}>
                  <Typography
                    variant='caption'
                    sx={{ display: 'block', mb: 2, fontWeight: 600, letterSpacing: 0.4 }}
                    color='text.secondary'
                  >
                    {section.group.toUpperCase()}
                  </Typography>

                  <Grid2 container spacing={3}>
                    {section.cards.map((card) => {
                      const selected = scope === card.scope

                      return (
                        <Grid2 key={card.scope} size={{ xs: 12, sm: 4 }}>
                          <Tooltip title={card.hint}>
                            {/* A real button, so it is reachable by keyboard
                                and reads as clickable to a screen reader.
                                A clickable Box is neither. */}
                            <Box
                              component='button'
                              type='button'
                              onClick={() => {
                                setScope(card.scope)
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                              }}
                              sx={{
                                width: '100%',
                                height: '100%',
                                p: 3,
                                cursor: 'pointer',
                                font: 'inherit',
                                borderRadius: 1,
                                textAlign: 'center',
                                bgcolor: selected
                                  ? 'primary.lighterOpacity'
                                  : 'customColors.surfaceSunken',
                                border: (theme) =>
                                  `1px solid ${
                                    selected ? theme.palette.primary.main : 'transparent'
                                  }`,
                                transition: 'border-color .15s, background-color .15s',
                                '&:hover': { borderColor: 'primary.main' }
                              }}
                            >
                              <Typography
                                variant='h5'
                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                                color={selected ? 'primary.main' : 'text.primary'}
                              >
                                {n(card.value)}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {card.label}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Grid2>
                      )
                    })}
                  </Grid2>
                </Box>
              ))}
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
              {/* The Last check / Everyone ever toggle used to live here. It
                  is gone: it switched between two of the six lists while the
                  other four had no way in, and with the cards selecting the
                  list it was a second control for the same state. */}
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {SCOPE_TITLE[scope] || 'Active users'}
                <Typography component='span' variant='body2' color='text.secondary'>
                  {' '}· {n(count)}
                </Typography>
              </Typography>

              <Box sx={{ flex: 1, minWidth: 120 }} />

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
                title={search ? 'Nothing matches that search' : SCOPE_EMPTY[scope] || 'Nothing here yet'}
                subtitle={
                  search
                    ? 'Clear the search to see everything in this list.'
                    : scope === 'active_devices'
                      ? 'Devices are recorded individually only from the next check onward. Press "Check who is active".'
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
