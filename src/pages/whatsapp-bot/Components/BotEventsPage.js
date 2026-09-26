/**
 * Tab 2 — everything the bot put on a calendar.
 *
 * wa_bot_actions is the index of what the bot created; the API joins the live
 * `function` / `family_reminders` rows onto it, so this list shows the CURRENT
 * state:
 *
 *   - a record renamed in the app since shows its new name, with the name the
 *     bot saved underneath
 *   - a record deleted in the app shows as Deleted rather than vanishing, which
 *     is the difference between "the bot never saved it" and "it saved and was
 *     removed later" — the question this tab exists to answer
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
  Typography
} from '@mui/material'

import { apiGet } from 'src/hooks/axios'
import { waBotEventsUrl } from 'src/services/pathConst'
import {
  ACTION_COLOR,
  ACTION_LABEL,
  describeAction,
  fmtNumber,
  formatDateTime,
  fullName
} from 'src/utils/whatsappBotUtils'

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

const BotEventsPage = ({ onOpenConversation }) => {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)

  const [draft, setDraft] = useState({ search: '', action: '', start_date: '', end_date: '' })
  const [applied, setApplied] = useState({ search: '', action: '', start_date: '', end_date: '' })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = [
        `limit=${limit}`,
        `page=${page + 1}`,
        applied.search ? `search=${encodeURIComponent(applied.search)}` : '',
        applied.action ? `action=${applied.action}` : '',
        applied.start_date ? `start_date=${applied.start_date}` : '',
        applied.end_date ? `end_date=${applied.end_date}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${waBotEventsUrl}?${params}`)
      setRows(res?.data?.detail || [])
      setTotal(res?.data?.total || 0)
      setSummary(res?.data?.summary || null)
    } catch (err) {
      console.error('WhatsApp bot events error:', err)
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [limit, page, applied])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const search = () => {
    setPage(0)
    setApplied(draft)
  }

  const clear = () => {
    const blank = { search: '', action: '', start_date: '', end_date: '' }
    setDraft(blank)
    setPage(0)
    setApplied(blank)
  }

  return (
    <Box>
      {summary && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Created by the bot' value={fmtNumber(summary.total)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Offline functions' value={fmtNumber(summary.functions)} color='primary.main' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Reminders' value={fmtNumber(summary.reminders)} color='success.main' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Family members' value={fmtNumber(summary.family_members)} color='info.main' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Users' value={fmtNumber(summary.users)} sub='with something scheduled' />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard label='Last 7 days' value={fmtNumber(summary.last_7_days)} />
          </Grid>
        </Grid>
      )}

      <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap alignItems='center' sx={{ mb: 3 }}>
        <TextField
          size='small'
          label='Search'
          placeholder='title, user or phone'
          value={draft.search}
          onChange={e => setDraft({ ...draft, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && search()}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size='small'
          label='Type'
          value={draft.action}
          onChange={e => setDraft({ ...draft, action: e.target.value })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value=''>All</MenuItem>
          <MenuItem value='offline-function'>Offline functions</MenuItem>
          <MenuItem value='reminder'>Reminders</MenuItem>
          <MenuItem value='family-member'>Family members</MenuItem>
          <MenuItem value='family-invite'>Add-back invites</MenuItem>
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
              <TableCell>Type</TableCell>
              <TableCell>What was created</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Still there?</TableCell>
              <TableCell>Created by bot</TableCell>
              <TableCell align='right'>&nbsp;</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                  <Typography color='text.secondary'>Nothing scheduled in this period.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                // live_title is the CURRENT name; title is what the bot saved.
                // When they differ someone renamed it in the app afterwards.
                const renamed = row.live_title && row.live_title !== row.title
                const description = describeAction(row)

                return (
                  <TableRow hover key={row.id}>
                    <TableCell>
                      <Chip
                        label={ACTION_LABEL[row.action] || row.action}
                        size='small'
                        variant='outlined'
                        color={ACTION_COLOR[row.action] || 'default'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>

                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant='body2' fontWeight={600}>
                        {row.live_title || row.title || '(untitled)'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {renamed ? `created as "${row.title}"` : ''}
                        {renamed && description ? ' · ' : ''}
                        {description}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant='body2'>{fullName(row) || '—'}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.phone || row.mobile || ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {row.is_live === false ? (
                        <Chip label='Deleted' size='small' color='error' sx={{ height: 22, fontSize: 11 }} />
                      ) : (
                        <Chip label='Live' size='small' sx={{ height: 22, fontSize: 11 }} />
                      )}
                    </TableCell>

                    <TableCell>{formatDateTime(row.created_at)}</TableCell>

                    <TableCell align='right'>
                      {row.phone ? (
                        <Button size='small' variant='outlined' onClick={() => onOpenConversation(row.phone)}>
                          View chat
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
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

export default BotEventsPage
