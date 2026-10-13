/**
 * The portal's landing screen.
 * -------------------------------------------------------------------------------------
 * What changed, and why:
 *
 *   - Six hardcoded hex colours became four from the palette, assigned by MEANING.
 *     The old tiles were green / orange / blue / purple / amber / teal, which is six
 *     hues saying nothing: a reader cannot learn that purple means family. Now
 *     activity is primary, people are info, anything time-sensitive is warning, and
 *     documents are success - four groups, each repeated, so the colour is
 *     information rather than decoration.
 *   - The tiles had a hardcoded `boxShadow: 0px 4px 12px rgba(0,0,0,0.1)` that
 *     overrode the theme on this one page. Gone; they use the card shadow like
 *     every other card in the portal.
 *   - The whole tile was clickable via onClick on a <div>, so it could not be
 *     reached by keyboard and announced nothing to a screen reader. It is a
 *     CardActionArea now: tab to it, Enter opens it.
 *   - There was no loading state, so every number flashed 0 before the three
 *     requests answered - which reads as "no data" on a slow connection. Skeletons
 *     now, and a tile only shows a number once its request has answered.
 *   - Counts are grouped with Indian digit grouping (1,23,456) via en-IN.
 *
 * ! NOT added: trends, deltas, percentages, sparklines. The three endpoints return
 *   a count for one date range and nothing else, so any "+12% vs last week" on this
 *   screen would be invented. If you want trends, the dashboard-report endpoint has
 *   to return the previous period too, and then they can go in honestly.
 *
 * The data layer below is unchanged: same three endpoints, same separate try blocks
 * so a module that is not deployed cannot blank the tiles that did answer.
 */

import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Popover,
  Skeleton,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { DateRange } from 'react-date-range'
import { format } from 'date-fns'
import { apiGet } from 'src/hooks/axios'

import { baseURL } from 'src/services/pathConst'
import { useRouter } from 'next/router'

// ** Custom Components
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'

const QUICK_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' }
]

