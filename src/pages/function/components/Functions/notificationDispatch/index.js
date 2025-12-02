// ** React Imports
import { useContext, useEffect, useState } from 'react'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Avatar,
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
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageNotificationsDispatchDrawer'
import { toggleSnackBar } from 'src/store/auth'
import { baseURL } from 'src/services/pathConst'
import {  getListOfNotificationDispatch } from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'

const NotificationsDispatch = ({ isOpen }) => {
  // ** Hooks
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClickOpen = () => {
    setdOpen(true)
  }

  const handleClose = () => {
    setdOpen(false)
  }
  const { isNotificationsDispatchFetching, allNotificationsDispatch, notificationsDispatchCount, functionId } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }

    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(notificationsDispatchCount || 0)

  const [sortModel, setSortModel] = useState([
    {
      field: 'scheduled_date_time',
      sort: 'desc'
    }
  ])
  const getAllFirms = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }

    const queryParams = `function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel.length > 0 ? sortModel[0]?.sort : 'desc'}&sortBy=${sortModel.length > 0 ? sortModel[0]?.field : 'scheduled_date_time'}`
    dispatch(getListOfNotificationDispatch(queryParams))
  }

  useEffect(() => {
    console.log('ca')
    if (addUserOpen === false && isOpen === true) {
      getAllFirms()
    }
  }, [searchText, addUserOpen, isOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (notificationsDispatchCount !== undefined ? notificationsDispatchCount : prevRowCountState))
  }, [notificationsDispatchCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        id: delId
      }

      let url = `${baseURL}notification-dispatch/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllFirms()
      toast.success(result?.data?.message)
    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }

  const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

  const columns = [
    {
      size: 100,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />,
    },

    {
      accessorKey: 'banner_image', //access nested data with dot notation
      header: 'Banner Image',
      Cell: ({ renderedCellValue, row }) => (
        <>
          <Avatar
            src={`${row?.original?.banner_image && row?.original?.banner_image?.length > 0 && row?.original?.banner_image[0]?.url || 'NA'}`}
            alt={capitalize(row?.original?.title)}
            sx={{
              mt: 2,
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
      header: 'Title',

    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'scheduled_date_time',
      header: 'Date Time',
      accessorFn: (row) => `${moment(row.scheduled_date_time).format('DD-MM-YYYY hh:mm:ss A')} `,
    },

    {
      accessorKey: 'city',
      header: 'Actions',
      enableSorting: false,
      Cell: ({ renderedCellValue, row }) => {
        console.log(row)
        console.log(renderedCellValue)

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
    data: allNotificationsDispatch,
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
      value: isNotificationsDispatchFetching //show precise real progress value if you so desire
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
    rowCount: notificationsDispatchCount,
    enableRowOrdering: false,

    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isNotificationsDispatchFetching,
      isLoading: isNotificationsDispatchFetching,
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
                placeholder='Search Reminder'
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
                Add Reminder
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
            <MaterialReactTable table={table} />
            {false && <DataGrid
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
                  '& .MuiDataGrid-row--borderBottom': {
                    background: 'none !important',
                  },
                  '& .MuiButtonBase-root.MuiIconButton-root ': {
                    color: '#fff'
                  },
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
                  color: 'grey !important',
                  mt: 1

                },
                '& .MuiTablePagination-select': {
                  color: 'grey !important',
                  mt: 1

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
                  border: `.25px solid grey`
                }
              }}
              autoHeight
              rowHeight={62}
              rows={allNotificationsDispatch}
              columns={listColumns}
              loading={isNotificationsDispatchFetching}
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
              rowReordering
              onRowOrderChange={(e) => console.log(e)}
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
      No Reminders Found
    </Stack>
  )
}
export default NotificationsDispatch
