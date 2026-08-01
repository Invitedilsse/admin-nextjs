import React, { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

import { apiGet } from 'src/hooks/axios'
import { reminderDetailUrl } from 'src/services/pathConst'
import { describeOffset, formatDateTime, PRIORITY_COLOR } from 'src/utils/reminderUtils'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(4),
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}))

const Label = ({ children }) => (
  <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {children}
  </Typography>
)

/**
 * Read-only super-admin view of one reminder: who it is shared with, every
 * alert, the whole comment thread and all uploaded documents.
 */
const ReminderDetailDrawer = ({ open, reminderId, toggle }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !reminderId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiGet(`${reminderDetailUrl}/${reminderId}`)
        if (!cancelled) setData(res?.data?.detail || null)
      } catch (err) {
        console.error('Reminder detail error:', err)
        if (!cancelled) {
          setError(typeof err === 'string' ? err : 'Could not load this reminder.')
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
  }, [open, reminderId])

  const activeMembers = (data?.members || []).filter(m => !m.is_removed)
  const removedMembers = (data?.members || []).filter(m => m.is_removed)

  // Group replies under their parent so the thread reads as it does in the app.
  const rootComments = (data?.comments || []).filter(c => !c.parent_id)
  const repliesByParent = (data?.comments || []).reduce((acc, comment) => {
    if (!comment.parent_id) return acc
    acc[comment.parent_id] = acc[comment.parent_id] || []
    acc[comment.parent_id].push(comment)

    return acc
  }, {})

  const renderComment = (comment, isReply = false) => (
    <Box key={comment.id} sx={{ pl: isReply ? 5 : 0, mb: 3 }}>
      <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
        <Typography variant='body2' fontWeight={600}>
          {comment.user_name || 'Family member'}
        </Typography>
        {comment.user_mobile ? (
          <Typography variant='caption' color='text.secondary'>
            {comment.user_mobile}
          </Typography>
        ) : null}
        <Typography variant='caption' color='text.secondary'>
          · {formatDateTime(comment.created_at)}
        </Typography>
        {isReply ? <Chip size='small' variant='outlined' label='reply' /> : null}
      </Stack>
      <Typography variant='body2' sx={{ mt: 0.5 }}>
        {comment.comment}
      </Typography>
      {Array.isArray(comment.mentions) && comment.mentions.length > 0 ? (
        <Typography variant='caption' color='primary'>
          {comment.mentions.length} member{comment.mentions.length === 1 ? '' : 's'} tagged
        </Typography>
      ) : null}
    </Box>
  )

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      ModalProps={{ keepMounted: false }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 } } }}
    >
      <Header>
        <Typography variant='h6'>Reminder Details</Typography>
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
        <Box sx={{ p: 4 }}>
          {/* SUMMARY */}
          <Stack direction='row' spacing={1} alignItems='center' mb={1} flexWrap='wrap'>
            <Typography variant='h6'>{data.title}</Typography>
            <Chip
              size='small'
              label={String(data.priority || '').toUpperCase()}
              color={PRIORITY_COLOR[data.priority] || 'default'}
            />
            <Chip
              size='small'
              variant='outlined'
              label={data.status === 'completed' ? 'Completed' : 'Active'}
              color={data.status === 'completed' ? 'success' : 'info'}
            />
          </Stack>

          <Typography variant='body2' color='text.secondary' mb={3}>
            {data.description}
          </Typography>

          <Stack spacing={2} mb={3}>
            <Box>
              <Label>Reminder date &amp; time</Label>
              <Typography variant='body2'>{formatDateTime(data.remind_at)}</Typography>
            </Box>
            <Box>
              <Label>Created by</Label>
              <Typography variant='body2'>
                {data.creator_name || '-'} {data.creator_mobile ? `· ${data.creator_mobile}` : ''}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                on {formatDateTime(data.created_at)}
              </Typography>
            </Box>
            {data.venue_name ? (
              <Box>
                <Label>Venue</Label>
                <Typography variant='body2'>{data.venue_name}</Typography>
                {data.venue_address ? (
                  <Typography variant='caption' color='text.secondary'>
                    {data.venue_address}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            <Box>
              <Label>Who can comment</Label>
              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                {data.comment_mode === 'disabled'
                  ? 'Comments locked'
                  : data.comment_mode === 'selected'
                  ? 'Selected members only'
                  : 'Everyone'}
              </Typography>
            </Box>
          </Stack>

          {/* ALERTS */}
          <Divider sx={{ my: 3 }} />
          <Label>Alerts ({data.schedules?.length || 0})</Label>
          <Stack direction='row' spacing={1} flexWrap='wrap' sx={{ mt: 1, gap: 1 }}>
            {(data.schedules || []).length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                None
              </Typography>
            ) : (
              data.schedules.map((s, i) => (
                <Chip key={i} size='small' label={s.label || describeOffset(s.offset_minutes)} />
              ))
            )}
          </Stack>

          {/* MEMBERS */}
          <Divider sx={{ my: 3 }} />
          <Label>Shared with ({activeMembers.length})</Label>
          <Box sx={{ mt: 1 }}>
            {activeMembers.map(m => (
              <Stack
                key={m.user_id}
                direction='row'
                spacing={1}
                alignItems='center'
                justifyContent='space-between'
                sx={{ py: 0.75 }}
              >
                <Box>
                  <Typography variant='body2' fontWeight={600}>
                    {m.name || 'Family member'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {m.mobile || '-'} {m.relation ? `· ${m.relation}` : ''}
                  </Typography>
                </Box>
                <Stack direction='row' spacing={0.5}>
                  {m.is_creator ? <Chip size='small' color='warning' label='Creator' /> : null}
                  {!m.is_creator && m.is_admin ? <Chip size='small' color='primary' label='Admin' /> : null}
                  {!m.can_comment ? <Chip size='small' variant='outlined' label='no comment' /> : null}
                </Stack>
              </Stack>
            ))}
          </Box>

          {removedMembers.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Label>Removed ({removedMembers.length})</Label>
              {removedMembers.map(m => (
                <Typography key={m.user_id} variant='caption' display='block' color='text.secondary'>
                  {m.name || 'Family member'} — removed {formatDateTime(m.removed_at)}
                </Typography>
              ))}
            </Box>
          ) : null}

          {/* DOCUMENTS */}
          <Divider sx={{ my: 3 }} />
          <Label>Documents ({data.attachments?.length || 0})</Label>
          <Box sx={{ mt: 1 }}>
            {(data.attachments || []).length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                None uploaded
              </Typography>
            ) : (
              data.attachments.map(a => (
                <Stack key={a.id} direction='row' spacing={1} alignItems='center' sx={{ py: 0.5 }}>
                  <Icon icon='mdi:file-document-outline' fontSize={18} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link href={a.file_url} target='_blank' rel='noopener' variant='body2' noWrap display='block'>
                      {a.file_name || 'Attachment'}
                    </Link>
                    <Typography variant='caption' color='text.secondary'>
                      {a.user_name || 'Family member'} · {formatDateTime(a.created_at)}
                    </Typography>
                  </Box>
                </Stack>
              ))
            )}
          </Box>

          {/* COMMENTS */}
          <Divider sx={{ my: 3 }} />
          <Label>Comments ({data.comments?.length || 0})</Label>
          <Box sx={{ mt: 2 }}>
            {rootComments.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                No comments
              </Typography>
            ) : (
              rootComments.map(comment => (
                <React.Fragment key={comment.id}>
                  {renderComment(comment)}
                  {(repliesByParent[comment.id] || []).map(reply => renderComment(reply, true))}
                </React.Fragment>
              ))
            )}
          </Box>

          {/* Private creator notes are intentionally not exposed here. */}
        </Box>
      )}
    </Drawer>
  )
}

export default ReminderDetailDrawer
