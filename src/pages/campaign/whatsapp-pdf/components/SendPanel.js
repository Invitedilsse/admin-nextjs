/**
 * Send the exported sheet.
 *
 * The last step: upload the spreadsheet the batch screen produced, say which
 * WhatsApp template to use and which column fills each of its variables, then
 * send.
 *
 * The screen is built around one fact — ChatWise charges the wallet for the
 * whole batch UP FRONT and nothing is retried. So everything that can be known
 * before the money is spent is shown before the button: how many rows can
 * actually be sent, who cannot and why, and whether the file links are still
 * alive. The Send button is the last thing you reach, not the first.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Alert, AlertTitle, Box, Button, Card, CardContent, Checkbox, Chip,
  CircularProgress, Divider, FormControlLabel, Grid2 as Grid, IconButton,
  MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material'
import { Send, UploadFile, Add, DeleteOutline } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import {
  chatwiseTemplatesUrl, pdfSendInspectUrl, pdfSendUrl,
} from 'src/services/pathConst'

const MAX_FIELDS = 10

const Tile = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, px: 2, pb: '12px !important' }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography variant='h6' fontWeight={700} color={color}>{value}</Typography>
      {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
    </CardContent>
  </Card>
)

const PdfSend = () => {
  const [file, setFile] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [reading, setReading] = useState(false)

  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({
    templateName: '', templateLanguage: 'en', fromPhoneNumberId: '', title: '',
  })
  const [createContacts, setCreateContacts] = useState(true)

  // [{ key: 'field_1', source: 'column'|'text', column: 'Guest Name', value: '' }]
  // in the template's own order.
  //
  // `source` is held separately from the two inputs so switching back and forth
  // does not throw away what was typed in the other one — an operator who tries
  // fixed text, changes their mind, and changes back should find their sentence
  // still there.
  const [fields, setFields] = useState([])

  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    apiGet(`${chatwiseTemplatesUrl}?page=1&page_size=200`)
      .then(res => setTemplates(res?.data?.data?.templateList?.data || []))
      .catch(err => toast.error(err?.message || 'Could not load templates from ChatWise'))
  }, [])

  const read = useCallback(async (chosen) => {
    if (!chosen) return
    setReading(true); setSheet(null); setResult(null)
    try {
      const body = new FormData()
      body.append('file', chosen)
      const res = await apiPost(pdfSendInspectUrl, body, true)
      const data = res?.data?.data
      setSheet(data)

      // A first guess at the mapping, so a straightforward sheet needs no
      // fiddling: the name column is almost always field_1.
      if (data?.name_column) {
        setFields([{ key: 'field_1', source: 'column', column: data.name_column, value: '' }])
      }
    } catch (err) {
      toast.error(err?.message || String(err) || 'Could not read that sheet')
    } finally {
      setReading(false)
    }
  }, [])

  const choose = (e) => {
    const chosen = e.target.files?.[0] || null
    setFile(chosen)
    read(chosen)
  }

  const setField = (i, patch) =>
    setFields(prev => prev.map((f, n) => (n === i ? { ...f, ...patch } : f)))

  const addField = () =>
    setFields(prev => [...prev, { key: `field_${prev.length + 1}`, source: 'column', column: '', value: '' }])

  const send = async () => {
    if (!form.templateName) return toast.error('Pick a template')
    if (!file) return toast.error('Upload the sheet')

    setSending(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('templateName', form.templateName)
      body.append('templateLanguage', form.templateLanguage || 'en')
      if (form.fromPhoneNumberId.trim()) body.append('fromPhoneNumberId', form.fromPhoneNumberId.trim())
      if (form.title.trim()) body.append('title', form.title.trim())
      body.append('createContacts', createContacts ? 'true' : 'false')
      // { field_1: { column: 'Guest Name' }, field_2: { value: '12 Jan 2027' } }
      // — the server takes either, and fixed text wins if both are present.
      const mapped = fields
        .filter(f => f.key && (f.source === 'text' ? String(f.value || '').trim() : f.column))
        .map(f => [f.key, f.source === 'text' ? { value: f.value.trim() } : { column: f.column }])
      body.append('fields', JSON.stringify(Object.fromEntries(mapped)))

      const res = await apiPost(pdfSendUrl, body, true)
      setResult(res?.data?.data || null)
      toast.success(res?.data?.message || 'Sent')
    } catch (err) {
      toast.error(err?.message || String(err) || 'The send was refused')
    } finally {
      setSending(false)
    }
  }

  const expired = (sheet?.warnings || []).some(w => w.includes('EXPIRED'))
  const canSend = Boolean(file && form.templateName && sheet?.sendable > 0 && !sending)

  return (
    <Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
        Upload the sheet step 2 gave you — the one with a header_document column on it.
      </Typography>

      <Card variant='outlined' sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' useFlexGap>
            <Button variant='outlined' component='label' startIcon={<UploadFile />}>
              {file ? file.name : 'Choose the recipients sheet'}
              <input hidden type='file' accept='.xlsx,.xls,.csv' onChange={choose} />
            </Button>
            {reading && <CircularProgress size={22} />}
          </Stack>
        </CardContent>
      </Card>

      {sheet && (
        <>
          {(sheet.warnings || []).map((w, i) => (
            <Alert key={i} severity={w.includes('EXPIRED') ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {w.includes('EXPIRED') && <AlertTitle>Do not send this</AlertTitle>}
              {w}
            </Alert>
          ))}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}><Tile label='Rows in the sheet' value={sheet.total_rows} /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Tile label='Will be sent' value={sheet.sendable} color='success.main'
                    sub={sheet.calls > 1 ? `${sheet.calls} calls of 1000` : 'one call'} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Tile label='With a file' value={sheet.with_document} sub='header_document' />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Tile label='Held back' value={(sheet.skipped || []).length}
                    color={(sheet.skipped || []).length ? 'error.main' : 'text.primary'} />
            </Grid>
          </Grid>

          {(sheet.skipped || []).length > 0 && (
            <Card variant='outlined' sx={{ mb: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                  These rows will not be sent
                </Typography>
                <TableContainer sx={{ maxHeight: 220 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 90 }}>Sheet row</TableCell>
                        <TableCell>Guest</TableCell>
                        <TableCell>Why</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sheet.skipped.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.row}</TableCell>
                          <TableCell>{s.name || '—'}</TableCell>
                          <TableCell><Typography variant='caption' color='error.main'>{s.reason}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          <Card variant='outlined' sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='subtitle2' fontWeight={700} gutterBottom>The message</Typography>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select fullWidth size='small' label='WhatsApp template'
                    value={form.templateName}
                    onChange={e => {
                      const t = templates.find(x => x.template_name === e.target.value)
                      setForm({ ...form, templateName: e.target.value, templateLanguage: t?.language || 'en' })
                    }}
                    helperText='Only APPROVED templates can be sent'
                  >
                    {templates.map(t => (
                      <MenuItem key={t._uid || t._id} value={t.template_name} disabled={t.status !== 'APPROVED'}>
                        {t.template_name}
                        <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                          {t.language} · {t.category} · {t.status}
                        </Typography>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField fullWidth size='small' label='Language' value={form.templateLanguage}
                             onChange={e => setForm({ ...form, templateLanguage: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField fullWidth size='small' label='Campaign title' value={form.title}
                             onChange={e => setForm({ ...form, title: e.target.value })}
                             placeholder='Wedding invites — batch 1' />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size='small' label='From phone number id (optional)'
                             value={form.fromPhoneNumberId}
                             onChange={e => setForm({ ...form, fromPhoneNumberId: e.target.value })}
                             helperText='Leave blank to use the account default' />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Stack direction='row' alignItems='center' sx={{ mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='subtitle2' fontWeight={700}>Template variables</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    In the order the template declares them. field_1 is the first {'{{1}}'} in its body.
                  </Typography>
                </Box>
                <Button size='small' startIcon={<Add />} onClick={addField} disabled={fields.length >= MAX_FIELDS}>
                  Add
                </Button>
              </Stack>

              {fields.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                  None — for a template whose body has no variables, that is correct.
                </Typography>
              )}

              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {fields.map((f, i) => (
                  <Stack key={i} direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                    <TextField size='small' label='Variable' value={f.key} sx={{ width: 120 }}
                               onChange={e => setField(i, { key: e.target.value })} />

                    {/* A column changes per guest; fixed text is the same on
                        every message — a date or a venue usually is. */}
                    <TextField select size='small' label='From' value={f.source || 'column'} sx={{ width: 140 }}
                               onChange={e => setField(i, { source: e.target.value })}>
                      <MenuItem value='column'>Excel column</MenuItem>
                      <MenuItem value='text'>Fixed text</MenuItem>
                    </TextField>

                    {f.source === 'text' ? (
                      <TextField
                        size='small' label='Text for every guest' value={f.value || ''} sx={{ flex: 1, minWidth: 220 }}
                        onChange={e => setField(i, { value: e.target.value })}
                        placeholder='12 Jan 2027'
                      />
                    ) : (
                      <TextField select size='small' label='Column' value={f.column || ''} sx={{ flex: 1, minWidth: 220 }}
                                 onChange={e => setField(i, { column: e.target.value })}>
                        <MenuItem value=''><em>nothing</em></MenuItem>
                        {(sheet.mappable || []).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </TextField>
                    )}

                    <Box sx={{ width: 210 }}>
                      {f.source === 'text' ? (
                        <Typography variant='caption' color='text.secondary' noWrap>
                          {f.value ? 'same on every message' : ''}
                        </Typography>
                      ) : f.column && sheet.blank_by_column?.[f.column] ? (
                        // Said here, beside the column, rather than in a banner
                        // at the top: this is a property of the choice just
                        // made, and WhatsApp refuses a blank variable.
                        <Typography variant='caption' color='error.main'>
                          empty on {sheet.blank_by_column[f.column].count} row
                          {sheet.blank_by_column[f.column].count === 1 ? '' : 's'}
                          {' '}({sheet.blank_by_column[f.column].rows.slice(0, 3).join(', ')}
                          {sheet.blank_by_column[f.column].count > 3 ? '…' : ''}) — those will fail
                        </Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary' noWrap>
                          {f.column && sheet.sample ? `e.g. ${sheet.sample[f.column] || '\u2014'}` : ''}
                        </Typography>
                      )}
                    </Box>

                    <IconButton size='small' onClick={() => setFields(prev => prev.filter((_, n) => n !== i))}>
                      <DeleteOutline fontSize='small' />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>

              <FormControlLabel
                sx={{ mt: 2 }}
                control={<Checkbox checked={createContacts} onChange={e => setCreateContacts(e.target.checked)} />}
                label={<Typography variant='body2'>Create the contact in ChatWise if it does not exist</Typography>}
              />
            </CardContent>
          </Card>

          <Alert severity={expired ? 'error' : 'info'} sx={{ mb: 2 }}>
            ChatWise charges the wallet for the whole batch <strong>before</strong> it sends, and nothing here is
            ever retried — a repeat would be a second campaign and a second charge. Check the numbers above
            before you press this.
          </Alert>

          <Button
            variant='contained' size='large' color={expired ? 'error' : 'primary'}
            startIcon={<Send />} disabled={!canSend} onClick={send}
          >
            {sending ? 'Sending…' : `Send to ${sheet.sendable} guest${sheet.sendable === 1 ? '' : 's'}`}
          </Button>
        </>
      )}

      {result && (
        <Card variant='outlined' sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant='subtitle2' fontWeight={700} gutterBottom>
              Result — {result.status}
            </Typography>
            <Stack direction='row' spacing={3} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Typography variant='body2'>Queued: <strong>{result.queued}</strong></Typography>
              <Typography variant='body2'>Held back here: <strong>{result.skipped_before_sending}</strong></Typography>
              <Typography variant='body2'>Refused by ChatWise: <strong>{result.skipped_by_panel}</strong></Typography>
            </Stack>

            {(result.campaign_uids || []).map(c => (
              <Chip key={c.uid} size='small' sx={{ mr: 1, mb: 1 }}
                    label={`campaign ${c.uid} · ${c.recipients} recipients`} />
            ))}

            {(result.errors || []).length > 0 && (
              <>
                <Typography variant='subtitle2' fontWeight={700} sx={{ mt: 2 }}>
                  What ChatWise refused
                </Typography>
                <Table size='small'>
                  <TableBody>
                    {result.errors.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ width: 110 }}>row {e.row || e.rows}</TableCell>
                        <TableCell sx={{ width: 150 }}>{e.phone_number || ''}</TableCell>
                        <TableCell><Typography variant='caption' color='error.main'>{e.message}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 2 }}>
              Keep the campaign id — delivery, read and failure counts are looked up by it.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default PdfSend
