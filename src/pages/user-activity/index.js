import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Grid2,
  Card,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Button,
  Chip,
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material'

// ** Iconify's Icon, not @mui/material's: only this one has an `icon` prop.
import Icon from 'src/@core/components/icon'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'

import { apiGet } from 'src/hooks/axios'
import {
  userActivityList,
  userActivitySummary,
  userActivityTimeline,
  userActivitySession,
  userActivityExport,
  userActivityUserBase
} from 'src/services/pathConst'

import { PageToolbar, EmptyState } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * What every mobile user did, and when.
 *
 * Rows are written by the phones (IDS_backend/api/activity) and read here
 * through admin-nodejs /api/user-activity. Nothing on this page writes.
 *
 * ! EVERY REQUEST CARRIES A DATE RANGE. `user_activity` is partitioned by
 *   month; an unbounded query reads every month the product has ever recorded.
 *   The API refuses a range wider than 92 days, so the pickers default to the
 *   last 7 and the error is surfaced rather than swallowed.
 */

const EVENT_TYPES = [
  { value: 'screen_enter', label: 'Screen opened' },
  { value: 'screen_exit', label: 'Screen left' },
  { value: 'action', label: 'Button tapped' },
  { value: 'session_start', label: 'Session started' },
  { value: 'session_end', label: 'Session ended' },
  { value: 'auth', label: 'Login / logout' }
]

const EVENT_COLOUR = {
  screen_enter: 'primary',
  screen_exit: 'default',
  action: 'success',
  session_start: 'info',
  session_end: 'info',
  auth: 'warning'
}

/** YYYY-MM-DD, which is what <input type="date"> speaks. */
const isoDay = date => date.toISOString().slice(0, 10)

const daysAgo = n => {
  const d = new Date()
  d.setDate(d.getDate() - n)

  return isoDay(d)
}

/**
 * `host_details` -> `Host details`.
 *
 * Deliberately derived rather than copied: the real registry of screen names
 * lives in the Flutter app (lib/core/analytics/screen_registry.dart), and a
 * second copy here would drift the first time a screen is renamed. A key is
 * readable enough on its own, and an `unmapped:` key stays visibly unmapped,
 * which is the point of that marker.
 */
