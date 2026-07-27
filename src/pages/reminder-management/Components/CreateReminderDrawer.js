import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import { reminderAppUsersUrl, reminderCreateUrl } from 'src/services/pathConst'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(4),
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}))

/** Preset "remind me before" offsets, in minutes. */
const ALERT_OPTIONS = [
  { minutes: 10080, label: '1 week before' },
  { minutes: 2880, label: '2 days before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 240, label: '4 hours before' },
  { minutes: 60, label: '1 hour before' }
]

/**
 * Lets a super admin push a reminder to chosen app users or to everyone.
 *
 * One reminder is created per target user with that user as its creator, so it
 * behaves in the app exactly like a reminder they made themselves.
 */
const CreateReminderDrawer = ({ open, toggle, onCreated }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:30')
  const [venue, setVenue] = useState('')
  const [priority, setPriority] = useState('medium')
  const [commentMode, setCommentMode] = useState('everyone')
  const [alerts, setAlerts] = useState([1440])

  const [target, setTarget] = useState('selected')
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState([])
  const [userLoading, setUserLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])

  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setTitle('')
    setDescription('')
    setDate('')
    setTime('10:30')
    setVenue('')
    setPriority('medium')
    setCommentMode('everyone')
    setAlerts([1440])
    setTarget('selected')
    setUserSearch('')
    setSelectedUsers([])
  }

  // Debounced user lookup for the picker.
  useEffect(() => {
    if (!open || target !== 'selected') return

    const handle = setTimeout(async () => {
      setUserLoading(true)
      try {
        const res = await apiGet(`${reminderAppUsersUrl}?search=${encodeURIComponent(userSearch)}&limit=50`)
        setUsers(res?.data?.detail || [])
      } catch (err) {
        console.error('App user lookup error:', err)
        setUsers([])
      } finally {
        setUserLoading(false)
      }
    }, 400)

    return () => clearTimeout(handle)
  }, [open, target, userSearch])

  const toggleAlert = minutes => {
    setAlerts(prev => (prev.includes(minutes) ? prev.filter(m => m !== minutes) : [...prev, minutes]))
  }

  const toggleUser = user => {
    setSelectedUsers(prev =>
      prev.some(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required')

      return
    }
    if (!date) {
      toast.error('Pick a reminder date')

      return
    }
    if (alerts.length === 0) {
      toast.error('Pick at least one alert')

      return
    }
    if (target === 'selected' && selectedUsers.length === 0) {
      toast.error('Select at least one user')

      return
    }

    // Combine the local date + time inputs, then send as UTC.
    const remindAt = new Date(`${date}T${time}:00`)
    if (Number.isNaN(remindAt.getTime())) {
      toast.error('Invalid date or time')

      return
    }
    if (remindAt.getTime() <= Date.now()) {
      toast.error('Reminder date and time must be in the future')

      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        remind_at: remindAt.toISOString(),
        venue_name: venue.trim(),
        priority,
        comment_mode: commentMode,
        schedules: alerts.map(minutes => ({
          offset_minutes: minutes,
          label: ALERT_OPTIONS.find(a => a.minutes === minutes)?.label
        })),
        target,
        ...(target === 'selected' ? { user_ids: selectedUsers.map(u => u.id) } : {})
      }

      const res = await apiPost(reminderCreateUrl, payload)
      toast.success(res?.data?.message || 'Reminder created')
      reset()
      if (onCreated) onCreated()
      toggle()
    } catch (err) {
      console.error('Create reminder error:', err)
      toast.error(typeof err === 'string' ? err : 'Could not create the reminder')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      ModalProps={{ keepMounted: false }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 520 } } }}
    >
      <Header>
        <Typography variant='h6'>Create Reminder</Typography>
        <IconButton size='small' onClick={toggle}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>

      <Box sx={{ p: 4 }}>
        <Stack spacing={3}>
          <TextField
            label='Title'
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='e.g. Collect Jewellery'
          />

          <TextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='What should the user do?'
          />

          <Stack direction='row' spacing={2}>
            <TextField
              label='Date'
              type='date'
              fullWidth
              value={date}
              onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='Time'
              type='time'
              fullWidth
              value={time}
              onChange={e => setTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            label='Venue (optional)'
            fullWidth
            value={venue}
            onChange={e => setVenue(e.target.value)}
          />

          <Stack direction='row' spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label='Priority' value={priority} onChange={e => setPriority(e.target.value)}>
                <MenuItem value='high'>High</MenuItem>
                <MenuItem value='medium'>Medium</MenuItem>
                <MenuItem value='low'>Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Comments</InputLabel>
              <Select label='Comments' value={commentMode} onChange={e => setCommentMode(e.target.value)}>
                <MenuItem value='everyone'>Everyone</MenuItem>
                <MenuItem value='selected'>Selected only</MenuItem>
                <MenuItem value='disabled'>Disabled</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box>
            <Typography variant='subtitle2' mb={1}>
              Alerts before the reminder
            </Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ gap: 1 }}>
              {ALERT_OPTIONS.map(option => (
                <Chip
                  key={option.minutes}
                  label={option.label}
                  clickable
                  color={alerts.includes(option.minutes) ? 'primary' : 'default'}
                  variant={alerts.includes(option.minutes) ? 'filled' : 'outlined'}
                  onClick={() => toggleAlert(option.minutes)}
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant='subtitle2' mb={1}>
              Send to
            </Typography>
            <RadioGroup row value={target} onChange={e => setTarget(e.target.value)}>
              <FormControlLabel value='selected' control={<Radio />} label='Specific users' />
              <FormControlLabel value='all' control={<Radio />} label='All app users' />
            </RadioGroup>
          </Box>

          {target === 'all' ? (
            <Alert severity='warning'>
              This creates the reminder for <strong>every app user</strong>, and each of them receives a push
              notification. Please double-check the wording before sending.
            </Alert>
          ) : (
            <Box>
              <TextField
                size='small'
                fullWidth
                placeholder='Search users by name or number'
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                sx={{ mb: 2 }}
              />

              {selectedUsers.length > 0 ? (
                <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ gap: 1, mb: 2 }}>
                  {selectedUsers.map(u => (
                    <Chip key={u.id} label={u.name || u.mobile} size='small' onDelete={() => toggleUser(u)} />
                  ))}
                </Stack>
              ) : null}

              <Box sx={{ maxHeight: 260, overflowY: 'auto', border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                {userLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : users.length === 0 ? (
                  <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                    No users found.
                  </Typography>
                ) : (
                  users.map(user => (
                    <Box
                      key={user.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        borderBottom: theme => `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Checkbox
                        size='small'
                        checked={selectedUsers.some(u => u.id === user.id)}
                        onChange={() => toggleUser(user)}
                      />
                      <Box sx={{ py: 1 }}>
                        <Typography variant='body2' fontWeight={600}>
                          {user.name || 'Unnamed'}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {user.mobile || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}

          <Stack direction='row' spacing={2}>
            <Button variant='outlined' fullWidth onClick={toggle} disabled={submitting}>
              Cancel
            </Button>
            <Button variant='contained' fullWidth onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={22} color='inherit' /> : 'Create Reminder'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  )
}

export default CreateReminderDrawer
