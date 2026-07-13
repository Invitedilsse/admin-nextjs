import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

import { apiGet, apiPost } from 'src/hooks/axios'
import { ocrMainPromptUrl } from 'src/services/pathConst'

const OcrMainPromptPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [promptText, setPromptText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

//   useEffect(() => {
//     if (userData?.userrole_type !== 'super-admin') router.push('/home')
//   }, [userData])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet(`${ocrMainPromptUrl}?promptKey=main_extraction_prompt`)
      const text = res.data?.prompt_text || ''
      setPromptText(text)
      setOriginalText(text)
      setUpdatedAt(res.data?.updated_at || null)
    } catch (e) {
      setError('Failed to load: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const isDirty = promptText !== originalText

  const handleSave = async () => {
    if (!promptText.trim()) {
      setError('Prompt text cannot be empty.')
      return
    }
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await apiPost(ocrMainPromptUrl, { prompt_text: promptText })
      setOriginalText(res.data?.prompt_text || promptText)
      setUpdatedAt(res.data?.updated_at || null)
      setSuccessMsg('Prompt saved.')
    } catch (e) {
      setError('Failed to save: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPromptText(originalText)
    setError('')
    setSuccessMsg('')
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>
        OCR Main Prompt
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={1}>
        This is the extraction prompt sent to the AI for every invitation page. Edit with care — changes apply to all
        future OCR extractions immediately.
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' mb={3}>
        Keep dynamic placeholders intact, e.g. <code>{'${today}'}</code>, <code>{'${currentYear}'}</code>,{' '}
        <code>{'${mappedOcrlis}'}</code>. Removing or renaming them will break extraction.
        {updatedAt && <> &nbsp;|&nbsp; Last updated: {new Date(updatedAt).toLocaleString()}</>}
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {loading ? (
        <Box textAlign='center' py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TextField
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            multiline
            minRows={24}
            maxRows={60}
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6
              }
            }}
          />

          <Divider sx={{ my: 2 }} />

          <Box display='flex' gap={1.5} justifyContent='flex-end'>
            <Button variant='outlined' onClick={handleReset} disabled={!isDirty || saving}>
              Discard changes
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={!isDirty || saving || !promptText.trim()}
              sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}
            >
              {saving ? 'Saving...' : 'Save prompt'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}

export default OcrMainPromptPage
