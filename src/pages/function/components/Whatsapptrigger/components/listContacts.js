import React, { useEffect, useState } from 'react'
import {
  Checkbox,
  Button,
  Box,
  CircularProgress,
  CardContent,
  Divider,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Icon
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Delete, Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  baseURL,
  deleteRoleList,
  getCustomPushTemplates,
  getFilterListWA,
  getListOfMappedContactTrigger,
  getnotification,
  getPushTemplates,
  getRoleListByfunctionId,
  getUpdatedWAStatus,
  mapTemplatesHrs
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { LoadingButton } from '@mui/lab'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import WatemplateDrawer from './templateDrawer'

function ListContacts({}) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [filterList, setfilterList] = useState([])

  const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [totalcount, setTotalCount] = useState(0)
  const [rowCountState, setRowCountState] = useState(totalcount || 0)
  const [searchText, setSearchText] = useState('')
  const [isdataloading, setisdataloading] = useState(false)
  const [tempSearchText, setTempSearchText] = useState('')
  const [selectedColumns, setSelectedColumns] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    setdelId('')
    setdOpen(false)
  }

  const generateColumns = ({ onToggleTime, onTemplateClick }) => [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) => row.original.name || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile Number',
      Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'title',
      header: 'Event title',
      Cell: ({ row }) => row.original.title || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'no_calls_done',
      header: 'Calls Done',
      Cell: ({ row }) => {
        // const date = new Date(row.original.mapped_access)
        return row.original.no_calls_done || '0'
      } // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'no_noti_triggered',
      header: 'Notification Triggered',
      Cell: ({ row }) => row.original.no_noti_triggered || '0' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'message_status',
      header: 'Message Status',
      Cell: ({ row }) => row.original.message_status || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'message_retry',
      header: 'Message Retry',
      Cell: ({ row }) => (row.original.message_retry ? 'Please Try Again' : '-') // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'action',
      Cell: ({ row }) => (
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        // <Button variant='contained'>Trigger Message</Button>
        <Button variant='contained' onClick={() => handleTemplateClick(row.original)}>
          Create Template
        </Button>
      )
      // </Button>
    },
    {
      accessorKey: 'Action',
      header: 'action',
      Cell: ({ row }) => (
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        // <Button variant='contained'>Trigger Message</Button>
        <LoadingButton
          variant='contained'
          color='primary'
          fullWidth
          type='submit'
          loading={isSubmitting}
          disabled={!row.original?.id}
          onClick={() => {
            getUpdatedWAStatusFun(row.original.id)
            // setIsAdd(true)
          }}
        >
          update message status
        </LoadingButton>
      )
      // </Button>
    }
  ]

  //   const handleTemplateClick = rowData => {
  //   // alert('true')
  //   setSelectedRow(rowData)
  //   setTemplateDrawerOpen(true) // opens drawer for push_notification_templates
  // }

  const deletelist = async () => {
    try {
      setDelLoading(true)
      console.log('innnnn---->', delId)

      if (delId) {
        console.log('innnnn---->', delId)

        await apiDelete(`${deleteRoleList}/${delId}`)
        fetchData()
        toast.success('Deleted successfully')
      }
    } catch (err) {
      console.log(err)
      toast.error('Delete failed')
    } finally {
      //   setdOpen(false)
      setDelLoading(false)
      handleClose()
    }
  }

  const handleTemplateClick = rowData => {
    // alert('true')
    setSelectedRow(rowData)
    setTemplateDrawerOpen(true) // opens drawer for push_notification_templates
  }

  useEffect(() => {
    console.log('contactsFunctionAll------>', contactsFunctionAll)
  }, [contactsFunctionAll])
  const table = useMaterialReactTable({
    columns: generateColumns({ onTemplateClick: handleTemplateClick }),
    data: contactsFunctionAll,
    manualPagination: true,
    rowCount: totalcount, // ✅ backend total count
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    enableTopToolbar: false,
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [5, 10, 20, 25],
      showFirstButton: true,
      showLastButton: true
    }
  })

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }

  const fetchData = async () => {
    try {
      setisdataloading(true)
      let filval = selectedColumns.length > 0 ? selectedColumns.map(d => d.key).join(',') : ''
      const response = await apiGet(
        `${getListOfMappedContactTrigger}?functionId=${functionId}&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&filterbyoid=${filval}`
      )
      console.log('fetching role list:', response.data)

      setContactsFunctionAll(response.data.data.data || [])
      setTotalCount(response.data.data.totalcount || 0)
    } catch (error) {
      console.error('Error fetching role list:', error)
    } finally {
      setisdataloading(false)
    }
  }

  const fetchFilterData = async () => {
    try {
      setisdataloading(true)
      const response = await apiGet(`${getFilterListWA}?functionId=${functionId}`)
      console.log('fetching filter list:', response.data)

      setfilterList(response.data.data || [])
    } catch (error) {
      console.error('Error fetching filter list:', error)
    } finally {
      setisdataloading(false)
    }
  }

  const getUpdatedWAStatusFun = async id => {
    try {
      setIsSubmitting(true)
      const response = await apiGet(`${getUpdatedWAStatus}?callId=${id}`)
      console.log('fetching filter list:', response.data)
      fetchData()
      // setfilterList(response.data.data || [])
    } catch (error) {
      console.error('Error fetching filter list:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  useEffect(() => {
    fetchFilterData()
  }, [templateDrawerOpen])

  useEffect(() => {
    fetchData()
  }, [pagination?.pageIndex, pagination?.pageSize, searchText, selectedColumns, templateDrawerOpen])

  // useEffect(() => {
  //   console.log('selectedColumns', selectedColumns)
  // }, [selectedColumns])

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 xs={12}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
            <Divider sx={{ m: '0 !important' }} />
            <CardContent />
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
                <DataMultiSelect data={filterList} passList={setSelectedColumns} />
              </Grid2>
              {/* <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
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
                    </Grid2> */}
            </Grid2>
            {/* <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
              <Grid2 xs={12} md={6} lg={6}>
                <Button variant='contained' onClick={handleTemplateClick}>
                  Create Roles
                </Button>
              </Grid2>
            </Grid2> */}

            <Box p={4} sx={{ width: '100%' }}>
              <MaterialReactTable
                table={table}
                muiTableContainerProps={{ sx: { width: '100%' } }}
                muiTableBodyCellProps={{ sx: { whiteSpace: 'nowrap' } }}
              />
            </Box>
          </Card>
        </Grid2>
      </Grid2>
      <WatemplateDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        RowData={selectedRow}
        // fetchData={fetchData()}
      />
      {/* Manual Drawer */}
      {/* <PushNotificationTargetDrawer
        open={manualDrawerOpen}
        toggle={() => setManualDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        templateId={selectedRow?.id}
      /> */}

      {/* Template Drawer */}
      {/* <AddCustomMessageDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
      /> */}

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
          <LoadingButton loading={delLoading} varient='contained' onClick={deletelist} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ListContacts

// {false ? (
//   <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
//     {' '}
//     <CircularProgress />
//   </Box>
// ) : eventDetailsAll?.length > 0 ? (
// ) : (
//   eventDetailsAll?.length > 0 &&
//   !isEventDetailsFetching && (
//     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
//       <Typography variant='h6' color='textSecondary'>
//         No Event(s) Found
//       </Typography>
//     </Box>
//   )
// )}

// {
//    <Box p={4}>
//         <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
//       </Box>

// }
