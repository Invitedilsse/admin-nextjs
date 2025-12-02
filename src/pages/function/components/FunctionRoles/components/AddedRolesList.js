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
  DialogActions
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
  getnotification,
  getPushTemplates,
  getRoleListByfunctionId,
  mapTemplatesHrs
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { LoadingButton } from '@mui/lab'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'

function AddedRolesList({}) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)

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
      accessorKey: 'role',
      header: 'Role',
      Cell: ({ row }) => row.original.role || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'mapped_access',
      header: 'Mapped Access',
      Cell: ({ row }) => {
        const date = new Date(row.original.mapped_access)
        return row.original.mapped_access && row.original.mapped_access.length ? row.original.mapped_access + ',' : '-'
      } // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      Cell: ({ row }) => row.original.notes || '-' // Event/Trans/Acc/Other title
    },

    {
      accessorKey: 'Action',
      header: 'action',
      Cell: ({ row }) =>
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        row.original.role === 'host' ? (
          <p>Host can't be edited</p>
        ) : (
          <>
            <Edit color='primary' onClick={() => onTemplateClick(row.original)} />

            <Delete
              color='error'
              onClick={() => {
                setdelId(row?.original?.id)
                setdOpen(true)
              }}
            />
          </>
        )
      // </Button>
    }
  ]

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

  const table = useMaterialReactTable({
    columns: generateColumns({
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

  const fetchData = async () => {
    try {
      const response = await apiGet(`${getRoleListByfunctionId}?functionId=${functionId}`)
      console.log('fetching role list:', response.data)
      setContactsFunctionAll(response.data.data || [])
    } catch (error) {
      console.error('Error fetching role list:', error)
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

            <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
              <Grid2 xs={12} md={6} lg={6}>
                <Button variant='contained' onClick={handleTemplateClick}>
                  Create Roles
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

      {/* Manual Drawer */}
      {/* <PushNotificationTargetDrawer
        open={manualDrawerOpen}
        toggle={() => setManualDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        templateId={selectedRow?.id}
      /> */}

      {/* Template Drawer */}
      <AddCustomMessageDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
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

export default AddedRolesList

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
