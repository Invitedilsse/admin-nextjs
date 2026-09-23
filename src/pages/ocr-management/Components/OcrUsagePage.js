import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { apiGet } from 'src/hooks/axios'
import { ocrUsageLogsUrl } from 'src/services/pathConst'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Grid2 } from '@mui/material'

const fmt = (n, decimals = 0) =>
  n == null ? '-' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })

// What the result filter offers. 'unknown' covers rows logged before uploads
// were tracked — they are neither empty nor not, they are simply unrecorded,
// and folding them into either bucket would misstate the numbers.
const RESULT_OPTIONS = [
  { value: '', label: 'All results' },
  { value: 'empty', label: 'Empty (0 events)' },
  { value: 'with_events', label: 'With events' },
  { value: 'unknown', label: 'Not recorded (older)' }
]

const EMPTY_FILTERS = { mobile: '', fromDate: '', toDate: '', fromMonth: '', toMonth: '', resultFilter: '' }

/**
 * Events chip: red for an empty upload, green with a count, grey when unknown.
 *
 * Rows logged before results were recorded are classified from the stored AI
 * output instead. Those carry a "~" and say so on hover — per page rather than
 * per upload, so close but not the same claim as a recorded result.
 */
const EventsChip = ({ log }) => {
  const estimated = log.result_source === 'derived'
  const wrap = chip => estimated
    ? <Tooltip title='Estimated from the stored AI output — logged before results were recorded'>{chip}</Tooltip>
    : chip

  if (log.is_empty === true) {
    return wrap(<Chip label={`${estimated ? '~' : ''}0 events`} size='small' color='error'
      variant={estimated ? 'outlined' : 'filled'} sx={{ fontSize: 10, fontWeight: 700 }} />)
  }
  if (log.is_empty === false) {
    const n = Number(log.event_count || 0)
    return wrap(<Chip label={`${estimated ? '~' : ''}${n} event${n === 1 ? '' : 's'}`} size='small'
      color='success' variant='outlined' sx={{ fontSize: 10 }} />)
  }
  return (
    <Tooltip title='Logged before results were recorded'>
      <Chip label='—' size='small' variant='outlined' sx={{ fontSize: 10, color: 'text.disabled' }} />
    </Tooltip>
  )
}

/** The user's original upload, inline when it is an image. */
const SourceFilePreview = ({ log }) => {
  if (!log.has_source_file) {
    return (
      <Typography variant='caption' color='text.disabled' display='block' mb={1}>
        Original file not stored for this entry.
      </Typography>
    )
  }
  if (!log.source_file_link) {
    return (
      <Typography variant='caption' color='warning.main' display='block' mb={1}>
        File is stored, but this server cannot create a link to it — check AWS credentials on the admin backend.
      </Typography>
    )
  }
  const isImage = String(log.source_file_type || '').startsWith('image/')
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={0.5}>
        UPLOADED FILE{log.source_file_name ? ` — ${log.source_file_name}` : ''}
      </Typography>
      {isImage ? (
        <a href={log.source_file_link} target='_blank' rel='noopener noreferrer'>
          <Box component='img' src={log.source_file_link} alt='Uploaded invitation'
            sx={{ maxWidth: '100%', maxHeight: 360, borderRadius: 1, border: '1px solid #eee', display: 'block' }} />
        </a>
      ) : (
        <Button size='small' variant='outlined' endIcon={<OpenInNewIcon fontSize='small' />}
          href={log.source_file_link} target='_blank' rel='noopener noreferrer'>
          Open {String(log.source_file_type || '').includes('pdf') ? 'PDF' : 'file'}
        </Button>
      )}
      <Typography variant='caption' color='text.disabled' display='block' mt={0.5}>
        Link expires after 15 minutes — reload the page for a fresh one.
      </Typography>
    </Box>
  )
}

const SummaryCard = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography variant='h6' fontWeight={700} color={color}>{value}</Typography>
      {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
    </CardContent>
  </Card>
)

