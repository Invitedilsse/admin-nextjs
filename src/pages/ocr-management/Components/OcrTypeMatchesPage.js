import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Icon from 'src/@core/components/icon'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import { apiGet } from 'src/hooks/axios'
import { ocrTypeMatchesUrl } from 'src/services/pathConst'

const PAGE_SIZE = 50

// Color for a similarity score
const scoreColor = (s) => {
  if (s == null) return '#999'
  if (s >= 0.999) return '#2e7d32' // exact — green
  if (s >= 0.6) return '#e0962e'   // decent — amber
  return '#d32f2f'                 // weak — red
}

const OcrTypeMatchesPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [exporting, setExporting] = useState(false)

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchData = useCallback(async (off = 0, q = search, changed = onlyChanged) => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: PAGE_SIZE, offset: off }
      if (q) params.search = q
      if (changed) params.changed = true
      const res = await apiGet(ocrTypeMatchesUrl, params)
      setRows(res.data.data || [])
      setTotal(res.data.total || 0)
      setSummary(res.data.summary || null)
      setOffset(off)
    } catch {
      setError('Failed to load type-match log')
    } finally {
      setLoading(false)
    }
  }, [search, onlyChanged])

  useEffect(() => { fetchData(0) }, [])

  const handleSearch = () => { setSearch(searchInput); fetchData(0, searchInput, onlyChanged) }
  const handleToggleChanged = (e) => {
    const v = e.target.checked
    setOnlyChanged(v)
    fetchData(0, search, v)
  }
  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      // Fetch the full log (respecting the current search / only-changed filters)
      const params = { all: true }
      if (search) params.search = search
      if (onlyChanged) params.changed = true
      const res = await apiGet(ocrTypeMatchesUrl, params)
      const all = res.data.data || []
      if (!all.length) { setError('No rows to export'); return }
      const sheetRows = all.map(r => ({
        'AI extracted': r.raw_type || '',
        'Final (matched)': r.matched_type || '',
        'Closest canonical': r.top_candidate || '',
        'Levenshtein score': r.score == null ? '' : Number(r.score),
        'Result': r.changed ? 'corrected' : 'kept',
        'Threshold': r.threshold == null ? '' : Number(r.threshold),
        'File': r.file_name || '',
        'User': r.user_name || '',
        'When': r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
      }))
      const ws = XLSX.utils.json_to_sheet(sheetRows)
      ws['!cols'] = Object.keys(sheetRows[0]).map(k => ({
        wch: Math.max(k.length, ...sheetRows.map(row => (row[k] != null ? row[k].toString().length : 0))) + 2,
      }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Type Matches')
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const stamp = new Date().toISOString().slice(0, 10)
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `ocr-type-matches-${stamp}.xlsx`)
    } catch {
      setError('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  const fmt = iso => { try { return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return iso } }

  const StatChip = ({ label, value, color }) => (
    <Box sx={{ px: 2, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center', minWidth: 90 }}>
      <Typography fontWeight={700} fontSize={20} sx={{ color: color || 'text.primary' }}>{value ?? '—'}</Typography>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
    </Box>
  )

  return (
    <Box sx={{ p: 4, maxWidth: 1150, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>Event Type Match Log</Typography>
      <Typography variant='body2' color='text.secondary' mb={2}>
        Every event type the AI extracts is fuzzy-matched against the canonical Event Types list. This log shows the
        raw value, the corrected value, and the Levenshtein similarity — so you can spot bad corrections and improve the list/threshold.
      </Typography>

      {/* Summary */}
      {summary && (
        <Box display='flex' gap={1.5} mb={3} flexWrap='wrap'>
          <StatChip label='total' value={summary.total} />
          <StatChip label='corrected' value={summary.changed_count} color='#e0962e' />
          <StatChip label='kept as-is' value={summary.kept_count} />
          <StatChip label='exact (1.0)' value={summary.exact_count} color='#2e7d32' />
          <StatChip label='risky (<0.6)' value={summary.risky_count} color='#d32f2f' />
        </Box>
      )}

      {/* Controls */}
      <Box display='flex' gap={1.5} mb={2} alignItems='center' flexWrap='wrap'>
        <TextField
          label='Search raw / matched / candidate'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          size='small'
          sx={{ width: 320 }}
          placeholder='e.g. Phere, Night, Casino...'
        />
        <Button variant='contained' onClick={handleSearch} sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' } }}>
          Search
        </Button>
        {search && <Button variant='text' onClick={() => { setSearchInput(''); setSearch(''); fetchData(0, '', onlyChanged) }}>Clear</Button>}
        <FormControlLabel
          control={<Switch checked={onlyChanged} onChange={handleToggleChanged} color='warning' />}
          label='Only corrections'
        />
        <Box flex={1} />
        <Button
          variant='contained'
          onClick={handleExport}
          disabled={exporting || loading}
          startIcon={<Icon icon='mdi:file-excel-outline' />}
          sx={{ background: '#1D6F42', '&:hover': { background: '#155932' } }}
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}

      {!loading && rows.length === 0 && (
        <Typography variant='body2' color='text.disabled' py={4} textAlign='center'>
          No type matches logged yet. Run an extraction and they’ll appear here.
        </Typography>
      )}

      {!loading && rows.length > 0 && (
        <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <Box component='thead'>
            <Box component='tr' sx={{ background: '#f5f5f5' }}>
              {['AI extracted', '', 'Final (matched)', 'Closest canonical', 'Levenshtein', 'Result', 'File', 'When'].map((h, i) => (
                <Box component='th' key={i} sx={{ p: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 700, fontSize: 12 }}>{h}</Box>
              ))}
            </Box>
          </Box>
          <Box component='tbody'>
            {rows.map((r, i) => (
              <Box component='tr' key={r.id} sx={{ background: r.changed ? '#fff8ee' : i % 2 ? '#fafafa' : 'white' }}>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>{r.raw_type}</Box>
                <Box component='td' sx={{ p: '6px 4px', borderBottom: '1px solid #f0f0f0', color: '#bbb' }}>→</Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, color: r.changed ? '#e0962e' : '#333' }}>
                  {r.matched_type}
                </Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#666' }}>{r.top_candidate || '—'}</Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                  {r.score == null ? '—' : (
                    <Box display='flex' alignItems='center' gap={1}>
                      <Box sx={{ width: 46, height: 6, borderRadius: 3, background: '#eee', overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.round(Number(r.score) * 100)}%`, height: '100%', background: scoreColor(Number(r.score)) }} />
                      </Box>
                      <Typography fontSize={12} fontWeight={700} sx={{ color: scoreColor(Number(r.score)) }}>
                        {Number(r.score).toFixed(3)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                  {r.changed
                    ? <Chip label='corrected' size='small' sx={{ height: 20, fontSize: 10, background: '#fde7c8', color: '#9a5b00' }} />
                    : <Chip label='kept' size='small' sx={{ height: 20, fontSize: 10, background: '#e6f4ea', color: '#2e7d32' }} />}
                </Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.file_name || '—'}
                </Box>
                <Box component='td' sx={{ p: '6px 10px', borderBottom: '1px solid #f0f0f0', color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <Box display='flex' justifyContent='center' gap={2} mt={3}>
          <Button disabled={offset === 0} onClick={() => fetchData(Math.max(0, offset - PAGE_SIZE))}>Previous</Button>
          <Typography alignSelf='center' variant='body2'>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</Typography>
          <Button disabled={offset + PAGE_SIZE >= total} onClick={() => fetchData(offset + PAGE_SIZE)}>Next</Button>
        </Box>
      )}
    </Box>
  )
}

export default OcrTypeMatchesPage