const prettyKey = key => {
  if (!key) return '—'
  if (key.startsWith('unmapped:')) return key

  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

/** How many of a person's events the history panel pulls at once. */
const HISTORY_LIMIT = 200

/**
 * How each tap reads in a person's history.
 *
 * Deliberately a lookup with a fallback, not a rule. `home.tile_my_guest`
 * prettifies to "tile my guest", which is not a sentence; "tapped My Guest"
 * is. A key missing from this map still renders - it just reads more like a
 * key - so adding a tap to the app can never blank a line here.
 */
const ACTION_PHRASES = {
  'function.view': 'opened an invitation',
  'home.open_event': 'opened an invitation from the home feed',
  'home.tile_reminders': 'opened reminders',
  'home.open_notifications': 'opened notifications',
  'home.open_reminder_card': 'opened a reminder',
  'profile.open_profile_form': 'opened their profile',
  'home.tile_invite_plus': 'tapped Invite Plus',
  'home.open_event_list': 'opened the event list',
  'home.tile_my_guest': 'tapped My Guest',
  'home.tile_family_plus': 'tapped Family Plus',
  'home.tile_choghadiya': 'tapped Choghadiya',
  'nav.home': 'switched to Home',
  'nav.inbox': 'switched to Inbox',
  'nav.menu': 'switched to Menu',
  'nav.unknown': 'switched to another tab',
  'share.invite_add': 'shared the invitation with a family member',
  'share.invite_remove': 'stopped sharing the invitation with a family member',
  'share.app_invite': 'invited someone to the app on WhatsApp'
}

const actionPhrase = key => {
  if (!key) return 'tapped something'
  if (ACTION_PHRASES[key]) return ACTION_PHRASES[key]

  const thing = key.includes('.') ? key.slice(key.indexOf('.') + 1) : key

  return `tapped ${thing.replace(/_/g, ' ')}`
}

/**
 * One row of the log as a sentence.
 *
 * `screen_key` and `action_key` are what the database stores; nobody reads a
 * history in those terms. The name is not repeated on every line - it is in
 * the panel's heading - so these read as a continuation of it.
 */
const sentence = event => {
  const screen = prettyKey(event.screen_key)
  const fn = event.target_function ? ` — ${event.target_function}` : ''

  switch (event.event_type) {
    case 'session_start':
      return 'opened the app'
    case 'session_end':
      return event.duration ? `left the app after ${event.duration}` : 'left the app'
    case 'auth':
      if (event.action_key === 'login') return 'logged in'
      if (event.action_key === 'logout') return 'logged out'
      if (event.action_key === 'signup') return 'created an account'

      return event.action_key || 'authenticated'
    case 'screen_enter':
      return `opened ${screen}`
    case 'screen_exit':
      return event.duration ? `spent ${event.duration} on ${screen}` : `left ${screen}`
    case 'action':
      return `${actionPhrase(event.action_key)}${fn}`
    default:
      return event.action_key || screen
  }
}

const UserActivity = () => {
  const [filters, setFilters] = useState({
    from: daysAgo(6),
    to: daysAgo(0),
    mobile: '',
    screen_key: '',
    action_key: '',
    event_type: '',
    platform: '',
    app_version: '',
    search: '',
    category: ''
  })

  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [options, setOptions] = useState({
    screens: [],
    actions: [],
    app_versions: [],
    // The chips come from the API rather than a list kept here, so one of them
    // can never be offered that the API would reject.
    categories: [],
    // Likewise the user-base cards: key, label and the hover definition. The
    // figures arrive separately in summary.user_base, keyed by the same keys.
    segments: []
  })
  const [notReady, setNotReady] = useState(false)
  const [tab, setTab] = useState('feed')
  const [exporting, setExporting] = useState(false)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  // The drill-down behind a user-base card: who is actually in that figure.
  // Its own pagination, so switching tabs does not fight with the feed's.
  const [baseSegment, setBaseSegment] = useState('total')
  const [baseRows, setBaseRows] = useState([])
  const [baseCount, setBaseCount] = useState(0)
  const [baseLoading, setBaseLoading] = useState(false)
  const [baseSearch, setBaseSearch] = useState('')
  const [basePagination, setBasePagination] = useState({ pageIndex: 0, pageSize: 25 })

  // The right-hand drawer: one user's sessions, and one session's events.
  const [timeline, setTimeline] = useState(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [openSession, setOpenSession] = useState(null)
  const [sessionEvents, setSessionEvents] = useState([])

  // The flat "all activity" list for one person.
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)

  /** Only the filters that are set — an empty string is not a filter. */
  const queryString = useCallback(
    extra => {
      const params = new URLSearchParams()

      Object.entries({ ...filters, ...(extra || {}) }).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value)
        }
      })

      return params.toString()
    },
    [filters]
  )

  const message = error =>
    error?.response?.data?.message || error?.message || 'Something went wrong'

  const loadFeed = useCallback(async () => {
    setLoading(true)

    try {
      const response = await apiGet(
        `${userActivityList}?${queryString({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        })}`
      )

      const body = response?.data || {}

      setNotReady(body.ready === false)
      setRows(body.data || [])
      setCount(body.count || 0)
    } catch (error) {
      toast.error(message(error))
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [queryString, pagination.pageIndex, pagination.pageSize])

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiGet(`${userActivitySummary}?${queryString()}`)
      const body = response?.data || {}

      setNotReady(body.ready === false)
      setSummary(body)

      if (body.options) setOptions(body.options)
    } catch (error) {
      toast.error(message(error))
      setSummary(null)
    }
  }, [queryString])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const setFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }))

    // Any filter change invalidates the page number; staying on page 6 of a
    // narrower result shows an empty table and looks like a bug.
    setPagination(current => ({ ...current, pageIndex: 0 }))
  }

  const clearFilters = () =>
    setFilters(current => ({
      from: current.from,
      to: current.to,
      mobile: '',
      screen_key: '',
      action_key: '',
      event_type: '',
      platform: '',
      app_version: '',
      search: '',
      // Clear resets the chip row too, or "Clear" would leave the table
      // filtered by a chip that is still highlighted and still in force.
      category: ''
    }))

  /** The chips under the toolbar — one per filter actually in force. */
  const activeChips = useMemo(() => {
    const labels = {
      mobile: 'Mobile',
      screen_key: 'Screen',
      action_key: 'Action',
      event_type: 'Event',
      platform: 'Platform',
      app_version: 'Version',
      search: 'Search'
    }

    return Object.keys(labels)
      .filter(key => filters[key])
      .map(key => ({
        label: `${labels[key]}: ${filters[key]}`,
        onDelete: () => setFilter(key, '')
      }))
  }, [filters])

  /**
   * Everything one person did, in the chosen dates.
   *
   * Deliberately sends only user_id and the date range - not the chip, not the
   * screen or action filters. "All activity" has to mean all of it, or the
   * panel would quietly show a filtered slice of a person's history under a
   * heading that says otherwise.
   */
  const loadHistory = async userId => {
    setHistoryLoading(true)

    try {
      const response = await apiGet(
        `${userActivityList}?user_id=${userId}&from=${filters.from}&to=${filters.to}` +
          `&limit=${HISTORY_LIMIT}&page=1`
      )

      setHistory(response?.data?.data || [])
    } catch (error) {
      toast.error(message(error))
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  /**
   * Who is in one card's figure.
   *
   * Sends the segment, the page and a search term — and nothing else. The
   * dates and the chip are deliberately absent: the figure being opened is not
   * filtered by them, so a list that was would answer a different question
   * from the card that opened it.
   */
  const loadUserBase = useCallback(async () => {
    if (tab !== 'base') return

    setBaseLoading(true)

    try {
      const params = new URLSearchParams({
        segment: baseSegment,
        page: basePagination.pageIndex + 1,
        limit: basePagination.pageSize
      })

      if (baseSearch) params.append('search', baseSearch)

      const response = await apiGet(`${userActivityUserBase}?${params.toString()}`)
      const body = response?.data || {}

      setBaseRows(body.data || [])
      setBaseCount(body.count || 0)
    } catch (error) {
      toast.error(message(error))
      setBaseRows([])
      setBaseCount(0)
    } finally {
      setBaseLoading(false)
    }
  }, [tab, baseSegment, baseSearch, basePagination.pageIndex, basePagination.pageSize])

  // Below loadUserBase, not up with the other two effects. loadUserBase is a
  // const, so an effect declared above it reads it inside its temporal dead
  // zone and the page throws on first render before drawing anything.
  useEffect(() => {
    loadUserBase()
  }, [loadUserBase])

  const openTimeline = async user => {
    if (!user?.user_id) return

    setTimeline({ user: { id: user.user_id, name: user.user_name, mobile: user.user_mobile }, sessions: [] })
    setOpenSession(null)
    setSessionEvents([])
    setHistory([])
    setTimelineLoading(true)

    // Fired alongside the timeline rather than after it: the two are
    // independent requests and the panel shows both.
    loadHistory(user.user_id)

    try {
      const response = await apiGet(
        `${userActivityTimeline}?user_id=${user.user_id}&from=${filters.from}&to=${filters.to}`
      )

      setTimeline(response?.data || null)
    } catch (error) {
      toast.error(message(error))
      setTimeline(null)
    } finally {
      setTimelineLoading(false)
    }
  }

  const openSessionEvents = async sessionId => {
    setOpenSession(sessionId)
    setSessionLoading(true)

    try {
      const response = await apiGet(`${userActivitySession}?session_id=${sessionId}`)

      setSessionEvents(response?.data?.events || [])
    } catch (error) {
      toast.error(message(error))
      setSessionEvents([])
    } finally {
      setSessionLoading(false)
    }
  }

  const exportXlsx = async () => {
    setExporting(true)

    try {
      const response = await apiGet(`${userActivityExport}?${queryString()}`)
      const body = response?.data || {}

      if (!body.data) throw new Error('The export came back empty.')

      // Base64 -> Blob, the same way the other reports in this portal do it.
      const binary = atob(body.data)
      const bytes = new Uint8Array(binary.length)

      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)

      const url = URL.createObjectURL(
        new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      )

      const link = document.createElement('a')

      link.href = url
      link.download = body.file_name || 'user-activity.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${body.count} events`)
    } catch (error) {
      // The API refuses an export over 20,000 rows and says why; that message
      // is the useful one, so it is shown rather than a generic failure.
      toast.error(message(error))
    } finally {
      setExporting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'occurred_at_ist',
        header: 'Time (IST)',
        size: 170,
        Cell: ({ cell }) => (
          <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
            {cell.getValue() || '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'user_name',
        header: 'User',
        size: 190,
        Cell: ({ row }) => (
          <Box
            onClick={() => openTimeline(row.original)}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              {row.original.user_name || 'Unknown'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.user_mobile || '—'}
            </Typography>
          </Box>
        )
      },
      {
        id: 'all_activity',
        header: '',
        size: 130,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) =>
          row.original.user_id ? (
            <Button
              size='small'
              variant='outlined'
              onClick={() => openTimeline(row.original)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              All activity
            </Button>
          ) : (
            // Pre-login events have no user yet, so there is no history to
            // open. A disabled-looking button would be worse than none.
            <Typography variant='caption' color='text.secondary'>
              —
            </Typography>
          )
      },
      {
        accessorKey: 'event_type',
        header: 'Event',
        size: 140,
        Cell: ({ cell }) => (
          <Chip
            size='small'
            label={
              (EVENT_TYPES.find(t => t.value === cell.getValue()) || {}).label ||
              cell.getValue()
            }
            color={EVENT_COLOUR[cell.getValue()] || 'default'}
            variant='outlined'
          />
        )
      },
      {
        accessorKey: 'screen_key',
        header: 'Screen',
        size: 170,
        Cell: ({ cell }) => prettyKey(cell.getValue())
      },
      {
        accessorKey: 'action_key',
        header: 'Action',
        size: 180,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'target_function',
        header: 'Function',
        size: 200,
        // Only function views carry one; everything else leaves it blank
        // rather than guessing.
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'duration',
        header: 'Time on screen',
        size: 130,
        Cell: ({ row }) =>
          row.original.duration ? (
            <Tooltip title={`${row.original.duration_ms} ms`}>
              <span>{row.original.duration}</span>
            </Tooltip>
          ) : (
            '—'
          )
      },
      {
        accessorKey: 'exit_reason',
        header: 'Left by',
        size: 120,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'platform',
        header: 'Platform',
        size: 110,
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>{row.original.platform || '—'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.app_version || ''}
            </Typography>
          </Box>
        )
      }
    ],
    // openTimeline closes over `filters`, so the columns are rebuilt when the
    // date range moves. Without this the drawer would query last week's range
    // after the picker had moved on.
    [filters]
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

  const screenColumns = useMemo(
    () => [
      { accessorKey: 'screen_key', header: 'Screen', size: 220, Cell: ({ cell }) => prettyKey(cell.getValue()) },
      { accessorKey: 'visits', header: 'Visits', size: 100 },
      { accessorKey: 'users', header: 'Users', size: 100 },
      { accessorKey: 'sessions', header: 'Sessions', size: 110 },
      { accessorKey: 'median', header: 'Median time', size: 130, Cell: ({ cell }) => cell.getValue() || '—' },
      { accessorKey: 'total', header: 'Total time', size: 130, Cell: ({ cell }) => cell.getValue() || '—' }
    ],
    []
  )

  const screenTable = useMaterialReactTable({
    ...tableDefaults,
    columns: screenColumns,
    data: summary?.screens || [],
    enableColumnFilters: false,
    enableGlobalFilter: false,
    state: { isLoading: loading }
  })

  // Which functions were opened, and by how many different people.
  //
  // Driven by the `function.view` the function detail screen records with the
  // function's id - not by screen_key, which only says that SOME invitation
  // was opened.
  const functionColumns = useMemo(
    () => [
      {
        accessorKey: 'function_name',
        header: 'Function',
        size: 300,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      { accessorKey: 'views', header: 'Views', size: 110 },
      { accessorKey: 'viewers', header: 'People', size: 110 },
      {
        accessorKey: 'last_viewed_ist',
        header: 'Last opened (IST)',
        size: 190,
        Cell: ({ cell }) => cell.getValue() || '—'
      }
    ],
    []
  )

  const functionTable = useMaterialReactTable({
    ...tableDefaults,
    columns: functionColumns,
    data: summary?.functions || [],
    enableColumnFilters: false,
    enableGlobalFilter: false,
    state: { isLoading: loading }
  })

  // The people behind one user-base card.
  const baseColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 220,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        size: 160,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'created_at_ist',
        header: 'Signed up (IST)',
        size: 180,
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'last_active_ist',
        header: 'Last active (IST)',
        size: 180,
        // Blank for anybody with nothing in the 90 days the activity log keeps
        // - which is everybody who was only ever invited.
        Cell: ({ cell }) => cell.getValue() || '—'
      },
      {
        accessorKey: 'app_version',
        header: 'App version',
        size: 150,
        Cell: ({ row }) =>
          row.original.app_version
            ? `${row.original.app_version}${
                row.original.platform ? ` · ${row.original.platform}` : ''
              }`
            : '—'
      }
    ],
    []
  )

  const baseTable = useMaterialReactTable({
    ...tableDefaults,
    columns: baseColumns,
    data: baseRows,
    rowCount: baseCount,
    manualPagination: true,
    onPaginationChange: setBasePagination,
    enableSorting: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    state: { pagination: basePagination, isLoading: baseLoading },
    muiTableBodyRowProps: { hover: true }
  })

  const cards = [
    { label: 'Events', value: summary?.totals?.events },
    { label: 'Users', value: summary?.totals?.users },
    { label: 'Sessions', value: summary?.totals?.sessions },
    { label: 'Screen views', value: summary?.totals?.screen_views },
    { label: 'Taps', value: summary?.totals?.taps }
  ]

  /**
   * The head-count, which does NOT follow the dates or the chip.
   *
   * Rendered above the filters and captioned as such, because the five cards
   * below it DO follow them. Two rows of numbers that look alike but answer
   * differently to the same controls is the one thing this screen must not do -
   * "Total users" that falls when you click Logins would be read as churn.
   *
   * The labels and the hover definitions come from the API, with the figures,
   * so a card, its definition and the heading over the list it opens cannot
   * drift apart. See admin-nodejs/src/user-activity/user-base.js.
   */
  const base = summary?.user_base

  const baseCards = (options.segments || []).map(segment => ({
    ...segment,
    value: base ? base[segment.key] : undefined,
    // null means the table that figure needs does not exist in this
    // environment. There is nobody to list, so the card does not pretend to be
    // a button.
    clickable: base ? base[segment.key] !== null && base[segment.key] !== undefined : false
  }))

  const segmentOf = key => (options.segments || []).find(s => s.key === key) || null

  const openSegment = key => {
    setBaseSegment(key)
    // A search left over from the last card would silently shrink this one.
    setBaseSearch('')
    setBasePagination(p => ({ ...p, pageIndex: 0 }))
    setTab('base')
  }

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card>
            <PageToolbar
              title='User Activity'
              count={count}
              filters={activeChips}
              actions={
                <Stack direction='row' spacing={2}>
                  {activeChips.length ? (
                    <Button size='small' onClick={clearFilters} startIcon={<Icon icon='tabler:x' />}>
                      Clear
                    </Button>
                  ) : null}
                  <Button
                    size='small'
                    variant='outlined'
                    disabled={exporting || notReady}
                    onClick={exportXlsx}
                    startIcon={
                      exporting ? <CircularProgress size={16} /> : <Icon icon='tabler:download' />
                    }
                  >
                    Export
                  </Button>
                </Stack>
              }
            />

            <Divider sx={{ m: '0 !important' }} />

            <CardContent>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mb: 3 }}
              >
                User base — a running total. Not affected by the dates or the
                filters below.
              </Typography>

              <Grid2 container spacing={3}>
                {baseCards.map(card => (
                  <Grid2 key={card.key} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Tooltip
                      title={card.clickable ? `${card.hint} Click to see who.` : card.hint}
                      placement='top'
                      arrow
                    >
                      <Box
                        onClick={card.clickable ? () => openSegment(card.key) : undefined}
                        sx={{
                          p: 3,
                          borderRadius: 1,
                          bgcolor: 'customColors.surfaceSunken',
                          textAlign: 'center',
                          cursor: card.clickable ? 'pointer' : 'help',
                          ...(card.clickable && {
                            '&:hover': { bgcolor: 'action.hover' }
                          })
                        }}
                      >
                        <Typography variant='h5'>
                          {card.value === undefined || card.value === null
                            ? '—'
                            : Number(card.value).toLocaleString('en-IN')}
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

            <Divider sx={{ m: '0 !important' }} />

            {options.categories.length > 0 && (
              <>
                <Box
                  sx={{
                    px: 4,
                    py: 3,
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    // One scrolling row, like the bullion dashboard. Wrapping
                    // instead would push the table below the fold on a laptop.
                    flexWrap: 'nowrap'
                  }}
                >
                  {options.categories.map(category => {
                    const active =
                      filters.category === category.key ||
                      (!filters.category && category.key === 'everything')

                    return (
                      <Chip
                        key={category.key}
                        label={category.label}
                        clickable
                        color={active ? 'primary' : 'default'}
                        variant={active ? 'filled' : 'outlined'}
                        onClick={() =>
                          setFilter(
                            'category',
                            category.key === 'everything' ? '' : category.key
                          )
                        }
                        sx={{ flexShrink: 0 }}
                      />
                    )
                  })}
                </Box>
                <Divider sx={{ m: '0 !important' }} />
              </>
            )}

            <CardContent>
              <Grid2 container spacing={3}>
                <Grid2 size={{ xs: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    size='small'
                    type='date'
                    label='From'
                    value={filters.from}
                    slotProps={{ inputLabel: { shrink: true } }}
                    onChange={e => setFilter('from', e.target.value)}
                  />
                </Grid2>
                <Grid2 size={{ xs: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    size='small'
                    type='date'
                    label='To'
                    value={filters.to}
                    slotProps={{ inputLabel: { shrink: true } }}
                    onChange={e => setFilter('to', e.target.value)}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label='Mobile'
                    placeholder='8072739569'
                    value={filters.mobile}
                    onChange={e => setFilter('mobile', e.target.value)}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Event'
                    value={filters.event_type}
                    onChange={e => setFilter('event_type', e.target.value)}
                  >
                    <MenuItem value=''>All events</MenuItem>
                    {EVENT_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Screen'
                    value={filters.screen_key}
                    onChange={e => setFilter('screen_key', e.target.value)}
                  >
                    <MenuItem value=''>All screens</MenuItem>
                    {options.screens.map(key => (
                      <MenuItem key={key} value={key}>
                        {prettyKey(key)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Action'
                    value={filters.action_key}
                    onChange={e => setFilter('action_key', e.target.value)}
                  >
                    <MenuItem value=''>All actions</MenuItem>
                    {options.actions.map(key => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Platform'
                    value={filters.platform}
                    onChange={e => setFilter('platform', e.target.value)}
                  >
                    <MenuItem value=''>Both</MenuItem>
                    <MenuItem value='android'>Android</MenuItem>
                    <MenuItem value='ios'>iOS</MenuItem>
                  </TextField>
                </Grid2>
                <Grid2 size={{ xs: 12, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='App version'
                    value={filters.app_version}
                    onChange={e => setFilter('app_version', e.target.value)}
                  >
                    <MenuItem value=''>All versions</MenuItem>
                    {options.app_versions.map(key => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid2>
              </Grid2>
            </CardContent>

            <Divider sx={{ m: '0 !important' }} />

            <CardContent>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mb: 3 }}
              >
                In the dates and filters selected above.
              </Typography>

              <Grid2 container spacing={3}>
                {cards.map(card => (
                  <Grid2 key={card.label} size={{ xs: 6, md: 2.4 }}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 1,
                        bgcolor: 'customColors.surfaceSunken',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant='h5'>
                        {card.value === undefined || card.value === null
                          ? '—'
                          : Number(card.value).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {card.label}
                      </Typography>
                    </Box>
                  </Grid2>
                ))}
              </Grid2>
            </CardContent>

            <Divider sx={{ m: '0 !important' }} />

            <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ px: 4 }}>
              <Tab value='feed' label='Activity feed' />
              <Tab value='screens' label='By screen' />
              <Tab value='functions' label='Functions viewed' />
              <Tab value='base' label='Users' />
            </Tabs>

            <Divider sx={{ m: '0 !important' }} />

            {/*
              The Users tab is checked BEFORE notReady on purpose. Users come
              from the `users` table, which is there whether or not the app
              backend has ever created the activity log here - so this list
              still works on an environment where the feed cannot.
            */}
            {tab === 'base' ? (
              <>
                <Box
                  sx={{
                    px: 4,
                    pt: 4,
                    display: 'flex',
                    gap: 3,
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Typography variant='subtitle2'>
                      {segmentOf(baseSegment)?.label || 'Users'} —{' '}
                      {baseCount.toLocaleString('en-IN')}{' '}
                      {baseCount === 1 ? 'person' : 'people'}
                      {baseSearch ? ' matching' : ''}
                    </Typography>
                    {/*
                      The card's own definition, repeated over its list. The
                      figure and the list are the same question, and this is
                      where somebody checks that.
                    */}
                    <Typography variant='caption' color='text.secondary'>
                      {segmentOf(baseSegment)?.hint || ''}
                    </Typography>
                  </Box>
                  <TextField
                    size='small'
                    label='Search name or mobile'
                    value={baseSearch}
                    onChange={event => {
                      setBaseSearch(event.target.value)
                      setBasePagination(p => ({ ...p, pageIndex: 0 }))
                    }}
                    sx={{ minWidth: 240 }}
                  />
                </Box>

                {baseRows.length === 0 && !baseLoading ? (
                  <EmptyState
                    title={baseSearch ? 'Nobody matches that search' : 'Nobody in this group'}
                    subtitle={
                      baseSearch
                        ? 'Clear the search to see everyone in this group.'
                        : 'Pick another card above.'
                    }
                  />
                ) : (
                  <MaterialReactTable table={baseTable} />
                )}
              </>
            ) : notReady ? (
              <EmptyState
                title='No activity recorded yet'
                subtitle='The app backend has not created the activity table in this environment.'
              />
            ) : tab === 'feed' ? (
              rows.length === 0 && !loading ? (
                <EmptyState
                  title='Nothing in this range'
                  subtitle='Widen the dates, or clear a filter.'
                />
              ) : (
                <MaterialReactTable table={table} />
              )
            ) : tab === 'screens' ? (
              <MaterialReactTable table={screenTable} />
            ) : (summary?.functions || []).length === 0 ? (
              <EmptyState
                title='No function was opened in this range'
                subtitle='A function view is recorded when someone opens an invitation in the app.'
              />
            ) : (
              <MaterialReactTable table={functionTable} />
            )}
          </Card>
        </Grid2>
      </Grid2>

      <Drawer
        anchor='right'
        open={Boolean(timeline)}
        onClose={() => setTimeline(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', md: 640 } } } }}
      >
        <Box sx={{ p: 5 }}>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Box>
              <Typography variant='h6'>{timeline?.user?.name || 'User'}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {timeline?.user?.mobile || '—'}
              </Typography>
            </Box>
            <IconButton onClick={() => setTimeline(null)}>
              <Icon icon='tabler:x' />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Typography variant='caption' color='text.secondary'>
            {historyLoading
              ? 'Loading…'
              : `${history.length}${
                  history.length === HISTORY_LIMIT ? '+' : ''
                } things recorded · ${filters.from} to ${filters.to}`}
          </Typography>

          {history.length === HISTORY_LIMIT ? (
            <Typography variant='caption' color='text.secondary' display='block'>
              Showing the most recent {HISTORY_LIMIT}. Narrow the dates to see
              further back.
            </Typography>
          ) : null}

          <Box sx={{ mt: 3 }}>
            {historyLoading ? (
              <Stack alignItems='center' sx={{ py: 6 }}>
                <CircularProgress size={22} />
              </Stack>
            ) : history.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Nothing recorded for this person in the chosen dates.
              </Typography>
            ) : (
              history.map(event => (
                <Stack
                  key={event.id}
                  direction='row'
                  spacing={3}
                  sx={{
                    py: 1.5,
                    borderBottom: theme => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ minWidth: 118, whiteSpace: 'nowrap' }}
                  >
                    {event.occurred_at_ist || '—'}
                  </Typography>
                  <Typography variant='body2' sx={{ flex: 1 }}>
                    {sentence(event)}
                  </Typography>
                </Stack>
              ))
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant='subtitle2' sx={{ mb: 2 }}>
            By session
          </Typography>

          {timelineLoading ? (
            <Stack alignItems='center' sx={{ py: 10 }}>
              <CircularProgress />
            </Stack>
          ) : (timeline?.sessions || []).length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No sessions for this user in the chosen dates.
            </Typography>
          ) : (
            (timeline?.sessions || []).map(session => (
              <Card key={session.session_id} variant='outlined' sx={{ mb: 3 }}>
                <CardContent>
                  <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    sx={{ cursor: 'pointer' }}
                    onClick={() =>
                      openSessionEvents(
                        openSession === session.session_id ? null : session.session_id
                      )
                    }
                  >
                    <Box>
                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                        {session.started_ist} &rarr; {session.ended_ist}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {session.span} · {session.screens} screens · {session.taps} taps ·{' '}
                        {session.platform} {session.app_version}
                      </Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      {session.ended_in_logout ? (
                        <Chip size='small' label='Logged out' color='warning' variant='outlined' />
                      ) : null}
                      <Icon
                        icon={
                          openSession === session.session_id
                            ? 'tabler:chevron-up'
                            : 'tabler:chevron-down'
                        }
                      />
                    </Stack>
                  </Stack>

                  {openSession === session.session_id ? (
                    <>
                      <Divider sx={{ my: 3 }} />
                      {sessionLoading ? (
                        <Stack alignItems='center' sx={{ py: 4 }}>
                          <CircularProgress size={20} />
                        </Stack>
                      ) : (
                        sessionEvents.map(event => (
                          <Stack
                            key={event.id}
                            direction='row'
                            spacing={3}
                            sx={{ py: 1.5, borderBottom: theme => `1px solid ${theme.palette.divider}` }}
                          >
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ minWidth: 70, whiteSpace: 'nowrap' }}
                            >
                              {(event.occurred_at_ist || '').slice(11)}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='body2'>
                                {event.action_key
                                  ? event.action_key
                                  : prettyKey(event.screen_key)}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {(EVENT_TYPES.find(t => t.value === event.event_type) || {})
                                  .label || event.event_type}
                                {event.duration ? ` · ${event.duration}` : ''}
                                {event.exit_reason ? ` · ${event.exit_reason}` : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        ))
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Drawer>
    </>
  )
}

UserActivity.acl = {
  action: 'manage',
  subject: 'useractivity'
}

export default UserActivity
