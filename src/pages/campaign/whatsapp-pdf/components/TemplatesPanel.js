/**
 * The template list: upload a PDF, then open it to place fields on it.
 *
 * Upload is deliberately the only thing you can do here without opening one —
 * a template with no fields generates a thousand identical copies of itself,
 * so the list nudges towards the editor rather than towards a batch.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { Add, DeleteOutline, Edit } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet, apiPost, apiDelete } from 'src/hooks/axios'
import { pdfTemplateUrl } from 'src/services/pathConst'

const PdfTemplates = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet(pdfTemplateUrl)
      setRows(res?.data?.data || [])
    } catch (err) {
      toast.error(err?.message || 'Could not load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async () => {
    if (!file) return toast.error('Choose a PDF first')

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      if (name.trim()) form.append('name', name.trim())

      // `true` switches the shared helper to multipart.
      const res = await apiPost(pdfTemplateUrl, form, true)
      toast.success(res?.data?.message || 'Uploaded')

      setOpen(false); setName(''); setFile(null)

      // Straight into the editor: an uploaded template with no fields on it is
      // not yet useful for anything.
      const id = res?.data?.data?.id
      if (id) router.push(`/campaign/pdf-templates/${id}`)
      else load()
    } catch (err) {
      toast.error(err?.message || String(err) || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const remove = async (id) => {
    try {
      await apiDelete(`${pdfTemplateUrl}/${id}`)
      toast.success('Template removed')
      load()
    } catch (err) {
      toast.error(err?.message || 'Could not remove it')
    }
  }

  return (
    <Box>
      <Stack direction='row' alignItems='center' sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant='caption' color='text.secondary'>
            A template is your invitation with boxes drawn on it — one per value that changes per guest.
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)}>Upload a PDF</Button>
      </Stack>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Pages</TableCell>
                  <TableCell>Fields</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell align='right'>&nbsp;</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align='center' sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>
                        No templates yet. Upload the invitation PDF you want personalised.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((t) => (
                  <TableRow hover key={t.id}>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{t.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{t.file_name}</Typography>
                    </TableCell>
                    <TableCell>{t.page_count}</TableCell>
                    <TableCell>
                      {t.field_count > 0
                        ? <Chip size='small' label={t.field_count} sx={{ height: 22 }} />
                        : <Chip size='small' color='warning' variant='outlined' label='none yet' sx={{ height: 22, fontSize: 11 }} />}
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Place fields'>
                        <IconButton size='small' onClick={() => router.push(`/campaign/pdf-templates/${t.id}`)}>
                          <Edit fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Remove'>
                        <IconButton size='small' onClick={() => remove(t.id)}>
                          <DeleteOutline fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={uploading ? undefined : () => setOpen(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Upload a template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              size='small' label='Name' value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Akaza's wedding — reception" fullWidth
            />
            <Button variant='outlined' component='label'>
              {file ? file.name : 'Choose a PDF'}
              <input hidden type='file' accept='application/pdf,.pdf'
                     onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant='caption' color='text.secondary'>
              The file is opened and checked before it is stored, so a PDF that cannot be read
              is refused now rather than part-way through a thousand guests.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
          <Button variant='contained' onClick={upload} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PdfTemplates
