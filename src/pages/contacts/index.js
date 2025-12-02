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
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Tab,
  TextField,
  Tooltip,
  alpha
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete, apiPatch, getAccessToken } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageContactsDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfContacts } from 'src/store/adminMod'
import toast from 'react-hot-toast'
import Group from './Group'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from '../function/components/common/SerialNumberGenerator'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import { convertBase64Blob } from 'src/utils/blobconverter'
import axios from 'axios'

const Contacts = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [tabValue, setTabValue] = useState('1')
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })
  const [searchText, setSearchText] = useState('')
  const [deltype, setDelType] = useState('single')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState([])

  const [rowSelection, setRowSelection] = useState({})
  const [rowSelectionUpdate, setRowSelectionUpdate] = useState({})
  const [selectedContacts, setSelectedContacts] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  const handleClose = () => {
    setDelType('single')
    setdOpen(false)
  }

  const { isContactsFetching, allContacts, contactsCount } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const [rowCountState, setRowCountState] = useState(contactsCount || 0)

  const getContactData = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }
    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'created_at'}`
    dispatch(getListOfContacts(queryParams))
  }

  useEffect(() => {
    getContactData()
  }, [])

  useEffect(() => {
    getContactData()
  }, [pagination?.pageIndex, pagination?.pageSize, rowCountState, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getContactData()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (contactsCount !== undefined ? contactsCount : prevRowCountState))
  }, [contactsCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        contact_id: delId
      }

      let url = `${baseURL}contacts/delete/${delId}`

      const result = await apiDelete(url, params)
      getContactData()
      toast.success(result?.data?.message)
    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }

  const deleteAllSelected = async () => {
    try {
      setDelLoading(true)
      const body = {
        ids: selectedIds
      }
      let url = `${baseURL}contacts/deleteAll`
      const result = await apiPatch(url, body)
      getContactData()
      toast.success(result?.data?.message)
    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }

  const exportSeclectedExcelFun = async () => {
    try {
      // let url = `${baseURL}invitee-contact/export-excel?function_id=${functionId}`
      // console.log('url----->', url)

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.post(
        `${baseURL}contacts/export-excel-all`,
        {
          // columnNames: selectedColumns
          columnNames: selectedColumns,
          contactIds: selectedIds
        },
        config
      )
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, 'contact-list.xlsx')
      toast.success('excel file downloaded successfully')
    } catch (e) {
      console.log('res----->', e)
      toast.error(e)
    } finally {
    }
  }

  const columns = [
    {
      size: 100,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
    },
    {
      accessorKey: 'name',
      header: 'Name'
    },
    // {
    //   accessorKey: 'mobile',
    //   header: 'Mobile',
    //   Cell: ({ renderedCellValue, row }) => `${row?.original?.country_code}-${row?.original?.mobile}`
    // },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
      Cell: ({ row }) => `${row?.original?.last_name ? row?.original?.last_name : '-'}`
    },
    {
      accessorKey: 'family_name',
      header: 'Family Name',
      Cell: ({ row }) => `${row?.original?.family_name ? row?.original?.family_name : '-'}`
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ row }) =>
        `${
          row?.original?.country_code && row?.original?.mobile
            ? `${row?.original?.country_code}-${row?.original?.mobile}`
            : '-'
        }`
    },
    {
      accessorKey: 'relation',
      header: 'Relation',
      Cell: ({ row }) => `${row?.original?.relation ? row?.original?.relation : '-'}`
    },
    {
      accessorKey: 'address',
      header: 'Address',
      Cell: ({ row }) => `${row?.original?.address ? row?.original?.address : '-'}`
    },
    {
      accessorKey: 'area_1',
      header: 'Area 1',
      Cell: ({ row }) => `${row?.original?.area_1 ? row?.original?.area_1 : '-'}`
    },
    {
      accessorKey: 'area_2',
      header: 'Area 2',
      Cell: ({ row }) => `${row?.original?.area_2 ? row?.original?.area_2 : '-'}`
    },
    {
      accessorKey: 'city',
      header: 'City',
      Cell: ({ row }) => `${row?.original?.city ? row?.original?.city : '-'}`
    },
    {
      accessorKey: 'state',
      header: 'State',
      Cell: ({ row }) => `${row?.original?.state ? row?.original?.state : '-'}`
    },
    {
      accessorKey: 'pin_code',
      header: 'Pincode',
      Cell: ({ row }) => `${row?.original?.pin_code ? row?.original?.pin_code : '-'}`
    },
    {
      accessorKey: 'action',
      enableSorting: false,
      header: 'Action',
      Cell: ({ renderedCellValue, row }) => {
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
                    setDelType('single')
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

  // const table = useMaterialReactTable({
  //   columns,
  //   data: allContacts,
  //   enableRowSelection: true,
  //   enableSelectAll: true,
  //   enableColumnFilter: false,
  //   enableHiding: true,
  //   enablePinning: false,
  //   enableColumnDragging: false,
  //   enableColumnOrdering: false,
  //   enableFullScreenToggle: false,
  //   enableDensityToggle: false,
  //   enableColumnActions: false,
  //   enableTopToolbar: false,
  //   muiLinearProgressProps: ({ isTopToolbar }) => ({
  //     color: 'primary',
  //     sx: { display: isTopToolbar ? 'block' : 'none' },
  //     value: isContactsFetching
  //   }),
  //   muiTableHeadRowProps: ({ isTopToolbar }) => ({
  //     sx: {
  //       color: 'white',
  //       '& .MuiButtonBase-root.Mui-active svg': {
  //         color: 'white !important'
  //       }
  //     }
  //   }),
  //   muiTableHeadCellProps: ({ isTopToolbar }) => ({
  //     color: 'primary',
  //     backgroundColor: 'primary',
  //     sx: { color: 'black', backgroundColor: theme => alpha(theme.palette.secondary.main, 0.3) }
  //   }),
  //   muiPaginationProps: {
  //     color: 'primary',
  //     shape: 'rounded',
  //     showRowsPerPage: true,
  //     variant: 'outlined',
  //     rowsPerPageOptions: [5, 10, 20, 25],
  //     showFirstButton: true,
  //     showLastButton: true
  //   },
  //   paginationDisplayMode: 'default',
  //   manualPagination: true,
  //   rowCount: contactsCount,
  //   enableRowOrdering: false,
  //   onPaginationChange: setPagination,
  //   state: {
  //     pagination,
  //     showProgressBars: isContactsFetching,
  //     isLoading: isContactsFetching,
  //     columnFilters: [],
  //     globalFilter: ''
  //   },
  //   onRowSelectionChange: () => {
  //     const selectedIds = table.getSelectedRowModel().flatRows.map(row => row.original.id)

  //     setSelectedIds(selectedIds)
  //   }
  // })

  const table = useMaterialReactTable({
    columns,
    data: allContacts,
    enableRowSelection: true,
    enableSelectAll: true,
    enableColumnFilter: false,
    enableHiding: true,
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
      value: isContactsFetching
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
      sx: { color: 'black', backgroundColor: theme => alpha(theme.palette.secondary.main, 0.3) }
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
    rowCount: contactsCount,
    enableRowOrdering: false,
    onPaginationChange: setPagination,

    // ✅ This is the key part:
    state: {
      pagination,
      showProgressBars: isContactsFetching,
      isLoading: isContactsFetching,
      columnFilters: [],
      globalFilter: '',
      rowSelection
    },
    onRowSelectionChange: setRowSelection
  })

  useEffect(() => {
    const ids = table.getSelectedRowModel().flatRows.map(row => row.original.id)
    setSelectedIds(ids)
  }, [rowSelection, table])

  // useEffect(() => {
  //   var temp = []
  //   for (let i = 0; i < table.getSelectedRowModel().rows.length; i++) {
  //     temp.push(table.getSelectedRowModel()?.rows[i].original?.id)
  //   }
  //   setSelectedContacts(temp)
  // }, [rowSelection])
  console.log('selectedIds------>', selectedIds)

  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12 }}>
        <Card
          sx={{
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <CardHeader
            title='Contacts & Groups'
            sx={{
              '& .MuiTypography-root ': {}
            }}
          />
          <Divider sx={{ m: '0 !important' }} />

          <CardContent></CardContent>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleTabChange} aria-label='lab API tabs example' variant='fullWidth'>
                <Tab label='Contacts' value='1' />
                <Tab label='Groups' value='2' />
              </TabList>
            </Box>
            <TabPanel value='1'>
              <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'between'}>
                <Grid2 size={{ xs: 12, lg: 4, md: 6, sm: 12 }}>
                  <TextField
                    variant='outlined'
                    size='small'
                    value={tempSearchText}
                    fullWidth
                    sx={{ mr: 4 }}
                    placeholder='Search Master Database'
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
                      }
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                  <ColumnMultiSelect table={table} passList={setSelectedColumns} />
                </Grid2>
                {/* <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }} >
                </Grid2> */}
                <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
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
                    Add Contact
                  </Button>
                </Grid2>
                <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                  <Button
                    // disabled={selectedIds.length <= 0}
                    fullWidth
                    onClick={() => {
                      console.log('selectedIds---> delete all', selectedIds)
                      // deleteAllSelected()
                      setdOpen(true)
                      setDelType('multiple')
                    }}
                    variant='contained'
                    color='error'
                    sx={{ '& svg': { mr: 2 } }}
                  >
                    {selectedIds.length == 0 ? 'Delete All' : 'Delete Selected'}
                  </Button>
                </Grid2>

                <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                  <Button
                    // disabled={selectedIds.length <= 0}
                    fullWidth
                    onClick={() => {
                      console.log('selectedIds---> delete all', selectedIds)
                      exportSeclectedExcelFun()
                    }}
                    variant='contained'
                    color='primary'
                    sx={{ '& svg': { mr: 2 } }}
                  >
                    {selectedIds.length <= 0 ? 'Export All' : 'Export Selected'}
                  </Button>
                </Grid2>
              </Grid2>
              <Box p={4}>
                <MaterialReactTable table={table} />
              </Box>
            </TabPanel>
            <TabPanel value='2'>
              <Group />
            </TabPanel>
          </TabContext>
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
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ${deltype === 'multiple' && 'all'}? All Mapped Data Will BE Erased For This Contact.`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton
            loading={delLoading}
            varient='contained'
            onClick={deltype === 'multiple' ? deleteAllSelected : deleteEvent}
            sx={{ color: 'red' }}
          >
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