const ExtractedFields = ({ r }) => {
  if (!r) return <Typography variant='caption' color='text.disabled'>No extraction data saved for this entry.</Typography>
  const events = Array.isArray(r.events) ? r.events : []
  const hosts = Array.isArray(r.hosts) ? r.hosts : []
  const Field = ({ label, value }) => value ? (
    <Box sx={{ mb: 0.5 }}>
      <Typography component='span' variant='caption' color='text.secondary' sx={{ mr: 0.5 }}>{label}:</Typography>
      <Typography component='span' variant='caption' fontWeight={600}>{value}</Typography>
    </Box>
  ) : null

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={5}>
        <Field label='Occasion' value={r.occasion} />
        <Field label='Bride' value={r.bride} />
        <Field label='Groom' value={r.groom} />
        <Field label='First Named' value={r.first_named} />
        <Field label="Bride's Father" value={r.bride_father} />
        <Field label="Bride's Mother" value={r.bride_mother} />
        <Field label="Bride's Grandfather" value={r.bride_grandfather} />
        <Field label="Bride's Grandmother" value={r.bride_grandmother} />
        <Field label="Groom's Father" value={r.groom_father} />
        <Field label="Groom's Mother" value={r.groom_mother} />
        <Field label="Groom's Grandfather" value={r.groom_grandfather} />
        <Field label="Groom's Grandmother" value={r.groom_grandmother} />
        {hosts.length > 0 && <Field label='Hosts' value={hosts.join(', ')} />}
        <Field label='Host Mobile' value={r.host_mobile} />
        <Field label='Host Address' value={r.host_address} />
      </Grid>
      <Grid item xs={12} sm={7}>
        <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={0.5}>
          EVENTS ({events.length})
        </Typography>
        {events.map((ev, i) => (
          <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '3px solid #F5A742' }}>
            <Typography variant='caption' fontWeight={700} display='block'>{ev.type || `Event ${i + 1}`}</Typography>
            {ev.date && <Typography variant='caption' color='text.secondary' display='block'>
              Date: {ev.date}{ev.date_day ? ` (${ev.date_day})` : ''}
            </Typography>}
            {ev.time && <Typography variant='caption' color='text.secondary' display='block'>Time: {ev.time}</Typography>}
            {ev.venue && <Typography variant='caption' color='text.secondary' display='block'>Venue: {ev.venue}</Typography>}
          </Box>
        ))}
      </Grid>
    </Grid>
  )
}

