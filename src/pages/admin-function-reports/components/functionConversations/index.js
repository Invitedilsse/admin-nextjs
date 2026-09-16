import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid2 as Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import { apiGet } from 'src/hooks/axios'
import { functionConversationExportUrl, functionConversationsUrl } from 'src/services/pathConst'
import { convertBase64Blob } from 'src/utils/blobconverter'
import {
  avatarColor,
  describeMessage,
  formatDateTime,
  initials,
  SCOPE_LABEL
} from 'src/utils/conversationUtils'
import ConversationDetailDrawer from './ConversationDetailDrawer'

/**
 * Every chat that exists on ONE function.
 *
 * A function does not have a single chat. Each root invitee gets a thread of
 * their own — that invitee is the "main member" — and the people they shared
 * the invite with are its family members. So this panel is a list of threads,
 * each showing its main member, that member's family, and how much was said;
 * opening one shows the full transcript.
 */

const StatCard = ({ title, value, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ py: 3 }}>
      <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {title}
      </Typography>
      <Typography variant='h5' fontWeight={600} sx={{ color, mt: 0.5 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

/** One member as a compact chip — name, relation, and why they are muted. */
const MemberChip = ({ member }) => {
  const label = member.relation ? `${member.name} · ${member.relation}` : member.name

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant='caption' display='block'>
            {member.mobile || 'No mobile on record'}
          </Typography>
          <Typography variant='caption' display='block'>
            {member.message_count} message{member.message_count === 1 ? '' : 's'} sent
          </Typography>
          {member.is_removed ? (
            <Typography variant='caption' display='block'>
              Removed on {formatDateTime(member.removed_at)}
            </Typography>
          ) : null}
        </Box>
      }
    >
      <Chip
        size='small'
        variant={member.is_removed ? 'outlined' : 'filled'}
        color={member.is_removed ? 'default' : member.message_count > 0 ? 'primary' : 'default'}
        label={
          <Stack direction='row' spacing={0.5} alignItems='center'>
            <span>{label}</span>
            {member.message_count > 0 ? (
              <Box
                component='span'
                sx={{ opacity: 0.75, fontSize: '0.7rem', fontWeight: 600 }}
              >
                ({member.message_count})
              </Box>
            ) : null}
            {!member.can_comment ? <Icon icon='mdi:comment-off-outline' fontSize={13} /> : null}
          </Stack>
        }
        sx={{ mb: 1, mr: 1, textDecoration: member.is_removed ? 'line-through' : 'none' }}
      />
    </Tooltip>
  )
}

