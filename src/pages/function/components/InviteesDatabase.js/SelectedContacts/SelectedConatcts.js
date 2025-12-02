// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
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
  alpha
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete, apiGet, getAccessToken } from 'src/hooks/axios'
// import AddFileDrawer from './components/ManageContactsDrawer'
import { baseURL, functionContactsReportexcel } from 'src/services/pathConst'
import { getListOfContactsNP, getListOfFunctionContacts, getListOfFunctionContactsSelected } from 'src/store/adminMod'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'
import convertBlob, { convertBase64Blob } from 'src/utils/blobconverter'
import axios from 'axios'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import { use } from 'react'
// import ManageContactsPlain from './components/ManageContactPlain'

const SelectdContacts = ({ isNewChangesContact, setisNewChangesContact }) => {
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

  const {
    isSelectedContactFunctionFetching,
    selectedContactsFunctionAll,
    selectedContactsFunctionCount,
    functionId,
    excelAutoSelected
  } = useSelector(state => state.adminMod)
  const [rowCountState, setRowCountState] = useState(selectedContactsFunctionCount || 0)

  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'desc'
    }
  ])

  const [selectedColumns, setSelectedColumns] = useState([])

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const getAllFunctionContacts = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
      // const queryParams = `group_id=&function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'contact_id'}`
    }
    const queryParams = `group_id=&function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'asc'}&sortBy=${'contact_function_id'}`
    dispatch(getListOfFunctionContactsSelected(queryParams))
    setisNewChangesContact(false)
  }

  useEffect(() => {
    getAllFunctionContacts()
  }, [])

  useEffect(() => {
    getAllFunctionContacts()
  }, [pagination?.pageIndex, pagination?.pageSize, rowCountState, searchText])

  useEffect(() => {
    console.log('isNewChangesContact---------> ss', isNewChangesContact)
    if (isNewChangesContact === true) {
      getAllFunctionContacts()
    }
  }, [isNewChangesContact])

  // useEffect(() => {
  //   if (addUserOpen === false) {
  //     getAllFunctionContacts()
  //   }
  // }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState =>
      selectedContactsFunctionCount !== undefined ? selectedContactsFunctionCount : prevRowCountState
    )
  }, [selectedContactsFunctionCount, setRowCountState])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const exportSeclectedExcelFun = async () => {
    try {
      let url = `${baseURL}invitee-contact/export-excel?function_id=${functionId}`
      console.log('url----->', url)

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.post(
        `${baseURL}invitee-contact/export-excel?function_id=${functionId}`,
        {
          columnNames: selectedColumns
        },
        config
      )
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, 'exportedcontactlist.xlsx')
      // alert('hi')
      getAllFunctionContacts()
      toast.success('excel file downloaded successfully')
    } catch (e) {
      toast.error(e)
    } finally {
    }
  }

  // const exportFunctionReportContact = async () => {
  //   try {
  //     const authToken = await getAccessToken()
  //     const config = {
  //       headers: {
  //         authorization: authToken ? `${authToken}` : null
  //       }
  //     }

  //     const result = await axios.get(`${functionContactsReportexcel}`, config)
  //     console.log('res----->', result)
  //     await convertBase64Blob(result.data.data, result.data.fileName)
  //   } catch (err) {
  //     console.log('err inexcel report===>', err)
  //   }
  // }
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

  useEffect(() => {
    console.log('exportSeclectedExcel---->', excelAutoSelected)

    if (excelAutoSelected) {
      console.log('exportSeclectedExcel---->', excelAutoSelected)
    }
  }, [excelAutoSelected])
  const columns = [
    {
      size: 80,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
    },
    {
      accessorKey: 'contact_function_id',
      enableColumnPinning: true,
      size: 200,
      header: 'Generated Function number',
      Cell: ({ row }) => `${row?.original?.contact_function_id ? row?.original?.contact_function_id : '-'}`
    },
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 ? row?.original?.contact_details[0]?.name : '-'}`
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.last_name ? row?.original?.contact_details[0]?.last_name : '-'}`
    },
    {
      accessorKey: 'family_name',
      header: 'Family Name',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.family_name ? row?.original?.contact_details[0]?.family_name : '-'}`
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 ? `${row?.original?.contact_details[0]?.country_code}-${row?.original?.contact_details[0]?.mobile} ` : '-'}`
    },
    {
      accessorKey: 'relation',
      header: 'Relation',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.relation ? row?.original?.contact_details[0]?.relation : '-'}`
    },

    // {
    //   accessorKey: 'additional_phone',
    //   header: 'Additional Phone',
    //   Cell: ({ renderedCellValue, row }) =>
    //     `${row?.original?.contact_details?.length > 0 ? `${row?.original?.contact_details[0]?.country_code}-${row?.original?.contact_details[0]?.mobile} ` : ''}`
    // },
    {
      accessorKey: 'address',
      header: 'Address',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.address ? row?.original?.contact_details[0]?.address : '-'}`
    },
    {
      accessorKey: 'area_1',
      header: 'Area 1',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.area_1 ? row?.original?.contact_details[0]?.area_1 : '-'}`
    },
    {
      accessorKey: 'area_2',
      header: 'Area 2',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.area_2 ? row?.original?.contact_details[0]?.area_2 : '-'}`
    },
    {
      accessorKey: 'city',
      header: 'City',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.city ? row?.original?.contact_details[0]?.city : '-'}`
    },
    {
      accessorKey: 'state',
      header: 'State',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.state ? row?.original?.contact_details[0]?.state : '-'}`
    },
    {
      accessorKey: 'pin_code',
      header: 'Pincode',
      Cell: ({ renderedCellValue, row }) =>
        `${row?.original?.contact_details?.length > 0 && row?.original?.contact_details[0]?.pin_code ? row?.original?.contact_details[0]?.pin_code : '-'}`
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
    data: selectedContactsFunctionAll,
    enableColumnFilter: false,
    // enableHiding: false,
    enableSorting: false, // 👈 disables sorting everywhere
    enableMultiSort: false,
    enablePinning: false,
    enableHiding: true,
    enableColumnActions: false,
    enableTopToolbar: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    muiLinearProgressProps: ({ isTopToolbar }) => ({
      color: 'primary',
      sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      value: isSelectedContactFunctionFetching //show precise real progress value if you so desire
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
    rowCount: selectedContactsFunctionCount,
    enableRowOrdering: false,

    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isSelectedContactFunctionFetching,
      isLoading: isSelectedContactFunctionFetching,
      columnFilters: [],
      globalFilter: ''
    }
  })
  useEffect(() => {
    console.log('selectedColumns', selectedColumns)
  }, [selectedColumns])
  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12 }}>
        <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
          <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
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
                }
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}></Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
            <ColumnMultiSelect table={table} passList={setSelectedColumns} />
          </Grid2>
          <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
            <Button
              fullWidth
              onClick={() => {
                exportSeclectedExcelFun()
              }}
              variant='contained'
              color='primary'
              sx={{ '& svg': { mr: 2 } }}
            >
              export contact
            </Button>
          </Grid2>
        </Grid2>
        <Box p={4}>
          <MaterialReactTable table={table} />
        </Box>
      </Grid2>

      {/* <Box p={4}>
        <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
      </Box> */}

      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ? All Mapped Data Will BE Erased For This Contact.`}</DialogContentText>
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
SelectdContacts.acl = {
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
export default SelectdContacts
