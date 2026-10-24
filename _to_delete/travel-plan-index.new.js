import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import { LoadingButton } from '@mui/lab'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'

import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import {
  assignFunctionList,
  travelPlanExportUrl,
  travelPlanImportUrl,
  travelPlanListUrl,
  travelPlanSampleUrl,
  travelPlanSummaryUrl
} from 'src/services/pathConst'
import { convertBase64Blob } from 'src/utils/blobconverter'

// ** Iconify, not @mui/material's Icon. The two are different components with the
//    same name and only this one understands `icon='tabler:upload'`.
import Icon from 'src/@core/components/icon'

// ** The portal's shared list-page chrome. See the header comments in each file.
import { PageToolbar, EmptyState, TableSkeleton } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * Guest Travel Plan — the host's sheet, and what the callers got out of it.
 *
 * The flow this page serves: a host sends a spreadsheet of guests, it is uploaded
 * here, a caller rings each guest on the phone and writes down how they are
 * arriving and leaving, and the collected plan comes back to this table.
 *
 * ! A FUNCTION MUST BE CHOSEN FIRST, and that is not a limitation to work around.
 *   A travel list only means anything inside one celebration — "all arrivals
 *   across every function" is not a question anybody asks, and a sheet uploaded
 *   without a function chosen would have to guess whose guests they are.
 *
 * ! NO DATE IS PARSED ON THIS PAGE. Every date, time and timestamp arrives from
 *   the server already formatted as a string. That is deliberate: the arrival
 *   columns are DATE and TIME in Postgres, and the moment a component here does
 *   `new Date(row.arrivalDate)` an arrival of 3 November renders as 2 November
 *   for everybody east of Greenwich. See the header of
 *   admin-nodejs/src/travel-plan/service.js.
 */

const STATUS_CHIPS = [
  { key: 'pending', label: 'Not started', color: 'default' },
  { key: 'partial', label: 'Part collected', color: 'warning' },
  { key: 'collected', label: 'Collected', color: 'success' },
  { key: 'declined', label: 'Declined', color: 'error' }
]

const STATUS_COLOR = {
  pending: 'default',
  partial: 'warning',
  collected: 'success',
  declined: 'error'
}

/**
 * ! BLANK AND ZERO ARE DIFFERENT ANSWERS, and these three are where the page can
 *   lose that. The server sends '' for a question nobody has asked the guest yet
 *   and 0 for a count the guest actually gave, so "0 adults" must read as 0 and
 *   an uncollected plan must read as a dash. `value || '-'` would collapse them,
 *   and a column of dashes over a coach party of zero children is a column the
 *   operator would ring four hundred people to re-check.
 *
 *   Exported — rather than left as closures inside the column definitions —
 *   because that is the only way pagecheck.js can hold them to it.
 */
export const dash = value => (value === '' || value === null || value === undefined ? '-' : value)

export const formatMembers = ({ adults, below12 }) => {
  if (dash(adults) === '-' && dash(below12) === '-') return '-'

  return `${dash(adults)} adult${adults === 1 ? '' : 's'}${dash(below12) === '-' ? '' : `, ${below12} below 12`}`
}

export const formatLuggage = ({ luggageBig, luggageSmall }) => {
  if (dash(luggageBig) === '-' && dash(luggageSmall) === '-') return '-'

  return `${dash(luggageBig)} big, ${dash(luggageSmall)} small`
}

