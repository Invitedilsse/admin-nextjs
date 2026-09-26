/**
 * One WhatsApp conversation, read-only.
 *
 * Drawn as chat bubbles: inbound left, outbound right — the mirror of the
 * user's own phone, so a screenshot a user sends lines up with what the admin
 * is looking at.
 *
 * Outbound `options` are the buttons the bot offered, drawn as chips. Without
 * them a later "3" in the transcript is unreadable, because what "3" meant
 * depends on the menu that was on screen at the time.
 *
 * What the bot created in this chat is pinned at the bottom, so "did this
 * actually save?" is answerable without leaving the drawer.
 */

import React, { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Divider, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

import { apiGet } from 'src/hooks/axios'
import { waBotConversationUrl } from 'src/services/pathConst'
import {
  ACTION_LABEL,
  describeAction,
  describeMedia,
  formatClock,
  formatDayHeading,
  formatDateTime,
  fullName
} from 'src/utils/whatsappBotUtils'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(4),
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}))

/** WhatsApp's own colours, so the transcript reads the way the chat looked. */
const CHAT_BG = '#ECE5DD'
const OUT_BUBBLE = '#DCF8C6'

const ConversationDrawer = ({ open, phone, toggle }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !phone) return

    let cancelled = false
    setLoading(true)
    setError('')
    setData(null)

    apiGet(`${waBotConversationUrl}?phone=${encodeURIComponent(phone)}&limit=500`)
      .then(res => {
        if (!cancelled) setData(res?.data || null)
      })
      .catch(err => {
        // The global axios interceptor unwraps errors, so this is usually a
        // string or a payload object, not an AxiosError.
        if (!cancelled) setError(typeof err === 'string' ? err : 'Could not load this conversation.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, phone])

  const messages = data?.detail || []
  const actions = data?.actions || []
  const who = data?.user

  // A date separator whenever the day changes, so a chat spread over weeks
  // stays readable.
  let lastDay = null

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      ModalProps={{ keepMounted: false }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 520 } } }}
    >
      <Header>
        <Box>
          <Typography variant='h6' fontWeight={600}>
            {who ? fullName(who) : 'Unknown number'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {phone}
            {who?.mobile && who.mobile !== phone ? ` · account ${who.mobile}` : ''}
            {!who && ' · no Invite Dilsse account matches this number'}
          </Typography>
        </Box>
        <IconButton size='small' onClick={toggle}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>

      {data?.session?.flow && (
        <Box px={4} py={2} borderBottom={theme => `1px solid ${theme.palette.divider}`}>
          <Chip
            size='small'
            color='warning'
            label={`In progress: ${data.session.flow} → ${data.session.step}`}
            sx={{ fontSize: 11 }}
          />
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: CHAT_BG, px: 2, py: 2 }}>
        {loading && (
          <Box textAlign='center' py={6}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography color='error' variant='body2' textAlign='center' py={4}>
            {error}
          </Typography>
        )}

        {!loading && !error && messages.length === 0 && (
          <Typography variant='body2' color='text.secondary' textAlign='center' py={6}>
            No messages recorded for this number.
          </Typography>
        )}

        {!loading &&
          messages.map(m => {
            const day = formatDayHeading(m.created_at)
            const showDay = day !== lastDay
            lastDay = day
            const mine = m.direction === 'out'

            return (
              <Box key={m.id}>
                {showDay && (
                  <Box textAlign='center' my={1.5}>
                    <Chip label={day} size='small' sx={{ bgcolor: '#fff', fontSize: 11 }} />
                  </Box>
                )}

                <Box display='flex' justifyContent={mine ? 'flex-end' : 'flex-start'} mb={0.75}>
                  <Box
                    sx={{
                      maxWidth: '80%',
                      bgcolor: mine ? OUT_BUBBLE : '#fff',
                      border: m.error ? '1px solid' : '1px solid rgba(0,0,0,.06)',
                      borderColor: m.error ? 'error.main' : 'rgba(0,0,0,.06)',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1,
                      boxShadow: '0 1px 1px rgba(0,0,0,.06)'
                    }}
                  >
                    {m.kind === 'media' && (
                      <Chip
                        component='span'
                        size='small'
                        label={`📎 ${describeMedia(m.media)}`}
                        sx={{ mb: m.body ? 0.75 : 0, fontSize: 11 }}
                      />
                    )}

                    {m.body && (
                      <Typography
                        variant='body2'
                        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13.5 }}
                      >
                        {m.body}
                      </Typography>
                    )}

                    {Array.isArray(m.options) && m.options.length > 0 && (
                      <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap mt={0.75}>
                        {m.options.map(o => (
                          <Chip
                            key={o.id}
                            label={o.title}
                            size='small'
                            variant='outlined'
                            sx={{ fontSize: 10.5, height: 20 }}
                          />
                        ))}
                      </Stack>
                    )}

                    {m.error && (
                      <Typography variant='caption' color='error' display='block' mt={0.5}>
                        Not delivered — {m.error}
                      </Typography>
                    )}

                    <Box display='flex' justifyContent='flex-end' alignItems='center' gap={0.5} mt={0.25}>
                      {m.step && (
                        <Tooltip title={`${m.flow || ''} → ${m.step}`} placement='left'>
                          <Typography variant='caption' color='text.disabled' sx={{ fontSize: 9.5 }}>
                            {m.step}
                          </Typography>
                        </Tooltip>
                      )}
                      <Typography variant='caption' color='text.disabled' sx={{ fontSize: 10 }}>
                        {formatClock(m.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )
          })}
      </Box>

      {actions.length > 0 && (
        <>
          <Divider />
          <Box px={4} py={2} maxHeight={190} sx={{ overflowY: 'auto' }}>
            <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Scheduled from this chat ({actions.length})
            </Typography>
            {actions.map(a => (
              <Box key={a.id} sx={{ mt: 1, pl: 1.5, borderLeft: theme => `3px solid ${theme.palette.primary.main}` }}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Typography variant='body2' fontWeight={600}>
                    {a.title || '(untitled)'}
                  </Typography>
                  <Chip label={ACTION_LABEL[a.action] || a.action} size='small' sx={{ height: 18, fontSize: 10 }} />
                </Stack>
                <Typography variant='caption' color='text.secondary'>
                  {formatDateTime(a.created_at)}
                  {describeAction(a) ? ` · ${describeAction(a)}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      <Box px={4} py={1.5} borderTop={theme => `1px solid ${theme.palette.divider}`}>
        <Typography variant='caption' color='text.secondary'>
          {data?.total ? `Showing ${messages.length} of ${data.total} messages` : ''}
        </Typography>
      </Box>
    </Drawer>
  )
}

export default ConversationDrawer
