/**
 * Batch list, and the screen that starts one.
 *
 * A batch is one template run over one guest list. Starting it returns
 * immediately — a thousand files take minutes — so the row appears as
 * "processing" and the detail screen polls it.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, LinearProgress, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import { pdfBatchUrl, pdfTemplateUrl } from 'src/services/pathConst'
import { STATUS_COLOUR, STATUS_LABEL } from 'src/utils/pdfBatchStatus'

const PdfBatches = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [form, setForm] = useState({ templateId: '', title: '', phoneColumn: '', nameColumn: '' })
  const [file, setFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, t] = await Promise.all([apiGet(pdfBatchUrl), apiGet(pdfTemplateUrl)])
      setRows(b?.data?.data || [])
      setTemplates((t?.data?.data || []).filter((x) => x.field_count > 0))
    } catch (err) {
      toast.error(err?.message || 'Could not load batches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // While anything is still generating, refresh the list so the operator does
  // not have to. Stops on its own once everything has settled.
  useEffect(() => {
    const busy = rows.some((r) => r.status === 'processing' || r.status === 'queued')
    if (!busy) return

    const timer = setInterval(load, 5000)

    return () => clearInterval(timer)
  }, [rows, load])

  const start = async () => {
    if (!form.templateId) return toast.error('Choose a template')
    if (!file) return toast.error('Choose a guest list')

    setStarting(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('templateId', form.templateId)
      if (form.title.trim()) body.append('title', form.title.trim())
      if (form.phoneColumn.trim()) body.append('phoneColumn', form.phoneColumn.trim())
      if (form.nameColumn.trim()) body.append('nameColumn', form.nameColumn.trim())

      const res = await apiPost(pdfBatchUrl, body, true)
      toast.success(res?.data?.message || 'Started')

      setOpen(false); setFile(null)
      const id = res?.data?.data?.batch_id
      if (id) router.push(`/campaign/pdf-batches/${id}`)
      else load()
    } catch (err) {
      // The server names the missing column when a field reads one the sheet
      // does not have — that message is the whole point of the failure.
      toast.error(err?.message || String(err) || 'Could not start the batch')
    } finally {
      setStarting(false)
    }
  }

  return (
    <Box>
      <Stack direction='row' alignItems='center' sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant='caption' color='text.secondary'>
            One template, one guest list, one personalised file per guest.
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)}>New batch</Button>
      </Stack>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Batch</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell sx={{ width: 220 }}>Progress</TableCell>
                  <TableCell>Started</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align='center' sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>Nothing generated yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((b) => {
                  const done = (b.generated || 0) + (b.failed || 0)
                  const pct = b.total ? Math.round((done / b.total) * 100) : 0

                  return (
                    <TableRow
                      hover key={b.id} sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/campaign/pdf-batches/${b.id}`)}
                    >
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>{b.title || 'Untitled'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{b.source_file_name}</Typography>
                      </TableCell>
                      <TableCell><Typography variant='body2'>{b.template_name || '—'}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          size='small' sx={{ height: 22, fontSize: 11 }}
                          color={STATUS_COLOUR[b.status] || 'default'}
                          label={STATUS_LABEL[b.status] || b.status}
                        />
                      </TableCell>
                      <TableCell>
                        <LinearProgress
                          variant='determinate' value={pct}
                          color={b.failed > 0 ? 'warning' : 'primary'}
                          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                        />
                        <Typography variant='caption' color='text.secondary'>
                          {b.generated || 0} of {b.total || 0}
                          {b.failed > 0 ? ` · ${b.failed} failed` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>
                          {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={starting ? undefined : () => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>New batch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select size='small' label='Template' value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              helperText={templates.length ? 'Only templates with fields on them are listed' : 'No template has fields on it yet'}
            >
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name} — {t.field_count} fields</MenuItem>
              ))}
            </TextField>

            <TextField
              size='small' label='Batch title' value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder='Wedding invites — batch 1'
            />

            <Button variant='outlined' component='label'>
              {file ? file.name : 'Choose the guest list (.xlsx or .csv)'}
              <input hidden type='file' accept='.xlsx,.xls,.csv'
                     onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>

            <Stack direction='row' spacing={1}>
              <TextField
                size='small' label='Phone column' value={form.phoneColumn} sx={{ flex: 1 }}
                onChange={(e) => setForm({ ...form, phoneColumn: e.target.value })}
                placeholder='leave blank to detect'
              />
              <TextField
                size='small' label='Name column' value={form.nameColumn} sx={{ flex: 1 }}
                onChange={(e) => setForm({ ...form, nameColumn: e.target.value })}
                placeholder='leave blank to detect'
              />
            </Stack>

            <Typography variant='caption' color='text.secondary'>
              Every field on the template must find its column in this sheet. If one is missing
              the batch is refused before anything is generated, and the message names it.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOpen(false)} disabled={starting}>Cancel</Button>
          <Button variant='contained' onClick={start} disabled={starting || !file || !form.templateId}>
            {starting ? 'Starting…' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PdfBatches
