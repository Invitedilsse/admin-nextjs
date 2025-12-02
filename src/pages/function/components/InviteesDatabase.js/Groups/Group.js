// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  alpha,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageGroupsDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfFunctionContacts, getListOfFunctionGroups } from 'src/store/adminMod'
import { useSettings } from 'src/@core/hooks/useSettings'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'

const Groups = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)

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

  const { isGroupsFunctionFetching, groupsFunctionAll, groupsFunctionCount, functionId } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }

    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(groupsFunctionCount || 0)

  const getAllFunctionContacts = () => {
    const queryParams = `group_id=&function_id=${functionId}&limit=${1000}&offset=${0}&search_string=${""}&sortDir=desc&sortBy=contact_id`
    dispatch(getListOfFunctionContacts(queryParams))
  }
  const getAllFunctionGroups = () => {

    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }
    const queryParams = `function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'user_group_id'}`
    dispatch(getListOfFunctionGroups(queryParams))
  }

  useEffect(() => {
    getAllFunctionGroups()
  }, [])

  useEffect(() => {
    getAllFunctionGroups()
  }, [pagination?.pageIndex, , pagination?.pageSize, rowCountState, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllFunctionGroups()
      getAllFunctionContacts()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (groupsFunctionCount !== undefined ? groupsFunctionCount : prevRowCountState))
  }, [groupsFunctionCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        group_id: delId
      }

      let url = `${baseURL}invitee-group/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllFunctionGroups()
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
      size: 80,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />,
    },
    {
      accessorKey: 'title',
      header: 'Name',
      Cell: ({ renderedCellValue, row }) => `${row?.original?.user_group_details?.length > 0 ? row?.original?.user_group_details[0]?.title : ''}`,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      Cell: ({ renderedCellValue, row }) => `${row?.original?.user_group_details?.length > 0 ? `${row?.original?.user_group_details[0]?.description} ` : ''}`,
    },
    {
      accessorKey: 'count',
      header: 'Total Contacts',
      Cell: ({ row }) => `${row?.original?.user_group_details && row?.original?.user_group_details?.length > 0 ? row?.original?.user_group_details[0]?.contact_id.length : 0}`
    },
    {
      accessorKey: 'action',
      enableSorting: false,
      header: 'Action',
      Cell: ({ renderedCellValue, row }) => {
        return (
          <>
            {
              <Tooltip title='Delete'>
                <IconButton
                  onClick={() => {
                    setdelId(row?.original?.id)
                    setdOpen(true)
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


  const table = useMaterialReactTable({
    columns,
    data: groupsFunctionAll,
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
      value: isGroupsFunctionFetching //show precise real progress value if you so desire
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
    rowCount: groupsFunctionCount,
    enableRowOrdering: false,

    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isGroupsFunctionFetching,
      isLoading: isGroupsFunctionFetching,
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
              placeholder='Search Groups'
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
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
            <Button
              fullWidth
              onClick={() => {
                setEid('')
                setEntireRow([])
                setEntireRow([])
                toggleAddUserDrawer()
              }}
              variant='contained'
              color='primary'
              sx={{ '& svg': { mr: 2 } }}
            >
              Choose Groups
            </Button>
          </Grid2>
        </Grid2>
        <Box p={4}>
          <MaterialReactTable table={table} />
        </Box>
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
      No Groups Found
    </Stack>
  )
}
export default Groups
