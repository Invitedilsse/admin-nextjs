

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
  Select,
  MenuItem,
  CardHeader,
  TextField,
  IconButton,
  Icon
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send, Visibility } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  assignedFunctionList,
  assignFunctionContactList,
    assignFunctionList,
  baseURL,
  deleteCustomPushTemplates,
  deleteCustomPushTemplatesAllUsers,
  deleteCustomPushTemplatesFunUsers,
  getCustomPushAdminTemplates,
  getCustomPushAdminTemplatesFun,
  getCustomPushTemplates,
  getnotification,
  getPushTemplates,
  mapTemplatesHrs,
  postCustomPushAdminTemplatesFun,
  userListUrl
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
import AssignContactsDrawer from './components/ManageAssignDrawer'
import AssignedFunctionDrawer from './components/ManageAssignDrawer'
// import AddUserListDrawerAdmin from './addUsersDrawer'

function ListUsers({ page }) {
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  // const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
const [addUserOpen, setAddUserOpen] = useState(false)
  const { userData } = useSelector(state => state.auth)




  const toggleAddUserDrawer = () => {
    // if (addUserOpen) {
    //   setEid('')
    // }
    setAddUserOpen(!addUserOpen)
  }



  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData,handleRestriction }) => [
    {
      accessorKey: 'function_name',
      header: 'Function Name',
      Cell: ({ row }) =>   row.original.function_name || '-'
    },
    {
      accessorKey: 'host_name',
      header: 'Host Name',
      Cell: ({ row }) => row.original.host_name || '-' // Event/Trans/Acc/Other title
    },
    //     {
    //   accessorKey: 'name',
    //   header: 'Created By',
    //   Cell: ({ row }) => row.original.name || '-' // Event/Trans/Acc/Other title
    // },
    // {
    //   accessorKey: 'mobile',
    //   header: 'Mobile',
    //   Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    // },
    // {
    //   accessorKey: 'role',
    //   header: 'role',
    //   Cell: ({ row }) => row.original.role || '-' // Event/Trans/Acc/Other title
    // },
    {
      accessorKey: 'Action',
      header: 'View',
      Cell: ({ row }) => (
        <>
          {/* <Button variant='contained' onClick={() => onTemplateClick(row.original)}> */}
          {/* {row.original.role === 'main' && userData.role === 'super-admin' ? null : }
           */}
             {/* <Edit onClick={() => onTemplateClick(row.original)}/> */}
              <Visibility
                onClick={() => onTemplateClick(row.original)}
                style={{ cursor: "pointer", marginRight: 8 }}
              />
          {/* <DeleteOutline color='error' sx={{ cursor: 'pointer' }} onClick={() => onDeleteData(row.original.id)} /> */}
          {/* </Button> */}
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
    toggleAddUserDrawer()
    // setTemplateDrawerOpen(true)
  }

  const handleDeleteData = async id => {
    setDelLoading(true)
    try {
      console.log('body')
      await apiDelete(
        page === 'allusers'
          ? deleteCustomPushTemplatesAllUsers + `/${delId}`
          : deleteCustomPushTemplatesFunUsers + `/${delId}`
      )
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

  const handleRestriction = async (id, field, value) => {
    // setDelLoading(true)
    try {
      console.log('body',id, field, value)
      await apiGet(`${baseURL}admin/restrict-user?userId=${id}&restrict=${value}`)
      fetchData()
      toast.success('Restricte successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      // setDelLoading(false)
    }
  }

  const table = useMaterialReactTable({
    columns: generateColumns({
      onToggleTime: handleToggleTime,
      // onManualClick: handleManualClick,
      onTemplateClick: handleTemplateClick,
      onDeleteData: toggleDialog,
      handleRestriction:handleRestriction
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
        `${assignedFunctionList}?page=1&limit=10`
      )
      console.log('Push Notification Templates:', response.data)
      setContactsFunctionAll(response.data.data || [])
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
    // fetchConatctData()
  }, [])

  return (
    <>
      <Grid2 container spacing={6}>
        {!addUserOpen && (
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
            }}
          >
            <CardHeader
              title='Assign Function(s)'
              sx={{
                '& .MuiTypography-root ': {}
              }}
            />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent></CardContent>
            <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
              <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
                <TextField
                  variant='outlined'
                  size='small'
                  // value={tempSearchText}
                  fullWidth
                  sx={{ mr: 4 }}
                  placeholder='Search Function'
                  onChange={e => {
                    // handleDebouncedSearch(e.target.value)
                  }}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault()
                      // setSearchText(tempSearchText)
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
              <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }}></Grid2>
              {/* <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                <Button
                  fullWidth
                  onClick={() => {
                    dispatch(handleFunctionId(''))
                    dispatch(handleFunction([]))
                    setEid('')
                    setEntireRow([])
                    setEntireRow([])
                    toggleAddUserDrawer()
                  }}
                  variant='contained'
                  color='primary'
                  sx={{ '& svg': { mr: 2 } }}
                >
                  Create Function
                </Button>
              </Grid2> */}
            </Grid2>
            <Box p={4} mt={4}>
              <MaterialReactTable table={table} />
            </Box>
          </Card>
        </Grid2>
      )}
        {/* <Grid2 xs={12}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
            <Divider sx={{ m: '0 !important' }} />
            <CardContent />

            <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
              <Grid2 xs={12} md={6} lg={6}>
                <Button variant='contained' onClick={handleTemplateClick}>
                  Create User
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
        </Grid2> */}
      </Grid2>

            {addUserOpen && (
              <Grid2 size={{ xs: 12 }}>
                <Card elevation={0}>
                  <AssignedFunctionDrawer
                    open={addUserOpen}
                    toggle={toggleAddUserDrawer}
                    // id={eid}
                    RowData={selectedRow}
                    getAll={() => {}}
                  />
                </Card>
              </Grid2>
            )}

      {/* Manual Drawer */}
      {/* <PushNotificationTargetDrawer
        open={manualDrawerOpen}
        toggle={() => setManualDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        templateId={selectedRow?.id}
      /> */}

      {/* Template Drawer */}
      {/* <AddUserListDrawerAdmin
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
        page={page}
      /> */}
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

export default ListUsers