const TravelPlan = () => {
  // ** The function picker
  const [functions, setFunctions] = useState([])
  const [functionsLoading, setFunctionsLoading] = useState(false)
  const [functionSearch, setFunctionSearch] = useState('')
  const [chosen, setChosen] = useState(null)

  // ** The list
  const [rows, setRows] = useState([])
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [status, setStatus] = useState('')

  // ** The header strip
  const [counts, setCounts] = useState(null)
  const [imports, setImports] = useState([])
  const [loadError, setLoadError] = useState('')

  // ** Upload
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInput = useRef(null)

  const [exporting, setExporting] = useState(false)
  const [sampling, setSampling] = useState(false)

  /* ------------------------------------------------------------ the picker */

  const fetchFunctions = async search => {
    setFunctionsLoading(true)
    try {
      const res = await apiGet(
        `${assignFunctionList}?page=1&limit=50&search=${encodeURIComponent(search || '')}`
      )
      setFunctions(res?.data?.data || [])
    } catch (error) {
      console.error('TravelPlan functions:------>', error)
      setFunctions([])
    } finally {
      setFunctionsLoading(false)
    }
  }

  useEffect(() => {
    // Debounced, because this fires on every keystroke in the picker.
    const id = setTimeout(() => fetchFunctions(functionSearch), 350)

    return () => clearTimeout(id)
  }, [functionSearch])

  /* -------------------------------------------------------------- the list */

  const fetchSummary = async functionId => {
    try {
      const res = await apiGet(`${travelPlanSummaryUrl}?function_id=${functionId}`)
      setCounts(res?.data?.data?.counts || null)
      setImports(res?.data?.data?.imports || [])
      setLoadError('')
    } catch (error) {
      console.error('TravelPlan summary:------>', error)
      setCounts(null)
      setImports([])

      // The one error worth spelling out: until the app backend has booted once,
      // these tables do not exist and nothing on this page can work. "Could not
      // load" would send somebody hunting for a bug in the portal.
      setLoadError(
        typeof error === 'string' && error.toLowerCase().includes('do not exist')
          ? error
          : 'Could not load this function’s travel summary.'
      )
    }
  }

  const fetchData = async functionId => {
    setisdataloading(true)
    try {
      const res = await apiGet(
        `${travelPlanListUrl}?function_id=${functionId}` +
          `&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}` +
          `&search=${encodeURIComponent(searchText)}&status=${status}`
      )
      setRows(res?.data?.data || [])
      setTotalCount(res?.data?.totalCount || 0)
    } catch (error) {
      console.error('TravelPlan list:------>', error)
      setRows([])
      setTotalCount(0)
    } finally {
      setisdataloading(false)
    }
  }

  useEffect(() => {
    if (!chosen?.id) {
      setRows([])
      setTotalCount(0)
      setCounts(null)

      return
    }
    fetchData(chosen.id)
    fetchSummary(chosen.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen?.id, searchText, status, pagination.pageIndex, pagination.pageSize])

  /* -------------------------------------------------------------- the file */

  const handleUpload = async () => {
    if (!file || !chosen?.id) return

    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('function_id', chosen.id)

      const res = await apiPost(travelPlanImportUrl, formData, true)
      const data = res?.data?.data

      setResult(data || null)
      toast.success(
        `${data?.added || 0} added, ${data?.updated || 0} updated` +
          (data?.skipped?.length ? `, ${data.skipped.length} skipped` : '')
      )

      // Back to the first page and reload: a sheet that added 400 rows while the
      // table sat on page 3 of 1 shows an empty list over a full one.
      setPagination(p => ({ ...p, pageIndex: 0 }))
      fetchData(chosen.id)
      fetchSummary(chosen.id)
    } catch (error) {
      console.error('TravelPlan import:------>', error)
      toast.error(typeof error === 'string' ? error : 'Could not import that sheet')
    } finally {
      setUploading(false)
    }
  }

  const closeUpload = () => {
    setUploadOpen(false)
    setFile(null)
    setResult(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const handleSample = async () => {
    setSampling(true)
    try {
      const res = await apiGet(travelPlanSampleUrl)
      if (!res?.data?.data) throw new Error('No sheet came back')
      await convertBase64Blob(res.data.data, res.data.fileName || 'guest-travel-sample.xlsx')
    } catch (error) {
      console.error('TravelPlan sample:------>', error)
      toast.error('Could not build the sample sheet')
    } finally {
      setSampling(false)
    }
  }

  const handleExport = async () => {
    if (!chosen?.id) return

    setExporting(true)
    try {
      const res = await apiGet(
        `${travelPlanExportUrl}?function_id=${chosen.id}` +
          `&search=${encodeURIComponent(searchText)}&status=${status}`
      )
      if (!res?.data?.data) {
        toast.error('Nothing to export')

        return
      }
      await convertBase64Blob(res.data.data, res.data.fileName || 'guest-travel.xlsx')
      toast.success('Excel file downloaded successfully')
    } catch (error) {
      console.error('TravelPlan export:------>', error)
      toast.error(typeof error === 'string' ? error : 'Could not export this list')
    } finally {
      setExporting(false)
    }
  }

  /* ------------------------------------------------------------ the table */

  const columns = useMemo(
    () => [
      {
        accessorKey: 'guestName',
        header: 'Guest',
        size: 200,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' noWrap sx={{ fontWeight: 500 }}>
              {row.original.guestName || '-'}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {[row.original.countryCode, row.original.mobile].filter(Boolean).join(' ')}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'onApp',
        header: 'On app',
        size: 90,
        Cell: ({ row }) =>
          row.original.onApp ? (
            <Chip label='Yes' size='small' color='success' variant='outlined' />
          ) : (
            <Chip label='No' size='small' variant='outlined' />
          )
      },
      {
        accessorKey: 'statusLabel',
        header: 'Status',
        size: 150,
        Cell: ({ row }) => (
          <Stack direction='row' spacing={1} alignItems='center'>
            <Chip
              size='small'
              variant='outlined'
              label={row.original.statusLabel}
              color={STATUS_COLOR[row.original.status] || 'default'}
            />
            {/* Something was understood but not confidently. The caller needs to
                know which rows to eyeball, and a flag nobody can see is no flag. */}
            {row.original.needsReview ? (
              <Tooltip title='Parsed from the guest’s own message — worth checking'>
                <Box sx={{ display: 'flex', color: 'warning.main' }}>
                  <Icon icon='tabler:alert-triangle' fontSize='1rem' />
                </Box>
              </Tooltip>
            ) : null}
          </Stack>
        )
      },
      {
        accessorKey: 'arrivalDate',
        header: 'Arrival',
        size: 190,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' noWrap>
              {[row.original.arrivalDate, row.original.arrivalTime].filter(Boolean).join(', ') || '-'}
            </Typography>
            <Typography variant='caption' noWrap sx={{ color: 'text.secondary' }}>
              {[row.original.arrivalMode, row.original.arrivalLocation].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'departureDate',
        header: 'Departure',
        size: 190,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' noWrap>
              {[row.original.departureDate, row.original.departureTime].filter(Boolean).join(', ') || '-'}
            </Typography>
            <Typography variant='caption' noWrap sx={{ color: 'text.secondary' }}>
              {[row.original.departureMode, row.original.departureLocation].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'expectedPeople',
        header: 'Expected',
        size: 100,
        // What the HOST said. The caller's own count is the next column, and the
        // two disagreeing is how a host finds out four more cousins turned up.
        Cell: ({ row }) => dash(row.original.expectedPeople)
      },
      {
        accessorKey: 'adults',
        header: 'Members',
        size: 120,
        Cell: ({ row }) => formatMembers(row.original)
      },
      {
        accessorKey: 'luggageBig',
        header: 'Luggage',
        size: 110,
        Cell: ({ row }) => formatLuggage(row.original)
      },
      {
        accessorKey: 'calls',
        header: 'Chased',
        size: 120,
        Cell: ({ row }) => (
          <Stack direction='row' spacing={2} alignItems='center'>
            <Tooltip title={`${row.original.calls} call${row.original.calls === 1 ? '' : 's'}`}>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Icon icon='tabler:phone' fontSize='0.875rem' />
                <Typography variant='body2'>{row.original.calls}</Typography>
              </Stack>
            </Tooltip>
            <Tooltip title={`${row.original.whatsapp} WhatsApp message${row.original.whatsapp === 1 ? '' : 's'}`}>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Icon icon='tabler:brand-whatsapp' fontSize='0.875rem' />
                <Typography variant='body2'>{row.original.whatsapp}</Typography>
              </Stack>
            </Tooltip>
          </Stack>
        )
      },
      {
        accessorKey: 'callStatusLabel',
        header: 'Call outcome',
        size: 140,
        Cell: ({ row }) => dash(row.original.callStatusLabel)
      },
      {
        accessorKey: 'source',
        header: 'Told us',
        size: 150,
        Cell: ({ row }) => dash(row.original.source)
      }
    ],
    []
  )

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. The page's own options below still
    //    win, because they are spread after these.
    ...tableDefaults,
    columns,
    data: rows,
    enableTopToolbar: false,
    enableRowSelection: false,
    enableSorting: false,
    rowCount: totalcount,
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    manualPagination: true,

    renderEmptyRowsFallback: () => (
      <EmptyState
        icon='tabler:plane-arrival'
        error={Boolean(loadError)}
        title={
          loadError
            ? 'This list cannot be read yet'
            : searchText || status
            ? 'No guests match these filters'
            : 'No guests on this list yet'
        }
        description={
          loadError ||
          (searchText || status
            ? 'Try a shorter search, or clear the filters to see everyone.'
            : 'Upload the host’s spreadsheet to start. Name and Mobile are the only columns that must be there.')
        }
        action={
          !loadError && !searchText && !status ? (
            <Button
              variant='contained'
              startIcon={<Icon icon='tabler:upload' />}
              onClick={() => setUploadOpen(true)}
            >
              Upload sheet
            </Button>
          ) : null
        }
      />
    )
  })

  const clearSearch = () => {
    setSearchText('')
    setTempSearchText('')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  const clearStatus = () => {
    setStatus('')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  const statusLabel = STATUS_CHIPS.find(s => s.key === status)?.label

  const filterChips = [
    chosen ? { label: chosen.function_name || 'Function', onDelete: () => setChosen(null) } : null,
    statusLabel ? { label: statusLabel, onDelete: clearStatus } : null,
    searchText ? { label: `"${searchText}"`, onDelete: clearSearch } : null
  ].filter(Boolean)

  const lastImport = imports[0]

  return (
    <>
      {/* ---------------------------------------------------- choose a function */}
      <Card sx={{ mb: 6 }}>
        <Box sx={{ px: 6, py: 4, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <Autocomplete
            size='small'
            sx={{ width: { xs: '100%', sm: 420 } }}
            options={functions}
            value={chosen}
            loading={functionsLoading}
            onChange={(e, value) => {
              setChosen(value)
              setStatus('')
              clearSearch()
            }}
            onInputChange={(e, value, reason) => {
              if (reason === 'input') setFunctionSearch(value)
            }}
            // The host's name and number as well as the function's: two families
            // hold a wedding called "Reception" on the same weekend.
            getOptionLabel={option => option?.function_name || 'Untitled function'}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderOption={(props, option) => (
              <Box component='li' {...props} key={option.id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='body2' noWrap>
                    {option.function_name || 'Untitled function'}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    {[option.name, option.mobile].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label='Function'
                placeholder='Search by function, host name or number'
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {functionsLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
          />

          <Stack direction='row' spacing={3} sx={{ flexWrap: 'wrap', gap: 3 }}>
            <Button
              size='small'
              variant='contained'
              disabled={!chosen}
              startIcon={<Icon icon='tabler:upload' />}
              onClick={() => setUploadOpen(true)}
            >
              Upload sheet
            </Button>
            <LoadingButton
              size='small'
              variant='outlined'
              color='secondary'
              loading={sampling}
              startIcon={<Icon icon='tabler:file-spreadsheet' />}
              onClick={handleSample}
            >
              Sample sheet
            </LoadingButton>
            <LoadingButton
              size='small'
              variant='outlined'
              color='secondary'
              loading={exporting}
              disabled={!chosen || totalcount === 0}
              startIcon={<Icon icon='tabler:download' />}
              onClick={handleExport}
            >
              Export
            </LoadingButton>
          </Stack>
        </Box>

        {chosen && lastImport ? (
          <>
            <Divider sx={{ m: '0 !important' }} />
            <Box sx={{ px: 6, py: 3 }}>
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                Last upload {lastImport.at}
                {lastImport.by ? ` by ${lastImport.by}` : ''} — {lastImport.added} added,{' '}
                {lastImport.updated} updated
                {lastImport.skipped ? `, ${lastImport.skipped} skipped` : ''}
              </Typography>
            </Box>
          </>
        ) : null}
      </Card>

      {/* --------------------------------------------------------------- the list */}
      <Card>
        <PageToolbar
          title='Guest Travel Plan'
          subtitle={
            chosen
              ? [chosen.name, chosen.mobile].filter(Boolean).join(' · ') || undefined
              : 'Choose a function to see its travel list'
          }
          count={!chosen || isdataloading ? undefined : totalcount}
          search={
            <TextField
              size='small'
              variant='outlined'
              disabled={!chosen}
              value={tempSearchText}
              sx={{ width: { xs: '100%', sm: 280 } }}
              placeholder='Search guest or number'
              onChange={e => setTempSearchText(e.target.value)}
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
          filters={filterChips}
          onClearFilters={() => {
            clearStatus()
            clearSearch()
          }}
        />

        {/* ** The four statuses, always all four and always with a number — a chip
               that disappears when its count hits zero is a chip nobody can trust,
               and "0 declined" is a useful thing to be able to read. */}
        {chosen && counts ? (
          <>
            <Box sx={{ px: 6, py: 3, gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                size='small'
                label={`All ${counts.total}`}
                color={status === '' ? 'primary' : 'default'}
                variant={status === '' ? 'filled' : 'outlined'}
                onClick={clearStatus}
              />
              {STATUS_CHIPS.map(s => (
                <Chip
                  key={s.key}
                  size='small'
                  label={`${s.label} ${counts[s.key] ?? 0}`}
                  color={status === s.key ? s.color : 'default'}
                  variant={status === s.key ? 'filled' : 'outlined'}
                  onClick={() => {
                    setStatus(status === s.key ? '' : s.key)
                    setPagination(p => ({ ...p, pageIndex: 0 }))
                  }}
                />
              ))}
            </Box>
            <Divider sx={{ m: '0 !important' }} />
          </>
        ) : null}

        {!chosen ? (
          <EmptyState
            icon='tabler:plane-arrival'
            title='Choose a function'
            description='A travel list belongs to one celebration, so pick the function above and its guests appear here.'
          />
        ) : isdataloading && rows.length === 0 ? (
          // ** Skeleton rows on the FIRST load only. On a page change the old rows
          //    stay put and MRT's own progress bar does the telling, which stops the
          //    table collapsing and re-expanding under the cursor.
          <TableSkeleton columns={8} />
        ) : (
          <MaterialReactTable table={table} />
        )}
      </Card>

      {/* ------------------------------------------------------------- the upload */}
      <Dialog open={uploadOpen} onClose={closeUpload} maxWidth='sm' fullWidth>
        <DialogTitle>
          Upload the guest sheet
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {chosen?.function_name || ''}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2' sx={{ mb: 4 }}>
            Columns are found by their heading, not their position, so the order does not matter.
            <strong> Name</strong> and <strong>Mobile</strong> must be there; <strong>Country Code</strong>,{' '}
            <strong>No. of People</strong> and <strong>Message</strong> are optional.
          </Typography>

          <Button
            variant='outlined'
            color='secondary'
            component='label'
            startIcon={<Icon icon='tabler:paperclip' />}
          >
            {file ? file.name : 'Choose .xlsx file'}
            <input
              hidden
              type='file'
              ref={fileInput}
              accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              onChange={e => {
                setFile(e.target.files?.[0] || null)
                setResult(null)
              }}
            />
          </Button>

          <Typography variant='caption' display='block' sx={{ mt: 2, color: 'text.secondary' }}>
            Re-uploading a corrected sheet updates the names and expected counts. It never wipes a
            travel plan a caller has already collected.
          </Typography>

          {/* ** The skipped rows, named. A host needs to know WHICH three of their
                 four hundred did not make it, which is the whole reason the server
                 returns them instead of a count. */}
          {result ? (
            <Box sx={{ mt: 5 }}>
              <Divider sx={{ mb: 4 }} />
              <Typography variant='body2'>
                {result.added} added, {result.updated} updated
                {result.skipped?.length ? `, ${result.skipped.length} skipped` : ''}.
              </Typography>

              {result.skipped?.length ? (
                <Box sx={{ mt: 3, maxHeight: 180, overflowY: 'auto' }}>
                  {result.skipped.map(s => (
                    <Typography
                      key={`${s.row}-${s.name}`}
                      variant='caption'
                      display='block'
                      sx={{ color: 'text.secondary' }}
                    >
                      Row {s.row}: {s.name} — {s.reason}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={closeUpload}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          <LoadingButton variant='contained' loading={uploading} disabled={!file} onClick={handleUpload}>
            Upload
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Its own subject, matching the nav entry, so the page is permissioned like every
// other screen here rather than riding on somebody else's grant.
TravelPlan.acl = {
  action: 'read',
  subject: 'travelplan'
}

export default TravelPlan