const Home = () => {
  const [dashboardData, setDashboardData] = useState({})
  const [reminderCount, setReminderCount] = useState(0)
  const [familyDocumentCount, setFamilyDocumentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const [filType, setFiltype] = useState('today')
  const [dateRange, setDateRange] = useState({
    startdate: '',
    endDate: ''
  })
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
  })
  const router = useRouter()

  const fetchDashboard = async (start_date, end_date) => {
    const params = `start_date=${start_date}&end_date=${end_date}`
    setLoading(true)

    try {
      const res = await apiGet(`${baseURL}function-reports/dashboard-report?${params}`)
      setDashboardData(res?.data || {})
      setAnchorEl(null)
    } catch (err) {
      console.error('Dashboard API Error:', err)
    }

    // Reminder count lives in its own module. Kept in a separate try so a
    // failure here can never blank out the existing dashboard cards.
    try {
      const reminderRes = await apiGet(`${baseURL}reminder-management/summary?${params}`)
      setReminderCount(reminderRes?.data?.detail?.total_reminders || 0)
    } catch (err) {
      console.error('Reminder summary API Error:', err)
      setReminderCount(0)
    }

    // Family Documents, in its own try for the same reason the reminder
    // count has one: a module that is not deployed yet, or an endpoint that
    // fails, must not blank the cards that did answer.
    try {
      const docRes = await apiGet(`${baseURL}family-documents/summary?${params}`)
      setFamilyDocumentCount(docRes?.data?.detail?.total_documents || 0)
    } catch (err) {
      console.error('Family document summary API Error:', err)
      setFamilyDocumentCount(0)
    }

    setLoading(false)
  }

  const applyQuickFilter = type => {
    const today = new Date()
    let start = new Date()
    setFiltype(type)
    if (type === 'today') start = new Date()
    if (type === '7d') start.setDate(today.getDate() - 7)
    if (type === '30d') start.setDate(today.getDate() - 30)

    setSelectionRange({
      startDate: start,
      endDate: today,
      key: 'selection'
    })
    setDateRange({
      startdate: format(start, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    })
    fetchDashboard(format(start, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'))
  }

  const handleDateChange = ranges => {
    const { startDate, endDate } = ranges.selection

    setSelectionRange({
      startDate,
      endDate,
      key: 'selection'
    })
    setDateRange({
      startdate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    })
    fetchDashboard(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'))
  }

  useEffect(() => {
    applyQuickFilter('today')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ** Four colours, assigned by what the number is about - not one per tile.
  const cards = [
    {
      title: 'Functions',
      // ** Explicit, so the query no longer depends on what this card is CALLED.
      type: 'online',
      value: dashboardData?.function_count || 0,
      color: 'primary',
      icon: 'tabler:calendar-event',
      route: '/admin-function-reports'
    },
    {
      title: 'Invite Plus',
      type: 'offline',
      value: dashboardData?.offline_function_count || 0,
      color: 'primary',
      icon: 'tabler:map-pin',
      route: '/admin-function-reports'
    },
    {
      title: 'Users',
      value: dashboardData?.user_count || 0,
      color: 'info',
      icon: 'tabler:users',
      route: `/users-history`
    },
    {
      title: 'Family Plus',
      value: dashboardData?.familyconnection_count || 0,
      color: 'info',
      icon: 'tabler:heart-handshake',
      route: '/user-family'
    },
    {
      title: 'Family Reminders',
      value: reminderCount,
      color: 'warning',
      icon: 'tabler:bell',
      route: '/reminder-management'
    },
    {
      title: 'Family Documents',
      value: familyDocumentCount,
      color: 'success',
      icon: 'tabler:file-text',
      route: '/family-documents'
    }
  ]

  const openCard = card =>
    router.push({
      pathname: card.route,
      query: {
        sd: dateRange.startdate,
        ed: dateRange.endDate,
        // ** Read off the card, not sniffed out of its title. The previous version
        //    matched on title.includes('functions'), so renaming a card silently
        //    dropped the online/offline filter on the way through.
        ...(card.type ? { type: card.type } : {})
      }
    })

  const rangeLabel = `${format(selectionRange.startDate, 'dd MMM yyyy')} - ${format(
    selectionRange.endDate,
    'dd MMM yyyy'
  )}`

  return (
    <Box>
      {/* ------------------------------------------------------------- filter bar */}
      <Card sx={{ mb: 6 }}>
        <Box
          sx={{
            p: 4,
            gap: 3,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='overline' sx={{ display: 'block', color: 'text.disabled' }}>
              Showing
            </Typography>
            <Typography variant='subtitle1' noWrap>
              {rangeLabel}
            </Typography>
          </Box>

          <Stack direction='row' spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            {QUICK_FILTERS.map(f => (
              <Button
                key={f.key}
                size='small'
                variant={filType === f.key ? 'contained' : 'outlined'}
                color={filType === f.key ? 'primary' : 'secondary'}
                onClick={() => applyQuickFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
            <Button
              size='small'
              startIcon={<Icon icon='tabler:calendar' />}
              variant={filType === 'custom' ? 'contained' : 'outlined'}
              color={filType === 'custom' ? 'primary' : 'secondary'}
              onClick={e => {
                setFiltype('custom')
                setAnchorEl(e.currentTarget)
              }}
            >
              Custom range
            </Button>
          </Stack>
        </Box>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <DateRange ranges={[selectionRange]} onChange={handleDateChange} moveRangeOnFirstSelection={false} />
        </Popover>
      </Card>

      {/* ----------------------------------------------------------------- tiles */}
      <Grid container spacing={6}>
        {cards.map(card => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={card.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => openCard(card)}
                sx={{ height: '100%', borderRadius: 'inherit' }}
                aria-label={`${card.title} - open the full list`}
              >
                <CardContent
                  sx={{ gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' noWrap sx={{ color: 'text.secondary' }}>
                      {card.title}
                    </Typography>
                    {loading ? (
                      <Skeleton variant='text' width={72} sx={{ mt: 1, fontSize: '1.5rem' }} />
                    ) : (
                      <Typography variant='h3' sx={{ mt: 1 }}>
                        {Number(card.value || 0).toLocaleString('en-IN')}
                      </Typography>
                    )}
                  </Box>
                  <CustomAvatar skin='light' variant='rounded' color={card.color} sx={{ width: 44, height: 44 }}>
                    <Icon icon={card.icon} fontSize='1.5rem' />
                  </CustomAvatar>
                </CardContent>
                <Divider sx={{ m: '0 !important' }} />
                <Box sx={{ px: 6, py: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    View all
                  </Typography>
                  <Icon icon='tabler:chevron-right' fontSize='0.875rem' />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

Home.acl = {
  action: 'read',
  subject: 'accatee'
}
export default Home