const FunctionConversations = ({ RowData, functionDetails }) => {
  const functionId = RowData?.functionid || RowData?.function_id || RowData?.id
  const scope = RowData?.function || RowData?.scope || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(true)
  const [stats, setStats] = useState({})
  const [threads, setThreads] = useState([])
  const [search, setSearch] = useState('')
  const [tempSearch, setTempSearch] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [exporting, setExporting] = useState(false)

  const functionName =
    functionDetails?.function_name || RowData?.function_name || 'this function'

  const fetchThreads = useCallback(async () => {
    if (!functionId) return
    setLoading(true)
    setError('')
    try {
      const params = [
        `functionId=${functionId}`,
        scope ? `scope=${scope}` : '',
        search ? `search=${encodeURIComponent(search)}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${functionConversationsUrl}?${params}`)
      setReady(res?.data?.ready !== false)
      setStats(res?.data?.stats || {})
      setThreads(res?.data?.threads || [])
    } catch (err) {
      console.error('Function conversations error:', err)
      setError(typeof err === 'string' ? err : 'Could not load the chats for this function.')
      setThreads([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [functionId, scope, search])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const visibleThreads = useMemo(
    () => (onlyActive ? threads.filter(t => t.message_count > 0) : threads),
    [threads, onlyActive]
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = [`functionId=${functionId}`, scope ? `scope=${scope}` : ''].filter(Boolean).join('&')
      const res = await apiGet(`${functionConversationExportUrl}?${params}`)
      if (!res?.data?.data) {
        toast.error('Nothing to export yet')

        return
      }
      await convertBase64Blob(res.data.data, res.data.fileName || 'function-conversations.xlsx')
      toast.success('Excel file downloaded successfully')
    } catch (err) {
      console.error('Conversation export error:', err)
      toast.error(typeof err === 'string' ? err : 'Could not export the chats')
    } finally {
      setExporting(false)
    }
  }

  const cards = [
    { title: 'Chats', value: stats.total_threads || 0, color: '#f2a429' },
    { title: 'With Messages', value: stats.active_threads || 0, color: '#2196f3' },
    { title: 'Messages', value: stats.total_messages || 0, color: '#4caf50' },
    { title: 'Photos / Voice / Files', value: stats.media_messages || 0, color: '#ff9800' },
    { title: 'Replies', value: stats.replies || 0, color: '#9c27b0' },
    { title: 'Members In Chats', value: stats.members_reached || 0, color: '#00897b' },
    { title: 'Members Who Spoke', value: stats.members_spoken || 0, color: '#5c6bc0' },
    {
      title: 'Last Activity',
      value: stats.last_activity_at ? formatDateTime(stats.last_activity_at) : '-',
      color: '#607d8b'
    }
  ]

  if (!functionId) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography color='text.secondary'>Pick a function to see its chats.</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* HEADER */}
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='flex-start'
        flexWrap='wrap'
        gap={2}
        mb={3}
      >
        <Box>
          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
            <Typography variant='h6' fontWeight={600}>
              Family Chats
            </Typography>
            {scope ? <Chip size='small' variant='outlined' label={SCOPE_LABEL[scope] || scope} /> : null}
          </Stack>
          <Typography variant='body2' color='text.secondary'>
            Each invitee of <b>{functionName}</b> has their own private chat with the family they shared
            the invite with. Every one of those chats is listed below.
          </Typography>
        </Box>

        <Stack direction='row' spacing={2}>
          <Button
            variant='outlined'
            startIcon={<Icon icon='mdi:file-excel-outline' />}
            onClick={handleExport}
            disabled={exporting || !threads.length}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button variant='outlined' startIcon={<Icon icon='mdi:refresh' />} onClick={fetchThreads}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* SUMMARY */}
      <Grid container spacing={3} mb={4}>
        {cards.map(card => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* FILTERS */}
      <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' mb={3}>
        <TextField
          size='small'
          placeholder='Search main member by name or number'
          value={tempSearch}
          onChange={e => setTempSearch(e.target.value)}
          onKeyDown={ev => {
            if (ev.key === 'Enter') {
              ev.preventDefault()
              setSearch(tempSearch)
            }
          }}
          sx={{ minWidth: 300 }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton size='small' onClick={() => setSearch(tempSearch)}>
                  <Icon icon='fluent:search-20-regular' width={20} height={20} />
                </IconButton>
              )
            }
          }}
        />
        {search ? (
          <Button
            size='small'
            onClick={() => {
              setSearch('')
              setTempSearch('')
            }}
          >
            Clear search
          </Button>
        ) : null}
        <Button
          size='small'
          variant={onlyActive ? 'contained' : 'outlined'}
          onClick={() => setOnlyActive(v => !v)}
        >
          Only chats with messages
        </Button>
      </Stack>

      {/* THREAD LIST */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color='error'>{error}</Typography>
          </CardContent>
        </Card>
      ) : !ready ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color='text.secondary'>
              Chats are not set up on this environment yet — the app backend creates them on its first
              boot. Nothing to show until then.
            </Typography>
          </CardContent>
        </Card>
      ) : visibleThreads.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Icon icon='mdi:chat-outline' fontSize={40} />
            <Typography color='text.secondary' mt={1}>
              {threads.length === 0
                ? 'No family chat has started on this function yet.'
                : 'No chat matches this filter.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {visibleThreads.map(thread => {
            const owner = thread.owner || {}
            const family = thread.members || []
            const removed = thread.removed_members || []

            return (
              <Card key={thread.conversation_id} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Grid container spacing={3}>
                    {/* MAIN MEMBER + FAMILY */}
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Stack direction='row' spacing={2} alignItems='flex-start'>
                        <Avatar
                          sx={{
                            bgcolor: avatarColor(owner.user_id || owner.name),
                            width: 44,
                            height: 44,
                            fontSize: '0.95rem',
                            fontWeight: 600
                          }}
                        >
                          {initials(owner.name)}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                            <Typography variant='subtitle1' fontWeight={600}>
                              {owner.name}
                              {owner.last_name ? ` ${owner.last_name}` : ''}
                            </Typography>
                            <Chip size='small' color='warning' label='Main member' />
                            {thread.comment_mode === 'disabled' ? (
                              <Chip size='small' variant='outlined' color='error' label='Replies locked' />
                            ) : null}
                          </Stack>
                          <Typography variant='caption' color='text.secondary'>
                            {owner.mobile || 'No mobile on record'} · chat started{' '}
                            {formatDateTime(thread.created_at)}
                          </Typography>

                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                              Family in this chat ({family.length})
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {family.length === 0 ? (
                                <Typography variant='body2' color='text.secondary'>
                                  Not shared with anyone yet — only {owner.name} is in this chat.
                                </Typography>
                              ) : (
                                family.map(member => (
                                  <MemberChip key={member.user_id} member={member} />
                                ))
                              )}
                              {removed.map(member => (
                                <MemberChip key={member.user_id} member={member} />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* ACTIVITY */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack spacing={1.5}>
                        <Stack direction='row' spacing={1} flexWrap='wrap'>
                          <Chip
                            size='small'
                            icon={<Icon icon='mdi:message-text-outline' fontSize={15} />}
                            label={`${thread.message_count} messages`}
                          />
                          <Chip
                            size='small'
                            icon={<Icon icon='mdi:paperclip' fontSize={15} />}
                            label={`${thread.media_count} media`}
                          />
                          <Chip
                            size='small'
                            icon={<Icon icon='mdi:reply-outline' fontSize={15} />}
                            label={`${thread.reply_count} replies`}
                          />
                          <Chip
                            size='small'
                            variant='outlined'
                            label={`${thread.spoken_count}/${thread.member_count} spoke`}
                          />
                        </Stack>

                        {thread.last_message ? (
                          <Box>
                            <Typography variant='caption' color='text.secondary'>
                              Last message · {formatDateTime(thread.last_message.created_at)}
                            </Typography>
                            <Typography variant='body2' noWrap>
                              <b>{thread.last_message.user_name}:</b>{' '}
                              {describeMessage({
                                message: thread.last_message.preview,
                                message_type: thread.last_message.message_type
                              })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            No messages sent in this chat yet.
                          </Typography>
                        )}

                        <Divider />

                        <Button
                          variant='contained'
                          size='small'
                          startIcon={<Icon icon='mdi:chat-processing-outline' />}
                          onClick={() => setOpenId(thread.conversation_id)}
                          disabled={thread.message_count === 0 && thread.member_count === 0}
                        >
                          View full chat
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <ConversationDetailDrawer
        open={Boolean(openId)}
        conversationId={openId}
        toggle={() => setOpenId(null)}
      />
    </Box>
  )
}

export default FunctionConversations
