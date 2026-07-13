import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

import { apiGet, apiPost, apiDelete } from 'src/hooks/axios'
import { ocrEventTypesUrl } from 'src/services/pathConst'

const OcrEventTypesPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet(ocrEventTypesUrl)
      setItems(res.data.eventTypes || [])
    } catch (e) {
      setError('Failed to load: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await apiPost(ocrEventTypesUrl, { name: newName.trim() })
      const inserted = res?.data?.inserted
      const saved = newName.trim()
      setNewName('')
      await load()
      setSuccessMsg(inserted === false ? `"${saved}" already exists.` : `Added "${saved}"`)
    } catch (e) {
      setError('Failed to add: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id, name) => {
    setError('')
    setSuccessMsg('')
    try {
      await apiDelete(`${ocrEventTypesUrl}/${id}`)
      await load()
      setSuccessMsg(`Removed "${name}"`)
    } catch (e) {
      setError('Failed to delete: ' + (e?.message || JSON.stringify(e)))
    }
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Box sx={{ p: 4, maxWidth: 920, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>OCR Event Types</Typography>
      <Typography variant='body2' color='text.secondary' mb={0.5}>
        Canonical list of known event/ceremony names. After AI extraction, each event type is fuzzy-matched against
        this list and corrected if similarity ≥ 40%.
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' mb={3}>
        Example: AI reads <b>"Alayra"</b> → matches <b>"Mayra"</b> &nbsp;|&nbsp; <b>"Alkasi"</b> → <b>"Nikasi"</b> &nbsp;|&nbsp; <b>"Grithpan"</b> → <b>"Grithpaan"</b>
      </Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Add form */}
      <Box display='flex' gap={1.5} mb={3} alignItems='flex-start'>
        <TextField
          label='New event type name'
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          size='small'
          sx={{ flex: 1 }}
          placeholder='e.g. Grithpaan, Baraat Swagat, Tamil Sapad...'
        />
        <Button
          variant='contained'
          onClick={handleAdd}
          disabled={adding || !newName.trim() || loading}
          sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' }, whiteSpace: 'nowrap' }}
        >
          {adding ? '...' : 'Add'}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Search + count */}
      <Box display='flex' alignItems='center' gap={2} mb={2}>
        <TextField
          label='Search'
          value={search}
          onChange={e => setSearch(e.target.value)}
          size='small'
          sx={{ width: 260 }}
          placeholder='Filter by name...'
        />
        <Typography variant='body2' color='text.secondary'>
          {loading ? '—' : `${filtered.length} of ${items.length} event types`}
        </Typography>
      </Box>

      {loading
        ? <Box textAlign='center' py={6}><CircularProgress /></Box>
        : (
          <Box display='flex' flexWrap='wrap' gap={1} minHeight={48}>
            {filtered.length === 0
              ? <Typography variant='body2' color='text.disabled' mt={1}>
                  {search ? 'No matches found.' : 'No event types yet. Add one above.'}
                </Typography>
              : filtered.map(item => (
                <Chip
                  key={item.id}
                  label={item.name}
                  variant='outlined'
                  size='small'
                  onDelete={() => handleDelete(item.id, item.name)}
                  sx={{ fontSize: 13, borderRadius: 1 }}
                />
              ))
            }
          </Box>
        )
      }
    </Box>
  )
}

export default OcrEventTypesPage
