import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import axios from 'axios'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { apiGet, getAccessToken } from 'src/hooks/axios'
import { ocrModelConfigUrl, ocrPdfPreviewUrl, ocrProcessSessionUrl, ocrReviewUrl, ocrUploadUrl } from 'src/services/pathConst'

const PROVIDER_COLOR = { OpenAI: '#10a37f', Anthropic: '#c96442' }
const STAR_COLOR = '#F5A742'
const USD_INR = 95

const deriveFunctionName = (data) => {
  const groom = data?.groom || ''
  const bride = data?.bride || ''
  if (groom && bride) return `${groom} weds ${bride}`
  return groom || bride || ''
}

const deriveHostName = (data) => {
  const firstNamed = data?.first_named || 'groom'
  const brideParents = data?.suggestions?.bride_parents || []
  const groomParents = data?.suggestions?.groom_parents || []
  const hosts = data?.suggestions?.hosts || []
  if (firstNamed === 'bride') {
    if (brideParents.length) return brideParents.join(', ')
    if (hosts.length) return hosts.join(', ')
    return groomParents.join(', ')
  } else {
    if (groomParents.length) return groomParents.join(', ')
    if (hosts.length) return hosts.join(', ')
    return brideParents.join(', ')
  }
}

const collectAllRawEvents = (rawPages) => {
  if (!Array.isArray(rawPages)) return []
  const all = []
  rawPages.forEach((page, pi) => {
    ;(page.events || []).forEach(ev => all.push({ ...ev, _page: pi + 1 }))
  })
  return all
}

const fmtDate = (iso) => {
  if (!iso) return iso
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDuration = (ms) => {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const StarRating = ({ value, onChange }) => (
  <Box display='flex' gap={0.5}>
    {[1, 2, 3, 4, 5].map(n => (
      <Box key={n} component='span' onClick={() => onChange(n)}
        sx={{ fontSize: 28, cursor: 'pointer', color: n <= value ? STAR_COLOR : '#ddd', lineHeight: 1, userSelect: 'none', transition: 'color 0.1s' }}>
        ★
      </Box>
    ))}
  </Box>
)

const FieldRow = ({ label, value }) =>
  value ? (
    <Box sx={{ mb: 1 }}>
      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, fontSize: 10, letterSpacing: 0.5, display: 'block' }}>
        {label.toUpperCase()}
      </Typography>
      <Typography variant='body2'>{value}</Typography>
    </Box>
  ) : null

const CostBadge = ({ response, model, models, durationMs }) => {
  if (!response) return null
  const info = models.find(m => m.id === model)
  const pColor = PROVIDER_COLOR[info?.provider] || '#888'
  return (
    <Box display='flex' flexWrap='wrap' gap={1} mb={2} alignItems='center'>
      <Chip label={model} size='small' sx={{ background: pColor, color: '#fff', fontWeight: 700, fontSize: 11 }} />
      {response.cost_usd != null && (
        <Chip
          label={`$${Number(response.cost_usd).toFixed(5)} · ₹${(Number(response.cost_usd) * USD_INR).toFixed(3)}`}
          size='small' variant='outlined'
          sx={{ borderColor: '#f5a742', color: '#c77a00', fontWeight: 600, fontSize: 11 }}
        />
      )}
      {response.total_tokens != null && (
        <Tooltip title={`Prompt: ${response.prompt_tokens ?? '?'} · Completion: ${response.completion_tokens ?? '?'} · Cache read: ${response.cache_read_tokens ?? 0}`}>
          <Chip label={`${Number(response.total_tokens).toLocaleString()} tokens`} size='small' variant='outlined' sx={{ fontSize: 11 }} />
        </Tooltip>
      )}
      {durationMs != null && (
        <Chip label={`⏱ ${fmtDuration(durationMs)}`} size='small' variant='outlined'
          sx={{ borderColor: '#7c4dff', color: '#7c4dff', fontWeight: 600, fontSize: 11 }} />
      )}
      {response.log_id && (
        <Typography variant='caption' color='text.disabled' sx={{ fontSize: 10 }}>log: {response.log_id.slice(0, 8)}…</Typography>
      )}
    </Box>
  )
}

