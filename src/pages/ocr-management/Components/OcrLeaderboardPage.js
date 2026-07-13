import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { apiGet } from 'src/hooks/axios'
import { ocrLeaderboardUrl } from 'src/services/pathConst'

const PROVIDER_COLOR = { OpenAI: '#10a37f', Anthropic: '#c96442' }
const STAR_COLOR = '#F5A742'

const Stars = ({ value }) => {
  const v = parseFloat(value) || 0
  const full = Math.floor(v)
  const frac = v - full
  return (
    <Box display='flex' alignItems='center' gap={0.3}>
      {[1, 2, 3, 4, 5].map(n => (
        <Box
          key={n}
          component='span'
          sx={{
            fontSize: 16,
            color: n <= full ? STAR_COLOR : (n === full + 1 && frac >= 0.5 ? STAR_COLOR : '#ddd'),
            lineHeight: 1,
            opacity: n === full + 1 && frac > 0 && frac < 0.5 ? 0.4 : 1,
          }}
        >★</Box>
      ))}
      <Typography variant='caption' fontWeight={700} sx={{ ml: 0.5 }}>{v.toFixed(1)}</Typography>
    </Box>
  )
}

const SORT_OPTIONS = [
  { value: 'avg_score', label: 'Avg Score' },
  { value: 'test_count', label: 'Most Tested' },
  { value: 'avg_cost_usd', label: 'Cost (Low→High)' },
  { value: 'avg_tokens', label: 'Avg Tokens' },
  { value: 'avg_duration_ms', label: 'Speed (Fastest)' },
]

