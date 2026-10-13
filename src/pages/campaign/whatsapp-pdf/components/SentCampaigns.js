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
import {
  STATUS_META, STATUS_ORDER, summarise, isStillMoving, deliveryBar,
  failureFileName, toCsv,
} from 'src/utils/campaignDelivery'

const when = (value) => (value ? new Date(value).toLocaleString() : '—')

const Tile = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, px: 2, pb: '12px !important' }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography variant='h6' fontWeight={700} color={color}>{value}</Typography>
      {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
    </CardContent>
  </Card>
)

/* ═══════════════════════════════════════════════════════════════════════════
 * One campaign's delivery
 * ═══════════════════════════════════════════════════════════════════════════ */

const CampaignDelivery = ({ uid }) => {
  const [status, setStatus] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(50)
  const [draft, setDraft] = useState({ status: '', search: '' })
  const [applied, setApplied] = useState({ status: '', search: '' })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadStatus = useCallback(async () => {
    if (!uid) return
    try {
      const res = await apiGet(chatwiseCampaignStatusUrl(uid))
      setStatus(res?.data?.data || res?.data || null)
    } catch (err) {
      toast.error(err?.message || 'Could not read the campaign status')
    }
  }, [uid])

  const loadRows = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const qs = [
        `page=${page + 1}`, `per_page=${limit}`,
        applied.status ? `status=${applied.status}` : '',
        applied.search ? `search=${encodeURIComponent(applied.search)}` : '',
      ].filter(Boolean).join('&')

      const res = await apiGet(`${chatwiseCampaignRecipientsUrl(uid)}?${qs}`)
      const data = res?.data?.data || res?.data || {}
      setRows(data.recipients || [])
      setTotal(data.pagination?.total ?? (data.recipients || []).length)
      // campaign-recipients carries counts too, and they are fresher than the
      // status call if that one has not come back yet.
      if (data.counts) setStatus(prev => ({ ...(prev || {}), counts: data.counts, campaign: data.campaign }))
    } catch (err) {
      toast.error(err?.message || 'Could not read the recipients')
    } finally {
      setLoading(false)
    }
  }, [uid, page, limit, applied])

  useEffect(() => { loadStatus() }, [loadStatus])
  useEffect(() => { loadRows() }, [loadRows])

  const counts = status?.counts || status?.data?.counts || {}
  const s = useMemo(() => summarise(counts), [counts])
  const moving = isStillMoving(counts)

  // Only while something can still change. A settled campaign polled all
  // afternoon is a lot of calls against an account that is also sending.
  useEffect(() => {
    if (!moving) return
    const timer = setInterval(loadStatus, 30000)

    return () => clearInterval(timer)
  }, [moving, loadStatus])

  /**
   * Every failure, not just this page of them.
   *
   * Walks status=failed across all pages before writing the file — a CSV of
   * "the fifty failures that happened to be on screen" is worse than none,
   * because it looks complete.
   */
  const downloadFailures = async () => {
    setExporting(true)
    try {
      const all = []
      let p = 1
      let lastPage = 1

      do {
        const res = await apiGet(`${chatwiseCampaignRecipientsUrl(uid)}?status=failed&per_page=500&page=${p}`)
        const data = res?.data?.data || res?.data || {}
        all.push(...(data.recipients || []))
        lastPage = data.pagination?.last_page || 1
        p += 1
      } while (p <= lastPage && p <= 40)   // 20,000 rows is a generous ceiling

      if (!all.length) return toast.success('Nothing failed on this campaign')

      const blob = new Blob([toCsv(all)], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = failureFileName(status?.campaign || {})
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`${all.length} failure(s) downloaded`)
    } catch (err) {
      toast.error(err?.message || 'Could not build the file')
    } finally {
      setExporting(false)
    }
  }

  const bar = deliveryBar(counts)

  return (
    <Box>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Typography variant='body2' color='text.secondary'>Campaign</Typography>
        <Chip size='small' label={uid} sx={{ fontFamily: 'monospace', fontSize: 11 }}
              onDelete={() => { navigator.clipboard?.writeText(uid); toast.success('Copied') }}
              deleteIcon={<ContentCopy sx={{ fontSize: 14 }} />} />
        {status?.campaign?.template_name && (
          <Chip size='small' variant='outlined' label={status.campaign.template_name} />
        )}
        <Box sx={{ flex: 1 }} />
        {moving && <Chip size='small' color='warning' label='still sending — refreshing every 30s' />}
        <Button size='small' startIcon={<Refresh />} onClick={() => { loadStatus(); loadRows() }}>Refresh</Button>
        <Button size='small' variant='outlined' startIcon={<Download />}
                onClick={downloadFailures} disabled={exporting || !s.bad}>
          {exporting ? 'Collecting…' : `Download ${s.bad} failed`}
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}><Tile label='Messages' value={s.total} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <Tile label='Reached the guest' value={s.reached} color='success.main'
                sub={`${s.reachedPct.toFixed(1)}% · delivered + read`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <Tile label='Read' value={s.by.read} color='success.main' sub={`${s.readPct.toFixed(1)}%`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
          <Tile label='Failed' value={s.bad} color={s.bad ? 'error.main' : 'text.primary'}
                sub={`${s.failedPct.toFixed(1)}% of the campaign`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
          <Tile label='Still moving' value={s.inFlight}
                color={s.inFlight ? 'warning.main' : 'text.primary'}
                sub={s.settled ? 'nothing left to wait for' : 'queued or processing'} />
        </Grid>
      </Grid>

      {bar.length > 0 && (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Stack direction='row' sx={{ height: 12, borderRadius: 6, overflow: 'hidden', mb: 1.5 }}>
              {bar.map(part => (
                <Tooltip key={part.key} title={`${part.key}: ${part.value}`}>
                  <Box sx={{ width: `${part.pct}%`, bgcolor: part.colour }} />
                </Tooltip>
              ))}
            </Stack>
            <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
              {STATUS_ORDER.filter(k => s.by[k] > 0).map(k => (
                <Stack key={k} direction='row' spacing={0.75} alignItems='center'>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: STATUS_META[k].colour }} />
                  <Typography variant='caption'>
                    <strong>{s.by[k]}</strong> {STATUS_META[k].label.toLowerCase()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {s.bad > 0 && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {s.bad} message{s.bad === 1 ? '' : 's'} did not arrive. Filter to <strong>Failed</strong> below —
          WhatsApp gives a reason per guest, and it is usually the same one for all of them.
        </Alert>
      )}

      <Stack direction='row' spacing={2} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <TextField select size='small' label='Show' value={draft.status} sx={{ minWidth: 170 }}
                   onChange={e => { const v = e.target.value; setDraft({ ...draft, status: v }); setPage(0); setApplied({ ...applied, status: v }) }}>
          <MenuItem value=''>Everyone</MenuItem>
          {STATUS_ORDER.map(k => (
            <MenuItem key={k} value={k}>
              {STATUS_META[k].label}{s.by[k] ? ` (${s.by[k]})` : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField size='small' label='Search' placeholder='phone or name' value={draft.search}
                   onChange={e => setDraft({ ...draft, search: e.target.value })}
                   onKeyDown={e => { if (e.key === 'Enter') { setPage(0); setApplied(draft) } }}
                   sx={{ minWidth: 240 }} />
        <Button variant='contained' onClick={() => { setPage(0); setApplied(draft) }}>Search</Button>
      </Stack>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>What WhatsApp said</TableCell>
                  <TableCell>Last update</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align='center' sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>Nothing matches these filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((r, i) => {
                  const meta = STATUS_META[r.status] || { label: r.status, colour: 'text.secondary' }

                  return (
                    <TableRow hover key={`${r.phone_number}-${i}`}>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>{r.full_name || '—'}</Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
                          {r.phone_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size='small' sx={{ height: 22, fontSize: 11 }} label={meta.label}
                              color={meta.tone === 'bad' ? 'error' : meta.tone === 'moving' ? 'warning' : 'success'}
                              variant={meta.tone === 'good' ? 'outlined' : 'filled'} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 460 }}>
                        <Typography variant='caption' color={r.error_message ? 'error.main' : 'text.secondary'}>
                          {r.error_message || meta.note || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>
                          {when(r.updated_at || r.messaged_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div' count={total} page={page} rowsPerPage={limit}
            rowsPerPageOptions={[25, 50, 100, 250]}
            onPageChange={(e, next) => setPage(next)}
            onRowsPerPageChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(0) }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

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
