// ** React Imports
import { useContext, useEffect, useState } from 'react'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'

import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  alpha,
  useMediaQuery
} from '@mui/material'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete } from 'src/hooks/axios'
import AddFileDrawer from './ManageEventsDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfEvents, getListOfMappedContacts } from 'src/store/adminMod'
import { useSettings } from 'src/@core/hooks/useSettings'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from 'src/pages/function/components/common/SerialNumberGenerator'

const EventsContacts = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [tabValue, setTabValue] = useState('1');
  const [id, setId] = useState('')
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClose = () => {
    setdOpen(false)
  }

  const { allEvents, isMappedContactFetching, mappedContact, mappedContactCount, functionId } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setId('')
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(mappedContactCount || 0)

  const [sortModel, setSortModel] = useState([
    {
      field: 'contact_id',
      sort: 'desc'
    }
  ])

  const getallEvents = () => {
    const queryParams = `function_id=${functionId}&limit=${200}&offset=${0}&search_string=&sortDir=desc&sortBy=event_name`
    dispatch(getListOfEvents(queryParams))
  }
  const getAllFunctionContacts = () => {

    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }

    const queryParams = `oid=${selectedId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel.length > 0 ? sortModel[0]?.sort : 'desc'}&sortBy=${sortModel.length > 0 ? sortModel[0]?.field : 'contact_id'}`
    dispatch(getListOfMappedContacts(queryParams))
  }

  useEffect(() => {
    getallEvents()
    getAllFunctionContacts()
  }, [])

  useEffect(() => {
    getAllFunctionContacts()
  }, [pagination?.pageIndex, , pagination?.pageSize, rowCountState, searchText, selectedId])

  useEffect(() => {
    if (addUserOpen === false) {
      getallEvents()
      getAllFunctionContacts()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (mappedContactCount !== undefined ? mappedContactCount : prevRowCountState))
  }, [mappedContactCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        group_id: delId
      }

      let url = `${baseURL}invitee-contact/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllFunctionContacts()
      toast.success(result?.data?.message)

    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
  const columns = [
    {
      size: 100,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />,
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ renderedCellValue, row }) => `${row?.original?.country_code}-${row?.original?.mobile}`,
    },
    {
      accessorKey: 'action',
      enableSorting: false,
      header: 'Add Details',
      Cell: ({ renderedCellValue, row }) => {
        return (
          <>
            {
              <Tooltip title='Add Details'>
                <IconButton
                  onClick={() => {
                    setEntireRow([])
                    setId(row?.original?.id)
                    setEntireRow(row?.original)
                    toggleAddUserDrawer()
                  }}
                  color='error'
                  sx={{ fontSize: '18px' }}
                >
                  {' '}
                  <Icon icon='proicons:file-add' color='primary' />
                </IconButton>
              </Tooltip>
            }
          </>
        )
      }
    }
  ]


  const table = useMaterialReactTable({
    columns,
    data: mappedContact,
    enableColumnFilter: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    enableTopToolbar: false,
    muiLinearProgressProps: ({ isTopToolbar }) => ({
      color: 'primary',
      sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      value: isMappedContactFetching //show precise real progress value if you so desire
    }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'black',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'black !important'
        }
      }
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: { color: 'black', backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.3) },
    }),

    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [5, 10, 20, 25],
      showFirstButton: true,
      showLastButton: true
    },
    paginationDisplayMode: 'default',
    manualPagination: true,
    rowCount: mappedContactCount,
    enableRowOrdering: false,

    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isMappedContactFetching,
      isLoading: isMappedContactFetching,
      columnFilters: [],
      globalFilter: ''
    }
  });
  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12, }}>
        <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
          <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }} >
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

            />
          </Grid2>
          <Grid2 size={{ xs: 0, lg: 2, md: 2, sm: 0 }} >
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }} >
            <TextField
              labelId='demo-simple-select-labelw'
              id='demo-simple-select'
              fullWidth
              value={selectedId}
              select
              label='Select Events'
              size='small'
              onChange={e => setSelectedId(e?.target.value)}
            >
              <MenuItem value={''}>Select Events</MenuItem>
              {allEvents.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.event_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
          </Grid2>
        </Grid2>
        <Box p={4}>
          <MaterialReactTable table={table} />
        </Box>
      </Grid2>
      <Box p={4}>
        <AddFileDrawer key={id} open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} oid={selectedId} />
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
EventsContacts.acl = {
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
export default EventsContacts
