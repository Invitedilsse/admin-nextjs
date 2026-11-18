/**
 * What happened to the messages.
 *
 * Two levels: every send you have made, and — when you open one — the delivery
 * state of each campaign it produced, down to the individual guest.
 *
 * A send of 2,500 guests is three ChatWise campaigns, because the panel takes a
 * thousand at a time. They are shown as tabs rather than added together: each
 * has its own uid, its own counts, and its own failures, and summing them would
 * hide which thousand went wrong.
 *
 * ── What the screen is for ───────────────────────────────────────────────
 *
 * Someone says they did not get their invitation. You open this, search their
 * number, and read the reason WhatsApp gave. Everything else on the screen is
 * arranged around making that take ten seconds.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  Grid2 as Grid, IconButton, LinearProgress, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, Download, Refresh, ContentCopy } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet } from 'src/hooks/axios'
import {
  pdfSendListUrl, chatwiseCampaignStatusUrl, chatwiseCampaignRecipientsUrl,
} from 'src/services/pathConst'
import CampaignDelivery from '../../components/CampaignDelivery'

const when = (value) => (value ? new Date(value).toLocaleString() : '—')

/* ═══════════════════════════════════════════════════════════════════════════
 * Every send, and the one you opened
 * ═══════════════════════════════════════════════════════════════════════════ */

const SentCampaigns = () => {
  const [sends, setSends] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(null)
  const [campaignTab, setCampaignTab] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet(pdfSendListUrl)
      setSends(res?.data?.data || [])
    } catch (err) {
      toast.error(err?.message || 'Could not load what has been sent')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (open) {
    const uids = open.campaign_uids || []

    return (
      <Box>
        <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 3 }}>
          <IconButton onClick={() => { setOpen(null); setCampaignTab(0) }}><ArrowBack /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant='subtitle1' fontWeight={700}>{open.title || 'Untitled send'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {open.template_name} · {open.source_file_name} · sent {when(open.created_at)}
            </Typography>
          </Box>
        </Stack>

        {(open.warnings || []).map((w, i) => (
          <Alert key={i} severity='warning' sx={{ mb: 2 }}>{w}</Alert>
        ))}

        {(open.skipped_rows || []).length > 0 && (
          <Alert severity='info' sx={{ mb: 2 }}>
            {open.skipped_rows.length} row{open.skipped_rows.length === 1 ? '' : 's'} in the sheet
            {open.skipped_rows.length === 1 ? ' was' : ' were'} never sent — no usable number or file link.
            Those guests will not appear below at all.
          </Alert>
        )}

        {uids.length === 0 ? (
          <Alert severity='error'>
            This send produced no campaign — nothing was queued. {open.error || ''}
          </Alert>
        ) : (
          <>
            {uids.length > 1 && (
              <>
                <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
                  This send was split into {uids.length} campaigns of up to 1,000 guests each.
                </Typography>
                <Tabs value={campaignTab} onChange={(e, v) => setCampaignTab(v)} sx={{ mb: 3 }}
                      variant='scrollable' scrollButtons='auto'>
                  {uids.map((c, i) => (
                    <Tab key={c.uid} label={`Batch ${c.batch || i + 1} · ${c.recipients}`} />
                  ))}
                </Tabs>
              </>
            )}
            <CampaignDelivery uid={uids[campaignTab]?.uid} />
          </>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction='row' alignItems='center' sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant='subtitle1' fontWeight={700}>Sent campaigns</Typography>
          <Typography variant='caption' color='text.secondary'>
            Open one to see who received it, who read it, and who did not get it.
          </Typography>
        </Box>
        <Button size='small' startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Stack>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Send</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell align='right'>Queued</TableCell>
                  <TableCell align='right'>Not sent</TableCell>
                  <TableCell>Campaigns</TableCell>
                  <TableCell>When</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align='center' sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : sends.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>Nothing has been sent yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : sends.map(row => {
                  const notSent = (row.skipped_before || 0) + (row.skipped_by_panel || 0)

                  return (
                    <TableRow hover key={row.id} sx={{ cursor: 'pointer' }} onClick={() => setOpen(row)}>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>{row.title || 'Untitled'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{row.source_file_name}</Typography>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{row.template_name}</Typography></TableCell>
                      <TableCell align='right'><Typography variant='body2' fontWeight={600}>{row.queued}</Typography></TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' color={notSent ? 'error.main' : 'text.disabled'}>
                          {notSent || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size='small' sx={{ height: 22, fontSize: 11 }}
                              color={row.status === 'sent' ? 'success' : row.status === 'failed' ? 'error' : 'warning'}
                              label={(row.campaign_uids || []).length || 'none'} />
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>{when(row.created_at)}</Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SentCampaigns
