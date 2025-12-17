

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
  Icon as MuiIcon,
  Typography
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send, Visibility } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
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
  reportEventDetailsById,
  reportFunctionDetailsById,
  reportFunctionListByUser,
  reportUserList,
  userListUrl
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
// import FunctionDetailsDrawer from './components/ManageAssignDrawer'
// import AssignContactsDrawer from './components/ManageAssignDrawer'
import { makeStyles } from '@mui/styles'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

function EvetDetailsById({ page,RowData,setfunctionDetails,userId,functionId,toggle }) {
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
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
//   const[userDetails,setuserDetails] = useState({})
//   const[functionDetails,setfunctionDetails] = useState({})

  const toggleAddUserDrawer = () => {
    // if (addUserOpen) {
    //   setEid('')
    // }
    setAddUserOpen(!addUserOpen)
  }



  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData,handleRestriction }) => [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) =>   row.original.name || '-'
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ row }) =>  row.original.mobile || '-' // Event/Trans/Acc/Other title
    }
    // {
    //   accessorKey: 'Action',
    //   header: 'View In Detail',
    //   Cell: ({ row }) => (
    //     <>
    //          {/* <Edit onClick={() => onTemplateClick(row.original)}/> */}
    //           <Visibility
    //                           onClick={() => onTemplateClick(row.original)}
    //                           style={{ cursor: "pointer", marginRight: 8 }}
    //                         />
    //     </>
    //   )
    // }
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
    rowCount: totalcount,
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    manualPagination: true,
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
      setisdataloading(true)
      try {
        const response = await apiGet(
          `${reportEventDetailsById}?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&userId=${userId}&functionId=${functionId}&type=${RowData.type}&eventId=${RowData.oid}`
        )
        console.log('Push Notification Templates:', response.data)
        setContactsFunctionAll(response.data.contacts || [])
        // setuserDetails(response.data.userDetails[0]||{})
        setTotalCount(response.data.total || 0)
  
        
        // setData(response.data) // assuming response.data contains the array of templates
      } catch (error) {
        console.error('Error fetching push notification templates:', error)
      }finally{
      setisdataloading(false)
      }
    }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

    const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
   const handleCloseFunctionDetails = () => {
   toggle()
  }

  useEffect(() => {
    fetchData()
    // fetchConatctData()
  }, [searchText,pagination?.pageIndex, pagination?.pageSize,])

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
            }}
          >
        
            <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
                <Header>
                {/* <Typography variant='h5'>{' close'}</Typography> */}
                <CardHeader
                    title='Mapped Contact List'
                    sx={{
                        '& .MuiTypography-root ': {}
                    }}
                    />
                <IconButton
                    size='small'
                    onClick={handleCloseFunctionDetails}
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
            <Divider sx={{ m: '0 !important' }} />
            <CardContent></CardContent>
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
      </Grid2>

            {/* {addUserOpen && (
              <Grid2 size={{ xs: 12 }}>
                <Card elevation={0}>
                  <FunctionDetailsDrawer
                    open={addUserOpen}
                    toggle={toggleAddUserDrawer}
                    // id={eid}
                    RowData={selectedRow}
                    getAll={() => {}}
                  />
                </Card>
              </Grid2>
            )} */}
    </>
  )
}

export default EvetDetailsById
