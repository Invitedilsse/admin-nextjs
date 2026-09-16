import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Link,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

import Icon from 'src/@core/components/icon'
import { apiGet } from 'src/hooks/axios'
import { functionConversationDetailUrl } from 'src/services/pathConst'
import {
  avatarColor,
  dayKey,
  formatDateTime,
  formatDay,
  formatDuration,
  formatFileSize,
  formatTime,
  initials,
  MESSAGE_TYPE_ICON,
  MESSAGE_TYPE_LABEL
} from 'src/utils/conversationUtils'

/**
 * One family chat, read end to end.
 *
 * Deliberately a compact transcript rather than chat bubbles: an admin is
 * scanning and searching a conversation, not taking part in it, so every line
 * carries its own time, sender and relation and the whole thread prints and
 * searches cleanly.
 */

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(4),
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}))

const DaySeparator = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 2,
  padding: theme.spacing(1, 0),
  background: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2)
}))

const Label = ({ children }) => (
  <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {children}
  </Typography>
)

/** The media that hangs off one message — thumbnail, player link or file link. */
const MessageMedia = ({ media, type }) => {
  if (!media?.url) return null

  if (type === 'image') {
    return (
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 0.75 }}>
        <Box
          component='img'
          src={media.thumbnail_url || media.url}
          alt={media.name || 'Photo'}
          sx={{
            width: 84,
            height: 84,
            objectFit: 'cover',
            borderRadius: 1,
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        />
        <Link href={media.url} target='_blank' rel='noopener' variant='caption'>
          Open photo
        </Link>
      </Stack>
    )
  }

  if (type === 'audio') {
    return (
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 0.75 }}>
        <Icon icon='mdi:microphone-outline' fontSize={16} />
        <Box component='audio' src={media.url} controls sx={{ height: 32, maxWidth: 260 }} />
        {formatDuration(media.duration_ms) ? (
          <Typography variant='caption' color='text.secondary'>
            {formatDuration(media.duration_ms)}
          </Typography>
        ) : null}
      </Stack>
    )
  }

  return (
    <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 0.75 }}>
      <Icon icon={type === 'video' ? 'mdi:video-outline' : 'mdi:paperclip'} fontSize={16} />
      <Link href={media.url} target='_blank' rel='noopener' variant='body2'>
        {media.name || (type === 'video' ? 'Video' : 'Document')}
      </Link>
      {formatFileSize(media.size) ? (
        <Typography variant='caption' color='text.secondary'>
          {formatFileSize(media.size)}
        </Typography>
      ) : null}
    </Stack>
  )
}

