import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  IconButton,
  Popover,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { DateRange } from 'react-date-range'
import { format } from 'date-fns'
import { useRouter } from 'next/router'

import { apiGet } from 'src/hooks/axios'
import {
  reminderSummaryUrl,
  reminderListUrl,
  reminderUserListUrl
} from 'src/services/pathConst'
import ReminderDetailDrawer from './Components/ReminderDetailDrawer'
import UserReminderDrawer from './Components/UserReminderDrawer'
import CreateReminderDrawer from './Components/CreateReminderDrawer'
import { PRIORITY_COLOR, formatDateTime } from 'src/utils/reminderUtils'
import { convertBase64Blob } from 'src/utils/blobconverter'
import { reminderExportUrl } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import Icon from 'src/@core/components/icon'

const ReminderManagement = () => {
  const router = useRouter()

  const [tab, setTab] = useState('reminders')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({})

  const [reminders, setReminders] = useState([])
  const [reminderTotal, setReminderTotal] = useState(0)
  const [reminderPage, setReminderPage] = useState(0)
  const [reminderLimit, setReminderLimit] = useState(10)

  const [users, setUsers] = useState([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(0)
  const [userLimit, setUserLimit] = useState(10)

  const [search, setSearch] = useState('')
  const [selectedReminderId, setSelectedReminderId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const [anchorEl, setAnchorEl] = useState(null)
  const [filType, setFiltype] = useState('30d')
  const [createOpen, setCreateOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Seeded from the home-screen cards, which pass ?sd=&ed=
  const initialStart = router.query.sd ? new Date(router.query.sd) : (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)

    return d
  })()
  const initialEnd = router.query.ed ? new Date(router.query.ed) : new Date()

  const [selectionRange, setSelectionRange] = useState({
    startDate: initialStart,
    endDate: initialEnd,
    key: 'selection'
  })

  const rangeParams = useCallback(() => {
    const start = format(selectionRange.startDate, 'yyyy-MM-dd')
    const end = format(selectionRange.endDate, 'yyyy-MM-dd')

    return `start_date=${start}&end_date=${end}`
  }, [selectionRange])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiGet(`${reminderSummaryUrl}?${rangeParams()}`)
      setSummary(res?.data?.detail || {})
    } catch (err) {
      console.error('Reminder summary error:', err)
      setSummary({})
    }
  }, [rangeParams])

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    try {
      const params = [
        rangeParams(),
        `limit=${reminderLimit}`,
        `page=${reminderPage + 1}`,
        search ? `search=${encodeURIComponent(search)}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${reminderListUrl}?${params}`)
      setReminders(res?.data?.detail || [])
      setReminderTotal(res?.data?.total || 0)
    } catch (err) {
      console.error('Reminder list error:', err)
      setReminders([])
      setReminderTotal(0)
    } finally {
      setLoading(false)
    }
  }, [rangeParams, reminderLimit, reminderPage, search])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = [
        rangeParams(),
        `limit=${userLimit}`,
        `page=${userPage + 1}`,
        search ? `search=${encodeURIComponent(search)}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${reminderUserListUrl}?${params}`)
      setUsers(res?.data?.detail || [])
      setUserTotal(res?.data?.total || 0)
    } catch (err) {
      console.error('Reminder user list error:', err)
      setUsers([])
      setUserTotal(0)
    } finally {
      setLoading(false)
    }
  }, [rangeParams, userLimit, userPage, search])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    if (tab === 'reminders') fetchReminders()
  }, [tab, fetchReminders])

  useEffect(() => {
    if (tab === 'users') fetchUsers()
  }, [tab, fetchUsers])

  const applyQuickFilter = type => {
    const today = new Date()
    let start = new Date()
    setFiltype(type)
    if (type === 'today') start = new Date()
    if (type === '7d') start.setDate(today.getDate() - 7)
    if (type === '30d') start.setDate(today.getDate() - 30)

    setSelectionRange({ startDate: start, endDate: today, key: 'selection' })
    setReminderPage(0)
    setUserPage(0)
  }

  const handleDateChange = ranges => {
    const { startDate, endDate } = ranges.selection
    setSelectionRange({ startDate, endDate, key: 'selection' })
    setReminderPage(0)
    setUserPage(0)
  }

  /** Downloads the same rows the table is showing, as a 4-sheet workbook. */
  const handleExport = async () => {
    setExporting(true)
    try {
      const params = [rangeParams(), search ? `search=${encodeURIComponent(search)}` : '']
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${reminderExportUrl}?${params}`)
      if (!res?.data?.data) {
        toast.error('Nothing to export for this period')

        return
      }
      await convertBase64Blob(res.data.data, res.data.fileName || 'family-reminders.xlsx')
      toast.success('Excel file downloaded successfully')
    } catch (err) {
      console.error('Reminder export error:', err)
      toast.error(typeof err === 'string' ? err : 'Could not export reminders')
    } finally {
      setExporting(false)
    }
  }

  const cards = [
    { title: 'Reminders Set', value: summary.total_reminders || 0, color: '#f2a429' },
    { title: 'Active', value: summary.active_reminders || 0, color: '#2196f3' },
    { title: 'Completed', value: summary.completed_reminders || 0, color: '#4caf50' },
    { title: 'High Priority', value: summary.high_priority || 0, color: '#d64550' },
    { title: 'Comments', value: summary.total_comments || 0, color: '#9c27b0' },
    { title: 'Documents', value: summary.total_attachments || 0, color: '#ff9800' },
    { title: 'Members Reached', value: summary.members_reached || 0, color: '#00897b' },
    { title: 'Users Creating', value: summary.distinct_creators || 0, color: '#5c6bc0' }
  ]

  return (
    <Box>
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' flexWrap='wrap' gap={2} mb={3}>
        <Box>
          <Typography variant='h5' fontWeight={600} mb={1}>
            Family Reminders
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Every reminder users create, who it is shared with, and all comments and documents added.
          </Typography>
        </Box>

        <Stack direction='row' spacing={2}>
          <Button
            variant='outlined'
            startIcon={<Icon icon='mdi:file-excel-outline' />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button variant='contained' startIcon={<Icon icon='mdi:plus' />} onClick={() => setCreateOpen(true)}>
            Create Reminder
          </Button>
        </Stack>
      </Stack>

      {/* FILTER SECTION */}
      <Stack direction='row' justifyContent='space-between' alignItems='center' mb={3} flexWrap='wrap' spacing={2}>
        <Stack direction='row' spacing={1}>
          <Button variant={filType === 'today' ? 'contained' : 'outlined'} onClick={() => applyQuickFilter('today')}>
            Today
          </Button>
          <Button variant={filType === '7d' ? 'contained' : 'outlined'} onClick={() => applyQuickFilter('7d')}>
            Last 7 Days
          </Button>
          <Button variant={filType === '30d' ? 'contained' : 'outlined'} onClick={() => applyQuickFilter('30d')}>
            Last 30 Days
          </Button>
        </Stack>

        <Button
          variant={filType === 'custom' ? 'contained' : 'outlined'}
          onClick={e => {
            setFiltype('custom')
            setAnchorEl(e.currentTarget)
          }}
        >
          {format(selectionRange.startDate, 'dd MMM yyyy')} - {format(selectionRange.endDate, 'dd MMM yyyy')}
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <DateRange ranges={[selectionRange]} onChange={handleDateChange} moveRangeOnFirstSelection={false} />
        </Popover>
      </Stack>

      {/* SUMMARY CARDS */}
      <Grid container spacing={3} mb={4}>
        {cards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant='subtitle2' color='text.secondary'>
                  {card.title}
                </Typography>
                <Typography variant='h4' fontWeight={600} sx={{ color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TABS + SEARCH */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ px: 3, pt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs
            value={tab}
            onChange={(e, value) => {
              setTab(value)
              setSearch('')
            }}
          >
            <Tab label='Reminders' value='reminders' />
            <Tab label='By User' value='users' />
          </Tabs>

          <TextField
            size='small'
            placeholder={tab === 'reminders' ? 'Search name, number or title' : 'Search name or number'}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setReminderPage(0)
              setUserPage(0)
            }}
            sx={{ minWidth: 280 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : tab === 'reminders' ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Reminder Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align='center'>Shared</TableCell>
                    <TableCell align='center'>Alerts</TableCell>
                    <TableCell align='center'>Comments</TableCell>
                    <TableCell align='center'>Docs</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='center'>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reminders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center' sx={{ py: 6 }}>
                        <Typography color='text.secondary'>No reminders in this period.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reminders.map(row => (
                      <TableRow hover key={row.id}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {row.title}
                          </Typography>
                          {row.venue_name ? (
                            <Typography variant='caption' color='text.secondary'>
                              {row.venue_name}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{row.creator_name || '-'}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {row.creator_mobile || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDateTime(row.remind_at)}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={String(row.priority || '').toUpperCase()}
                            color={PRIORITY_COLOR[row.priority] || 'default'}
                          />
                        </TableCell>
                        <TableCell align='center'>{row.member_count}</TableCell>
                        <TableCell align='center'>{row.alert_count}</TableCell>
                        <TableCell align='center'>{row.comment_count}</TableCell>
                        <TableCell align='center'>{row.attachment_count}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            variant='outlined'
                            label={row.status === 'completed' ? 'Completed' : 'Active'}
                            color={row.status === 'completed' ? 'success' : 'info'}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <IconButton size='small' onClick={() => setSelectedReminderId(row.id)}>
                            <Typography variant='caption' color='primary' fontWeight={600}>
                              View
                            </Typography>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component='div'
              count={reminderTotal}
              page={reminderPage}
              rowsPerPage={reminderLimit}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={(e, page) => setReminderPage(page)}
              onRowsPerPageChange={e => {
                setReminderLimit(parseInt(e.target.value, 10))
                setReminderPage(0)
              }}
            />
          </>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align='center'>Reminders Created</TableCell>
                    <TableCell align='center'>Shared With Them</TableCell>
                    <TableCell align='center'>Comments Made</TableCell>
                    <TableCell align='center'>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                        <Typography color='text.secondary'>No users found for this period.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(row => (
                      <TableRow hover key={row.user_id}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {row.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.mobile || '-'}</TableCell>
                        <TableCell align='center'>{row.created_count}</TableCell>
                        <TableCell align='center'>{row.shared_with_count}</TableCell>
                        <TableCell align='center'>{row.comment_count}</TableCell>
                        <TableCell align='center'>
                          <IconButton size='small' onClick={() => setSelectedUser(row)}>
                            <Typography variant='caption' color='primary' fontWeight={600}>
                              View
                            </Typography>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component='div'
              count={userTotal}
              page={userPage}
              rowsPerPage={userLimit}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={(e, page) => setUserPage(page)}
              onRowsPerPageChange={e => {
                setUserLimit(parseInt(e.target.value, 10))
                setUserPage(0)
              }}
            />
          </>
        )}
      </Card>

      <ReminderDetailDrawer
        open={Boolean(selectedReminderId)}
        reminderId={selectedReminderId}
        toggle={() => setSelectedReminderId(null)}
      />

      <CreateReminderDrawer
        open={createOpen}
        toggle={() => setCreateOpen(false)}
        onCreated={() => {
          fetchSummary()
          if (tab === 'reminders') fetchReminders()
          else fetchUsers()
        }}
      />

      <UserReminderDrawer
        open={Boolean(selectedUser)}
        user={selectedUser}
        rangeQuery={rangeParams()}
        toggle={() => setSelectedUser(null)}
        onOpenReminder={id => {
          setSelectedUser(null)
          setSelectedReminderId(id)
        }}
      />
    </Box>
  )
}

ReminderManagement.acl = {
  action: 'read',
  subject: 'remindermanage'
}

export default ReminderManagement
