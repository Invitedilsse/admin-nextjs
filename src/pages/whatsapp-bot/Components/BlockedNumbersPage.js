/**
 * Tab 3 — the block list.
 *
 * Currently blocked at the top, then numbers that have been released, so the
 * live list is what you see first and the history sits below it.
 *
 * "Replies stopped" is the one figure on this screen that measures the feature
 * itself: every reply the bot would have sent to a blocked number is still
 * written to the transcript, marked as withheld, so this counts exactly what
 * blocking has saved. It is not an estimate.
 *
 * The number can also be typed in directly — a number that has never messaged
 * the bot will not be in the Users tab to click, and blocking it in advance is
 * a legitimate thing to want.
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
import { waBotBlockedUrl } from 'src/services/pathConst'
import { fmtNumber, formatDateTime, fullName } from 'src/utils/whatsappBotUtils'
import BlockNumberDialog from './BlockNumberDialog'

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

const BlockedNumbersPage = ({ onOpenConversation }) => {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)

  const [draft, setDraft] = useState({ search: '', active: 'true' })
  const [applied, setApplied] = useState({ search: '', active: 'true' })

  // { mode, phone, name } while the confirmation is open.
  const [dialog, setDialog] = useState(null)

  // The "block a number that has never messaged" box.
  const [manual, setManual] = useState('')

  const fetchBlocked = useCallback(async () => {
    setLoading(true)
    try {
      const params = [
        `limit=${limit}`,
        `page=${page + 1}`,
        applied.search ? `search=${encodeURIComponent(applied.search)}` : '',
        applied.active ? `active=${applied.active}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${waBotBlockedUrl}?${params}`)
      setRows(res?.data?.detail || [])
      setTotal(res?.data?.total || 0)
      setSummary(res?.data?.summary || null)
    } catch (err) {
      console.error('WhatsApp bot blocked list error:', err)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [limit, page, applied])

  useEffect(() => {
    fetchBlocked()
  }, [fetchBlocked])

  const search = () => {
    setPage(0)
    setApplied(draft)
  }

  const clear = () => {
    const blank = { search: '', active: 'true' }
    setDraft(blank)
    setPage(0)
    setApplied(blank)
  }

  return (
    <Box>
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <SummaryCard
              label='Blocked now'
              value={fmtNumber(summary.blocked_now)}
              sub='the bot will not reply'
              color={summary.blocked_now > 0 ? 'error.main' : 'text.primary'}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <SummaryCard label='Released' value={fmtNumber(summary.released)} sub='blocked, then unblocked' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <SummaryCard
              label='Replies stopped'
              value={fmtNumber(summary.replies_suppressed)}
              sub='messages the bot did not send'
              color='success.main'
            />
          </Grid>
        </Grid>
      )}

      {/* Block a number that is not in the Users tab yet. */}
      <Card variant='outlined' sx={{ mb: 4 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant='subtitle2' fontWeight={600} gutterBottom>
            Block a number directly
          </Typography>
          <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
            Any format works — +91 97890 31773, 9789031773 or 919789031773 are the same number.
          </Typography>
          <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' useFlexGap>
            <TextField
              size='small'
              label='Phone number'
              placeholder='+91 97890 31773'
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && manual.trim() && setDialog({ mode: 'block', phone: manual.trim() })}
              sx={{ minWidth: 240 }}
            />
            <Button
              variant='contained'
              color='error'
              disabled={!manual.trim()}
              onClick={() => setDialog({ mode: 'block', phone: manual.trim() })}
            >
              Block
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap alignItems='center' sx={{ mb: 3 }}>
        <TextField
          size='small'
          label='Search'
          placeholder='number, name or reason'
          value={draft.search}
          onChange={e => setDraft({ ...draft, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && search()}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size='small'
          label='State'
          value={draft.active}
          onChange={e => setDraft({ ...draft, active: e.target.value })}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value='true'>Blocked now</MenuItem>
          <MenuItem value='false'>Released</MenuItem>
          <MenuItem value=''>All</MenuItem>
        </TextField>
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
              <TableCell>Number</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align='right'>Sent to bot</TableCell>
              <TableCell align='right'>Replies stopped</TableCell>
              <TableCell>Last action</TableCell>
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
                  <Typography color='text.secondary'>
                    {applied.active === 'true'
                      ? 'No numbers are blocked. The bot is answering everyone.'
                      : 'Nothing matches these filters.'}
                  </Typography>
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

                  <TableCell>
                    {row.is_blocked ? (
                      <Chip label='Blocked' size='small' color='error' sx={{ height: 22, fontSize: 11 }} />
                    ) : (
                      <Chip
                        label='Released'
                        size='small'
                        variant='outlined'
                        color='success'
                        sx={{ height: 22, fontSize: 11 }}
                      />
                    )}
                  </TableCell>

                  <TableCell sx={{ maxWidth: 260 }}>
                    <Tooltip title={row.reason || ''} placement='top'>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {row.reason || '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography variant='body2'>{fmtNumber(row.inbound_count)}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {row.last_message_at ? formatDateTime(row.last_message_at) : 'never'}
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      fontWeight={600}
                      color={row.suppressed_count > 0 ? 'success.main' : 'text.disabled'}
                    >
                      {fmtNumber(row.suppressed_count)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant='body2'>
                      {row.is_blocked
                        ? formatDateTime(row.blocked_at)
                        : formatDateTime(row.unblocked_at)}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      by {(row.is_blocked ? row.blocked_by_name : row.unblocked_by_name) || 'unknown'}
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <Stack direction='row' spacing={1} justifyContent='flex-end'>
                      <Button size='small' variant='text' onClick={() => onOpenConversation(row.phone)}>
                        View chat
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        color={row.is_blocked ? 'success' : 'error'}
                        onClick={() =>
                          setDialog({
                            mode: row.is_blocked ? 'unblock' : 'block',
                            phone: row.phone,
                            name: fullName(row)
                          })
                        }
                      >
                        {row.is_blocked ? 'Unblock' : 'Block'}
                      </Button>
                    </Stack>
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

      <BlockNumberDialog
        open={!!dialog}
        mode={dialog?.mode}
        phone={dialog?.phone}
        name={dialog?.name}
        onClose={() => setDialog(null)}
        onDone={() => {
          setManual('')
          fetchBlocked()
        }}
      />
    </Box>
  )
}

export default BlockedNumbersPage
