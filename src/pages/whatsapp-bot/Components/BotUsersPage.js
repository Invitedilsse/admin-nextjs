/**
 * Tab 1 — every number that has messaged the bot.
 *
 * Rows are one per PHONE, not per user: a number with no Invite Dilsse account
 * still appears, because "someone messaged the bot and it told them to install
 * the app" is exactly what this screen is for.
 *
 * Clicking a row opens the full transcript.
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid2 as Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import { apiGet } from 'src/hooks/axios'
import { waBotUsersUrl } from 'src/services/pathConst'
import { fmtNumber, formatDate, formatDateTime, fullName } from 'src/utils/whatsappBotUtils'

const SummaryCard = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Typography variant='h6' fontWeight={700} color={color}>
        {value}
      </Typography>
      {sub && (
        <Typography variant='caption' color='text.secondary'>
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
)

const BotUsersPage = ({ onOpenConversation }) => {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // MUI TablePagination is 0-based; the API is 1-based. Converted on the wire.
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)

  // Typing does not fetch. `applied` is what the query uses, and it only
  // changes on Search/Enter — a request per keystroke is wasted round trips.
  const [draft, setDraft] = useState({ search: '', registered: '', start_date: '', end_date: '' })
  const [applied, setApplied] = useState({ search: '', registered: '', start_date: '', end_date: '' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = [
        `limit=${limit}`,
        `page=${page + 1}`,
        applied.search ? `search=${encodeURIComponent(applied.search)}` : '',
        applied.registered ? `registered=${applied.registered}` : '',
        applied.start_date ? `start_date=${applied.start_date}` : '',
        applied.end_date ? `end_date=${applied.end_date}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${waBotUsersUrl}?${params}`)
      setRows(res?.data?.detail || [])
      setTotal(res?.data?.total || 0)
      setSummary(res?.data?.summary || null)
    } catch (err) {
      console.error('WhatsApp bot users error:', err)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [limit, page, applied])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const search = () => {
    setPage(0)
    setApplied(draft)
  }

  const clear = () => {
    const blank = { search: '', registered: '', start_date: '', end_date: '' }
    setDraft(blank)
    setPage(0)
    setApplied(blank)
  }

  /** The chip in the Status column. */
  const statusOf = row => {
    if (row.failed_count > 0) {
      return <Chip label={`${row.failed_count} send failed`} size='small' color='error' sx={{ height: 22, fontSize: 11 }} />
    }
    if (row.current_flow) {
      return (
        <Tooltip title={`${row.current_flow} → ${row.current_step}`} placement='top'>
          <Chip label='In progress' size='small' color='warning' sx={{ height: 22, fontSize: 11 }} />
        </Tooltip>
      )
    }
    if (!row.is_registered) {
      return <Chip label='No account' size='small' variant='outlined' sx={{ height: 22, fontSize: 11 }} />
    }

    return (
      <Typography variant='caption' color='text.disabled'>
        Idle
      </Typography>
    )
  }

  return (
    <Box>
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Conversations' value={fmtNumber(summary.total_chats)} sub='distinct numbers' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Registered users' value={fmtNumber(summary.registered_users)} sub='matched to an account' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Active (7 days)' value={fmtNumber(summary.active_last_7_days)} color='primary.main' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              label='Messages'
              value={fmtNumber(summary.total_messages)}
              sub={`${fmtNumber(summary.inbound_messages)} in / ${fmtNumber(summary.outbound_messages)} out`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Functions created' value={fmtNumber(summary.functions_created)} color='success.main' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              label='Failed sends'
              value={fmtNumber(summary.failed_messages)}
              sub='replies never delivered'
              color={summary.failed_messages > 0 ? 'error.main' : 'text.primary'}
            />
          </Grid>
        </Grid>
      )}

      <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap alignItems='center' sx={{ mb: 3 }}>
        <TextField
          size='small'
          label='Search'
          placeholder='name, mobile or phone number'
          value={draft.search}
          onChange={e => setDraft({ ...draft, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && search()}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size='small'
          label='Account'
          value={draft.registered}
          onChange={e => setDraft({ ...draft, registered: e.target.value })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value=''>All</MenuItem>
          <MenuItem value='true'>Registered</MenuItem>
          <MenuItem value='false'>No account</MenuItem>
        </TextField>
        <TextField
          size='small'
          label='From'
          type='date'
          value={draft.start_date}
          onChange={e => setDraft({ ...draft, start_date: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size='small'
          label='To'
          type='date'
          value={draft.end_date}
          onChange={e => setDraft({ ...draft, end_date: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant='contained' onClick={search}>
          Search
        </Button>
        <Button variant='outlined' color='secondary' onClick={clear}>
          Clear
        </Button>
      </Stack>

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Last message</TableCell>
              <TableCell align='right'>Messages</TableCell>
              <TableCell>Scheduled</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last active</TableCell>
              <TableCell align='right'>&nbsp;</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align='center' sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center' sx={{ py: 6 }}>
                  <Typography color='text.secondary'>No conversations match these filters.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow hover key={row.phone}>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>
                      {fullName(row) || (
                        <Typography component='span' variant='body2' color='text.disabled'>
                          Not registered
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {row.phone}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ maxWidth: 280 }}>
                    <Tooltip title={row.last_message || ''} placement='top'>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {row.last_direction === 'out' ? '↩ ' : ''}
                        {row.last_message || '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography variant='body2' fontWeight={600}>
                      {fmtNumber(row.message_count)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {row.inbound_count} in / {row.outbound_count} out
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {!row.functions_created && !row.reminders_created && !row.family_members_added ? (
                      <Typography variant='caption' color='text.disabled'>
                        —
                      </Typography>
                    ) : (
                      <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                        {row.functions_created > 0 && (
                          <Chip
                            label={`${row.functions_created} function${row.functions_created > 1 ? 's' : ''}`}
                            size='small'
                            color='primary'
                            sx={{ height: 22, fontSize: 11 }}
                          />
                        )}
                        {row.reminders_created > 0 && (
                          <Chip
                            label={`${row.reminders_created} reminder${row.reminders_created > 1 ? 's' : ''}`}
                            size='small'
                            color='success'
                            sx={{ height: 22, fontSize: 11 }}
                          />
                        )}
                        {row.family_members_added > 0 && (
                          <Chip
                            label={`${row.family_members_added} family`}
                            size='small'
                            color='info'
                            sx={{ height: 22, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    )}
                  </TableCell>

                  <TableCell>{statusOf(row)}</TableCell>

                  <TableCell>
                    <Typography variant='body2'>{formatDateTime(row.last_message_at)}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      first {formatDate(row.first_message_at)}
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <Button size='small' variant='outlined' onClick={() => onOpenConversation(row.phone)}>
                      View chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={total}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(e, next) => setPage(next)}
        onRowsPerPageChange={e => {
          setLimit(parseInt(e.target.value, 10))
          setPage(0)
        }}
      />
    </Box>
  )
}

export default BotUsersPage
