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
  Icon as MuiIcon,
  Typography
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Delete, Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut, getAccessToken } from 'src/hooks/axios'
import {
  assignedcallhistoryExcelList,
  assignedcallhistoryList,
  baseURL,
  deleteRoleList,
  getContactListCallers,
  getCustomPushTemplates,
  getFilterListWA,
  getFilterListWACaller,
  getListOfMappedContactTrigger,
  getnotification,
  getPushTemplates,
  getRoleListByfunctionId,
  getUpdatedWAStatus,
  mapTemplatesHrs,
  updateWAstatusCallers
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { LoadingButton } from '@mui/lab'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import PreviewWatemplateDrawer from './components/PreviewTemplate'
import CreateMessageRecordDrawerAdmin from './components/messageRecord'
// import WatemplateDrawer from './templateDrawer'
import { styled } from '@mui/material/styles'
import { makeStyles } from '@mui/styles'
import Icon from 'src/@core/components/icon'
import { convertBase64Blob } from 'src/utils/blobconverter'
import axios from 'axios'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))
function ListContactsCallers({RowData,callerId,toggle}) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [messageRecordDrawerOpen, setmessageRecordDrawerOpen] = useState(false)

  const [selectedRow, setSelectedRow] = useState(null)
  // const { functionId } = useSelector(state => state.adminMod)
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
      accessorKey: 'no_of_calls',
      header: 'Calls Done',
      Cell: ({ row }) => {
        // const date = new Date(row.original.mapped_access)
        return row.original.no_of_calls || '0'
      } // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'no_of_notifications',
      header: 'Notification Triggered',
      Cell: ({ row }) => row.original.no_of_notifications || '0' // Event/Trans/Acc/Other title
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
    // {
    //   accessorKey: 'Preview Template',
    //   header: 'Preview Template',
    //   Cell: ({ row }) => (
    //     // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
    //     // <Button variant='contained'>Trigger Message</Button>
    //     <Button variant='contained' onClick={() => handleTemplateClick(row.original)}
    //       style={{width:'200px'}}
    //     >
    //       Preview Message Template
    //     </Button>
    //   )
    //   // </Button>
    // },
            {
      accessorKey: 'View Message Record',
      header: 'View Message Record',
      Cell: ({ row }) => (
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        // <Button variant='contained'>Trigger Message</Button>
        <LoadingButton
          variant='contained'
          color='primary'
          // fullWidth
          style={{width:'200px'}}
          type='submit'
          loading={isSubmitting}
          disabled={!row.original?.id}
          onClick={() => {
            handleRecordClick(row.original)
            // setIsAdd(true)
          }}
        >
          View Message Record
        </LoadingButton>
      )
      // </Button>
    },
    {
      accessorKey: 'Check Status Update',
      header: 'Check Status Update',
      Cell: ({ row }) => (
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        // <Button variant='contained'>Trigger Message</Button>
        <LoadingButton
          variant='contained'
          color='primary'
          // fullWidth
          style={{width:'200px'}}
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
    setTemplateDrawerOpen(true) 
  }
    const handleRecordClick = rowData => {
    // alert('true')
    setSelectedRow(rowData)
    setmessageRecordDrawerOpen(true) 
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
        `${assignedcallhistoryList}?functionId=${RowData.id}&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&filterbyoid=${filval}&callerID=${callerId}&excel=false`
      )
      console.log('fetching role list:', response.data)

      setContactsFunctionAll(response.data.data || [])
      setTotalCount(response.data.totalcount || 0)
    } catch (error) {
      console.error('Error fetching role list:', error)
    } finally {
      setisdataloading(false)
    }
  }

  const fetchFilterData = async () => {
    try {
      setisdataloading(true)
      const response = await apiGet(`${getFilterListWACaller}?functionId=${RowData?.id}`)
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
      const response = await apiGet(`${updateWAstatusCallers}?callId=${id}`)
      console.log('fetching filter list:', response.data)
      fetchData()
      // setfilterList(response.data.data || [])
    } catch (error) {
      console.error('Error fetching filter list:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportFunctionReportContact = async () => {
    try {
      let filval = selectedColumns.length > 0 ? selectedColumns.map(d => d.key).join(',') : ''
      const queryParams = `functionId=${RowData.id}&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&filterbyoid=${filval}&callerID=${callerId}&excel=true`

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.get(`${assignedcallhistoryExcelList}?${queryParams}`, config)
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, result.data.fileName)
    } catch (err) {
      console.log('err inexcel report===>', err)
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
           <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
                <Header>
                  <Typography variant='h5'>{RowData.id !== '' || callerId !== '' ? ' ' : ' '}</Typography>
                  <IconButton
                    size='small'
                    onClick={toggle}
                    sx={{
                      p: '0.438rem',
                      borderRadius: 1,
                      color: 'text.primary',
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                      }
                    }}
                  >
                    <Icon icon='tabler:x' fontSize='1.125rem' />
                  </IconButton>
                </Header>
              </Box>
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
                          <MuiIcon icon='fluent:search-20-regular' width={20} height={20} />
                        </IconButton>
                      )
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}></Grid2>
              <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                <DataMultiSelect data={filterList} passList={setSelectedColumns} title="Event Filter" />
              </Grid2>
            </Grid2>
             <Grid2 xs={12} md={6} lg={6}>
                    <Button
                      //   fullWidth
                      onClick={() => {
                        exportFunctionReportContact()
                      }}
                      variant='contained'
                      color='primary'
                      sx={{ '& svg': { mr: 2 } }}
                    >
                      export Report list
                    </Button>
                  </Grid2>

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
      {/* <PreviewWatemplateDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        RowData={selectedRow}
        functionId={RowData?.id}
        // fetchData={fetchData()}
      /> */}
      <CreateMessageRecordDrawerAdmin
        open={messageRecordDrawerOpen}
        toggle={() => setmessageRecordDrawerOpen(false)}
        RowData={selectedRow}
        functionId={RowData?.id}
        // fetchData={fetchData()}
      />

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

export default ListContactsCallers


