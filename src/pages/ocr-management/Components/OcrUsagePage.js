import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

import { apiGet } from 'src/hooks/axios'
import { ocrUsageLogsUrl } from 'src/services/pathConst'

const fmt = (n, decimals = 0) =>
  n == null ? '-' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })

const SummaryCard = ({ label, value, sub, color = 'text.primary' }) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent sx={{ pb: '12px !important', pt: 1.5, px: 2 }}>
      <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
      <Typography variant='h6' fontWeight={700} color={color}>{value}</Typography>
      {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
    </CardContent>
  </Card>
)

const OcrUsagePage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })

  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const response = await apiGet(
        `${ocrUsageLogsUrl}?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`
      )
      setLogs(response.data?.data || [])
      setTotal(response.data?.total || 0)
      setSummary(response.data?.summary || null)
    } catch (error) {
      console.error('Failed to fetch OCR usage logs:', error)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [pagination.pageIndex, pagination.pageSize])

  const columns = [
    {
      accessorKey: 'uploaded_by_name',
      header: 'User',
      size: 140,
      Cell: ({ row }) => (
        <Box>
          <Typography variant='body2' fontWeight={500}>{row.original.uploaded_by_name || '-'}</Typography>
          <Typography variant='caption' color='text.secondary'>{row.original.uploaded_by_mobile || ''}</Typography>
        </Box>
      )
    },
    {
      accessorKey: 'file_name',
      header: 'File',
      size: 140,
      Cell: ({ row }) => (
        <Tooltip title={row.original.file_name || ''} placement='top'>
          <Typography variant='body2' noWrap sx={{ maxWidth: 130 }}>
            {row.original.file_name || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      accessorKey: 'model',
      header: 'Model',
      size: 130,
      Cell: ({ row }) => (
        <Chip
          label={row.original.model || '-'}
          size='small'
          variant='outlined'
          sx={{ fontSize: 11 }}
        />
      )
    },
    {
      accessorKey: 'dimensions',
      header: 'Image px',
      size: 90,
      Cell: ({ row }) =>
        row.original.image_width
          ? `${row.original.image_width}×${row.original.image_height}`
          : '-'
    },
    {
      accessorKey: 'prompt_tokens',
      header: 'Prompt',
      size: 80,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => fmt(row.original.prompt_tokens)
    },
    {
      accessorKey: 'cache_read_tokens',
      header: 'Cache Read',
      size: 90,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => {
        const v = row.original.cache_read_tokens
        return v > 0
          ? <Typography variant='body2' color='success.main'>{fmt(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>0</Typography>
      }
    },
    {
      accessorKey: 'cache_creation_tokens',
      header: 'Cache Write',
      size: 90,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => {
        const v = row.original.cache_creation_tokens
        return v > 0
          ? <Typography variant='body2' color='warning.main'>{fmt(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>0</Typography>
      }
    },
    {
      accessorKey: 'completion_tokens',
      header: 'Completion',
      size: 90,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => fmt(row.original.completion_tokens)
    },
    {
      accessorKey: 'total_tokens',
      header: 'Total Tokens',
      size: 90,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) => <b>{fmt(row.original.total_tokens)}</b>
    },
    {
      accessorKey: 'cost_usd',
      header: 'Cost (USD)',
      size: 90,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) =>
        row.original.cost_usd != null
          ? `$${Number(row.original.cost_usd).toFixed(5)}`
          : '-'
    },
    {
      accessorKey: 'cost_inr',
      header: 'Cost (₹)',
      size: 80,
      muiTableHeadCellProps: { align: 'right' },
      muiTableBodyCellProps: { align: 'right' },
      Cell: ({ row }) =>
        row.original.cost_inr != null
          ? `₹${Number(row.original.cost_inr).toFixed(3)}`
          : '-'
    },
    {
      accessorKey: 'created_at',
      header: 'Date / Time',
      size: 140,
      Cell: ({ row }) =>
        row.original.created_at
          ? new Date(row.original.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '-'
    }
  ]

  const renderDetailPanel = ({ row }) => {
    const r = row.original.raw_result
    if (!r) return (
      <Box sx={{ p: 2 }}>
        <Typography variant='caption' color='text.disabled'>No extraction data saved for this entry.</Typography>
      </Box>
    )

    const events = Array.isArray(r.events) ? r.events : []
    const brideParents = Array.isArray(r.bride_parents) ? r.bride_parents : []
    const groomParents = Array.isArray(r.groom_parents) ? r.groom_parents : []
    const hosts = Array.isArray(r.hosts) ? r.hosts : []

    const Field = ({ label, value }) =>
      value ? (
        <Box sx={{ mb: 0.5 }}>
          <Typography component='span' variant='caption' color='text.secondary' sx={{ mr: 0.5 }}>{label}:</Typography>
          <Typography component='span' variant='caption' fontWeight={600}>{value}</Typography>
        </Box>
      ) : null

    return (
      <Box sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
        <Grid container spacing={2}>
          {/* Left: key fields */}
          <Grid item xs={12} sm={5}>
            <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={0.5}>EXTRACTED FIELDS</Typography>
            <Field label='Occasion' value={r.occasion} />
            <Field label='Bride' value={r.bride} />
            <Field label='Groom' value={r.groom} />
            <Field label='First Named' value={r.first_named} />
            {brideParents.length > 0 && <Field label="Bride's Parents" value={brideParents.join(', ')} />}
            {groomParents.length > 0 && <Field label="Groom's Parents" value={groomParents.join(', ')} />}
            {hosts.length > 0 && <Field label='Hosts' value={hosts.join(', ')} />}
          </Grid>

          {/* Right: events */}
          <Grid item xs={12} sm={7}>
            <Typography variant='caption' fontWeight={700} color='text.secondary' display='block' mb={0.5}>
              EVENTS ({events.length})
            </Typography>
            {events.length === 0 && (
              <Typography variant='caption' color='text.disabled'>No events extracted</Typography>
            )}
            {events.map((ev, i) => (
              <Box key={i} sx={{ mb: 1, pl: 1, borderLeft: '3px solid #F5A742' }}>
                <Typography variant='caption' fontWeight={700} display='block'>{ev.type || `Event ${i + 1}`}</Typography>
                {ev.date && <Typography variant='caption' color='text.secondary' display='block'>Date: {ev.date}{ev.date_raw ? ` (raw: ${ev.date_raw})` : ''}</Typography>}
                {ev.time && <Typography variant='caption' color='text.secondary' display='block'>Time: {ev.time}{ev.time_raw ? ` (raw: ${ev.time_raw})` : ''}</Typography>}
                {ev.venue && <Typography variant='caption' color='text.secondary' display='block'>Venue: {ev.venue}</Typography>}
              </Box>
            ))}
          </Grid>
        </Grid>
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

      {/* Summary cards */}
      {summary && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Total Requests'
              value={fmt(total)}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Prompt Tokens'
              value={fmt(summary.totalPromptTokens)}
              sub='non-cached input'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Cache Read Tokens'
              value={fmt(summary.totalCacheReadTokens)}
              sub='served from cache (cheap)'
              color='success.main'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Cache Write Tokens'
              value={fmt(summary.totalCacheCreationTokens)}
              sub='Anthropic cache creation'
              color='warning.main'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Completion Tokens'
              value={fmt(summary.totalCompletionTokens)}
              sub='output tokens'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <SummaryCard
              label='Total Tokens (all)'
              value={fmt(summary.totalTokens)}
              sub='all types combined'
              color='primary.main'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryCard
              label='Est. Total Cost (USD)'
              value={`$${Number(summary.totalCostUsd).toFixed(4)}`}
              sub='prompt+output+cache weighted'
              color='error.main'
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <SummaryCard
              label='Est. Total Cost (₹)'
              value={`₹${Number(summary.totalCostInr).toFixed(2)}`}
              sub={`at ₹${95}/USD approx`}
              color='error.main'
            />
          </Grid>
        </Grid>
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
