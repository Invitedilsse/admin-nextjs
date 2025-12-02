// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
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

import AddFileDrawer from './components/ManageKeyTypeDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfKeyType } from 'src/store/adminMod'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

const KeyType = () => {
  // ** Hooks
  const theme = useTheme()
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })
  const handleClose = () => {
    setdOpen(false)
  }

  const { isKeyTypeFetching, allKeyType, keyTypeCount } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }

    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(keyTypeCount || 0)

  const getAllKeyTypes = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }

    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'created_at'}`
    dispatch(getListOfKeyType(queryParams))
  }

  useEffect(() => {
    getAllKeyTypes()
  }, [])

  useEffect(() => {
    getAllKeyTypes()
  }, [pagination?.pageIndex, pagination?.pageSize, rowCountState, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllKeyTypes()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (keyTypeCount !== undefined ? keyTypeCount : prevRowCountState))
  }, [keyTypeCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        id: delId
      }
      let url = `${baseURL}key-type/delete/${delId}`
      const result = await apiDelete(url, params)
      getAllKeyTypes()
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
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description'
    },
    {
      accessorKey: 'action',
      enableSorting: false,
      header: 'Action',
      Cell: ({ row }) => {
        return (
          <>
            <Tooltip title='Edit'>
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
    data: allKeyType,
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
      value: isKeyTypeFetching
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
    rowCount: keyTypeCount,
    enableRowOrdering: false,
    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isKeyTypeFetching,
      isLoading: isKeyTypeFetching,
      columnFilters: [],
      globalFilter: ''
    }
  });
  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12, }}>
        <Card
          sx={{
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <CardHeader
            title='Manage Key Type'
            sx={{
              '& .MuiTypography-root ': {
              }
            }}
          />
          <Divider sx={{ m: '0 !important' }} />
          <CardContent></CardContent>
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }} >
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Key Type'
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
            <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }} >
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
                Add Key Type
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
            <MaterialReactTable table={table} />
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
KeyType.acl = {
  action: 'read',
  subject: 'ukeyType'
}
export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Key Type Found
    </Stack>
  )
}
export default KeyType
