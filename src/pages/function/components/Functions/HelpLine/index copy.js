// ** React Imports
import { forwardRef, useCallback, useContext, useEffect, useState } from 'react'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import { DataGrid } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
import CustomTextField from 'src/@core/components/mui/text-field'
// ** Utils Import

// ** Actions Imports

// ** Third Party Components
// ** Custom Table Components Imports
import { LoadingButton } from '@mui/lab'
import {
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  debounce,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import moment from 'moment'
import { useRouter } from 'next/router'
import 'react-datepicker/dist/react-datepicker.css'
// import useNotification from "src/hooks/useNotification";
// import { getEventsList } from "src/store/apps/superadmin/events";
// import { getCategoryList, getFileList } from 'src/store/apps/user/memberlist'
import { apiDelete } from 'src/hooks/axios'

import AddFileDrawer from './components/ManageHelpLineDrawer'
// import SideBarShareJob from './components/ShareJob'
import { toggleSnackBar } from 'src/store/auth'
import { baseURL } from 'src/services/pathConst'
import Select from 'src/@core/theme/overrides/select'
import { getListOfCategories, getListOfFirms, getListOfGiftType, getListOfOccasion } from 'src/store/adminMod'
import { ca } from 'date-fns/locale'
import { useSettings } from 'src/@core/hooks/useSettings'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

const userStatusObj = {
  active: 'success',
  hired: 'info',
  disabled: 'error'
}
const formatDate = date => {
  if (date) {
    return moment(date).format('DD-MM-YYYY hh:mm a')
  } else {
    return ''
  }
}
const SpecialInvitee = () => {
  // ** Hooks
  const ability = useContext(AbilityContext)
  const theme = useTheme()
  const dispatch = useDispatch()
  const { settings } = useSettings()
  // const [sendNotification] = useNotification();
  const leftSidebarWidth = 300
  const addEventSidebarWidth = 500
  const { direction } = theme
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const [id, setId] = useState('')
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [role, setRole] = useState('')
  const [plan, setPlan] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [isSearch, setEventStatus] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [searchText, setSearchText] = useState('')
  const router = useRouter()
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClickOpen = () => {
    setdOpen(true)
  }

  const handleClose = () => {
    setdOpen(false)
  }

  console.log(paginationModel)

  const listColumns = [
    {
      flex: 0.05,
      minWidth: 120,
      width: 120,
      sortable: true,
      field: 'main_logo',
      headerName: 'Logo',
      renderCell: ({ row }) => {
        return (
          <Avatar
          // variant='r'
            src={`${row?.main_logo && row?.main_logo?.length>0 &&  row?.main_logo[0]?.url ||''}`}
            alt={row.name}
            sx={{
              mt:2,
              width: '44px',
              height: '44px',
              objectFit: 'cover'
            }}
          />
        )
      }
      
    },
    {
      flex: 0.055,
      // minWidth: 120,
      // width: 200,
      sortable: true,
      field: 'title',
      headerName: 'Name'
    },
    {
       flex: 0.1,
      // minWidth: 120,
      // width: 440,

      sortable: true,
      field: 'description',
      headerName: 'Description'
    },

    {
      // flex: 0.1,
      minWidth: 120,
      width: 120,
      field: 'action',
      sortable: false,
      headerName: 'Action',
      renderCell: ({ row }) => {
        return (
          <>
            <Tooltip title='Edit Firm'>
              <IconButton
                onClick={() => {
                  // setId(row.id);
                  setEid(row?.id)
                  setEntireRow(row)
                  toggleAddUserDrawer()
                }}
                color='primary'
                sx={{ fontSize: '18px' }}
              >
                {' '}
                <Icon icon='tabler:pencil' color='primary' />
              </IconButton>
            </Tooltip>

            {
              <Tooltip title='Delete Firm'>
                <IconButton
                  onClick={() => {
                    // setId(row.id);
                    setdelId(row.category_id)
                    setdOpen(true)
                    // deleteEvent(row._id);
                    // setEid(row?._id);
                    // setEntireRow(row);
                    // toggleAddUserDrawer();
                  }}
                  color='error'
                  sx={{ fontSize: '18px' }}
                >
                  {' '}
                  <Icon icon='ic:outline-delete' color='error' />
                </IconButton>
              </Tooltip>
            }
          </>
        )
      }
    }
  ]



  const { isFirmsFetching, allFirms, firmsCount } = useSelector(state => state.adminMod)
  // console.log("ddd", recruiterJobList);
  console.log(allFirms, firmsCount)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setId('')
      setEid('')

      //
    }

    setAddUserOpen(!addUserOpen)
  }
  const toggleShareDrawer = () => {
    if (shareOpen) {
      setId('')
    }
    setShareOpen(!shareOpen)
  }

  const handleOnChangeRange = dates => {
    const [start, end] = dates
    setStartDateRange(start)
    setEndDateRange(end)
  }
  const CustomInput = forwardRef((props, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')
    const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null
    const value = `${startDate}${endDate !== null ? endDate : ''}`

    return <CustomTextField inputRef={ref} label={props.label || ''} {...props} value={value} />
  })
  const [rowCountState, setRowCountState] = useState(firmsCount || 0)
  console.log(firmsCount)

  const [sortModel, setSortModel] = useState([
    {
      field: 'title',
      sort: 'desc'
    }
  ])
  const getAllFirms = () => {
    const params2 = {
      page: paginationModel?.page + 1,
      size: paginationModel?.pageSize
    }
    const params12 = {
      page: paginationModel?.page,
      size: paginationModel?.pageSize
    }
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }
    console.log(params)
    const params4 = {
      sortDir: 'desc',
      limit: '100',
      offset: '0',
      search_string: '',
      sortBy: 'name'
    }

    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel.length>0 ? sortModel[0]?.sort: 'desc'}&sortBy=${sortModel.length>0 ? sortModel[0]?.field: 'title'}`
    dispatch(getListOfFirms(queryParams))
  }

  useEffect(() => {
    getAllFirms()
  }, [])

  useEffect(() => {
    console.log('ca')
    getAllFirms()
  }, [paginationModel?.page, paginationModel?.pageSize, rowCountState, searchText, pagination?.pageIndex, pagination?.pageSize])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllFirms()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (firmsCount !== undefined ? firmsCount : prevRowCountState))
  }, [firmsCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
    // debounce(getAllFirms(), 2000)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        id: delId
      }

      let url = `${baseURL}firm/delete`

      const result = await apiDelete(url, params)
      // toggle();
      console.log(result?.data?.data)
      getAllFirms()
      dispatch(
        toggleSnackBar({
          isOpen: true,
          type: 'success',
          message: result?.data?.message
        })
      )
    } catch (e) {
      dispatch(
        toggleSnackBar({
          isOpen: true,
          type: 'error',
          message: e
        })
      )
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
   const columns = [
    
    {
      accessorKey: 'main_logo', //access nested data with dot notation
      header: 'Logo',
      Cell: ({ renderedCellValue, row }) => (
        <>
        <Avatar
        // variant='r'
          src={`${row?.original?.main_logo && row?.original?.main_logo?.length>0 &&  row?.original?.main_logo[0]?.url ||'NA'}`}
          alt={row?.original?.name}
          sx={{
            mt:2,
            width: '44px',
            height: '44px',
            objectFit: 'cover'
          }}
        />
        </>
      )
    },
    {
      accessorKey: 'title',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'city',
      header: 'Actions',
      Cell: ({ renderedCellValue, row }) => 
      {
      console.log(row)
      console.log(renderedCellValue)
        
        return (  <>
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              // setId(row.id);
              setEid(row?.original?.id)
              setEntireRow(row?.original)
              toggleAddUserDrawer()
            }}
            color='primary'
            sx={{ fontSize: '18px' }}
          >
            {' '}
            <Icon icon='tabler:pencil' color='primary' />
          </IconButton>
        </Tooltip>

        {
          <Tooltip title='Delete'>
            <IconButton
              onClick={() => {
                // setId(row.id);
                setdelId(row?.original?.id)
                setdOpen(true)
                // deleteEvent(row._id);
                // setEid(row?._id);
                // setEntireRow(row);
                // toggleAddUserDrawer();
              }}
              color='error'
              sx={{ fontSize: '18px' }}
            >
              {' '}
              <Icon icon='ic:outline-delete' color='error' />
            </IconButton>
          </Tooltip>
        }
      </>)}
    },
  ];
  const table = useMaterialReactTable({
    columns,
    data:allFirms,
    enableColumnFilter:false,
    enableTopToolbar: false,
     enableHiding: false,
     enablePinning: false,
     enableColumnDragging: false,
     enableColumnOrdering: false,
     enableFullScreenToggle: false,
     enableDensityToggle: false,  
     enableColumnActions: false,
    //  muiLinearProgressProps: ({ isTopToolbar }) => ({
    //   color: 'warning',
    //   sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
    //   value: fetchProgress, //show precise real progress value if you so desire
    // }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx:{      color: 'white',
        '& .MuiButtonBase-root.Mui-active svg':{
          color: 'white !important',
        }
//         '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
//   color: 'red !important',
// }
       }
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
sx:{      color: 'white',
  backgroundColor: 'primary.main',
  
// '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
//   color: 'blue !important',
// }
}
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),
    
    //  renderTopToolbarCustomActions: ({ table }) => ( <Button
    //   // fullWidth
    //   onClick={() => {
    //     setEid('')
    //     setEntireRow([])
    //     setId('')
    //     setEntireRow([])
    //     toggleAddUserDrawer()
    //   }}
    //   variant='contained'
    //   color='primary'
    //   sx={{ '& svg': { mr: 2 } }}
    // >
    //   Add Firm
    // </Button>),
    //  enableColumnActions: false,
    //  enableRowOrdering: false,
    // enableGlobalFilter: false, 
    // enableRowSelection: true,
    // initialState: { showColumnFilters: true , pagination: { pageSize: 10, pageIndex: 0 }},
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [5, 10, 20],
      showFirstButton: true,
      showLastButton: true,
    },
     paginationDisplayMode: 'default',
    
    manualPagination: true,
    rowCount: firmsCount,
    enableRowOrdering: true,
    enableSorting: true,
    onPaginationChange: setPagination, //hoist pagination state to your state when it changes internally
  state: { pagination ,
    showProgressBars: isFirmsFetching,
    isLoading:isFirmsFetching,
    columnFilters:[],
    globalFilter:''
    // sorting

  }, 
    muiRowDragHandleProps: ({ table }) => ({
      onDragEnd: () => {
        const { draggingRow, hoveredRow } = table.getState();
        if (hoveredRow && draggingRow) {
          console.log(draggingRow, hoveredRow)
          var d = allFirms;
          
          // data.splice(
          //   (hoveredRow).index,
          //   0,
          //   data.splice(draggingRow.index, 1)[0],
          // );
          // console.log(...data)
          // setData([...data]);
        }
      },
    }),
  });
  return (
    <Grid2 container spacing={6}>
      <Grid2  size={{ xs:12,}}>
        <Card
          sx={{
            // background: 'white',
           boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
         
          {/* <Divider sx={{ m: '0 !important' }} /> */}

          <CardContent></CardContent>

          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid2  size={{ xs:12, lg:6 , md:6, sm:12}} >
              <TextField
              variant='outlined'
              size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search'
                onChange={e => handleDebouncedSearch(e.target.value)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter') {
                    ev.preventDefault()
                    setSearchText(tempSearchText)
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton onClick={() => setSearchText(tempSearchText)}>
                        <Icon icon='fluent:search-20-regular' width={20} height={20} />
                      </IconButton>
                    )
                  },
                }}
                // InputProps={{
                //   endAdornment: (
                //     <IconButton onClick={() => setSearchText(tempSearchText)}>
                //       <Icon icon='fluent:search-20-regular' width={20} height={20} />
                //     </IconButton>
                //   )
                // }}
              />
            </Grid2>
            <Grid2 size={{ xs:12, lg:4 , md:4, sm:12}} >
              {/* <FormControl
                  fullWidth
                  size='small'

                  // sx={{ my: 2, }}
                >
                  <InputLabel id='demo-simple-select-labelw ' size='small' fullWidth>
                    Event Status
                  </InputLabel>
                  <Select
                    labelId='demo-simple-select-labelw'
                    id='demo-simple-select'
                    fullWidth
                    value={eventStatus}
                    label='Events Status'
                    size='small'
                    onChange={e => setEventStatus(e?.target.value)}
                  >
                    <MenuItem value={'past'}>Past Events</MenuItem>
                    <MenuItem value={'live'}>Live Events</MenuItem>
                    <MenuItem value={'upcoming'}>Upcoming Events</MenuItem>
                  </Select>
                </FormControl> */}
            </Grid2>
            <Grid2   size={{ xs:12, lg:2 , md:2, sm:12}} >
              <Button
                fullWidth
                onClick={() => {
                  setEid('')
                  setEntireRow([])
                  setId('')
                  setEntireRow([])
                  toggleAddUserDrawer()
                }}
                variant='contained'
                color='primary'
                sx={{ '& svg': { mr: 2 } }}
              >
                Add Special Invitee
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
          <MaterialReactTable table={table} />
          {false&&  <DataGrid
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 200,
                '& .MuiDataGrid-row': {
                  cursor: 'pointer'
                },

                '& .MuiDataGrid-columnHeaders ': {
                  backgroundColor: `${theme.palette.primary.main} !important`,
                  color: '#fff',
                  '& .MuiDataGrid-row--borderBottom':{
background:'none !important',
                  },
                  '& .MuiButtonBase-root.MuiIconButton-root ': {
                    color: '#fff'
                  },
                  // borderTopLeftRadius: '6px',
                  // borderTopRightRadius: '6px'
                },
                '& .MuiDataGrid-columnHeaders.MuiDataGrid-withBorderColor': {
                  borderColor: `${theme.palette.primary.main}`
                },

                '& .MuiDataGrid-columnSeparator ': {
                  color: '#fff'
                },
                '& .MuiDataGrid-cell , .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  // color: '#000'
                },
                '& .MuiTablePagination-selectLabel .MuiTablePagination-select .MuiSelect-nativeInput': {
                  // color: 'rgb(0,0,0)'
                  // color:'text.primary !important'
                 color:'grey !important',
                 mt:1

                },
                '& .MuiTablePagination-select': {
                 color:'grey !important',
                 mt:1

                },
                '& .MuiTablePagination-actions': {
                  // color: 'rgb(0,0,0)',
                  '& .Mui-disabled': {
                    color: 'rgb(0,0,0, .5)'
                  }
                },
                '& .MuiButtonBase-root .MuiMenuItem-root.MuiTablePagination-menuItem , .MuiTablePagination-root': {
                  color: 'rgb(0,0,0)'
                },
                '& .MuiDataGrid-virtualScroller': {
                  // border: `1px solid ${theme.palette.primary.main}`,
                  border: `.25px solid grey`
                }
              }}
              autoHeight
              rowHeight={62}
              rows={allFirms}
              columns={listColumns}
              loading={isFirmsFetching}
              onRowClick={it => console.log(it)}
              onSortModelChange={newSortModel => {
                console.log(newSortModel)
                setSortModel(newSortModel)
              }}
              enableHiding={false}
              enableColumnActions={false}
              enableColumnFilterModes={false}
              enableDensityToggle={false}
              enableFullScreenToggle={false}
              enableGlobalFilter={false}
              enableTopToolbar={false}
              disableColumnMenu={true}
              getRowId={row => row.id}
              // autoPageSize
              rowReordering
              onRowOrderChange={(e)=>console.log(e)}
              disableRowSelectionOnClick
              rowCount={rowCountState}
              paginationMode='server'
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              columnBuffer={3}
              slots={{
                noRowsOverlay: NoRowsOverlay
              }}
            />}
          </Box>
        </Card>
      </Grid2>

      <Box p={4}>
        <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
      </Box>

      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ?`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton loading={delLoading} varient='contained' onClick={deleteEvent} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid2>
  )
}

export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Special Invitees Found 
    </Stack>
  )
}
export default SpecialInvitee
