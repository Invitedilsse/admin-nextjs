import React, { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

import { apiGet } from 'src/hooks/axios'
import { reminderUserDetailUrl } from 'src/services/pathConst'
import { formatDateTime, PRIORITY_COLOR } from 'src/utils/reminderUtils'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(4),
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}))

/** Every reminder one user created or was shared on, within the selected range. */
const UserReminderDrawer = ({ open, user, rangeQuery, toggle, onOpenReminder }) => {
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user?.user_id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiGet(`${reminderUserDetailUrl}/${user.user_id}?${rangeQuery || ''}`)
        if (!cancelled) setReminders(res?.data?.detail || [])
      } catch (err) {
        console.error('User reminder detail error:', err)
        if (!cancelled) {
          setError(typeof err === 'string' ? err : 'Could not load this user.')
          setReminders([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, user, rangeQuery])

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      ModalProps={{ keepMounted: false }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 620 } } }}
    >
      <Header>
        <Box>
          <Typography variant='h6'>{user?.name || 'User'}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {user?.mobile || '-'}
          </Typography>
        </Box>
        <IconButton size='small' onClick={toggle}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>

      <Box sx={{ p: 4 }}>
        <Stack direction='row' spacing={3} mb={1} flexWrap='wrap'>
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Created
            </Typography>
            <Typography variant='h6'>{user?.created_count ?? 0}</Typography>
          </Box>
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Shared with them
            </Typography>
            <Typography variant='h6'>{user?.shared_with_count ?? 0}</Typography>
          </Box>
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Comments
            </Typography>
            <Typography variant='h6'>{user?.comment_count ?? 0}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color='error'>{error}</Typography>
        ) : reminders.length === 0 ? (
          <Typography color='text.secondary'>No reminders for this user in the selected period.</Typography>
        ) : (
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Reminder Date</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align='center'>Shared</TableCell>
                <TableCell align='center'>Comments</TableCell>
                <TableCell align='center'>View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reminders.map(row => (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>
                      {row.title}
                    </Typography>
                    <Chip
                      size='small'
                      sx={{ mt: 0.5 }}
                      label={String(row.priority || '').toUpperCase()}
                      color={PRIORITY_COLOR[row.priority] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(row.remind_at)}</TableCell>
                  <TableCell>
                    {row.is_creator ? (
                      <Chip size='small' color='warning' label='Creator' />
                    ) : (
                      <Typography variant='caption' color='text.secondary'>
                        shared by {row.creator_name || '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align='center'>{row.member_count}</TableCell>
                  <TableCell align='center'>{row.comment_count}</TableCell>
                  <TableCell align='center'>
                    <IconButton size='small' onClick={() => onOpenReminder && onOpenReminder(row.id)}>
                      <Typography variant='caption' color='primary' fontWeight={600}>
                        View
                      </Typography>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Drawer>
  )
}

export default UserReminderDrawer
