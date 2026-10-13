import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Card,
  TextField,
  IconButton,
  Button,
  Popover,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Typography
} from '@mui/material'

import { Visibility } from '@mui/icons-material'

import { Box } from '@mui/system'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'

import { DateRange } from 'react-date-range'
import { format } from 'date-fns'

import { apiGet } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

// ** Iconify, not @mui/material's Icon. The two are different components with the
//    same name and only this one understands `icon='tabler:search'`.
import Icon from 'src/@core/components/icon'

// ** The portal's shared list-page chrome. See the header comments in each file.
import { PageToolbar, EmptyState, TableSkeleton } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * What the Family Documents card on the dashboard opens: the documents
 * behind that number.
 *
 * It arrives carrying the dashboard's date range in the query string (sd/ed),
 * exactly as the other cards hand theirs over, so the list opens showing the
 * same set the card was counting rather than resetting to everything.
 *
 * THE NUMBER ON AN AADHAAR CARD IS NOT HERE. It is encrypted at rest and the
 * portal does not hold the key.
 *
 * The document itself CAN be opened, by main and super-admin only, through a
 * link the server signs for five minutes at a time. The storage key never
 * reaches this page, every open is written to an audit log, and the link in
 * state dies on its own — see admin-nodejs/src/family-documents/service.js.
 */