const ConversationDetailDrawer = ({ open, conversationId, toggle }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const [tab, setTab] = useState('transcript')
  const [search, setSearch] = useState('')
  const [sender, setSender] = useState('all')
  const [mediaOnly, setMediaOnly] = useState(false)

  useEffect(() => {
    if (!open || !conversationId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiGet(`${functionConversationDetailUrl}/${conversationId}`)
        if (!cancelled) setData(res?.data?.detail || null)
      } catch (err) {
        console.error('Conversation detail error:', err)
        if (!cancelled) {
          setError(typeof err === 'string' ? err : 'Could not load this chat.')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [open, conversationId])

  // Filters are per-open, not per-thread: reopening a chat should not inherit
  // the last thread's sender filter, which silently hides messages.
  useEffect(() => {
    if (!open) return
    setTab('transcript')
    setSearch('')
    setSender('all')
    setMediaOnly(false)
  }, [open, conversationId])

  const messages = data?.messages || []

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()

    return messages.filter(msg => {
      if (sender !== 'all' && msg.user_id !== sender) return false
      if (mediaOnly && msg.message_type === 'text') return false
      if (!needle) return true
      const haystack = `${msg.message || ''} ${msg.user_name || ''} ${msg.media?.name || ''}`.toLowerCase()

      return haystack.includes(needle)
    })
  }, [messages, search, sender, mediaOnly])

  /** Chronological groups, one per calendar day. */
  const grouped = useMemo(() => {
    const out = []
    filtered.forEach(msg => {
      const key = dayKey(msg.created_at)
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(msg)
      else out.push({ key, items: [msg] })
    })

    return out
  }, [filtered])

  const owner = data?.owner || {}
  const members = data?.members || []
  const removedMembers = data?.removed_members || []
  const totals = data?.totals || {}

  const renderMessage = msg => (
    <Stack key={msg.id} direction='row' spacing={1.5} sx={{ mb: 2.5 }} alignItems='flex-start'>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ width: 62, flexShrink: 0, pt: 0.5, textAlign: 'right' }}
      >
        {formatTime(msg.created_at)}
      </Typography>

      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: '0.7rem',
          fontWeight: 600,
          bgcolor: avatarColor(msg.user_id || msg.user_name)
        }}
      >
        {initials(msg.user_name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
          <Typography variant='body2' fontWeight={600}>
            {msg.user_name}
          </Typography>
          {msg.is_owner ? <Chip size='small' color='warning' label='Main member' /> : null}
          {msg.message_type !== 'text' ? (
            <Tooltip title={MESSAGE_TYPE_LABEL[msg.message_type] || msg.message_type}>
              <Box component='span' sx={{ display: 'inline-flex', color: 'text.secondary' }}>
                <Icon icon={MESSAGE_TYPE_ICON[msg.message_type] || 'mdi:paperclip'} fontSize={15} />
              </Box>
            </Tooltip>
          ) : null}
        </Stack>

        {/* What this message was a reply to — quoted, the way the app shows it. */}
        {msg.parent ? (
          <Box
            sx={{
              mt: 0.5,
              pl: 1.5,
              borderLeft: theme => `3px solid ${theme.palette.divider}`,
              color: 'text.secondary'
            }}
          >
            <Typography variant='caption' fontWeight={600} display='block'>
              ↳ replying to {msg.parent.user_name}
            </Typography>
            <Typography variant='caption' noWrap display='block'>
              {msg.parent.message || MESSAGE_TYPE_LABEL[msg.parent.message_type] || ''}
            </Typography>
          </Box>
        ) : null}

        {msg.message ? (
          <Typography variant='body2' sx={{ mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.message}
          </Typography>
        ) : null}

        <MessageMedia media={msg.media} type={msg.message_type} />

        {msg.mention_names ? (
          <Typography variant='caption' color='primary' display='block' sx={{ mt: 0.5 }}>
            @ {msg.mention_names}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      ModalProps={{ keepMounted: false }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 720 } } }}
    >
      <Header>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' noWrap>
            {owner.name ? `${owner.name}'s family chat` : 'Family chat'}
          </Typography>
          <Typography variant='caption' color='text.secondary' noWrap>
            {data?.function_name || ''}
            {data?.host_name ? ` · ${data.host_name}` : ''}
          </Typography>
        </Box>
        <IconButton size='small' onClick={toggle}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Header>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4 }}>
          <Typography color='error'>{error}</Typography>
        </Box>
      ) : !data ? (
        <Box sx={{ p: 4 }}>
          <Typography color='text.secondary'>No data.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          {/* WHO THIS CHAT BELONGS TO */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Stack direction='row' spacing={2} alignItems='center'>
              <Avatar
                sx={{
                  bgcolor: avatarColor(owner.user_id || owner.name),
                  width: 40,
                  height: 40,
                  fontWeight: 600
                }}
              >
                {initials(owner.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='subtitle1' fontWeight={600}>
                  {owner.name}
                  {owner.last_name ? ` ${owner.last_name}` : ''}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Main member · {owner.mobile || 'No mobile on record'} · chat started{' '}
                  {formatDateTime(data.created_at)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mt: 2, gap: 1 }}>
              <Chip size='small' label={`${totals.messages || 0} messages`} />
              <Chip size='small' label={`${totals.media || 0} media`} />
              <Chip size='small' label={`${totals.replies || 0} replies`} />
              <Chip size='small' variant='outlined' label={`${totals.members || 0} in chat`} />
              <Chip
                size='small'
                variant='outlined'
                label={`${totals.spoken || 0} spoke`}
                color={totals.spoken ? 'primary' : 'default'}
              />
              {data.comment_mode === 'disabled' ? (
                <Chip size='small' color='error' variant='outlined' label='Replies locked by owner' />
              ) : null}
            </Stack>
          </Box>

          <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ px: 4 }}>
            <Tab label={`Transcript (${messages.length})`} value='transcript' />
            <Tab label={`Members (${members.length})`} value='members' />
            <Tab label={`Files (${(data.attachments || []).length})`} value='files' />
          </Tabs>
          <Divider />

          {/* TRANSCRIPT */}
          {tab === 'transcript' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <Stack direction='row' spacing={2} sx={{ p: 3 }} flexWrap='wrap' alignItems='center'>
                <TextField
                  size='small'
                  placeholder='Search in this chat'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  sx={{ minWidth: 220 }}
                />
                <TextField
                  size='small'
                  select
                  label='Sent by'
                  value={sender}
                  onChange={e => setSender(e.target.value)}
                  sx={{ minWidth: 190 }}
                >
                  <MenuItem value='all'>Everyone</MenuItem>
                  {[...members, ...removedMembers].map(m => (
                    <MenuItem key={m.user_id} value={m.user_id}>
                      {m.name} ({m.message_count})
                    </MenuItem>
                  ))}
                </TextField>
                <Chip
                  size='small'
                  clickable
                  color={mediaOnly ? 'primary' : 'default'}
                  variant={mediaOnly ? 'filled' : 'outlined'}
                  label='Media only'
                  onClick={() => setMediaOnly(v => !v)}
                />
                {filtered.length !== messages.length ? (
                  <Typography variant='caption' color='text.secondary'>
                    {filtered.length} of {messages.length} shown
                  </Typography>
                ) : null}
              </Stack>

              <Box sx={{ px: 4, pb: 6, overflowY: 'auto', flex: 1 }}>
                {messages.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Icon icon='mdi:chat-outline' fontSize={36} />
                    <Typography color='text.secondary' mt={1}>
                      Nobody has said anything in this chat yet.
                    </Typography>
                  </Box>
                ) : filtered.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography color='text.secondary'>No message matches this filter.</Typography>
                  </Box>
                ) : (
                  grouped.map(group => (
                    <Box key={group.key}>
                      <DaySeparator>
                        <Typography variant='caption' color='text.secondary' fontWeight={600}>
                          {formatDay(group.items[0].created_at)}
                        </Typography>
                      </DaySeparator>
                      {group.items.map(renderMessage)}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          ) : null}

          {/* MEMBERS */}
          {tab === 'members' ? (
            <Box sx={{ p: 4, overflowY: 'auto' }}>
              <Label>In this chat ({members.length})</Label>
              <Table size='small' sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Relation</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell align='center'>Messages</TableCell>
                    <TableCell>Last spoke</TableCell>
                    <TableCell>Last read</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.user_id} hover>
                      <TableCell>
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <Typography variant='body2' fontWeight={600}>
                            {m.name}
                          </Typography>
                          {m.is_owner ? <Chip size='small' color='warning' label='Main' /> : null}
                          {!m.can_comment && !m.is_owner ? (
                            <Chip size='small' variant='outlined' label='muted' />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{m.relation || '-'}</TableCell>
                      <TableCell>{m.mobile || '-'}</TableCell>
                      <TableCell align='center'>{m.message_count}</TableCell>
                      <TableCell>{m.last_message_at ? formatDateTime(m.last_message_at) : '-'}</TableCell>
                      <TableCell>{m.last_read_at ? formatDateTime(m.last_read_at) : 'Never opened'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {removedMembers.length > 0 ? (
                <Box sx={{ mt: 4 }}>
                  <Label>Removed from the chat ({removedMembers.length})</Label>
                  {removedMembers.map(m => (
                    <Typography key={m.user_id} variant='caption' display='block' color='text.secondary'>
                      {m.name} — {m.message_count} message{m.message_count === 1 ? '' : 's'}, removed{' '}
                      {formatDateTime(m.removed_at)}
                    </Typography>
                  ))}
                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 1 }}>
                    Their messages stay in the transcript above — removing someone withdraws access, it does
                    not erase what they said.
                  </Typography>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {/* FILES */}
          {tab === 'files' ? (
            <Box sx={{ p: 4, overflowY: 'auto' }}>
              {(data.attachments || []).length === 0 ? (
                <Typography color='text.secondary'>Nothing has been shared in this chat.</Typography>
              ) : (
                data.attachments.map(a => (
                  <Stack key={a.id} direction='row' spacing={1.5} alignItems='center' sx={{ py: 1 }}>
                    <Icon
                      icon={
                        String(a.file_type || '').startsWith('image')
                          ? 'mdi:image-outline'
                          : String(a.file_type || '').startsWith('audio')
                          ? 'mdi:microphone-outline'
                          : String(a.file_type || '').startsWith('video')
                          ? 'mdi:video-outline'
                          : 'mdi:file-document-outline'
                      }
                      fontSize={20}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Link href={a.file_url} target='_blank' rel='noopener' variant='body2' noWrap display='block'>
                        {a.file_name || 'Attachment'}
                      </Link>
                      <Typography variant='caption' color='text.secondary'>
                        {a.user_name || 'Family member'} · {formatDateTime(a.created_at)}
                        {formatFileSize(a.file_size) ? ` · ${formatFileSize(a.file_size)}` : ''}
                        {formatDuration(a.duration_ms) ? ` · ${formatDuration(a.duration_ms)}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                ))
              )}
            </Box>
          ) : null}
        </Box>
      )}
    </Drawer>
  )
}

export default ConversationDetailDrawer
