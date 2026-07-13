import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'

import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { apiGet, apiPut } from 'src/hooks/axios'
import { ocrModelConfigUrl, ocrRawPageSettingUrl, ocrCompressSettingUrl, ocrFuzzyThresholdUrl } from 'src/services/pathConst'

const COMPRESS_PX_OPTIONS = [500, 1000, 1500, 2000, 2500]

const USD_INR = 95

// Typical invitation image: ~1 500 input tokens (image tiles + prompt) + ~400 output tokens (JSON)
const SAMPLE_INPUT_TOKENS = 1500
const SAMPLE_OUTPUT_TOKENS = 400

const sampleCostUSD = (m) =>
  (SAMPLE_INPUT_TOKENS / 1e6) * m.inputPer1M + (SAMPLE_OUTPUT_TOKENS / 1e6) * m.outputPer1M

const fmt = (n, decimals = 2) => n.toFixed(decimals)

const OcrSettingsPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [config, setConfig] = useState(null)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')
  const [saveRawPages, setSaveRawPages] = useState(false)
  const [rawToggleSaving, setRawToggleSaving] = useState(false)
  const [compressImages, setCompressImages] = useState(true)
  const [compressToggleSaving, setCompressToggleSaving] = useState(false)
  const [compressMaxPx, setCompressMaxPx] = useState(1500)
  const [pxSaving, setPxSaving] = useState(false)
  const [fuzzyThreshold, setFuzzyThreshold] = useState(0.4)
  const [fuzzyDraft, setFuzzyDraft] = useState(0.4)
  const [fuzzySaving, setFuzzySaving] = useState(false)

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchConfig = async () => {
    setLoading(true)
    setError('')
    try {
      const [modelRes, rawRes, compressRes, fuzzyRes] = await Promise.all([
        apiGet(ocrModelConfigUrl),
        apiGet(ocrRawPageSettingUrl),
        apiGet(ocrCompressSettingUrl),
        apiGet(ocrFuzzyThresholdUrl),
      ])
      setConfig(modelRes.data)
      setSelected(modelRes.data.activeModel)
      setSaveRawPages(rawRes.data?.saveRawPages ?? false)
      setCompressImages(compressRes.data?.compressImages ?? true)
      setCompressMaxPx(compressRes.data?.compressMaxPx ?? 1500)
      const ft = fuzzyRes.data?.fuzzyThreshold ?? 0.4
      setFuzzyThreshold(ft)
      setFuzzyDraft(ft)
    } catch {
      setError('Failed to load model config')
    } finally {
      setLoading(false)
    }
  }

  const handleCompressPx = async (px) => {
    if (px == null || px === compressMaxPx) return
    setPxSaving(true)
    setError('')
    try {
      const res = await apiPut(ocrCompressSettingUrl, { compressMaxPx: px })
      setCompressMaxPx(res.data?.compressMaxPx ?? px)
    } catch {
      setError('Failed to update compression resolution')
    } finally {
      setPxSaving(false)
    }
  }

  const handleSaveFuzzy = async () => {
    setFuzzySaving(true)
    setError('')
    try {
      const res = await apiPut(ocrFuzzyThresholdUrl, { fuzzyThreshold: fuzzyDraft })
      const saved = res.data?.fuzzyThreshold ?? fuzzyDraft
      setFuzzyThreshold(saved)
      setFuzzyDraft(saved)
      setSavedMsg(`Fuzzy match threshold set to ${saved.toFixed(2)} (${Math.round(saved * 100)}%)`)
    } catch {
      setError('Failed to update fuzzy threshold')
    } finally {
      setFuzzySaving(false)
    }
  }

  const handleRawToggle = async (e) => {
    const val = e.target.checked
    setRawToggleSaving(true)
    try {
      await apiPut(ocrRawPageSettingUrl, { saveRawPages: val })
      setSaveRawPages(val)
    } catch {
      setError('Failed to update raw data setting')
    } finally {
      setRawToggleSaving(false)
    }
  }

  const handleCompressToggle = async (e) => {
    const val = e.target.checked
    setCompressToggleSaving(true)
    try {
      await apiPut(ocrCompressSettingUrl, { compressImages: val })
      setCompressImages(val)
    } catch {
      setError('Failed to update compression setting')
    } finally {
      setCompressToggleSaving(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const handleSave = async () => {
    setSaving(true)
    setSavedMsg('')
    setError('')
    try {
      await apiPut(ocrModelConfigUrl, { model: selected })
      setSavedMsg(`Active model set to: ${selected}`)
      fetchConfig()
    } catch {
      setError('Failed to save model')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>

  const providerColor = { OpenAI: '#10a37f', Anthropic: '#c96442', Google: '#4285F4' }

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>OCR AI Model Settings</Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Select which AI model is used for all invitation OCR extractions. Users never see this choice.
      </Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      {savedMsg && <Alert severity='success' sx={{ mb: 2 }}>{savedMsg}</Alert>}

      {config && (
        <>
          {/* ── Model selector ─────────────────────────────────────── */}
          <RadioGroup value={selected} onChange={e => setSelected(e.target.value)}>
            {['OpenAI', 'Anthropic', 'Google'].map(provider => (
              <Box key={provider} mb={3}>
                <Box display='flex' alignItems='center' gap={1} mb={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: providerColor[provider] }} />
                  <Typography variant='overline' fontWeight={700} color='text.secondary'>{provider} Models</Typography>
                </Box>
                {config.models.filter(m => m.provider === provider).map(m => {
                  const costUSD = sampleCostUSD(m)
                  const costINR = costUSD * USD_INR
                  const isActive = config.activeModel === m.id
                  const isSelected = selected === m.id
                  return (
                    <Card
                      key={m.id}
                      variant='outlined'
                      sx={{
                        mb: 1.5,
                        borderColor: isSelected ? providerColor[provider] : 'divider',
                        borderWidth: isSelected ? 2 : 1,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                        background: isSelected ? (provider === 'OpenAI' ? '#f0fdf8' : '#fdf4f0') : 'white',
                      }}
                      onClick={() => setSelected(m.id)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display='flex' alignItems='center' gap={1.5}>
                          <Radio value={m.id} size='small' sx={{ color: providerColor[provider], '&.Mui-checked': { color: providerColor[provider] } }} />
                          <Box flex={1} minWidth={0}>
                            <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
                              <Typography fontWeight={700} fontSize={14}>{m.name}</Typography>
                              {isActive && <Chip label='ACTIVE' size='small' color='success' sx={{ height: 18, fontSize: 10 }} />}
                            </Box>
                            <Typography variant='caption' color='text.secondary'>{m.note}</Typography>
                          </Box>
                          {/* Pricing columns */}
                          <Box display='flex' gap={3} alignItems='center'>
                            <Box textAlign='right'>
                              <Typography variant='caption' color='text.secondary' display='block'>Input / 1M</Typography>
                              <Typography fontWeight={600} fontSize={12}>${m.inputPer1M}</Typography>
                              <Typography fontSize={11} color='text.secondary'>₹{(m.inputPer1M * USD_INR).toFixed(0)}</Typography>
                            </Box>
                            <Box textAlign='right'>
                              <Typography variant='caption' color='text.secondary' display='block'>Output / 1M</Typography>
                              <Typography fontWeight={600} fontSize={12}>${m.outputPer1M}</Typography>
                              <Typography fontSize={11} color='text.secondary'>₹{(m.outputPer1M * USD_INR).toFixed(0)}</Typography>
                            </Box>
                            <Tooltip title={`~${SAMPLE_INPUT_TOKENS} input + ~${SAMPLE_OUTPUT_TOKENS} output tokens per typical invitation image`} arrow>
                              <Box textAlign='right' sx={{ borderLeft: '1px solid #e0e0e0', pl: 2, minWidth: 90 }}>
                                <Typography variant='caption' color='text.secondary' display='block'>Per image</Typography>
                                <Typography fontWeight={700} fontSize={13} color={providerColor[provider]}>
                                  ₹{fmt(costINR, costINR < 0.1 ? 3 : 2)}
                                </Typography>
                                <Typography fontSize={10} color='text.secondary'>${fmt(costUSD, 5)}</Typography>
                              </Box>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            ))}
          </RadioGroup>

          <Divider sx={{ my: 2 }} />

          <Box display='flex' alignItems='center' gap={2} mb={4}>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={saving || selected === config.activeModel}
              sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}
            >
              {saving ? 'Saving...' : 'Save Model'}
            </Button>
            <Typography variant='caption' color='text.secondary'>
              Currently active: <strong>{config.activeModel}</strong>
            </Typography>
          </Box>

          {/* ── Per-image cost table ─────────────────────────────────── */}
          <Box mb={4} p={2.5} sx={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 2 }}>
            <Typography variant='subtitle2' fontWeight={700} mb={0.5}>Sample Cost — Per Invitation Image</Typography>
            <Typography variant='caption' color='text.secondary' display='block' mb={2}>
              Estimated based on ~{SAMPLE_INPUT_TOKENS} input tokens (image + prompt) and ~{SAMPLE_OUTPUT_TOKENS} output tokens (JSON result).
              Actual token usage varies by image complexity and number of events.
            </Typography>
            <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <Box component='thead'>
                <Box component='tr' sx={{ background: '#f0f0f0' }}>
                  {['Model', 'Provider', 'Input cost', 'Output cost', 'Per image (USD)', 'Per image (INR)', '100 scans (INR)'].map(h => (
                    <Box component='th' key={h} sx={{ p: '6px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 700, fontSize: 12 }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component='tbody'>
                {config.models.map((m, i) => {
                  const inCost = (SAMPLE_INPUT_TOKENS / 1e6) * m.inputPer1M
                  const outCost = (SAMPLE_OUTPUT_TOKENS / 1e6) * m.outputPer1M
                  const total = inCost + outCost
                  const totalINR = total * USD_INR
                  const isActive = config.activeModel === m.id
                  return (
                    <Box component='tr' key={m.id} sx={{ background: isActive ? '#fff8e1' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: isActive ? 700 : 400 }}>
                        {m.name}{isActive && ' ★'}
                      </Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', color: providerColor[m.provider], fontWeight: 600, fontSize: 12 }}>{m.provider}</Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>${fmt(inCost, 6)}</Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>${fmt(outCost, 6)}</Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>${fmt(total, 5)}</Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, color: '#333' }}>
                        ₹{fmt(totalINR, totalINR < 0.1 ? 4 : 3)}
                      </Box>
                      <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                        ₹{fmt(totalINR * 100, totalINR * 100 < 1 ? 2 : 1)}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>

          {/* ── Raw Page Data Toggle ─────────────────────────────────── */}
          <Divider sx={{ my: 3 }} />
          <Box mb={4}>
            <Typography variant='subtitle1' fontWeight={700} mb={0.5}>Raw Page Data Collection</Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              When enabled, every extracted page image and raw AI JSON response is saved to the database.
              Use this to audit and improve AI extraction over time. Disable when not needed to save storage.
            </Typography>
            <Box display='flex' alignItems='center' gap={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, background: saveRawPages ? '#f0fdf4' : '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={saveRawPages}
                    onChange={handleRawToggle}
                    disabled={rawToggleSaving}
                    color='success'
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={600} fontSize={14}>
                      {saveRawPages ? 'Enabled — saving raw pages' : 'Disabled — not collecting'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Applies to all users immediately. Stored in ocr_raw_page_data table.
                    </Typography>
                  </Box>
                }
              />
              {rawToggleSaving && <CircularProgress size={18} />}
            </Box>
          </Box>

          {/* ── Image Compression Toggle + Resolution ────────────────── */}
          <Divider sx={{ my: 3 }} />
          <Box mb={4}>
            <Typography variant='subtitle1' fontWeight={700} mb={0.5}>Image Compression Before AI</Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              When <strong>ON</strong>: images are resized to the chosen resolution at JPEG quality 85 before sending to AI (faster, cheaper).
              When <strong>OFF</strong>: original image is sent as-is (better quality for high-res or ornate cards, higher cost).
              OpenAI always uses <strong>detail: high</strong>.
            </Typography>
            <Box display='flex' alignItems='center' gap={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, background: compressImages ? '#f0fdf4' : '#fff8e1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={compressImages}
                    onChange={handleCompressToggle}
                    disabled={compressToggleSaving}
                    color='warning'
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={600} fontSize={14}>
                      {compressImages ? `Compression ON — ${compressMaxPx}px JPEG q85` : 'Compression OFF — sending original image'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Turn OFF to test if full resolution improves extraction accuracy.
                    </Typography>
                  </Box>
                }
              />
              {compressToggleSaving && <CircularProgress size={18} />}
            </Box>

            {/* Resolution selector — only relevant when compression is ON */}
            <Box mt={2} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: compressImages ? 1 : 0.5 }}>
              <Box display='flex' alignItems='center' gap={1.5} mb={1.5} flexWrap='wrap'>
                <Typography fontWeight={600} fontSize={14}>Compression resolution (longest edge)</Typography>
                {pxSaving && <CircularProgress size={16} />}
              </Box>
              <ToggleButtonGroup
                exclusive
                value={compressMaxPx}
                onChange={(e, val) => handleCompressPx(val)}
                disabled={!compressImages || pxSaving}
                size='small'
              >
                {COMPRESS_PX_OPTIONS.map(px => (
                  <ToggleButton
                    key={px}
                    value={px}
                    sx={{
                      px: 2.5,
                      '&.Mui-selected': { background: '#F5A742', color: 'white', '&:hover': { background: '#e0962e' } },
                    }}
                  >
                    {px}px
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant='caption' color='text.secondary' display='block' mt={1.5}>
                Lower (500px) = fastest & cheapest, may miss fine text on ornate cards. Higher (2000–2500px) = sharper text for AI, slower & costlier.
                Applies to all extractions immediately.
              </Typography>
            </Box>
          </Box>

          {/* ── Event-Type Fuzzy Match Threshold ─────────────────────── */}
          <Divider sx={{ my: 3 }} />
          <Box mb={4}>
            <Typography variant='subtitle1' fontWeight={700} mb={0.5}>Event Name Fuzzy Match Threshold</Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              After AI extraction, each event type is matched against the canonical Event Types list and corrected when similarity is
              at or above this threshold. <strong>Lower</strong> = more aggressive correction (fixes badly garbled names like
              &quot;Alaayna&quot; → &quot;Mayra&quot;, but risks wrong matches). <strong>Higher</strong> = only near-exact matches are corrected.
            </Typography>
            <Box p={2.5} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, background: '#fafafa' }}>
              <Box display='flex' alignItems='center' gap={2} mb={1}>
                <Typography fontWeight={700} fontSize={18} sx={{ minWidth: 110 }}>
                  {fuzzyDraft.toFixed(2)} <Typography component='span' variant='caption' color='text.secondary'>({Math.round(fuzzyDraft * 100)}%)</Typography>
                </Typography>
                <Slider
                  value={fuzzyDraft}
                  onChange={(e, val) => setFuzzyDraft(Array.isArray(val) ? val[0] : val)}
                  min={0}
                  max={1}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.4, label: '0.4' },
                    { value: 0.65, label: '0.65' },
                    { value: 1, label: '1' },
                  ]}
                  valueLabelDisplay='auto'
                  sx={{ color: '#F5A742', flex: 1 }}
                />
              </Box>
              <Box display='flex' alignItems='center' gap={2} mt={1}>
                <Button
                  variant='contained'
                  onClick={handleSaveFuzzy}
                  disabled={fuzzySaving || fuzzyDraft === fuzzyThreshold}
                  sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}
                >
                  {fuzzySaving ? 'Saving...' : 'Save Threshold'}
                </Button>
                <Typography variant='caption' color='text.secondary'>
                  Currently active: <strong>{fuzzyThreshold.toFixed(2)}</strong> ({Math.round(fuzzyThreshold * 100)}%).
                  Recommended: <strong>0.40</strong>.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ── Full pricing reference ───────────────────────────────── */}
          <Box>
            <Typography variant='overline' color='text.secondary' fontWeight={700}>
              API Pricing Reference (per 1M tokens · USD → INR at ₹{USD_INR})
            </Typography>
            <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', mt: 1, fontSize: 13 }}>
              <Box component='thead'>
                <Box component='tr' sx={{ background: '#f5f5f5' }}>
                  {['Model', 'Provider', 'Input $/1M', 'Output $/1M', 'Input ₹/1M', 'Output ₹/1M', 'Best for'].map(h => (
                    <Box component='th' key={h} sx={{ p: '6px 10px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontWeight: 700, fontSize: 12 }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component='tbody'>
                {config.models.map((m, i) => (
                  <Box component='tr' key={m.id} sx={{ background: config.activeModel === m.id ? '#fff8e1' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: config.activeModel === m.id ? 700 : 400 }}>
                      {m.name}{config.activeModel === m.id && ' ★'}
                    </Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', color: providerColor[m.provider], fontWeight: 600, fontSize: 12 }}>{m.provider}</Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>${m.inputPer1M}</Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>${m.outputPer1M}</Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>₹{(m.inputPer1M * USD_INR).toFixed(2)}</Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0' }}>₹{(m.outputPer1M * USD_INR).toFixed(2)}</Box>
                    <Box component='td' sx={{ p: '5px 10px', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: 12 }}>{m.note}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}

export default OcrSettingsPage
