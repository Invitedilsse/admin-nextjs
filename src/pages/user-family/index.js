import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

import {
  Grid2,
  Card,
  CardHeader,
  Divider,
  TextField,
  IconButton,
  Button,
  Popover
} from '@mui/material'

// ** Iconify's Icon, not @mui/material's: only this one has an `icon` prop.
import Icon from 'src/@core/components/icon';

import { Box } from '@mui/system';
import { Visibility } from '@mui/icons-material';

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table';

import { DateRange } from 'react-date-range';
import { format } from 'date-fns';

import { apiGet } from 'src/hooks/axios';
import { baseURL } from 'src/services/pathConst';

// ** The portal's shared list-page chrome. See the header comments in each file.
import { PageToolbar, EmptyState } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

const UsersFamily = ({}) => {
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [userList, setUserList] = useState([])
const router = useRouter()
const [anchorEl, setAnchorEl] = useState(null);
const searchParams = useSearchParams();
const [startdate,setStartDate] = useState(searchParams.get("sd")??'')
const [endDate,setEndDate] = useState(searchParams.get("ed")??'');
const [selectionRange, setSelectionRange] = useState({
    // startDate:startdate !==''? startdate : new Date(),
    // endDate: endDate !==''? endDate : new Date(),
    startDate:startdate !==''? startdate : '',
    endDate: endDate !==''? endDate : '',
    key: "selection"
  });


console.log("startdate----->",startdate,"endDate----->",endDate)

  const fetchData = async () => {
    //fetch data from the api and set it to the state
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${baseURL}function-reports/user-family-list?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&sd=${startdate}&ed=${endDate}`
      )
      console.log('uses List--------->', response.data)
      setUserList(response.data.data || [])
      setTotalCount(response.data.count.total || 0)
    } catch (error) {
      console.error('UserList:------>', error)
    } finally {
      setisdataloading(false)
    }
  }

    const fetchuserData = async (d,type) => {
      if(type === 'm')
        router.push(`/users-history/${d.id}`)
      else
        router.push(`/users-history/${d.creator_id}`)

  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const handleTemplateClick = ()=>{
     console.log("innn")
  }

  useEffect(() => {
    fetchData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize,startdate,endDate])

  const generateColumns = ({ onTemplateClick }) => [
    {
      accessorKey: 'member name',
      header: 'Member Name',
      Cell: ({ row }) => row.original.member_name || '-'
    },
    {
      accessorKey: 'member mobile',
      header: 'Member Mobile',
      Cell: ({ row }) => row.original.member_mobile || '-' // Event/Trans/Acc/Other title
    },
     {
      accessorKey: 'creator name',
      header: 'Creator Name',
      Cell: ({ row }) => row.original.creator_name || '-'
    },
    {
      accessorKey: 'creator mobile',
      header: 'Creator Mobile',
      Cell: ({ row }) => row.original.creator_mobile || '-' // Event/Trans/Acc/Other title
    },
     {
      accessorKey: 'created At',
      header: 'Created At',
      Cell: ({ row }) => row.original.created_at || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'View Member In Detail',
      Cell: ({ row }) => (
        <>
          <Visibility onClick={() => onTemplateClick(row.original,'m')} style={{ cursor: 'pointer', marginRight: 8 }} />
        </>
      )
    },
     {
      accessorKey: 'Action',
      header: 'View Creator In Detail',
      Cell: ({ row }) => (
        <>
          <Visibility onClick={() => onTemplateClick(row.original,'c')} style={{ cursor: 'pointer', marginRight: 8 }} />
        </>
      )
    }
  ]

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. This page's own options below
    //    still win, because they are spread after these.
    ...tableDefaults,
    columns: generateColumns({
      onTemplateClick: fetchuserData
    }),
    data: userList,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['title'] }
    },
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
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

    // ** An empty table with headers and no rows reads exactly like a failed
    //    request. Say which it is, and say it differently when a search is the
    //    reason there is nothing to show.
    renderEmptyRowsFallback: () => (
      <EmptyState
        icon='tabler:heart-handshake'
        title={searchText ? 'Nothing matches that search' : 'No family connections in this date range'}
        description={
          searchText
            ? 'Try a shorter search, or clear it to see everything in the range.'
            : 'Widen the date range, or clear the filter to see everything.'
        }
      />
    )
  })

    const handleDateChange = ranges => {
    const { startDate:sdate, endDate:edate } = ranges.selection;

    setSelectionRange({
      startDate:sdate,
      endDate:edate,
      key: "selection"
    });
    setStartDate(format(sdate, "yyyy-MM-dd"))
    setEndDate(format(edate, "yyyy-MM-dd"))
  }

  // ** These dates are legitimately '' when no range is set, and format() throws on
  //    that, so every read of them goes through here.
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
  }

  const clearSearch = () => {
    setSearchText('')
    setTempSearchText('')
  }

  // ** What is actually narrowing this list, shown rather than hidden behind a
  //    button that looks the same whether anything is filtered or not.
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
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
        <Card>
          <PageToolbar
          title='Family Plus'
          count={isdataloading ? undefined : totalcount}
          search={
            <TextField
              size='small'
              variant='outlined'
              value={tempSearchText}
              sx={{ width: { xs: '100%', sm: 280 } }}
              placeholder='Search Contacts'
              onChange={e => handleDebouncedSearch(e.target.value)}
              onKeyDown={ev => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  setSearchText(tempSearchText)
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
                    <IconButton size='small' aria-label='Search' onClick={() => setSearchText(tempSearchText)}>
                      <Icon icon='tabler:arrow-right' fontSize='1.125rem' />
                    </IconButton>
                  ) : null
                }
              }}
            />
          }
          actions={
            <>
              <Button
              size='small'
              variant='outlined'
              color='secondary'
              startIcon={<Icon icon='tabler:calendar' />}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              {rangeLabel}
            </Button>
            </>
          }
          filters={filterChips}
          onClearFilters={clearFilters}
        />

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <DateRange ranges={[selectionRange]} onChange={handleDateChange} moveRangeOnFirstSelection={false} />
        </Popover>

        <MaterialReactTable table={table} />
        </Card>
        </Grid2>
      </Grid2>
    </>
  )
}

export default UsersFamily