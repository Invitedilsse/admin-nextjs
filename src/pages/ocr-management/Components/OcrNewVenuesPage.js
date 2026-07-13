import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Link from '@mui/material/Link'
import Icon from 'src/@core/components/icon'

import { apiGet, apiPost } from 'src/hooks/axios'
import { ocrNewVenuesUrl, ocrNewVenuesExportUrl } from 'src/services/pathConst'

// Split "R.K Convention Center, ECR, Chennai" → name + address
const splitVenue = (full) => {
  const s = (full || '').trim()
  const i = s.indexOf(',')
  if (i === -1) return { name: s, address: '' }
  return { name: s.slice(0, i).trim(), address: s.slice(i + 1).trim() }
}
const mapsLink = (full) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full || '')}`

const OcrNewVenuesPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchData = useCallback(async (q = search) => {
    setLoading(true)
    setError('')
    try {
      const params = q ? { search: q } : {}
      const res = await apiGet(ocrNewVenuesUrl, params)
      setRows(res.data.data || [])
      setSelected(new Set())
    } catch {
      setError('Failed to load new venues')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchData('') }, [])

  const handleSearch = () => { setSearch(searchInput); fetchData(searchInput) }

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const allChecked = rows.length > 0 && selected.size === rows.length
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)))

  const handleExport = async () => {
    if (!selected.size) return
    setExporting(true)
    setError(''); setMsg('')
    try {
      const res = await apiPost(ocrNewVenuesExportUrl, { ids: [...selected] })
      const failed = res?.data?.geocodeFailed || []
      let m = `Exported ${res?.data?.exported ?? selected.size} venue(s) to the main list.`
      if (failed.length) m += ` ${failed.length} could not be geocoded (added without map location): ${failed.join(', ')}.`
      setMsg(m)
      await fetchData()
    } catch (e) {
      setError('Export failed: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setExporting(false)
    }
  }

  const fmt = iso => { try { return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' }) } catch { return iso } }

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>New Venues</Typography>
      <Typography variant='body2' color='text.secondary' mb={2}>
        Venue names seen during OCR extraction that are <strong>not yet</strong> in the main venue list (Map Management).
        Verify each on Google Maps, tick the ones to keep, and export them to the main list with a geocoded location.
        Exported venues disappear from here and won’t reappear.
      </Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {msg && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

      {/* Controls */}
      <Box display='flex' gap={1.5} mb={2} alignItems='center' flexWrap='wrap'>
        <TextField
          label='Search venue'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          size='small'
          sx={{ width: 280 }}
        />
        <Button variant='contained' onClick={handleSearch} sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}>Search</Button>
        {search && <Button variant='text' onClick={() => { setSearchInput(''); setSearch(''); fetchData('') }}>Clear</Button>}
        <Box flex={1} />
        <Typography variant='body2' color='text.secondary'>{selected.size} selected · {rows.length} total</Typography>
        <Button
          variant='contained'
          onClick={handleExport}
          disabled={exporting || selected.size === 0}
          startIcon={<Icon icon='mdi:database-export-outline' />}
          sx={{ background: '#1D6F42', '&:hover': { background: '#155932' } }}
        >
          {exporting ? 'Exporting...' : `Export ${selected.size || ''} to main list`}
        </Button>
      </Box>

      {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}

      {!loading && rows.length === 0 && (
        <Typography variant='body2' color='text.disabled' py={4} textAlign='center'>
          No new venues. They’ll appear here after extractions that contain venues not in the main list.
        </Typography>
      )}

      {!loading && rows.length > 0 && (
        <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <Box component='thead'>
            <Box component='tr' sx={{ background: '#f5f5f5' }}>
              <Box component='th' sx={{ p: '8px 10px', borderBottom: '1px solid #ddd', width: 40 }}>
                <Checkbox size='small' checked={allChecked} indeterminate={selected.size > 0 && !allChecked} onChange={toggleAll} />
              </Box>
              {['Venue name', 'Address', 'Google Maps', 'Source', 'Seen'].map(h => (
                <Box component='th' key={h} sx={{ p: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 700, fontSize: 12 }}>{h}</Box>
              ))}
            </Box>
          </Box>
          <Box component='tbody'>
            {rows.map((r, i) => {
              const { name, address } = splitVenue(r.venue_name)
              const checked = selected.has(r.id)
              return (
                <Box component='tr' key={r.id} sx={{ background: checked ? '#f0fdf4' : i % 2 ? '#fafafa' : 'white' }}>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    <Checkbox size='small' checked={checked} onChange={() => toggle(r.id)} />
                  </Box>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{name || '—'}</Box>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#555' }}>{address || '—'}</Box>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                    <Link href={mapsLink(r.venue_name)} target='_blank' rel='noopener' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#1a73e8', fontSize: 12 }}>
                      <Icon icon='mdi:google-maps' fontSize={16} /> Open
                    </Link>
                  </Box>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.source_file || '—'}</Box>
                  <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default OcrNewVenuesPage
