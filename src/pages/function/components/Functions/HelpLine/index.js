// ** React Imports
import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
  Stack,
  TextField,
  Tooltip,
  alpha,
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete } from 'src/hooks/axios'
import SideBarHelpline from './components/ManageHelpLineDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfHelpline } from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'

const HelpLine = ({ isOpen }) => {
  // ** Hooks
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClose = () => {
    setdOpen(false)
  }
  const { isHelplinesFetching, allHelplines, helplinessCount, functionId } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }

    setAddUserOpen(!addUserOpen)
  }

  const getAllHelpLineNumbers = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }

    const queryParams = `function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'name'}`
    dispatch(getListOfHelpline(queryParams))
  }

  useEffect(() => {
    if (addUserOpen === false && isOpen === true) {
      getAllHelpLineNumbers()
    }
  }, [searchText, addUserOpen, isOpen, pagination?.pageIndex, pagination?.pageSize])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        id: delId
      }
      let url = `${baseURL}help-line/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllHelpLineNumbers()
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
      accessorKey: 'number',
      header: 'Number',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'designation',
      header: 'Description',
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      enableSorting: false,
      Cell: ({ renderedCellValue, row }) => {
        return (<>
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
        </>)
      }
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: allHelplines,
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
      value: isHelplinesFetching
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
    rowCount: helplinessCount,
    enableRowOrdering: false,
    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isHelplinesFetching,
      isLoading: isHelplinesFetching,
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
          <CardContent></CardContent>
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }} >
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Helpline'
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
                Add Helpline
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
            <MaterialReactTable table={table} />
          </Box>
        </Card>
      </Grid2>
      <Box p={4}>
        <SideBarHelpline open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
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
      No Helpline Found
    </Stack>
  )
}
export default HelpLine
