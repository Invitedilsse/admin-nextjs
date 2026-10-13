/**
 * The template editor.
 *
 * Drag boxes onto the page, say which spreadsheet column fills each one, and
 * check it with a preview before a thousand files are built from it.
 *
 * The one thing worth knowing while reading this: x/y/w/h are PDF POINTS
 * measured from the top-left of the page, never pixels. The conversion lives in
 * src/utils/pdfFieldGeometry.js and happens at the edges — everything held in
 * state here is already in points, so what you see in the panel is what the
 * server stores.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, Divider,
  FormControlLabel, Grid2 as Grid, IconButton, MenuItem, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import { ArrowBack, Add, DeleteOutline, Visibility, Save } from '@mui/icons-material'
import toast from 'react-hot-toast'

import { apiGet, apiPost, apiPut, getAccessToken } from 'src/hooks/axios'
import { pdfTemplateUrl, pdfTemplateFileUrl, pdfTemplateFieldsUrl, pdfTemplatePreviewUrl } from 'src/services/pathConst'
import { defaultBoxFor, keyFromLabel, applyNudge } from 'src/utils/pdfFieldGeometry'
import PdfPageCanvas from './components/PdfPageCanvas'
import FieldBox from './components/FieldBox'

const FONTS = [
  'Helvetica', 'Helvetica Bold', 'Helvetica Italic', 'Helvetica Bold Italic',
  'Times', 'Times Bold', 'Times Italic', 'Times Bold Italic',
  'Courier', 'Courier Bold',
]

const CANVAS_WIDTH = 760

const PdfTemplateEditor = () => {
  const router = useRouter()
  const { id } = router.query

  const [template, setTemplate] = useState(null)
  const [fields, setFields] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [token, setToken] = useState(null)
  const [rendered, setRendered] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [warnings, setWarnings] = useState([])

  const stageRef = useRef(null)

  useEffect(() => { getAccessToken().then(setToken) }, [])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await apiGet(`${pdfTemplateUrl}/${id}`)
      setTemplate(res?.data?.data || null)
      setFields(res?.data?.data?.fields || [])
    } catch (err) {
      toast.error(err?.message || 'Could not open that template')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // The page's own size in points, from the server's reading of the PDF. The
  // canvas reports the same numbers once it has drawn; the server's copy is
  // used so boxes can be placed before the preview has finished loading.
  const page = useMemo(() => {
    const fromServer = template?.pages?.[pageIndex]
    if (fromServer) return { width: Number(fromServer.width), height: Number(fromServer.height) }
    if (rendered) return { width: rendered.pageWidthPt, height: rendered.pageHeightPt }

    return null
  }, [template, pageIndex, rendered])

  const scale = rendered && page ? rendered.widthPx / page.width : 1

  const selected = fields.find((f) => f.key === selectedKey) || null
  const onThisPage = fields.filter((f) => (f.page || 0) === pageIndex)

  const patch = (key, changes) =>
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...changes } : f)))

  const addField = () => {
    if (!page) return toast.error('Wait for the page to finish drawing')

    const key = keyFromLabel(`field_${fields.length + 1}`, fields.map((f) => f.key))
    const box = defaultBoxFor(page, onThisPage.length)

    setFields((prev) => [...prev, {
      key, label: `Field ${prev.length + 1}`, column: '', value: '',
      page: pageIndex, ...box,
      font: 'Helvetica', size: 14, minSize: 8, color: '#1F1B16',
      align: 'left', valign: 'top', lineHeight: 1.2, maxLines: 1, shrinkToFit: true,
    }])
    setSelectedKey(key)
  }

  const removeField = (key) => {
    setFields((prev) => prev.filter((f) => f.key !== key))
    if (selectedKey === key) setSelectedKey(null)
  }

  // Arrow keys nudge the selected box. Ignored while a text input has focus,
  // or typing a name would move the box instead of the cursor.
  useEffect(() => {
    const onKey = (event) => {
      if (!selected || !page) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const next = applyNudge(selected, event.key, event.shiftKey, page)
      if (!next) return

      event.preventDefault()
      patch(selected.key, next)
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, page])

  const save = async () => {
    setSaving(true)
    try {
      const res = await apiPut(pdfTemplateFieldsUrl(id), { fields })
      toast.success(res?.data?.message || 'Saved')
      setFields(res?.data?.data?.fields || fields)
    } catch (err) {
      // The server names the offending field when a box is off the page or a
      // key is duplicated — show its words, not a generic failure.
      toast.error(err?.message || String(err) || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const preview = async () => {
    setPreviewing(true)
    setWarnings([])
    try {
      // Save first: a preview of the layout you can see, not the last one saved.
      await apiPut(pdfTemplateFieldsUrl(id), { fields })

      const values = {}
      fields.forEach((f) => { values[f.key] = f.value || f.label || f.key })

      const res = await apiPost(pdfTemplatePreviewUrl(id), { values })
      setWarnings(res?.data?.data?.warnings || [])

      const url = res?.data?.data?.url
      if (url) window.open(url, '_blank', 'noopener')
      else toast.error('No preview came back')
    } catch (err) {
      toast.error(err?.message || String(err) || 'Could not build a preview')
    } finally {
      setPreviewing(false)
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
  }
  if (!template) {
    return <Alert severity='error'>That template could not be opened.</Alert>
  }

  return (
    <Box>
      <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 3 }}>
        <IconButton onClick={() => router.push('/campaign/whatsapp-pdf?tab=0')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant='h6' fontWeight={700}>{template.name}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {template.page_count} page{template.page_count === 1 ? '' : 's'}
            {page ? ` · ${Math.round(page.width)} × ${Math.round(page.height)} points` : ''}
            {' · '}{fields.length} field{fields.length === 1 ? '' : 's'}
          </Typography>
        </Box>
        <Button startIcon={<Visibility />} onClick={preview} disabled={previewing || !fields.length}>
          {previewing ? 'Building…' : 'Preview'}
        </Button>
        <Button variant='contained' startIcon={<Save />} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save layout'}
        </Button>
      </Stack>

      {warnings.length > 0 && (
        <Alert severity='warning' sx={{ mb: 3 }} onClose={() => setWarnings([])}>
          <Typography variant='body2' fontWeight={600} gutterBottom>
            The preview came back with something to say:
          </Typography>
          {warnings.map((w, i) => <Typography key={i} variant='caption' display='block'>• {w}</Typography>)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── The page ───────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card variant='outlined'>
            <CardContent>
              {template.page_count > 1 && (
                <ToggleButtonGroup
                  size='small' exclusive value={pageIndex} sx={{ mb: 2 }}
                  onChange={(e, v) => v !== null && setPageIndex(v)}
                >
                  {Array.from({ length: template.page_count }, (_, i) => (
                    <ToggleButton key={i} value={i}>Page {i + 1}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}

              <Box
                ref={stageRef}
                onPointerDown={() => setSelectedKey(null)}
                sx={{ position: 'relative', width: CANVAS_WIDTH, maxWidth: '100%', mx: 'auto' }}
              >
                <PdfPageCanvas
                  fileUrl={pdfTemplateFileUrl(id)}
                  token={token}
                  pageIndex={pageIndex}
                  width={CANVAS_WIDTH}
                  onRendered={setRendered}
                />

                {rendered && page && onThisPage.map((f) => (
                  <FieldBox
                    key={f.key}
                    field={f}
                    scale={scale}
                    page={page}
                    selected={f.key === selectedKey}
                    onSelect={() => setSelectedKey(f.key)}
                    onChange={(next) => patch(f.key, next)}
                  />
                ))}
              </Box>

              <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 2, textAlign: 'center' }}>
                Drag a box to move it, pull a corner to resize. Arrow keys nudge by a point, with Shift by ten.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ── The panel ──────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card variant='outlined'>
            <CardContent>
              <Stack direction='row' alignItems='center' sx={{ mb: 2 }}>
                <Typography variant='subtitle2' fontWeight={700} sx={{ flex: 1 }}>Fields</Typography>
                <Button size='small' startIcon={<Add />} onClick={addField}>Add</Button>
              </Stack>

              {fields.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                  No fields yet. Add one, drag it where the guest&apos;s name should print,
                  and tell it which column of your sheet to read.
                </Typography>
              )}

              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {fields.map((f) => (
                  <Stack
                    key={f.key} direction='row' alignItems='center' spacing={1}
                    onClick={() => { setSelectedKey(f.key); setPageIndex(f.page || 0) }}
                    sx={{
                      px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer',
                      bgcolor: f.key === selectedKey ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' fontWeight={600} noWrap>{f.label || f.key}</Typography>
                      <Typography variant='caption' color='text.secondary' noWrap>
                        {f.column ? `reads "${f.column}"` : f.value ? 'fixed text' : 'no source yet'}
                        {template.page_count > 1 ? ` · page ${(f.page || 0) + 1}` : ''}
                      </Typography>
                    </Box>
                    <Tooltip title='Remove'>
                      <IconButton size='small' onClick={(e) => { e.stopPropagation(); removeField(f.key) }}>
                        <DeleteOutline fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>

              {selected && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <TextField
                      size='small' label='Label' value={selected.label || ''}
                      onChange={(e) => patch(selected.key, { label: e.target.value })}
                      helperText='Only shown here and on the preview'
                    />
                    <TextField
                      size='small' label='Spreadsheet column' value={selected.column || ''}
                      onChange={(e) => patch(selected.key, { column: e.target.value })}
                      helperText='Exactly as the heading is spelled in your sheet'
                    />
                    <TextField
                      size='small' label='Or fixed text' value={selected.value || ''}
                      onChange={(e) => patch(selected.key, { value: e.target.value })}
                      helperText='Used when no column is given — the same on every copy'
                    />

                    <Stack direction='row' spacing={1}>
                      <TextField
                        select size='small' label='Font' value={selected.font || 'Helvetica'}
                        onChange={(e) => patch(selected.key, { font: e.target.value })}
                        sx={{ flex: 2 }}
                      >
                        {FONTS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                      </TextField>
                      <TextField
                        size='small' type='number' label='Size' value={selected.size ?? 14}
                        onChange={(e) => patch(selected.key, { size: Number(e.target.value) || 1 })}
                        sx={{ flex: 1 }}
                      />
                    </Stack>

                    <Stack direction='row' spacing={1} alignItems='center'>
                      <TextField
                        size='small' label='Colour' value={selected.color || '#000000'}
                        onChange={(e) => patch(selected.key, { color: e.target.value })}
                        sx={{ flex: 1 }}
                      />
                      <input
                        type='color'
                        value={/^#[0-9a-fA-F]{6}$/.test(selected.color || '') ? selected.color : '#000000'}
                        onChange={(e) => patch(selected.key, { color: e.target.value })}
                        style={{ width: 42, height: 38, border: 'none', background: 'none', cursor: 'pointer' }}
                      />
                    </Stack>

                    <Stack direction='row' spacing={1}>
                      <TextField
                        select size='small' label='Align' value={selected.align || 'left'}
                        onChange={(e) => patch(selected.key, { align: e.target.value })} sx={{ flex: 1 }}
                      >
                        {['left', 'center', 'right'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                      </TextField>
                      <TextField
                        select size='small' label='Vertical' value={selected.valign || 'top'}
                        onChange={(e) => patch(selected.key, { valign: e.target.value })} sx={{ flex: 1 }}
                      >
                        {['top', 'middle', 'bottom'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                      </TextField>
                    </Stack>

                    <Stack direction='row' spacing={1}>
                      <TextField
                        size='small' type='number' label='Max lines' value={selected.maxLines ?? 1}
                        onChange={(e) => patch(selected.key, { maxLines: Math.max(1, Number(e.target.value) || 1) })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size='small' type='number' label='Smallest size' value={selected.minSize ?? 8}
                        onChange={(e) => patch(selected.key, { minSize: Number(e.target.value) || 1 })}
                        sx={{ flex: 1 }}
                      />
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selected.shrinkToFit !== false}
                          onChange={(e) => patch(selected.key, { shrinkToFit: e.target.checked })}
                        />
                      }
                      label={
                        <Typography variant='body2'>
                          Shrink long values to fit
                          <Typography variant='caption' color='text.secondary' display='block'>
                            Off means a long name is clipped and the row is flagged
                          </Typography>
                        </Typography>
                      }
                    />

                    <Divider />
                    <Typography variant='caption' color='text.secondary'>
                      Box: {selected.x}, {selected.y} · {selected.w} × {selected.h} points
                    </Typography>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PdfTemplateEditor
