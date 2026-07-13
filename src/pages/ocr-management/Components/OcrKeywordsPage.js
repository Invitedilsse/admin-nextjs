import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import { apiGet, apiPost, apiDelete } from 'src/hooks/axios'
import { ocrKeywordsUrl } from 'src/services/pathConst'

const ALL_FIELDS = ['occasion', 'host_name', 'venue', 'event_type', 'bride', 'groom']

const FIELD_LABELS = {
  occasion: 'Occasion',
  host_name: 'Host Name',
  venue: 'Venue',
  event_type: 'Event Type',
  bride: 'Bride Name',
  groom: 'Groom Name',
}

const FIELD_HINTS = {
  occasion: 'e.g. Wedding, Vivah, Shaadi, Kalyanam, Engagement',
  host_name: 'Ignore: Mr., Mrs., Shri, Smt., Late',
  venue: 'e.g. Mahal, Palace, Convention Centre',
  event_type: 'e.g. Sangeet, Mehendi, Haldi, Baraat, Reception',
  bride: 'Ignore: Kum., Miss, D/O',
  groom: 'Ignore: S/O, Mr.',
}

const OcrKeywordsPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [activeField, setActiveField] = useState('occasion')
  const [newKeyword, setNewKeyword] = useState('')
  const [newType, setNewType] = useState('match')
  const [adding, setAdding] = useState(false)

//   useEffect(() => {
//     if (userData?.userrole_type !== 'super-admin') router.push('/home')
//   }, [userData])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet(ocrKeywordsUrl)
      setData(res.data)
    } catch (err) {
      console.error('[OCR-KEYWORDS] load error:', err)
      setError('Failed to load keywords: ' + (err?.message || err?.error || JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newKeyword.trim()) return
    setAdding(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await apiPost(ocrKeywordsUrl, { field_name: activeField, keyword: newKeyword.trim(), type: newType })
      const inserted = res?.data?.inserted
      setNewKeyword('')
      await load()
      if (inserted === false) {
        setSuccessMsg(`"${newKeyword.trim()}" already exists in this field.`)
      } else {
        setSuccessMsg(`Added "${newKeyword.trim()}" to ${FIELD_LABELS[activeField]}.`)
      }
    } catch (err) {
      console.error('[OCR-KEYWORDS] add error:', err)
      setError('Failed to add keyword: ' + (err?.message || err?.error || JSON.stringify(err)))
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id, kw) => {
    setError('')
    setSuccessMsg('')
    try {
      await apiDelete(`${ocrKeywordsUrl}/${id}`)
      await load()
      setSuccessMsg(`Removed "${kw}".`)
    } catch (err) {
      console.error('[OCR-KEYWORDS] delete error:', err)
      setError('Failed to delete keyword: ' + (err?.message || err?.error || JSON.stringify(err)))
    }
  }

  const fields = data?.fields || ALL_FIELDS
  const fieldKeywords = data?.keywords?.[activeField] || { match: [], ignore: [] }

  return (
    <Box sx={{ p: 4, maxWidth: 820, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>OCR Keywords & Ignore Words</Typography>
      <Typography variant='body2' color='text.secondary' mb={1}>
        <b>Match keywords</b> are sent to the AI to help it recognise field values correctly (e.g. "Sangeet" for event_type).
        <br />
        <b>Ignore words</b> are stripped from extracted values after AI returns them (e.g. "Mr." from host name).
      </Typography>
      <Typography variant='caption' color='warning.main' display='block' mb={3}>
        Switch between field tabs below. Each field has its own match + ignore lists.
      </Typography>

      {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Field tabs — always rendered using static field list as fallback */}
      <Tabs
        value={activeField}
        onChange={(_, v) => { setActiveField(v); setSuccessMsg('') }}
        variant='scrollable'
        scrollButtons='auto'
        sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}
      >
        {fields.map(f => (
          <Tab key={f} label={FIELD_LABELS[f] || f} value={f} />
        ))}
      </Tabs>

      {FIELD_HINTS[activeField] && (
        <Typography variant='caption' color='text.secondary' display='block' mb={2}>
          💡 Suggestions: {FIELD_HINTS[activeField]}
        </Typography>
      )}

      {/* Add form */}
      <Box display='flex' gap={1.5} mb={3} alignItems='flex-start'>
        <TextField
          label='Keyword / phrase'
          value={newKeyword}
          onChange={e => setNewKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          size='small'
          sx={{ flex: 1 }}
          placeholder={`Add for ${FIELD_LABELS[activeField] || activeField}...`}
        />
        <FormControl size='small' sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select value={newType} label='Type' onChange={e => setNewType(e.target.value)}>
            <MenuItem value='match'>Match (boost AI)</MenuItem>
            <MenuItem value='ignore'>Ignore (strip text)</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant='contained'
          onClick={handleAdd}
          disabled={adding || !newKeyword.trim() || loading}
          sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' }, whiteSpace: 'nowrap' }}
        >
          {adding ? '...' : 'Add'}
        </Button>
      </Box>

      {/* Match keywords */}
      <Box mb={3}>
        <Typography variant='overline' fontWeight={700} color='success.main'>
          Match Keywords — {FIELD_LABELS[activeField] || activeField}
        </Typography>
        <Typography variant='caption' color='text.secondary' display='block' mb={1}>
          These are included in the AI prompt to improve recognition for this field.
        </Typography>
        <Box display='flex' flexWrap='wrap' gap={1} minHeight={40}>
          {fieldKeywords.match.length === 0
            ? <Typography variant='caption' color='text.disabled'>No match keywords yet</Typography>
            : fieldKeywords.match.map(k => (
              <Chip
                key={k.id}
                label={k.keyword}
                color='success'
                variant='outlined'
                size='small'
                onDelete={() => handleDelete(k.id, k.keyword)}
              />
            ))
          }
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Ignore words */}
      <Box>
        <Typography variant='overline' fontWeight={700} color='error.main'>
          Ignore Words — {FIELD_LABELS[activeField] || activeField}
        </Typography>
        <Typography variant='caption' color='text.secondary' display='block' mb={1}>
          These are stripped from the extracted value before saving (e.g. "Mr.", "Shri", "Late").
        </Typography>
        <Box display='flex' flexWrap='wrap' gap={1} minHeight={40}>
          {fieldKeywords.ignore.length === 0
            ? <Typography variant='caption' color='text.disabled'>No ignore words yet</Typography>
            : fieldKeywords.ignore.map(k => (
              <Chip
                key={k.id}
                label={k.keyword}
                color='error'
                variant='outlined'
                size='small'
                onDelete={() => handleDelete(k.id, k.keyword)}
              />
            ))
          }
        </Box>
      </Box>
    </Box>
  )
}

export default OcrKeywordsPage
