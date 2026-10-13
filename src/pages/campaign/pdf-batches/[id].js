/**
 * One batch: how far it has got, who failed and why, and the export.
 *
 * The export is the point of the whole screen — it is the sheet that feeds the
 * WhatsApp send, with a link to each guest's file on it. Everything else here
 * exists so you can be sure that sheet is worth sending before you send it.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid2 as Grid,
  IconButton, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, Download, Refresh, OpenInNew } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet, apiPost, getAccessToken } from 'src/hooks/axios'
import { pdfBatchUrl, pdfBatchRowsUrl, pdfBatchRetryUrl, pdfBatchExportUrl } from 'src/services/pathConst'
import { STATUS_COLOUR, STATUS_LABEL } from 'src/utils/pdfBatchStatus'

const Tile = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, px: 2, pb: '12px !important' }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography variant='h6' fontWeight={700} color={color}>{value}</Typography>
      {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
    </CardContent>
  </Card>
)

const PdfBatchDetail = () => {
  const router = useRouter()
  const { id } = router.query

  const [batch, setBatch] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(25)
  const [draft, setDraft] = useState({ status: '', search: '' })
  const [applied, setApplied] = useState({ status: '', search: '' })
  const [loadingRows, setLoadingRows] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadBatch = useCallback(async () => {
    if (!id) return
    try {
      const res = await apiGet(`${pdfBatchUrl}/${id}`)
      setBatch(res?.data?.data || null)
    } catch (err) {
      toast.error(err?.message || 'Could not load the batch')
    }
  }, [id])

  const loadRows = useCallback(async () => {
    if (!id) return
    setLoadingRows(true)
    try {
      const qs = [
        `page=${page + 1}`, `limit=${limit}`,
        applied.status ? `status=${applied.status}` : '',
        applied.search ? `search=${encodeURIComponent(applied.search)}` : '',
      ].filter(Boolean).join('&')

      const res = await apiGet(`${pdfBatchRowsUrl(id)}?${qs}`)
      setRows(res?.data?.data || [])
      setTotal(res?.data?.total || 0)
    } catch (err) {
      toast.error(err?.message || 'Could not load rows')
    } finally {
      setLoadingRows(false)
    }
  }, [id, page, limit, applied])

  useEffect(() => { loadBatch() }, [loadBatch])
  useEffect(() => { loadRows() }, [loadRows])

  // Poll the summary only while it is still working. The row table is heavier
  // and is only refreshed when someone asks for it, or when the run finishes.
  const busy = batch?.status === 'processing' || batch?.status === 'queued'
  useEffect(() => {
    if (!busy) return

    const timer = setInterval(async () => {
      await loadBatch()
    }, 4000)

    return () => clearInterval(timer)
  }, [busy, loadBatch])

  // One refresh of the table at the moment it settles, so the last few rows
  // appear without anyone clicking.
  const settled = batch?.status && !busy
  useEffect(() => { if (settled) loadRows() /* eslint-disable-next-line */ }, [settled])

  const done = (batch?.generated || 0) + (batch?.failed || 0)
  const pct = batch?.total ? Math.round((done / batch.total) * 100) : 0
  const failedPct = batch?.total ? ((batch.failed || 0) / batch.total) * 100 : 0

  const retry = async () => {
    try {
      const res = await apiPost(pdfBatchRetryUrl(id), {})
      toast.success(res?.data?.message || 'Retrying')
      loadBatch()
    } catch (err) {
      toast.error(err?.message || String(err) || 'Nothing to retry')
    }
  }

  /**
   * The export comes back as a file, not JSON, so it goes around the shared
   * helper — that one parses every response as JSON and would mangle a
   * spreadsheet into an unopenable file.
   */
  const download = async () => {
    setExporting(true)
    try {
      const token = await getAccessToken()
      const res = await axios.get(pdfBatchExportUrl(id), {
        responseType: 'blob',
        headers: { authorization: token || '' },
      })

      const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || 'recipients.xlsx'
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = name
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)

      const days = res.headers['x-link-ttl-days']
      toast.success(
        days
          ? `Downloaded. The links in it stop working in ${days} days — send before then.`
          : 'Downloaded'
      )
    } catch (err) {
      toast.error('Could not build the export')
    } finally {
      setExporting(false)
    }
  }

  const counts = batch?.counts || {}

  if (!batch) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
  }

  return (
    <Box>
      <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 3 }}>
        <IconButton onClick={() => router.push('/campaign/whatsapp-pdf?tab=1')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant='h6' fontWeight={700}>{batch.title || 'Untitled batch'}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {batch.template_name} · {batch.source_file_name}
          </Typography>
        </Box>
        <Chip
          size='small' color={STATUS_COLOUR[batch.status] || 'default'}
          label={STATUS_LABEL[batch.status] || batch.status}
        />
        {batch.failed > 0 && (
          <Button startIcon={<Refresh />} onClick={retry}>Retry {batch.failed} failed</Button>
        )}
        <Button
          variant='contained' startIcon={<Download />} onClick={download}
          disabled={exporting || !batch.generated}
        >
          {exporting ? 'Building…' : 'Download for sending'}
        </Button>
      </Stack>

      {busy && (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Stack direction='row' alignItems='center' spacing={2}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress variant='determinate' value={pct} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              <Typography variant='body2' fontWeight={600}>{done} / {batch.total}</Typography>
            </Stack>
            <Typography variant='caption' color='text.secondary'>
              Still generating. This page updates itself; you can leave it and come back.
            </Typography>
          </CardContent>
        </Card>
      )}

      {batch.error && <Alert severity='error' sx={{ mb: 3 }}>{batch.error}</Alert>}

      {batch.with_warnings > 0 && (
        <Alert severity='warning' sx={{ mb: 3 }}>
          {batch.with_warnings} file{batch.with_warnings === 1 ? ' was' : 's were'} generated with something
          to report — a value that did not fit its box, or a character the font cannot print.
          Filter the table by that row&apos;s note before sending.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}><Tile label='Guests' value={batch.total || 0} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Tile label='Generated' value={counts.done || 0} color='success.main' sub='ready to send' />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Tile
            label='Failed' value={counts.failed || 0}
            color={(counts.failed || 0) > 0 ? 'error.main' : 'text.primary'}
            sub={batch.total ? `${failedPct.toFixed(1)}% of the list` : ''}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Tile label='Still to do' value={counts.pending || 0} />
        </Grid>
      </Grid>

      <Stack direction='row' spacing={2} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <TextField
          select size='small' label='Show' value={draft.status} sx={{ minWidth: 160 }}
          onChange={(e) => { const v = e.target.value; setDraft({ ...draft, status: v }); setPage(0); setApplied({ ...applied, status: v }) }}
        >
          <MenuItem value=''>Everyone</MenuItem>
          <MenuItem value='done'>Generated</MenuItem>
          <MenuItem value='failed'>Failed</MenuItem>
          <MenuItem value='pending'>Still to do</MenuItem>
        </TextField>
        <TextField
          size='small' label='Search' placeholder='name or number' value={draft.search}
          onChange={(e) => setDraft({ ...draft, search: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); setApplied(draft) } }}
          sx={{ minWidth: 220 }}
        />
        <Button variant='contained' onClick={() => { setPage(0); setApplied(draft) }}>Search</Button>
        <Button variant='outlined' color='secondary' onClick={loadRows}>Refresh</Button>
      </Stack>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>#</TableCell>
                  <TableCell>Guest</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell align='right'>File</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingRows ? (
                  <TableRow><TableCell colSpan={5} align='center' sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>Nothing matches these filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((r) => (
                  <TableRow hover key={r.id}>
                    <TableCell><Typography variant='caption' color='text.secondary'>{r.row_index}</Typography></TableCell>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{r.name || '—'}</Typography>
                      <Typography variant='caption' color='text.secondary'>{r.phone || 'no usable number'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small' sx={{ height: 22, fontSize: 11 }}
                        color={r.status === 'done' ? 'success' : r.status === 'failed' ? 'error' : 'default'}
                        variant={r.status === 'done' ? 'outlined' : 'filled'}
                        label={r.status === 'done' ? 'Generated' : r.status === 'failed' ? 'Failed' : 'Waiting'}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 380 }}>
                      <Tooltip title={r.error || (r.warnings || []).join(' · ') || ''}>
                        <Typography
                          variant='caption'
                          color={r.error ? 'error.main' : (r.warnings || []).length ? 'warning.main' : 'text.secondary'}
                        >
                          {r.error || (r.warnings || []).join(' · ') || '—'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align='right'>
                      {r.pdf_url && (
                        <Tooltip title='Open this guest&apos;s file'>
                          <IconButton size='small' onClick={() => window.open(r.pdf_url, '_blank', 'noopener')}>
                            <OpenInNew fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div' count={total} page={page} rowsPerPage={limit}
            rowsPerPageOptions={[25, 50, 100, 250]}
            onPageChange={(e, next) => setPage(next)}
            onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0) }}
          />
        </CardContent>
      </Card>

      <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 3 }}>
        The download is your original sheet with three columns added — phone_number, header_document and
        header_document_name — named exactly as the WhatsApp send expects them. The links in it are signed
        for seven days, which is the longest AWS will sign for, so export it shortly before you send.
      </Typography>
    </Box>
  )
}

export default PdfBatchDetail
