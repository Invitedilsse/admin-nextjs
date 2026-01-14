

import React, { useEffect, useRef, useState } from 'react'
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
  Select,
  MenuItem,
  TextField
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  baseURL,
  deleteEventListUrl,
  deletemapListUrl,
  eventListUrl,
  getnotification,
  mapTemplatesHrs,
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import AddEventTemplateDrawer from './addEventDrawers'



function ListEvent({ page }) {

  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [contactsFunctionCount, setcontactsFunctionCount] = useState([])

  // const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const { userData } = useSelector(state => state.auth)

  const [groupDropDrown, setgroupDropDrown] = useState([])

  console.log("userData.role------->",userData.role)






  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData,handleRestriction }) => [
    {
      accessorKey: 'event_name',
      header: 'Event Name',
      Cell: ({ row }) =>   row.original.event_name // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'action',
      Cell: ({ row }) => (
      <>
          {(userData.role === 'super-admin'|| userData.role === 'main') &&   row.original.id  ?  <Edit onClick={() => onTemplateClick(row.original)}/>:null}
          {/* {(userData.role === 'super-admin'|| userData.role === 'main') &&   row.original.id  ? <DeleteOutline color='error' sx={{ cursor: 'pointer' }} onClick={() => onDeleteData(row.original.id)} />:null} */}
        </>
      )
    }
  ]

  const handleToggleTime = async (id, field, value) => {
    try {
      let body = {
        id: id,
        // [field]: value,
        type: field,
        boolval: value
      }
      console.log('body', body, field, value)
      await apiPatch(mapTemplatesHrs, body)
      fetchData()
      toast.success('Updated successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }

  const handleManualClick = rowData => {
    // alert('Manual Clicked')
    setSelectedRow(rowData)
    setManualDrawerOpen(true) // opens drawer for push_notification_targets
  }

  const handleTemplateClick = rowData => {
    // alert('true')
    setSelectedRow(rowData)
    setTemplateDrawerOpen(true) // opens drawer for push_notification_templates
  }

  const handleDeleteData = async id => {
    setDelLoading(true)
    try {
      console.log('body')
      await apiDelete( deleteEventListUrl + `/${delId}`)
      fetchData()
      toast.success('Deleted successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      setDelLoading(false)
      setdOpen(false)
      setdelId('')
    }
  }

  const toggleDialog = id => {
    setdelId(id)
    setdOpen(true)
  }

  const table = useMaterialReactTable({
    columns: generateColumns({
      onToggleTime: handleToggleTime,
      // onManualClick: handleManualClick,
      onTemplateClick: handleTemplateClick,
      onDeleteData: toggleDialog,
    }),
    data: contactsFunctionAll,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['title'] }
    },
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: contactsFunctionCount,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false
  })

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }

  //need a getApi function to fetch the data from the api
  const fetchData = async () => {
    //fetch data from the api and set it to the state
    try {
      const response = await apiGet(
        `${eventListUrl}?search=&page=1&limit=200`
      )
      console.log('Push Notification Templates:', response.data)
      setContactsFunctionAll(response.data.data.data || [])
      setcontactsFunctionCount(response.data.data.data.total ||0)
      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 xs={12}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
            <Divider sx={{ m: '0 !important' }} />
            <CardContent />

            <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
              <Grid2 xs={12} md={6} lg={6}>
                <Button variant='contained' onClick={handleTemplateClick}>
                  Create Event
                </Button>
              </Grid2>
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

      <AddEventTemplateDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
        page={page}      
        /> 

      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ? ${delId}`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton loading={delLoading} varient='contained' onClick={handleDeleteData} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ListEvent
