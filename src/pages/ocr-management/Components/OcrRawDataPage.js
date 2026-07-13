import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'

import { apiGet } from 'src/hooks/axios'
import { ocrRawPageDataUrl } from 'src/services/pathConst'
import Icon from 'src/@core/components/icon'

const PAGE_SIZE = 20
const USD_TO_INR = 95

const OcrRawDataPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchData = useCallback(async (off = 0, q = search) => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: PAGE_SIZE, offset: off }
      if (q) params.search = q
      const res = await apiGet(ocrRawPageDataUrl, params)
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
      setOffset(off)
    } catch {
      setError('Failed to load raw page data')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData(0) }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    fetchData(0, searchInput)
  }

  const fmt = iso => {
    try {
      return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    } catch { return iso }
  }

  const fmtCost = row => {
    if (row.cost_usd == null) return null
    const usd = Number(row.cost_usd)
    const inr = usd * USD_TO_INR
    return `$${usd.toFixed(4)} / ₹${inr.toFixed(3)}`
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>Raw Page Data</Typography>
      <Typography variant='body2' color='text.secondary' mb={2}>
        Every page image + AI JSON saved during extraction (when the toggle is ON in OCR Settings).
        Total: <strong>{total}</strong> records
      </Typography>

      {/* Search */}
      <Box display='flex' gap={1.5} mb={2} alignItems='center'>
        <TextField
          label='Search by file name or user'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          size='small'
          sx={{ width: 320 }}
          placeholder='Type and press Enter or click Search'
        />
        <Button variant='contained' onClick={handleSearch}
          sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}>
          Search
        </Button>
        {search && (
          <Button variant='text' onClick={() => { setSearchInput(''); setSearch(''); fetchData(0, '') }}>
            Clear
          </Button>
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}

      {!loading && rows.map(row => (
        <Card key={row.id} variant='outlined' sx={{ mb: 1.5 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
              {/* Thumbnail */}
              {row.image_base64 && (
                <Box
                  component='img'
                  src={`data:image/jpeg;base64,${row.image_base64}`}
                  sx={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => setSelected(row)}
                />
              )}
              <Box flex={1} minWidth={0}>
                <Box display='flex' alignItems='center' gap={1} flexWrap='wrap' mb={0.5}>
                  <Typography fontWeight={700} fontSize={13}>{row.user_name || '—'}</Typography>
                  <Typography variant='caption' color='text.secondary'>{row.user_mobile}</Typography>
                  <Chip label={`Page ${(row.page_index ?? 0) + 1}`} size='small' sx={{ height: 18, fontSize: 10 }} />
                  {row.session_id && <Chip label='PDF session' size='small' color='info' sx={{ height: 18, fontSize: 10 }} />}
                  {row.model && <Chip label={row.model} size='small' color='secondary' sx={{ height: 18, fontSize: 10 }} />}
                </Box>
                <Typography variant='caption' color='text.secondary' display='block' noWrap>
                  {row.file_name} · {fmt(row.created_at)}
                </Typography>
                {row.raw_ai_json && (
                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
                    bride: <strong>{row.raw_ai_json.bride || '—'}</strong>
                    &nbsp;groom: <strong>{row.raw_ai_json.groom || '—'}</strong>
                    &nbsp;events: <strong>{row.raw_ai_json.events?.length ?? 0}</strong>
                  </Typography>
                )}
                {/* Cost + tokens */}
                <Box display='flex' gap={2} mt={0.5} flexWrap='wrap'>
                  {fmtCost(row) && (
                    <Typography variant='caption' color='text.secondary'>
                      Cost: <strong style={{ color: '#e07020' }}>{fmtCost(row)}</strong>
                    </Typography>
                  )}
                  {row.total_tokens != null && (
                    <Typography variant='caption' color='text.secondary'>
                      Tokens: <strong>{Number(row.total_tokens).toLocaleString()}</strong>
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button size='small' variant='outlined' onClick={() => setSelected(row)}>
                View JSON
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <Box display='flex' justifyContent='center' gap={2} mt={2}>
          <Button disabled={offset === 0} onClick={() => fetchData(Math.max(0, offset - PAGE_SIZE))}>
            Previous
          </Button>
          <Typography alignSelf='center' variant='body2'>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </Typography>
          <Button disabled={offset + PAGE_SIZE >= total} onClick={() => fetchData(offset + PAGE_SIZE)}>
            Next
          </Button>
        </Box>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            Page {(selected?.page_index ?? 0) + 1} — {selected?.file_name}
            {selected?.model && (
              <Chip label={selected.model} size='small' color='secondary' sx={{ ml: 1, height: 18, fontSize: 10 }} />
            )}
          </Box>
          <IconButton onClick={() => setSelected(null)}><Icon icon='tabler:x' /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box>
              {/* Cost/token summary */}
              {(selected.cost_usd != null || selected.total_tokens != null) && (
                <Box display='flex' gap={3} mb={2} flexWrap='wrap'>
                  {selected.cost_usd != null && (
                    <Typography variant='body2'>
                      Cost: <strong style={{ color: '#e07020' }}>{fmtCost(selected)}</strong>
                    </Typography>
                  )}
                  {selected.total_tokens != null && (
                    <Typography variant='body2'>
                      Tokens: <strong>{Number(selected.total_tokens).toLocaleString()}</strong>
                    </Typography>
                  )}
                </Box>
              )}
              <Box display='flex' gap={3} flexWrap='wrap'>
                {selected.image_base64 && (
                  <Box
                    component='img'
                    src={`data:image/jpeg;base64,${selected.image_base64}`}
                    sx={{ maxWidth: 260, maxHeight: 380, objectFit: 'contain', borderRadius: 2, border: '1px solid #eee' }}
                  />
                )}
                <Box flex={1} minWidth={200}>
                  <Typography variant='overline' fontWeight={700} display='block' mb={1}>Raw AI JSON</Typography>
                  <Box
                    component='pre'
                    sx={{
                      fontSize: 11,
                      background: '#f5f5f5',
                      borderRadius: 1,
                      p: 1.5,
                      overflow: 'auto',
                      maxHeight: 380,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {JSON.stringify(selected.raw_ai_json, null, 2)}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default OcrRawDataPage
