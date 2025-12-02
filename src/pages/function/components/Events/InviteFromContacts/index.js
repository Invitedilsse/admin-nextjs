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
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import {
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
  Tab,
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
import { apiDelete, apiGet, apiPut } from 'src/hooks/axios'

import AddFileDrawer from './components/ManageGlobalConatctDrawer'
// import SideBarShareJob from './components/ShareJob'
import { toggleSnackBar } from 'src/store/auth'
import { baseURL } from 'src/services/pathConst'
import Select from 'src/@core/theme/overrides/select'
import { getListOfCategories, getListOfContacts, getListOfGiftType, getListOfKeyType, getListOfOccasion } from 'src/store/adminMod'
import { ca } from 'date-fns/locale'
import { useSettings } from 'src/@core/hooks/useSettings'
import toast from 'react-hot-toast'
import Group from './Group'
import axios from 'axios'
import InternalGroup from './InternalGroup'

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
const Contacts = () => {
  // ** Hooks
  const ability = useContext(AbilityContext)
  const theme = useTheme()
  const dispatch = useDispatch()
  const { settings } = useSettings()
  const [tabValue, setTabValue] = useState('1');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
  const [searchText, setSearchText] = useState('')
  const router = useRouter()
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [contactData, setContactData] = useState([])
  const [contactDataCount, setContactDataCount] = useState(0)
  const handleClickOpen = () => {
    setdOpen(true)
  }

  const handleClose = () => {
    setdOpen(false)
  }

  console.log(paginationModel)

  const listColumns = [
    {
      flex: 0.055,
      // minWidth: 120,
      // width: 200,
      sortable: true,
      field: 'name',
      headerName: 'Name'
    },
    {
      flex: 0.055,
      // minWidth: 120,
      // width: 200,
      sortable: true,
      field: 'mobile',
      headerName: 'Mobile Number',
      renderCell: ({ row }) => `${row?.country_code}-${row?.mobile}`
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
            {/* <Tooltip title='Edit Contact'>
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
            </Tooltip> */}

            {
              <Tooltip title='Delete Contact'>
                <IconButton
                  onClick={() => {
                    // setId(row.id);
                    setdelId(row.id)
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
 
  const { isContactsFetching, allContacts, contactsCount,eventId } = useSelector(state => state.adminMod)
  // console.log("ddd", recruiterJobList);
  console.log(allContacts, contactsCount)

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
  const [rowCountState, setRowCountState] = useState(contactsCount || 0)
  console.log(contactsCount)

  const [sortModel, setSortModel] = useState([
    {
      field: 'event_id',
      sort: 'desc'
    }
  ])
  const getAllGiftTypes = async () => {
    const params2 = {
      page: paginationModel?.page + 1,
      size: paginationModel?.pageSize
    }
    const params = {
      page: paginationModel?.page,
      size: paginationModel?.pageSize
    }
    console.log(params)
    const params4 = {
      sortDir: 'desc',
      limit: '100',
      offset: '0',
      search_string: '',
      sortBy: 'name'
    }

    const queryParams = `event_id=${eventId}&search_string=${searchText}&sortDir=${sortModel.length>0 ? sortModel[0]?.sort: 'desc'}&sortBy=${sortModel.length>0 ? sortModel[0]?.field: 'event_id'}`
    // dispatch(getListOfContacts(queryParams))

    try{
      setIsLoading(true)
      const response= await apiGet(`${baseURL}event-user/list?${queryParams}`)
      console.log(response?.data)

      if(response?.data){
        console.log(response?.data)
setContactData(response?.data)
if(response?.data?.detail?.length>0 &&response?.data?.detail[0]?.contact_id?.length>0 ? response?.data?.detail[0]?.contact_id?.length :30){
setContactDataCount(response?.data?.detail[0]?.contact_id?.length)
}else{
  setContactDataCount(0)
}
      }
    }catch(error){
      console.log(error)
    }finally{
      setIsLoading(false)
    }


  }

  useEffect(() => {
    getAllGiftTypes()
  }, [])

  useEffect(() => {
    console.log('ca')
    getAllGiftTypes()
  }, [paginationModel?.page, paginationModel?.pageSize, rowCountState, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllGiftTypes()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (contactsCount !== undefined ? contactsCount : prevRowCountState))
  }, [contactsCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
    // debounce(getAllGiftTypes(), 2000)
  }
  const deleteEvent = async () => {
    try {
      if( contactData?.detail.length>0 && contactData?.detail[0]?.contact_details.length===0){
        toast.error('No contacts added')
        return
      }
      setDelLoading(true)
      const filData = contactData?.detail[0]?.contact_details?.filter(it => it.id !== delId)
      const selectedIds = filData?.map(row => row?.id);
      const params = {
        event_id:[eventId],
        contact_id: selectedIds||[]
      }

      let url = `${baseURL}event-user/update`
console.log(params)
// return
      const result = await apiPut(url, params)
      // toggle();
      console.log(result?.data?.data)
      getAllGiftTypes()
      toast.success( result?.data?.message)
    
    } catch (e) {
      toast.error(e)
   
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
  return (
    <Grid2 container spacing={6}>
      <Grid2  size={{ xs:12,}}>
        <Card
          sx={{
            // background: 'white',
           boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
        

          <CardContent sx={{my:0, py:2}}></CardContent>
          <TabContext value={tabValue} sx={{mt:3}}>
  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
    <TabList onChange={handleTabChange} aria-label="lab API tabs example" variant='fullWidth'>
      <Tab label="Contacts" value="1" />
      <Tab label="Groups" value="2" />
      <Tab label="Internal Groups" value="3" />
    </TabList>
  </Box>
  <TabPanel value="1">
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid2  size={{ xs:12, lg:6 , md:6, sm:12}} >
              <TextField
              variant='outlined'
              size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
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
            <Grid2 size={{ xs:12, lg:2 , md:2, sm:12}} >
              </Grid2>
            <Grid2 size={{ xs:12, lg:2 , md:2, sm:12}} >
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
                 {/* <Button
                fullWidth
                onClick={() => {
                  setEid('')
                  setEntireRow([])
                  setId('')
                  setEntireRow([])
                  toggleAddUserDrawer()
                }}
                variant='outlined'
                color='primary'
                sx={{ '& svg': { mr: 2 } }}
              >
                Add from Excel
              </Button> */}
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
                Select from Contacts
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
            <DataGrid
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
              rows={contactData?.detail?.length>0 && contactData?.detail[0]?.contact_details||[]}
              columns={listColumns}
              loading={isLoading}
              onRowClick={it => console.log(it)}
              onSortModelChange={newSortModel => {
                console.log(newSortModel)
                setSortModel(newSortModel)
              }}
              // checkboxSelection
              onRowSelectionModelChange={newRowSelectionModel => {
                console.log(newRowSelectionModel)
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
              disableRowSelectionOnClick
              rowCount={contactDataCount}
              // rowCount={30}
              paginationMode='client'
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              columnBuffer={3}
              slots={{
                noRowsOverlay: NoRowsOverlay
              }}
            />
          </Box>
          </TabPanel>
  <TabPanel value="2">
   <Group/>
          </TabPanel>
          <TabPanel value="3">
   <InternalGroup/>
          </TabPanel>
          </TabContext>
        </Card>
      </Grid2>

      <Box p={4}>
        <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} contactData={contactData} />
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
Contacts.acl = {
  action: 'read',
  subject: 'ucontacts'
}
export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Contacts Found 
    </Stack>
  )
}
export default Contacts