const fmtDuration = (ms) => {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const Medal = ({ rank }) => {
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>
  return <Typography variant='body2' color='text.secondary' fontWeight={700}>{rank}</Typography>
}

const OcrLeaderboardPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [provider, setProvider] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('avg_score')

//   useEffect(() => {
//     if (userData?.userrole_type !== 'super-admin') router.push('/home')
//   }, [userData])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (provider) params.set('provider', provider)
      if (fromDate) params.set('from_date', fromDate)
      if (toDate) params.set('to_date', toDate)
      const res = await apiGet(`${ocrLeaderboardUrl}?${params.toString()}`)
      setRows(res.data?.leaderboard || [])
    } catch {
      setError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaderboard() }, [])

  const sorted = [...rows].sort((a, b) => {
    if (sortBy === 'avg_score')      return (parseFloat(b.avg_score) || 0) - (parseFloat(a.avg_score) || 0)
    if (sortBy === 'test_count')     return (b.test_count || 0) - (a.test_count || 0)
    if (sortBy === 'avg_cost_usd')   return (parseFloat(a.avg_cost_usd) || 0) - (parseFloat(b.avg_cost_usd) || 0)
    if (sortBy === 'avg_tokens')     return (parseFloat(a.avg_tokens) || 0) - (parseFloat(b.avg_tokens) || 0)
    if (sortBy === 'avg_duration_ms') return (parseFloat(a.avg_duration_ms) || 999999) - (parseFloat(b.avg_duration_ms) || 999999)
    return 0
  })

  // Summary stats
  const totalTests = rows.reduce((s, r) => s + (r.test_count || 0), 0)
  const bestModel = rows.reduce((best, r) => (!best || parseFloat(r.avg_score) > parseFloat(best.avg_score)) ? r : best, null)

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Box display='flex' alignItems='flex-start' justifyContent='space-between' flexWrap='wrap' gap={1} mb={3}>
        <Box>
          <Typography variant='h5' fontWeight={700} mb={0.5}>AI Model Leaderboard</Typography>
          <Typography variant='body2' color='text.secondary'>
            Ranked by your extraction quality scores. Use filters to compare.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          onClick={fetchLeaderboard}
          disabled={loading}
          sx={{ borderColor: STAR_COLOR, color: STAR_COLOR, fontWeight: 700, height: 36 }}
        >
          {loading ? <CircularProgress size={16} /> : 'Refresh'}
        </Button>
      </Box>

      {/* Summary cards */}
      {rows.length > 0 && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card variant='outlined'>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant='caption' color='text.secondary' display='block'>Models Tested</Typography>
                <Typography variant='h6' fontWeight={700}>{rows.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant='outlined'>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant='caption' color='text.secondary' display='block'>Total Reviews</Typography>
                <Typography variant='h6' fontWeight={700}>{totalTests}</Typography>
              </CardContent>
            </Card>
          </Grid>
          {bestModel && (
            <Grid item xs={12} sm={6}>
              <Card variant='outlined' sx={{ borderColor: STAR_COLOR, borderWidth: 2 }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant='caption' color='text.secondary' display='block'>Top Rated Model</Typography>
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography variant='h6' fontWeight={700}>{bestModel.name}</Typography>
                    <Chip
                      label={bestModel.provider}
                      size='small'
                      sx={{ background: PROVIDER_COLOR[bestModel.provider] || '#888', color: '#fff', fontWeight: 700, fontSize: 10 }}
                    />
                  </Box>
                  <Stars value={bestModel.avg_score} />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Filters */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Provider</InputLabel>
                <Select value={provider} label='Provider' onChange={e => setProvider(e.target.value)}>
                  <MenuItem value=''>All providers</MenuItem>
                  <MenuItem value='OpenAI'>OpenAI</MenuItem>
                  <MenuItem value='Anthropic'>Anthropic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label='From date'
                type='date'
                size='small'
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                label='To date'
                type='date'
                size='small'
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortBy} label='Sort by' onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant='contained'
                fullWidth
                onClick={fetchLeaderboard}
                disabled={loading}
                sx={{ background: STAR_COLOR, '&:hover': { background: '#e0962e' }, fontWeight: 700 }}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ color: STAR_COLOR }} />
        </Box>
      )}

      {!loading && rows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e0e0e0', borderRadius: 2 }}>
          <Typography variant='body2' color='text.secondary'>No reviews yet.</Typography>
          <Typography variant='caption' color='text.disabled' display='block' mt={0.5}>
            Use OCR Lab to test models and save ratings.
          </Typography>
        </Box>
      )}

      {/* Leaderboard table */}
      {!loading && sorted.length > 0 && (
        <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <Box component='thead'>
            <Box component='tr' sx={{ background: '#f8f8f8' }}>
              {['#', 'Model', 'Provider', 'Avg Score', 'Tests', 'Best / Worst', 'Avg Cost (USD)', 'Avg Tokens', 'Avg Time', 'Rate / 1M tokens'].map(h => (
                <Box
                  component='th'
                  key={h}
                  sx={{ p: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component='tbody'>
            {sorted.map((row, i) => {
              const pColor = PROVIDER_COLOR[row.provider] || '#888'
              const isTop = i === 0
              return (
                <Box
                  component='tr'
                  key={row.model}
                  sx={{
                    background: isTop ? '#fffbf0' : i % 2 === 0 ? '#fff' : '#fafafa',
                    '&:hover': { background: '#fff8e8' },
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Rank */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0', width: 40, textAlign: 'center' }}>
                    <Medal rank={i + 1} />
                  </Box>

                  {/* Model name */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <Typography fontWeight={isTop ? 700 : 500} fontSize={13}>{row.name}</Typography>
                    <Typography variant='caption' color='text.disabled' sx={{ fontSize: 10 }}>{row.model}</Typography>
                    {row.note && (
                      <Typography variant='caption' color='text.secondary' display='block' sx={{ fontSize: 10, mt: 0.2 }}>{row.note}</Typography>
                    )}
                  </Box>

                  {/* Provider */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <Chip label={row.provider} size='small' sx={{ background: pColor, color: '#fff', fontWeight: 700, fontSize: 10, height: 20 }} />
                  </Box>

                  {/* Avg Score */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {row.avg_score != null ? <Stars value={row.avg_score} /> : <Typography variant='caption' color='text.disabled'>—</Typography>}
                  </Box>

                  {/* Tests */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                    <Typography fontWeight={600}>{row.test_count}</Typography>
                  </Box>

                  {/* Best / Worst */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <Tooltip title='Best score given'>
                      <Typography variant='caption' color='success.main' fontWeight={700}>▲{row.best_score ?? '—'}</Typography>
                    </Tooltip>
                    {' / '}
                    <Tooltip title='Worst score given'>
                      <Typography component='span' variant='caption' color='error.main' fontWeight={700}>▼{row.worst_score ?? '—'}</Typography>
                    </Tooltip>
                  </Box>

                  {/* Avg cost */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {row.avg_cost_usd != null
                      ? <Typography variant='body2'>${Number(row.avg_cost_usd).toFixed(5)}</Typography>
                      : <Typography variant='caption' color='text.disabled'>—</Typography>}
                  </Box>

                  {/* Avg tokens */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {row.avg_tokens != null
                      ? <Typography variant='body2'>{Number(row.avg_tokens).toLocaleString('en-IN')}</Typography>
                      : <Typography variant='caption' color='text.disabled'>—</Typography>}
                  </Box>

                  {/* Avg time */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {row.avg_duration_ms != null ? (
                      <Tooltip title={row.best_duration_ms != null ? `Best: ${fmtDuration(row.best_duration_ms)}` : ''}>
                        <Typography variant='body2' sx={{ color: '#7c4dff', fontWeight: 600 }}>
                          {fmtDuration(row.avg_duration_ms)}
                        </Typography>
                      </Tooltip>
                    ) : <Typography variant='caption' color='text.disabled'>—</Typography>}
                  </Box>

                  {/* Rate per 1M */}
                  <Box component='td' sx={{ p: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {row.inputPer1M != null ? (
                      <Box>
                        <Typography variant='caption' display='block'>In: <b>${row.inputPer1M}</b></Typography>
                        <Typography variant='caption' display='block'>Out: <b>${row.outputPer1M}</b></Typography>
                      </Box>
                    ) : <Typography variant='caption' color='text.disabled'>—</Typography>}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      <Typography variant='caption' color='text.secondary' display='block' mt={2}>
        Scores are based on your manual ratings in OCR Lab. Cost data comes from actual API usage logs linked to each review.
        Models with no linked log show — for cost/token columns.
      </Typography>
    </Box>
  )
}

OcrLeaderboardPage.acl = {
  action: 'read',
  subject: 'ocr'
}

export default OcrLeaderboardPage
