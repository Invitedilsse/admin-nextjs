import React, { useEffect, useState } from 'react'
import { Checkbox, Button, Box, CircularProgress, CardContent, Divider, Card } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// import your drawers
// import PushNotificationTargetDrawer from './PushNotificationTargetDrawer'
// import PushNotificationTemplateDrawer from './PushNotificationTemplateDrawer'

// api hook
import { apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import { baseURL, getnotification, getPushTemplates, mapTemplatesHrs } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import PushNotificationTargetDrawer from './components/pushtargetTemplates'
import PushNotificationTemplateDrawer from './components/pushTempaltes'
import { useSelector } from 'react-redux'

function PushNotification({}) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length

  const generateColumns = ({ onToggleTime, onTemplateClick }) => [
    {
      accessorKey: 'ev_title',
      header: 'Title',
      Cell: ({ row }) => row.original.ev_title || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'send_24hr',
      header: '24hr',
      Cell: ({ row }) => (
        <Checkbox
          checked={row.original.send_24hr}
          onChange={e => onToggleTime(row.original.id, 'send_24hr', e.target.checked)}
        />
      )
    },
    {
      accessorKey: 'send_12hr',
      header: '12hr',
      Cell: ({ row }) => (
        <Checkbox
          checked={row.original.send_12hr}
          onChange={e => onToggleTime(row.original.id, 'send_12hr', e.target.checked)}
        />
      )
    },
    {
      accessorKey: 'send_8hr',
      header: '8hr',
      Cell: ({ row }) => (
        <Checkbox
          checked={row.original.send_8hr}
          onChange={e => onToggleTime(row.original.id, 'send_8hr', e.target.checked)}
        />
      )
    },
    {
      accessorKey: 'send_4hr',
      header: '4hr',
      Cell: ({ row }) => (
        <Checkbox
          checked={row.original.send_4hr}
          onChange={e => onToggleTime(row.original.id, 'send_4hr', e.target.checked)}
        />
      )
    },
    // {
    //   accessorKey: 'manual',
    //   header: 'Manual',
    //   Cell: ({ row }) => (
    //     <Button variant='outlined' startIcon={<Send />} onClick={() => onManualClick(row.original)}>
    //       Manual
    //     </Button>
    //   )
    // },
    {
      accessorKey: 'template',
      header: 'Template',
      Cell: ({ row }) => (
        <Button variant='contained' startIcon={<Edit />} onClick={() => onTemplateClick(row.original)}>
          Template
        </Button>
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

  const table = useMaterialReactTable({
    columns: generateColumns({
      onToggleTime: handleToggleTime,
      // onManualClick: handleManualClick,
      onTemplateClick: handleTemplateClick
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
      const response = await apiGet(`${getPushTemplates}/${functionId}`)
      console.log('Push Notification Templates:', response.data)
      setContactsFunctionAll(response.data.data || [])
      setTemplateDrawerOpen(false)
      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
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
            {/* <Button variant='contained' startIcon={<Edit />} onClick={() => triggerNotification()}>
              trigger notification
            </Button> */}
            <Box p={4}>
              <MaterialReactTable table={table} />
            </Box>
          </Card>
        </Grid2>
      </Grid2>

      {/* Manual Drawer */}
      {/* <PushNotificationTargetDrawer
        open={manualDrawerOpen}
        toggle={() => setManualDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        templateId={selectedRow?.id}
      /> */}

      {/* Template Drawer */}
      <PushNotificationTemplateDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchData={fetchData}
      />
    </>
  )
}

export default PushNotification

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

{
  /* <Box p={4}>
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
      </Dialog> */
}
