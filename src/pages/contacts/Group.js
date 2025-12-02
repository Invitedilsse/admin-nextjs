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
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageGroupsDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfGroups } from 'src/store/adminMod'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from '../function/components/common/SerialNumberGenerator'

const Group = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const handleClose = () => {
    setdOpen(false)
  }

  const { isGroupdFetching, allGroups, groupsCount } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(groupsCount || 0)

  const getGroupData = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }
    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'created_at'}`
    dispatch(getListOfGroups(queryParams))
  }

  useEffect(() => {
    getGroupData()
  }, [])

  useEffect(() => {
    getGroupData()
  }, [pagination?.pageIndex, pagination?.pageSize, rowCountState, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getGroupData()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (groupsCount !== undefined ? groupsCount : prevRowCountState))
  }, [groupsCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        group_id: delId
      }
      let url = `${baseURL}user-group/delete/${delId}`

      const result = await apiDelete(url, params)
      getGroupData()
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
      accessorKey: 'title',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description'
    },
    {
      accessorKey: 'count',
      header: 'Total Contacts',
      Cell: ({ row }) => `${row?.original?.contact_id?.length || 0}`
    },
    {
      accessorKey: 'action',
      enableSorting: false,
      header: 'Action',
      Cell: ({ renderedCellValue, row }) => {
        return (
          <>
            <Tooltip title='Edit Group'>
              <IconButton
                onClick={() => {
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
              <Tooltip title='Delete Group'>
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
    data: allGroups,
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
      sx: { display: isTopToolbar ? 'block' : 'none' },
      value: isGroupdFetching
    }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'white',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'white !important'
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
    rowCount: groupsCount,
    enableRowOrdering: false,
    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isGroupdFetching,
      isLoading: isGroupdFetching,
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
              Create Group
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
Group.acl = {
  action: 'read',
  subject: 'ucontacts'
}
export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Groups Found
    </Stack>
  )
}
export default Group