const FamilyDocuments = () => {
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [rows, setRows] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)

  // The document being looked at. `viewing` is the row, `viewLink` what the
  // server signed for it. Both are dropped when the dialog closes rather than
  // kept around: a live link to somebody's Aadhaar card should not outlast
  // the moment it was needed.
  const [viewing, setViewing] = useState(null)
  const [viewLink, setViewLink] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')

  const openDocument = async row => {
    setViewing(row)
    setViewLink(null)
    setViewError('')
    setViewLoading(true)

    try {
      const res = await apiGet(`${baseURL}family-documents/${row.id}/link`)
      const detail = res?.data?.detail

      if (!detail?.url) throw new Error('No link came back')

      // A PDF has no in-page viewer here, so it opens in a tab. An image is
      // shown in the dialog, which is what an operator checking an upload
      // actually wants.
      if (String(detail.contentType || '').toLowerCase().includes('pdf')) {
        window.open(detail.url, '_blank', 'noopener,noreferrer')
        setViewing(null)
      } else {
        setViewLink(detail)
      }
    } catch (error) {
      console.error('FamilyDocuments link:------>', error)
      setViewError(
        error?.response?.status === 403
          ? 'Your role cannot open documents.'
          : 'Could not open this document.'
      )
    } finally {
      setViewLoading(false)
    }
  }

  const closeViewer = () => {
    setViewing(null)
    setViewLink(null)
    setViewError('')
  }

  const searchParams = useSearchParams()
  const [startdate, setStartDate] = useState(searchParams.get('sd') ?? '')
  const [endDate, setEndDate] = useState(searchParams.get('ed') ?? '')

  const [selectionRange, setSelectionRange] = useState({
    startDate: searchParams.get('sd') ? new Date(searchParams.get('sd')) : '',
    endDate: searchParams.get('ed') ? new Date(searchParams.get('ed')) : '',
    key: 'selection'
  })

  const fetchData = async () => {
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${baseURL}family-documents/list?page=${pagination.pageIndex + 1}` +
          `&limit=${pagination.pageSize}&search=${searchText}` +
          `&start_date=${startdate}&end_date=${endDate}`
      )
      setRows(response?.data?.detail?.rows || [])
      setTotalCount(response?.data?.detail?.total || 0)
    } catch (error) {
      console.error('FamilyDocuments:------>', error)
      setRows([])
      setTotalCount(0)
    } finally {
      setisdataloading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize, startdate, endDate])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  const when = value => {
    if (!value) return '-'
    try {
      return format(new Date(value), 'dd MMM yyyy, h:mm a')
    } catch (e) {
      return '-'
    }
  }

  const columns = [
    {
      accessorKey: 'ownerName',
      header: 'Owner',
      Cell: ({ row }) => row.original.ownerName || '-'
    },
    {
      accessorKey: 'ownerMobile',
      header: 'Mobile',
      Cell: ({ row }) => row.original.ownerMobile || '-'
    },
    {
      accessorKey: 'documentType',
      header: 'Type',
      Cell: ({ row }) => row.original.documentType || '-'
    },
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) => row.original.name || '-'
    },
    {
      accessorKey: 'sharedWithFamily',
      header: 'With family',
      Cell: ({ row }) =>
        row.original.sharedWithFamily ? (
          <Chip label='Shared' size='small' color='success' variant='outlined' />
        ) : (
          <Chip label='Private' size='small' variant='outlined' />
        )
    },
    {
      accessorKey: 'sentToHosts',
      header: 'Sent to hosts',
      // The live count: a document taken back reads zero here, as it does on
      // the guest's own screen.
      Cell: ({ row }) => row.original.sentToHosts ?? 0
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      Cell: ({ row }) => when(row.original.createdAt)
    },
    {
      accessorKey: 'view',
      header: 'Document',
      Cell: ({ row }) => (
        <Visibility
          onClick={() => openDocument(row.original)}
          style={{ cursor: 'pointer' }}
        />
      )
    }
  ]

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. The page's own options below still
    //    win, because they are spread after these.
    ...tableDefaults,
    columns,
    data: rows,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    enableTopToolbar: false,
    muiPaginationProps: { showFirstButton: true, showLastButton: true },
    enablePinning: false,
    rowCount: totalcount,
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    manualPagination: true,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,

    // ** An empty table with headers and no rows cannot be told apart from a failed
    //    request, so say which it is - and say it differently when a search is the
    //    reason there is nothing to show.
    renderEmptyRowsFallback: () => (
      <EmptyState
        icon='tabler:file-text'
        title={searchText ? 'No documents match that search' : 'No documents in this date range'}
        description={
          searchText
            ? 'Try a shorter search, or clear it to see everything in the range.'
            : 'Documents appear here once a guest sends one to a host, or adds one to their own wallet.'
        }
      />
    )
  })

  const handleDateChange = ranges => {
    const { startDate: sdate, endDate: edate } = ranges.selection

    setSelectionRange({ startDate: sdate, endDate: edate, key: 'selection' })
    setStartDate(format(sdate, 'yyyy-MM-dd'))
    setEndDate(format(edate, 'yyyy-MM-dd'))
    // Back to the first page: staying on page 4 of a range that may only
    // have one page shows an empty table over a list that is not empty.
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  // ** The dates can legitimately be '' (no range), and format() throws on that.
  const asDay = value => {
    if (!value) return null
    try {
      return format(new Date(value), 'dd MMM yyyy')
    } catch (e) {
      return null
    }
  }

  const from = asDay(selectionRange.startDate)
  const to = asDay(selectionRange.endDate)
  const rangeLabel = from && to ? `${from} - ${to}` : 'Any date'

  const clearDates = () => {
    setStartDate('')
    setEndDate('')
    setSelectionRange({ startDate: '', endDate: '', key: 'selection' })
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  const clearSearch = () => {
    setSearchText('')
    setTempSearchText('')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  // ** What is actually narrowing the list, shown rather than hidden behind a funnel.
  const filterChips = [
    from && to ? { label: rangeLabel, onDelete: clearDates } : null,
    searchText ? { label: `"${searchText}"`, onDelete: clearSearch } : null
  ].filter(Boolean)

  const clearFilters = () => {
    clearDates()
    clearSearch()
  }

  return (
    <>
      <Card>
        <PageToolbar
          title='Family Documents'
          count={isdataloading ? undefined : totalcount}
          search={
            <TextField
              size='small'
              variant='outlined'
              value={tempSearchText}
              sx={{ width: { xs: '100%', sm: 300 } }}
              placeholder='Search owner, number or type'
              onChange={e => handleDebouncedSearch(e.target.value)}
              onKeyDown={ev => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  setSearchText(tempSearchText)
                  setPagination(p => ({ ...p, pageIndex: 0 }))
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                      <Icon icon='tabler:search' fontSize='1.125rem' />
                    </Box>
                  ),
                  endAdornment: tempSearchText ? (
                    <IconButton
                      size='small'
                      aria-label='Search'
                      onClick={() => {
                        setSearchText(tempSearchText)
                        setPagination(p => ({ ...p, pageIndex: 0 }))
                      }}
                    >
                      <Icon icon='tabler:arrow-right' fontSize='1.125rem' />
                    </IconButton>
                  ) : null
                }
              }}
            />
          }
          actions={
            <Button
              size='small'
              variant='outlined'
              color='secondary'
              startIcon={<Icon icon='tabler:calendar' />}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              {rangeLabel}
            </Button>
          }
          filters={filterChips}
          onClearFilters={clearFilters}
        />

        {/* ** Skeleton rows on the FIRST load only. On a page change the old rows
               stay put and MRT's own progress bar does the telling, which stops the
               table collapsing and re-expanding under the cursor. */}
        {isdataloading && rows.length === 0 ? (
          <TableSkeleton columns={6} />
        ) : (
          <MaterialReactTable table={table} />
        )}

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <DateRange ranges={[selectionRange]} onChange={handleDateChange} moveRangeOnFirstSelection={false} />
        </Popover>
      </Card>

      <Dialog open={Boolean(viewing)} onClose={closeViewer} maxWidth='md' fullWidth>
        <DialogTitle>
          {viewing?.name || 'Document'}
          <Typography variant='body2' color='text.secondary'>
            {viewing?.ownerName} · {viewing?.documentType || 'Document'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', minHeight: 240 }}>
          {viewLoading && <CircularProgress sx={{ my: 8 }} />}

          {!viewLoading && viewError && (
            <Typography color='error' sx={{ my: 8 }}>
              {viewError}
            </Typography>
          )}

          {!viewLoading && !viewError && viewLink?.url && (
            <Box
              component='img'
              src={viewLink.url}
              alt={viewing?.name || 'Document'}
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}

          {!viewLoading && !viewError && viewLink?.url && (
            <Typography variant='caption' color='text.secondary' display='block' mt={2}>
              This link stops working in {Math.round((viewLink.expiresInSeconds || 300) / 60)} minutes.
              Opening it has been recorded.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Its own subject, matching the nav entry, so the page is permissioned like
// every other screen here rather than riding on somebody else's grant.
FamilyDocuments.acl = {
  action: 'read',
  subject: 'familydocuments'
}

export default FamilyDocuments
