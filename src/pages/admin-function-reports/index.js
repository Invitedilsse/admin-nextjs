

import React, { useEffect, useState } from 'react'
import {
  Button,
  Box,
  CardContent,
  Divider,
  Card,
  CardHeader,
  TextField,
  IconButton,
  Popover,
  Grid2,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'

// ** Iconify's Icon, not @mui/material's: only this one has an `icon` prop.
import Icon from 'src/@core/components/icon'
// import Grid2 from '@mui/material/Grid2'
import {  Visibility } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch,  } from 'src/hooks/axios'
import {
  baseURL,
  deleteCustomPushTemplatesAllUsers,
  deleteCustomPushTemplatesFunUsers,
  getnotification,
  mapTemplatesHrs,
  reportUserList,
} from 'src/services/pathConst'

// ** The portal's shared list-page chrome. See the header comments in each file.
import { PageToolbar, EmptyState } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
import FunctionDetailsDrawer from './components/ManageAssignDrawer'
import { useRouter } from 'next/router'
// import AssignContactsDrawer from './components/ManageAssignDrawer'
import { useSearchParams } from "next/navigation";
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';

function ListUsers({ page }) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  // const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
const [addUserOpen, setAddUserOpen] = useState(false)
  const { userData } = useSelector(state => state.auth)
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
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
  const [type,setType] = useState(searchParams.get("type")??'');

  const toggleAddUserDrawer = () => {
    // if (addUserOpen) {
    //   setEid('')
    // }
    setAddUserOpen(!addUserOpen)
  }



  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData,handleRestriction }) => [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) =>   row.original.name || '-'
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    },
        {
      accessorKey: 'function',
      header: 'Function Type',
      Cell: ({ row }) => row.original.function + ', ' || '-' // Event/Trans/Acc/Other title
    },
    // {
    //   accessorKey: 'mobile',
    //   header: 'Mobile',
    //   Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    // },
    // {
    //   accessorKey: 'role',
    //   header: 'role',
    //   Cell: ({ row }) => row.original.role || '-' // Event/Trans/Acc/Other title
    // },
    {
      accessorKey: 'Action',
      header: 'View In Detail',
      Cell: ({ row }) => (
        <>
             {/* <Edit onClick={() => onTemplateClick(row.original)}/> */}
              <Visibility
                              onClick={() => onTemplateClick(row.original)}
                              style={{ cursor: "pointer", marginRight: 8 }}
                            />
        </>
      )
    }
  ]

  const handleToggleTime = async (id, field, value) => {
    try {
      let body = {
        id: id,
        // [field]: value,
        type: field,
        boolval: value
      }
      console.log('body', body, field, value)
      await apiPatch(mapTemplatesHrs, body)
      fetchData()
      toast.success('Updated successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }

  const handleManualClick = rowData => {
    // alert('Manual Clicked')
    setSelectedRow(rowData)
    setManualDrawerOpen(true) // opens drawer for push_notification_targets
  }

  const handleTemplateClick = rowData => {
    // alert('true')
    setSelectedRow(rowData)
    toggleAddUserDrawer()
    // setTemplateDrawerOpen(true)
  }

  const handleDeleteData = async id => {
    setDelLoading(true)
    try {
      console.log('body')
      await apiDelete(
        page === 'allusers'
          ? deleteCustomPushTemplatesAllUsers + `/${delId}`
          : deleteCustomPushTemplatesFunUsers + `/${delId}`
      )
      fetchData()
      toast.success('Deleted successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      setDelLoading(false)
      setdOpen(false)
      setdelId('')
    }
  }

  const toggleDialog = id => {
    setdelId(id)
    setdOpen(true)
  }

  const handleRestriction = async (id, field, value) => {
    // setDelLoading(true)
    try {
      console.log('body',id, field, value)
      await apiGet(`${baseURL}admin/restrict-user?userId=${id}&restrict=${value}`)
      fetchData()
      toast.success('Restricte successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      // setDelLoading(false)
    }
  }

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. This page's own options below
    //    still win, because they are spread after these.
    ...tableDefaults,
    columns: generateColumns({
      onToggleTime: handleToggleTime,
      // onManualClick: handleManualClick,
      onTemplateClick: handleTemplateClick,
      onDeleteData: toggleDialog,
      handleRestriction:handleRestriction
    }),
    data: contactsFunctionAll,
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
        icon='tabler:calendar-event'
        title={searchText ? 'Nothing matches that search' : 'No functions in this date range'}
        description={
          searchText
            ? 'Try a shorter search, or clear it to see everything in the range.'
            : 'Widen the date range, or clear the filter to see everything.'
        }
      />
    )
  })

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }

  //need a getApi function to fetch the data from the api
  const fetchData = async () => {
    //fetch data from the api and set it to the state
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${reportUserList}?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&start_date=${startdate}&end_date=${endDate}&type=${type}`
      )
      console.log('Push Notification Templates:', response.data)
      setContactsFunctionAll(response.data.data || [])
      setTotalCount(response.data.count || [])

      
      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }finally{
    setisdataloading(false)
    }
  }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

    const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

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

    const handleChange = (event) => {
    const value = event.target.value;
    setType(value);

    console.log("Selected:", value);
    // 👉 call API / filter logic here
  };

  useEffect(() => {
    fetchData()
    // fetchConatctData()
  }, [searchText,pagination?.pageIndex, pagination?.pageSize,startdate,endDate,type])


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
            type ? { label: type === 'online' ? 'Online' : 'Offline', onDelete: () => setType('') } : null,
    searchText ? { label: `"${searchText}"`, onDelete: clearSearch } : null
  ].filter(Boolean)

  const clearFilters = () => {
    clearDates()
    clearSearch()
    setType('')
  }

  return (
    <>
      <Grid2 container spacing={6}>
        {!addUserOpen && (
        <Grid2 size={{ xs: 12 }}>
          <Card
          >
            <PageToolbar
          title='Function Creators List'
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
              <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Function type</InputLabel>
              <Select value={type} label='Function type' onChange={handleChange}>
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='online'>Online</MenuItem>
                <MenuItem value='offline'>Offline</MenuItem>
              </Select>
            </FormControl>
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
      )}
      </Grid2>

            {addUserOpen && (
              <Grid2 size={{ xs: 12 }}>
                <Card elevation={0}>
                  <FunctionDetailsDrawer
                    open={addUserOpen}
                    toggle={toggleAddUserDrawer}
                    // id={eid}
                    RowData={selectedRow}
                    getAll={() => {}}
                    startdate={startdate}
                    endDate={endDate}
                    type={type}
                  />
                </Card>
              </Grid2>
            )}
    </>
  )
}

export default ListUsers