const EventCard = ({ ev, index, pageCount }) => (
  <Box sx={{ mb: 1.5, pl: 1.5, borderLeft: `3px solid ${STAR_COLOR}` }}>
    <Box display='flex' alignItems='center' gap={1} mb={0.3}>
      <Typography variant='body2' fontWeight={700}>{ev.type || `Event ${index + 1}`}</Typography>
      {pageCount > 1 && ev._page && (
        <Chip label={`p${ev._page}`} size='small' sx={{ height: 16, fontSize: 9, background: '#f0f0f0' }} />
      )}
      {!ev.date && <Chip label='no date' size='small' color='warning' sx={{ height: 16, fontSize: 9 }} />}
    </Box>
    {ev.date ? (
      <Box sx={{ mb: 0.3 }}>
        <Typography variant='caption' color='text.secondary'>Date: </Typography>
        <Typography component='span' variant='caption' fontWeight={600}>{fmtDate(ev.date)}</Typography>
        {ev.date_day && <Typography component='span' variant='caption' color='text.secondary'> · {ev.date_day}</Typography>}
        {ev.date_raw && <Typography variant='caption' color='text.disabled' display='block' sx={{ fontSize: 10 }}>raw: {ev.date_raw}</Typography>}
      </Box>
    ) : ev.date_raw ? (
      <Typography variant='caption' color='text.disabled' display='block'>raw: {ev.date_raw}</Typography>
    ) : null}
    {ev.time && (
      <Box sx={{ mb: 0.3 }}>
        <Typography variant='caption' color='text.secondary'>Time: </Typography>
        <Typography component='span' variant='caption' fontWeight={600}>{ev.time}</Typography>
        {ev.time_raw && <Typography component='span' variant='caption' color='text.disabled'> ({ev.time_raw})</Typography>}
      </Box>
    )}
    {ev.venue && (
      <Box>
        <Typography variant='caption' color='text.secondary'>Venue: </Typography>
        <Typography component='span' variant='caption' fontWeight={600}>{ev.venue}</Typography>
      </Box>
    )}
  </Box>
)