const OcrUsagePage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()
  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [mobileInput, setMobileInput] = useState('')

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...(filters.mobile && { mobile: filters.mobile }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.fromMonth && { fromMonth: filters.fromMonth }),
        ...(filters.toMonth && { toMonth: filters.toMonth }),
        ...(filters.resultFilter && { resultFilter: filters.resultFilter }),
      })
      const response = await apiGet(`${ocrUsageLogsUrl}?${params.toString()}`)
      setLogs(response.data?.data || [])
      setTotal(response.data?.total || 0)
      setSummary(response.data?.summary || null)
    } catch (error) {
      console.error('Failed to fetch OCR usage logs:', error)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [
    pagination.pageIndex, pagination.pageSize,
    filters.mobile, filters.fromDate, filters.toDate, filters.fromMonth, filters.toMonth, filters.resultFilter
  ])

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, mobile: mobileInput }))
      setPagination(p => ({ ...p, pageIndex: 0 }))
    }, 400)
    return () => clearTimeout(t)
  }, [mobileInput])

  const columns = [
    {
      accessorKey: 'uploaded_by_name', header: 'User', size: 160,
      Cell: ({ row }) => (
        <Box>
          <Typography variant='body2' fontWeight={600}>{row.original.uploaded_by_name || 'Unknown'}</Typography>
          <Typography variant='caption' color='text.secondary'>{row.original.uploaded_by_mobile || ''}</Typography>
        </Box>
      )
    },
    { accessorKey: 'request_count', header: 'Pages', size: 80,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => fmt(row.original.request_count) },
    { accessorKey: 'empty_uploads', header: 'Empty', size: 70,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => (
        <Typography variant='body2' fontWeight={row.original.empty_uploads > 0 ? 700 : 400}
          color={row.original.empty_uploads > 0 ? 'error.main' : 'text.disabled'}>
          {fmt(row.original.empty_uploads)}
        </Typography>
      ) },
    { accessorKey: 'prompt_tokens', header: 'Prompt', size: 80,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => fmt(row.original.prompt_tokens) },
    { accessorKey: 'cache_read_tokens', header: 'Cache Read', size: 90,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => <Typography variant='body2' color={row.original.cache_read_tokens > 0 ? 'success.main' : 'text.disabled'}>{fmt(row.original.cache_read_tokens)}</Typography> },
    { accessorKey: 'cache_creation_tokens', header: 'Cache Write', size: 90,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => <Typography variant='body2' color={row.original.cache_creation_tokens > 0 ? 'warning.main' : 'text.disabled'}>{fmt(row.original.cache_creation_tokens)}</Typography> },
    { accessorKey: 'completion_tokens', header: 'Completion', size: 90,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => fmt(row.original.completion_tokens) },
    { accessorKey: 'total_tokens', header: 'Total Tokens', size: 100,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => <b>{fmt(row.original.total_tokens)}</b> },
    { accessorKey: 'cost_usd', header: 'Cost (USD)', size: 90,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => `$${Number(row.original.cost_usd).toFixed(5)}` },
    { accessorKey: 'cost_inr', header: 'Cost (₹)', size: 80,
      muiTableHeadCellProps: { align: 'right' }, muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => `₹${Number(row.original.cost_inr).toFixed(3)}` },
  ]

  const renderDetailPanel = ({ row }) => {
    const rowLogs = row.original.logs || []
    if (!rowLogs.length) return <Box sx={{ p: 2 }}><Typography variant='caption' color='text.disabled'>No entries.</Typography></Box>

    return (
      <Box sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
        {rowLogs.map(log => (
          <Accordion key={log.id} disableGutters variant='outlined' sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid container spacing={1} alignItems='center' sx={{ width: '100%' }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant='body2' noWrap title={log.source_file_name || log.file_name || ''}>
                    {log.source_file_name || log.file_name || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}><Chip label={log.model || '-'} size='small' variant='outlined' sx={{ fontSize: 10 }} /></Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant='caption' color='text.secondary'>
                    {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={4} sm={1.5}><EventsChip log={log} /></Grid>
                <Grid item xs={4} sm={1.25}><Typography variant='caption' noWrap>{fmt(log.total_tokens)} tok</Typography></Grid>
                <Grid item xs={4} sm={1.25}><Typography variant='caption' color='error.main'>${Number(log.cost_usd || 0).toFixed(5)}</Typography></Grid>
                <Grid item xs={12} sm={1}>
                  {log.source_file_link && (
                    <Tooltip title='Open the uploaded file'>
                      {/* stopPropagation: without it the click also toggles the accordion */}
                      <Button size='small' sx={{ minWidth: 0, px: 1 }}
                        href={log.source_file_link} target='_blank' rel='noopener noreferrer'
                        onClick={e => e.stopPropagation()} onFocus={e => e.stopPropagation()}>
                        <OpenInNewIcon fontSize='small' />
                      </Button>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <SourceFilePreview log={log} />
              <ExtractedFields r={log.raw_result} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )
  }

  const table = useMaterialReactTable({
    columns,
    data: logs,
    manualPagination: true,
    rowCount: total,
    onPaginationChange: setPagination,
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [10, 25, 50, 100],
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    layoutMode: 'grid-no-grow',
    enableTopToolbar: false,
    enableExpanding: true,
    renderDetailPanel,
    state: { pagination, isLoading: dataLoading, showProgressBars: dataLoading }
  })

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' fontWeight={700} mb={3}>OCR Usage</Typography>

      <Stack direction='row' spacing={2} mb={3} alignItems='center' flexWrap='wrap'>
        <TextField label='Search by mobile' size='small' value={mobileInput}
          onChange={e => setMobileInput(e.target.value)} />
        <TextField label='From date' type='date' size='small' InputLabelProps={{ shrink: true }}
          value={filters.fromDate}
          onChange={e => { setFilters(f => ({ ...f, fromDate: e.target.value })); setPagination(p => ({ ...p, pageIndex: 0 })) }} />
        <TextField label='To date' type='date' size='small' InputLabelProps={{ shrink: true }}
          value={filters.toDate}
          onChange={e => { setFilters(f => ({ ...f, toDate: e.target.value })); setPagination(p => ({ ...p, pageIndex: 0 })) }} />
        <TextField label='From month' type='month' size='small' InputLabelProps={{ shrink: true }}
          value={filters.fromMonth}
          onChange={e => { setFilters(f => ({ ...f, fromMonth: e.target.value })); setPagination(p => ({ ...p, pageIndex: 0 })) }} />
        <TextField label='To month' type='month' size='small' InputLabelProps={{ shrink: true }} 
          value={filters.toMonth}
          onChange={e => { setFilters(f => ({ ...f, toMonth: e.target.value })); setPagination(p => ({ ...p, pageIndex: 0 })) }} />
        <TextField select label='Result' size='small' sx={{ minWidth: 190 }}
          value={filters.resultFilter}
          onChange={e => { setFilters(f => ({ ...f, resultFilter: e.target.value })); setPagination(p => ({ ...p, pageIndex: 0 })) }}>
          {RESULT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <Button size='small' onClick={() => {
          setMobileInput('')
          setFilters(EMPTY_FILTERS)
          setPagination(p => ({ ...p, pageIndex: 0 }))
        }}>Clear</Button>
      </Stack>

      {/* Summary cards */}
      {summary && (
        <Grid2 container spacing={2} mb={3}>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Total Users' value={fmt(summary.userCount)} />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Total pages' value={fmt(summary.requestCount)} />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            {/* Clickable: the number is only useful if it takes you to the uploads behind it. */}
            <Box sx={{ cursor: 'pointer', height: '100%' }}
              onClick={() => { setFilters(f => ({ ...f, resultFilter: 'empty' })); setPagination(p => ({ ...p, pageIndex: 0 })) }}>
              <SummaryCard label='Empty uploads' value={fmt(summary.emptyUploads)}
                sub={`0 events · ₹${Number(summary.emptyCostInr || 0).toFixed(2)} spent${summary.estimatedEmptyUploads ? ` · ${fmt(summary.estimatedEmptyUploads)} estimated` : ''}`}
                color='error.main' />
            </Box>
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Uploads with events' value={fmt(summary.withEventsUploads)} sub='at least one event' color='success.main' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Prompt Tokens' value={fmt(summary.totalPromptTokens)} sub='non-cached input' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Cache Read Tokens' value={fmt(summary.totalCacheReadTokens)} sub='served from cache (cheap)' color='success.main' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Cache Write Tokens' value={fmt(summary.totalCacheCreationTokens)} sub='Anthropic cache creation' color='warning.main' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Completion Tokens' value={fmt(summary.totalCompletionTokens)} sub='output tokens' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={2}>
            <SummaryCard label='Total Tokens (all)' value={fmt(summary.totalTokens)} sub='all types combined' color='primary.main' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={3}>
            <SummaryCard label='Est. Total Cost (USD)' value={`$${Number(summary.totalCostUsd).toFixed(4)}`} sub='prompt+output+cache weighted' color='error.main' />
          </Grid2>
          <Grid2 item xs={6} sm={4} md={3}>
            <SummaryCard label='Est. Total Cost (₹)' value={`₹${Number(summary.totalCostInr).toFixed(2)}`} sub={`at ₹${95}/USD approx`} color='error.main' />
          </Grid2>
        </Grid2>
      )}

      <MaterialReactTable table={table} />

      <Typography variant='caption' color='text.secondary' display='block' mt={1}>
        Costs are estimates. Cache read tokens are charged at ~10% (Anthropic) or 50% (OpenAI) of input rate.
        Cache write tokens (Anthropic) are 125% of input rate. Verify against your actual provider invoices.
      </Typography>
    </Box>
  )
}

OcrUsagePage.acl = {
  action: 'read',
  subject: 'ocr'
}

export default OcrUsagePage