const ExtractionResult = ({ response, model, models, durationMs, score, onScoreChange, remarks, onRemarksChange, onSaveReview, saving, savedMsg, saveError }) => {
  if (!response) return null
  const data = response.data || {}
  const rawPages = response.raw_pages || []
  const allEvents = collectAllRawEvents(rawPages)
  const functionName = deriveFunctionName(data)
  const hostName = deriveHostName(data)
  const pageCount = rawPages.length

  return (
    <Box>
      <CostBadge response={response} model={model} models={models} durationMs={durationMs} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={1} sx={{ letterSpacing: 1, fontSize: 10 }}>
            MOBILE APP FIELDS
          </Typography>
          <FieldRow label='Function Name' value={functionName} />
          <FieldRow label='Occasion' value={data.occasion} />
          <FieldRow label='Host Name' value={hostName} />
          <FieldRow label='Host Mobile' value={data.host_mobile} />

          <Divider sx={{ my: 1.5 }} />
          <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={1} sx={{ letterSpacing: 1, fontSize: 10 }}>
            ALL EXTRACTED RAW
          </Typography>
          <FieldRow label='Bride' value={data.bride} />
          <FieldRow label='Groom' value={data.groom} />
          <FieldRow label='First Named' value={data.first_named} />
          {(data.suggestions?.bride_parents || []).length > 0 && <FieldRow label="Bride's Parents" value={data.suggestions.bride_parents.join(', ')} />}
          {(data.suggestions?.groom_parents || []).length > 0 && <FieldRow label="Groom's Parents" value={data.suggestions.groom_parents.join(', ')} />}
          {(data.suggestions?.hosts || []).length > 0 && <FieldRow label='Hosts' value={data.suggestions.hosts.join(', ')} />}
          {pageCount > 1 && (
            <Chip label={`${pageCount} pages processed`} size='small' sx={{ mt: 1, background: '#e8f4fd', color: '#1565c0', fontSize: 10 }} />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={1} sx={{ letterSpacing: 1, fontSize: 10 }}>
            ALL EVENTS — AI RETURNED ({allEvents.length})
          </Typography>
          {allEvents.length === 0
            ? <Typography variant='caption' color='text.disabled'>No events extracted</Typography>
            : allEvents.map((ev, i) => <EventCard key={i} ev={ev} index={i} pageCount={pageCount} />)}
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      <Typography variant='subtitle2' fontWeight={700} mb={1}>Rate This Extraction</Typography>
      <StarRating value={score} onChange={onScoreChange} />
      <Typography variant='caption' color='text.secondary' display='block' mb={1.5} mt={0.5}>
        {['', 'Poor', 'Fair', 'Good', 'Great', 'Perfect'][score] || 'Tap stars to rate'}
      </Typography>
      <TextField
        label='Remarks (optional)' multiline rows={2} fullWidth size='small'
        value={remarks} onChange={e => onRemarksChange(e.target.value)}
        placeholder='e.g. Missed groom name, venue correct, date confused...'
        sx={{ mb: 1.5 }}
      />
      {saveError && <Alert severity='error' sx={{ mb: 1, fontSize: 12 }}>{saveError}</Alert>}
      {savedMsg && <Alert severity='success' sx={{ mb: 1, fontSize: 12 }}>{savedMsg}</Alert>}
      <Button
        variant='outlined' size='small'
        onClick={onSaveReview}
        disabled={saving || !!savedMsg}
        sx={{ borderColor: STAR_COLOR, color: STAR_COLOR, fontWeight: 700 }}
      >
        {saving ? 'Saving...' : savedMsg ? 'Saved ✓' : 'Save Review'}
      </Button>
    </Box>
  )
}

// ── PDF page multi-select ──────────────────────────────────────────────────────
const PdfPageSelector = ({ pdfPages, selectedIndices, onToggle, onSelectAll }) => (
  <Box>
    <Box display='flex' alignItems='center' gap={1} mb={1}>
      <Typography variant='caption' color='text.secondary'>
        {pdfPages.length} pages ·{' '}
        {selectedIndices.length === 0 ? <strong>All will run</strong> : `${selectedIndices.length} selected`}
      </Typography>
      <Button size='small' variant='text' onClick={onSelectAll}
        sx={{ minWidth: 0, fontSize: 11, py: 0, px: 0.5, textTransform: 'none' }}>
        Run All
      </Button>
    </Box>
    <Box display='flex' flexWrap='wrap' gap={1}>
      {pdfPages.map((pg, i) => {
        const selected = selectedIndices.includes(i)
        const dimmed = selectedIndices.length > 0 && !selected
        return (
          <Tooltip key={i} title={`Page ${i + 1} — click to ${selected ? 'deselect' : 'select'}`}>
            <Box onClick={() => onToggle(i)}
              sx={{
                width: 52, height: 68, cursor: 'pointer', position: 'relative',
                border: selected ? `2px solid ${STAR_COLOR}` : '2px solid #ddd',
                borderRadius: 1, overflow: 'hidden', opacity: dimmed ? 0.45 : 1,
                '&:hover': { borderColor: STAR_COLOR, opacity: 1 }, transition: 'all 0.15s',
              }}
            >
              <Box component='img' src={`data:image/jpeg;base64,${pg.thumbnail}`}
                alt={`P${i + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
                background: selected ? 'rgba(245,167,66,0.9)' : 'rgba(0,0,0,0.5)',
              }}>
                <Typography sx={{ color: '#fff', fontSize: 8, lineHeight: '14px', fontWeight: selected ? 700 : 400 }}>
                  P{i + 1}
                </Typography>
              </Box>
              {selected && (
                <Box sx={{
                  position: 'absolute', top: 2, right: 2, width: 14, height: 14,
                  borderRadius: '50%', background: STAR_COLOR,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ color: '#fff', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>✓</Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  </Box>
)

// ── Upload panel ───────────────────────────────────────────────────────────────
const UploadPanel = ({ file, setFile, isPdf, setIsPdf, filePreview, setFilePreview, pdfPages, setPdfPages, pdfSessionId, setPdfSessionId, selectedIndices, setSelectedIndices, pdfLoading, setPdfLoading, onError }) => {
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPdfPages([]); setPdfSessionId(null); setSelectedIndices([]); setFile(f)
    const pdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    setIsPdf(pdf)
    if (!pdf) {
      const reader = new FileReader()
      reader.onload = ev => setFilePreview(ev.target.result)
      reader.readAsDataURL(f)
    } else {
      setFilePreview(null)
      setPdfLoading(true)
      try {
        const token = await getAccessToken()
        const form = new FormData()
        form.append('file', f)
        const res = await axios.post(ocrPdfPreviewUrl, form, {
          headers: { authorization: token, 'Content-Type': 'multipart/form-data' }
        })
        setPdfPages(res.data?.pages || [])
        setPdfSessionId(res.data?.sessionId || null)
        setSelectedIndices([])
      } catch (err) {
        onError('Failed to load PDF preview: ' + (err?.message || 'Unknown'))
      } finally { setPdfLoading(false) }
    }
  }

  const handleToggle = (i) => {
    setSelectedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  return (
    <Box>
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed #ddd', borderRadius: 2, p: 2.5, textAlign: 'center',
          cursor: 'pointer', mb: 1.5, '&:hover': { borderColor: STAR_COLOR }, transition: 'border-color 0.2s'
        }}
      >
        {file
          ? <Typography variant='body2' fontWeight={600} noWrap>{file.name}</Typography>
          : <>
            <Typography variant='body2' color='text.secondary'>Click to upload</Typography>
            <Typography variant='caption' color='text.disabled'>JPG · PNG · PDF</Typography>
          </>}
      </Box>
      <input ref={fileInputRef} type='file' accept='image/*,.pdf' style={{ display: 'none' }} onChange={handleFileChange} />

      {!isPdf && filePreview && (
        <Box sx={{ mb: 1.5, textAlign: 'center' }}>
          <Box component='img' src={filePreview} alt='preview'
            sx={{ maxWidth: '100%', maxHeight: 180, borderRadius: 1, border: '1px solid #eee' }} />
        </Box>
      )}

      {pdfLoading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant='caption' display='block' mt={1} color='text.secondary'>Loading PDF pages…</Typography>
        </Box>
      )}

      {isPdf && pdfPages.length > 0 && (
        <PdfPageSelector
          pdfPages={pdfPages} selectedIndices={selectedIndices}
          onToggle={handleToggle} onSelectAll={() => setSelectedIndices([])}
        />
      )}
    </Box>
  )
}

const ModelSelect = ({ label, value, onChange, models, activeModel }) => (
  <FormControl fullWidth size='small'>
    <InputLabel>{label}</InputLabel>
    <Select value={value} label={label} onChange={e => onChange(e.target.value)}>
      {['OpenAI', 'Anthropic'].map(provider => [
        <MenuItem key={`hdr-${provider}`} disabled sx={{ opacity: 0.6, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          — {provider} —
        </MenuItem>,
        ...models.filter(m => m.provider === provider).map(m => (
          <MenuItem key={m.id} value={m.id}>
            <Box display='flex' alignItems='center' gap={1} width='100%'>
              <Box flex={1}>
                <Typography variant='body2' fontWeight={value === m.id ? 700 : 400}>{m.name}</Typography>
                <Typography variant='caption' color='text.secondary'>${m.inputPer1M}/${m.outputPer1M} /1M</Typography>
              </Box>
              {activeModel === m.id && <Chip label='ACTIVE' size='small' color='success' sx={{ height: 16, fontSize: 9 }} />}
            </Box>
          </MenuItem>
        ))
      ])}
    </Select>
  </FormControl>
)

// ── Extraction call — returns { response, durationMs } ─────────────────────────
const runExtraction = async ({ file, isPdf, pdfSessionId, selectedIndices, model }) => {
  const token = await getAccessToken()
  const start = Date.now()

  let data
  if (isPdf && pdfSessionId) {
    // Session-based: session is NOT deleted on the backend, so both compare-mode
    // models can hit the same session simultaneously in parallel.
    const res = await axios.post(ocrProcessSessionUrl, {
      sessionId: pdfSessionId,
      pageIndices: selectedIndices, // empty = all pages
      model,
    }, { headers: { authorization: token } })
    data = res.data
  } else {
    const form = new FormData()
    form.append('file', file)
    const url = `${ocrUploadUrl}?ignoreStartPages=0&ignoreEndPages=0&model=${model}`
    const res = await axios.post(url, form, { headers: { authorization: token, 'Content-Type': 'multipart/form-data' } })
    data = res.data
  }

  return { response: data, durationMs: Date.now() - start }
}

// ── Main page ──────────────────────────────────────────────────────────────────
const OcrLabPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [tab, setTab] = useState(0)
  const [models, setModels] = useState([])
  const [activeModel, setActiveModel] = useState('')
  const [modelsLoading, setModelsLoading] = useState(false)

  // Shared upload state
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [isPdf, setIsPdf] = useState(false)
  const [pdfPages, setPdfPages] = useState([])
  const [pdfSessionId, setPdfSessionId] = useState(null)
  const [selectedIndices, setSelectedIndices] = useState([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Single tab state
  const [sModel, setSModel] = useState('')
  const [sExtracting, setSExtracting] = useState(false)
  const [sResponse, setSResponse] = useState(null)
  const [sDurationMs, setSDurationMs] = useState(null)
  const [sError, setSError] = useState('')
  const [sScore, setSScore] = useState(0)
  const [sRemarks, setSRemarks] = useState('')
  const [sSaving, setSSaving] = useState(false)
  const [sSavedMsg, setSSavedMsg] = useState('')
  const [sSaveError, setSSaveError] = useState('')

  // Compare tab state
  const [cModelA, setCModelA] = useState('')
  const [cModelB, setCModelB] = useState('')
  const [cExtractingA, setCExtractingA] = useState(false)
  const [cExtractingB, setCExtractingB] = useState(false)
  const [cResponseA, setCResponseA] = useState(null)
  const [cResponseB, setCResponseB] = useState(null)
  const [cDurationA, setCDurationA] = useState(null)
  const [cDurationB, setCDurationB] = useState(null)
  const [cErrorA, setCErrorA] = useState('')
  const [cErrorB, setCErrorB] = useState('')
  const [cScoreA, setCScoreA] = useState(0)
  const [cScoreB, setCScoreB] = useState(0)
  const [cRemarksA, setCRemarksA] = useState('')
  const [cRemarksB, setCRemarksB] = useState('')
  const [cSavingA, setCSavingA] = useState(false)
  const [cSavingB, setCSavingB] = useState(false)
  const [cSavedMsgA, setCSavedMsgA] = useState('')
  const [cSavedMsgB, setCSavedMsgB] = useState('')
  const [cSaveErrorA, setCSaveErrorA] = useState('')
  const [cSaveErrorB, setCSaveErrorB] = useState('')

//   useEffect(() => {
//     if (userData?.userrole_type !== 'super-admin') router.push('/home')
//   }, [userData])

  useEffect(() => {
    const load = async () => {
      setModelsLoading(true)
      try {
        const res = await apiGet(ocrModelConfigUrl)
        const ms = res.data?.models || []
        setModels(ms)
        setActiveModel(res.data?.activeModel || '')
        setSModel(res.data?.activeModel || '')
        setCModelA(res.data?.activeModel || '')
        const second = ms.filter(m => m.id !== res.data?.activeModel)[0]?.id || ''
        setCModelB(second)
      } catch { /* ignore */ }
      finally { setModelsLoading(false) }
    }
    load()
  }, [])

  const handleTabChange = (_, v) => { setTab(v); setUploadError('') }

  const uploadPanelProps = {
    file, setFile, isPdf, setIsPdf, filePreview, setFilePreview,
    pdfPages, setPdfPages, pdfSessionId, setPdfSessionId,
    selectedIndices, setSelectedIndices,
    pdfLoading, setPdfLoading, onError: setUploadError,
  }

  const canExtract = file && !pdfLoading && !(isPdf && !pdfSessionId)

  const pageLabel = isPdf && pdfPages.length > 0
    ? (selectedIndices.length === 0 ? `All ${pdfPages.length} pages` : `${selectedIndices.length} page${selectedIndices.length > 1 ? 's' : ''}`)
    : null

  const handleSingleExtract = async () => {
    if (!file) return
    setSResponse(null); setSError(''); setSDurationMs(null); setSScore(0); setSRemarks(''); setSSavedMsg(''); setSSaveError('')
    setSExtracting(true)
    try {
      const { response, durationMs } = await runExtraction({ file, isPdf, pdfSessionId, selectedIndices, model: sModel })
      setSResponse(response)
      setSDurationMs(durationMs)
    } catch (err) {
      setSError(err?.response?.data?.message || err?.message || 'Extraction failed')
    } finally { setSExtracting(false) }
  }

  const handleCompareExtract = async () => {
    if (!file || !cModelA || !cModelB) return
    setCResponseA(null); setCResponseB(null); setCDurationA(null); setCDurationB(null)
    setCErrorA(''); setCErrorB('')
    setCScoreA(0); setCScoreB(0); setCRemarksA(''); setCRemarksB('')
    setCSavedMsgA(''); setCSavedMsgB(''); setCSaveErrorA(''); setCSaveErrorB('')

    // Run A first, then B sequentially.
    // Running both in parallel doubles the concurrent API calls (2×N pages),
    // which causes Anthropic/OpenAI rate-limiting and degrades result quality.
    // Sequential keeps peak concurrency at N pages (same as single mode).
    setCExtractingA(true)
    try {
      const { response, durationMs } = await runExtraction({ file, isPdf, pdfSessionId, selectedIndices, model: cModelA })
      setCResponseA(response)
      setCDurationA(durationMs)
    } catch (err) {
      setCErrorA(err?.response?.data?.message || err?.message || 'Failed')
    } finally { setCExtractingA(false) }

    setCExtractingB(true)
    try {
      const { response, durationMs } = await runExtraction({ file, isPdf, pdfSessionId, selectedIndices, model: cModelB })
      setCResponseB(response)
      setCDurationB(durationMs)
    } catch (err) {
      setCErrorB(err?.response?.data?.message || err?.message || 'Failed')
    } finally { setCExtractingB(false) }
  }

  const saveReview = async ({ model, response, score, remarks, durationMs, setSaving, setSavedMsg, setSaveError }) => {
    if (score === 0) { setSaveError('Please select a star rating.'); return }
    setSaving(true); setSavedMsg(''); setSaveError('')
    try {
      const token = await getAccessToken()
      await axios.post(ocrReviewUrl, {
        ocr_log_id: response?.log_id || null,
        model,
        score,
        remarks: remarks || null,
        duration_ms: durationMs || null,
      }, { headers: { authorization: token } })
      setSavedMsg(`${score}★ saved for ${model}`)
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>OCR Lab</Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Test any AI model on invitation images. Single mode or side-by-side comparison.
      </Typography>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Tab label='Single Model' />
        <Tab label='Compare Two Models' />
      </Tabs>

      {/* ── SINGLE TAB ───────────────────────────────────────────────── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle2' fontWeight={700} mb={1.5}>1. Upload</Typography>
                <UploadPanel {...uploadPanelProps} />
                {uploadError && <Alert severity='error' sx={{ mb: 1, fontSize: 12 }}>{uploadError}</Alert>}

                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle2' fontWeight={700} mb={1.5}>2. Select Model</Typography>
                {modelsLoading
                  ? <CircularProgress size={20} />
                  : <ModelSelect label='AI Model' value={sModel} onChange={setSModel} models={models} activeModel={activeModel} />}

                <Button
                  variant='contained' fullWidth
                  sx={{ mt: 2, background: STAR_COLOR, '&:hover': { background: '#e0962e' }, fontWeight: 700 }}
                  disabled={!canExtract || sExtracting}
                  onClick={handleSingleExtract}
                >
                  {sExtracting
                    ? <><CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />Extracting…</>
                    : `3. Extract${pageLabel ? ` (${pageLabel})` : ''}`}
                </Button>
                {sError && <Alert severity='error' sx={{ mt: 1.5, fontSize: 12 }}>{sError}</Alert>}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {!sResponse && !sExtracting && (
              <Box sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e0e0e0', borderRadius: 2 }}>
                <Typography variant='body2' color='text.disabled'>Result will appear here</Typography>
              </Box>
            )}
            {sExtracting && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <CircularProgress sx={{ color: STAR_COLOR }} />
                <Typography variant='body2' color='text.secondary' mt={2}>Running {sModel}{pageLabel ? ` on ${pageLabel}` : ''}…</Typography>
              </Box>
            )}
            {sResponse && (
              <Card variant='outlined'>
                <CardContent>
                  <ExtractionResult
                    response={sResponse} model={sResponse.model || sModel} models={models} durationMs={sDurationMs}
                    score={sScore} onScoreChange={setSScore}
                    remarks={sRemarks} onRemarksChange={setSRemarks}
                    onSaveReview={() => saveReview({ model: sResponse.model || sModel, response: sResponse, score: sScore, remarks: sRemarks, durationMs: sDurationMs, setSaving: setSSaving, setSavedMsg: setSSavedMsg, setSaveError: setSSaveError })}
                    saving={sSaving} savedMsg={sSavedMsg} saveError={sSaveError}
                  />
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── COMPARE TAB ──────────────────────────────────────────────── */}
      {tab === 1 && (
        <Box>
          <Card variant='outlined' sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems='flex-start'>
                <Grid item xs={12} md={4}>
                  <Typography variant='subtitle2' fontWeight={700} mb={1.5}>Upload (shared)</Typography>
                  <UploadPanel {...uploadPanelProps} />
                  {uploadError && <Alert severity='error' sx={{ mb: 1, fontSize: 12 }}>{uploadError}</Alert>}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='subtitle2' fontWeight={700} mb={1.5}>Model A</Typography>
                  {modelsLoading ? <CircularProgress size={20} /> : (
                    <ModelSelect label='Model A' value={cModelA} onChange={setCModelA} models={models} activeModel={activeModel} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='subtitle2' fontWeight={700} mb={1.5}>Model B</Typography>
                  {modelsLoading ? <CircularProgress size={20} /> : (
                    <ModelSelect label='Model B' value={cModelB} onChange={setCModelB} models={models} activeModel={activeModel} />
                  )}
                </Grid>
                <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    variant='contained' fullWidth
                    sx={{ background: STAR_COLOR, '&:hover': { background: '#e0962e' }, fontWeight: 700 }}
                    disabled={!canExtract || cExtractingA || cExtractingB || !cModelA || !cModelB}
                    onClick={handleCompareExtract}
                  >
                    {(cExtractingA || cExtractingB)
                      ? <><CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />{cExtractingA ? 'Running A…' : 'Running B…'}</>
                      : `Extract Both${pageLabel ? ` (${pageLabel})` : ''}`}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {(cResponseA || cResponseB || cErrorA || cErrorB || cExtractingA || cExtractingB) && (
            <Grid container spacing={2}>
              {/* Model A card */}
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderColor: PROVIDER_COLOR[models.find(m => m.id === cModelA)?.provider] || '#ddd', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' fontWeight={700} mb={1.5}>
                      Model A{cExtractingA && <CircularProgress size={12} sx={{ ml: 1, color: STAR_COLOR, verticalAlign: 'middle' }} />}
                    </Typography>
                    {cExtractingA && !cResponseA && !cErrorA && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                        <CircularProgress sx={{ color: STAR_COLOR }} />
                        <Typography variant='caption' color='text.secondary' mt={1.5}>Running {cModelA}{pageLabel ? ` on ${pageLabel}` : ''}…</Typography>
                      </Box>
                    )}
                    {cErrorA && <Alert severity='error' sx={{ mb: 2, fontSize: 12 }}>{cErrorA}</Alert>}
                    {cResponseA && (
                      <ExtractionResult
                        response={cResponseA} model={cResponseA.model || cModelA} models={models} durationMs={cDurationA}
                        score={cScoreA} onScoreChange={setCScoreA}
                        remarks={cRemarksA} onRemarksChange={setCRemarksA}
                        onSaveReview={() => saveReview({ model: cResponseA.model || cModelA, response: cResponseA, score: cScoreA, remarks: cRemarksA, durationMs: cDurationA, setSaving: setCSavingA, setSavedMsg: setCSavedMsgA, setSaveError: setCSaveErrorA })}
                        saving={cSavingA} savedMsg={cSavedMsgA} saveError={cSaveErrorA}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Model B card */}
              <Grid item xs={12} md={6}>
                <Card variant='outlined' sx={{ borderColor: PROVIDER_COLOR[models.find(m => m.id === cModelB)?.provider] || '#ddd', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant='subtitle2' fontWeight={700} mb={1.5}>
                      Model B{cExtractingB && <CircularProgress size={12} sx={{ ml: 1, color: STAR_COLOR, verticalAlign: 'middle' }} />}
                    </Typography>
                    {(cExtractingA || cExtractingB) && !cResponseB && !cErrorB && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                        {cExtractingA
                          ? <Typography variant='caption' color='text.disabled' sx={{ fontStyle: 'italic' }}>Waiting for Model A to finish…</Typography>
                          : <><CircularProgress sx={{ color: STAR_COLOR }} /><Typography variant='caption' color='text.secondary' mt={1.5}>Running {cModelB}{pageLabel ? ` on ${pageLabel}` : ''}…</Typography></>
                        }
                      </Box>
                    )}
                    {cErrorB && <Alert severity='error' sx={{ mb: 2, fontSize: 12 }}>{cErrorB}</Alert>}
                    {cResponseB && (
                      <ExtractionResult
                        response={cResponseB} model={cResponseB.model || cModelB} models={models} durationMs={cDurationB}
                        score={cScoreB} onScoreChange={setCScoreB}
                        remarks={cRemarksB} onRemarksChange={setCRemarksB}
                        onSaveReview={() => saveReview({ model: cResponseB.model || cModelB, response: cResponseB, score: cScoreB, remarks: cRemarksB, durationMs: cDurationB, setSaving: setCSavingB, setSavedMsg: setCSavedMsgB, setSaveError: setCSaveErrorB })}
                        saving={cSavingB} savedMsg={cSavedMsgB} saveError={cSaveErrorB}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Summary comparison row */}
              {(cResponseA || cResponseB) && (
                <Grid item xs={12}>
                  <Card variant='outlined' sx={{ background: '#fafafa' }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={1} sx={{ letterSpacing: 1 }}>
                        COMPARISON SUMMARY
                      </Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Model', a: cResponseA?.model || cModelA, b: cResponseB?.model || cModelB },
                          ...(cResponseA?.cost_usd != null && cResponseB?.cost_usd != null ? [{
                            label: 'Cost (USD)',
                            a: `$${Number(cResponseA.cost_usd).toFixed(5)}`,
                            b: `$${Number(cResponseB.cost_usd).toFixed(5)}`,
                            winner: Number(cResponseA.cost_usd) <= Number(cResponseB.cost_usd) ? 'A' : 'B',
                          }] : []),
                          ...(cResponseA?.total_tokens != null && cResponseB?.total_tokens != null ? [{
                            label: 'Total Tokens',
                            a: Number(cResponseA.total_tokens || 0).toLocaleString(),
                            b: Number(cResponseB.total_tokens || 0).toLocaleString(),
                            winner: Number(cResponseA.total_tokens) <= Number(cResponseB.total_tokens) ? 'A' : 'B',
                          }] : []),
                          ...(cDurationA != null && cDurationB != null ? [{
                            label: 'Time',
                            a: fmtDuration(cDurationA),
                            b: fmtDuration(cDurationB),
                            winner: cDurationA <= cDurationB ? 'A' : 'B',
                          }] : []),
                        ].map(row => (
                          <Grid item xs={6} sm={3} key={row.label}>
                            <Typography variant='caption' color='text.secondary' display='block' sx={{ fontSize: 10 }}>{row.label}</Typography>
                            <Typography variant='body2' fontWeight={row.winner === 'A' ? 700 : 400} color={row.winner === 'A' ? 'success.main' : 'text.primary'}>
                              A: {row.a}{row.winner === 'A' ? ' ✓' : ''}
                            </Typography>
                            <Typography variant='body2' fontWeight={row.winner === 'B' ? 700 : 400} color={row.winner === 'B' ? 'success.main' : 'text.primary'}>
                              B: {row.b}{row.winner === 'B' ? ' ✓' : ''}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {!cResponseA && !cResponseB && !cErrorA && !cErrorB && !cExtractingA && !cExtractingB && (
            <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e0e0e0', borderRadius: 2 }}>
              <Typography variant='body2' color='text.disabled'>Upload a file, pick two models, and click Extract Both</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

OcrLabPage.acl = { action: 'read', subject: 'ocr' }

export default OcrLabPage
