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
import { Stack } from '@mui/system'
import dayjs from 'dayjs'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

function EvetDetailsById({ page, RowData, setfunctionDetails, userId, functionId, toggle }) {
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
  const [eventDetails, setEventDetails] = useState({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  //   const[userDetails,setuserDetails] = useState({})
  //   const[functionDetails,setfunctionDetails] = useState({})

  const toggleAddUserDrawer = () => {
    // if (addUserOpen) {
    //   setEid('')
    // }
    setAddUserOpen(!addUserOpen)
  }

  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData, handleRestriction }) => [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) => row.original.name || '-'
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'is_sent',
      header: 'Sent',
      Cell: ({ row }) => row.original.is_sent ? "Yes":'No' // Event/Trans/Acc/Other title
    },
      {
      accessorKey: 'delivery_status',
      header: 'Delivered',
      Cell: ({ row }) => row.original.delivery_status ? "Yes":'No' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'is_viewed',
      header: 'Seen',
      Cell: ({ row }) => row.original.is_viewed ? "Yes":'No' // Event/Trans/Acc/Other title
    }, {
      accessorKey: 'clicked_count',
      header: 'Total Clicks',
      Cell: ({ row }) => row.original.clicked_count || 0 // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'watch_secs',
      header: 'Watch hours',
      Cell: ({ row }) => formatWatchTime(row.original.watch_secs||0) // Event/Trans/Acc/Other title
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
      console.log('body', id, field, value)
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
      handleRestriction: handleRestriction
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
      setEventDetails(response.data.eventDetail[0] || {})
      // setuserDetails(response.data.userDetails[0]||{})
      setTotalCount(response.data.total || 0)

      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    } finally {
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

    const handlePreview = file => {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedFile(null)
  }

  function formatWatchTime(totalSecs) {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60); // ensure integer

  let parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? "s" : ""}`);
  if (secs > 0 || parts.length === 0)
    parts.push(`${secs} sec${secs !== 1 ? "s" : ""}`);

  return parts.join(" ");
}

  useEffect(() => {
    fetchData()
    // fetchConatctData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize])

  
  console.log("invitation_files----->",eventDetails?.invitation_files)


  return (
    <>
      <Grid2 container spacing={6} mt={2}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
              borderRadius: 2
            }}
          >
            <Header>
              <CardHeader
                title={`${eventDetails.typeof} Details`}
                sx={{
                  borderBottom: '1px solid #eee',
                  '& .MuiTypography-root': {
                    fontWeight: 600
                  }
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
         <CardContent>
  <Stack spacing={2} mt={2}>
    
    {/* ---------------- TITLE ---------------- */}
    <Stack direction="row" spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        Title:
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {eventDetails?.title || '-'}
      </Typography>
    </Stack>

    {/* ---------------- EVENT ---------------- */}
    {eventDetails?.typeof === "Event" && (
      <>
        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Event Name:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.event_name || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Venue:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.venue_name || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Event Date:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.date_time
              ? dayjs(eventDetails.date_time).format("DD MMM YYYY hh:mm A")
              : '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Gift Preference:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.gift_preference || '-'}
          </Typography>
        </Stack>
      </>
    )}

    {/* ---------------- TRANSPORTATION ---------------- */}
    {eventDetails?.typeof === "Transportation" && (
      <>
        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Mode Of Travel:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.mode_of_travel || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Transport Name:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.transport_name || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Location:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.venue_name || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Travel Date:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.date_time
              ? dayjs(eventDetails.date_time).format("DD MMM YYYY hh:mm A")
              : '-'}
          </Typography>
        </Stack>
      </>
    )}

    {/* ---------------- ACCOMMODATION / DEFAULT ---------------- */}
    {!["Event", "Transportation"].includes(eventDetails?.typeof) && (
      <>
        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Venue Name:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.venue_name || '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Check-in:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.check_in_date_time
              ? dayjs(eventDetails.check_in_date_time).format("DD MMM YYYY hh:mm A")
              : '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Check-out:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.check_out_date_time
              ? dayjs(eventDetails.check_out_date_time).format("DD MMM YYYY hh:mm A")
              : '-'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Room Key:
          </Typography>
          <Typography variant="body1">
            {eventDetails?.room_key || '-'}
          </Typography>
        </Stack>
      </>
    )}

    {/* ---------------- NOTES (COMMON) ---------------- */}
    <Stack direction="row" spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        Notes:
      </Typography>
      <Typography variant="body1">
        {eventDetails?.notes || '-'}
      </Typography>
    </Stack>

    {/* ---------------- FILES ---------------- */}

    {eventDetails?.invitation_files?.length > 0 ? (
      <>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Invited File
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap">
            {eventDetails.invitation_files.map(file => {
              console.log("file------->",file)
              const url = file?.url
              const name = file?.file_name

              return (
                <Box
                  key={file.id}
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    background: '#fafafa',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => handlePreview({ ...file, url, name })}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />
                  {/* {file.type === 'pdf' && (
                    <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />
                  )}

                  {file.type === 'audio' && (
                    <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                  )}

                  {file.type === 'video' && (
                    <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                  )}

                  {file.type === 'image' && (
                    <img
                      src={url}
                      alt={name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )} */}
                </Box>
              )
            })}
          </Stack>
        </Stack>
      </>
    ) : (
      <>
        <Divider />
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Invited File
          </Typography>
          <Typography>No Invited File Found</Typography>
        </Stack>
      </>
    )}
  </Stack>
  <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth='md' fullWidth>
                  <DialogContent sx={{ p: 2 }}>
                     {console.log("selectedFile=======>",selectedFile)}
                      <iframe src={selectedFile?.url} width='100%' height='500px' style={{ border: 'none' }} />

                    {/* {selectedFile?.type === 'pdf' && (
                      <iframe src={selectedFile.url} width='100%' height='500px' style={{ border: 'none' }} />
                    )}
  
                    {(selectedFile?.type === 'video' ||
                    selectedFile?.type === 'special_invite_video' ||
                    selectedFile?.type === 'host_video' ||
                    selectedFile?.type === 'firms_video')
                    && (
                      <video width='100%' controls>
                        <source src={selectedFile.url}  />
                      </video>
                    )}
  
                    {selectedFile?.type === 'audio' && (
                      <audio controls style={{ width: '100%' }}>
                        <source src={selectedFile.url} />
                      </audio>
                    )}
                    {selectedFile && (
                      selectedFile?.type === 'image' || 
                      selectedFile?.type === 'host'||
                      selectedFile?.type === 'special_invite'||
                      selectedFile?.type === 'firms'
                     ) && (
                      <img
                        src={selectedFile.url}
                        alt={selectedFile.file_name}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: 8
                        }}
                      />
                    )} */}
                  </DialogContent>
                </Dialog>
</CardContent>
          </Card>
        </Grid2>
      </Grid2>

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
      <Box p={4} mt={4}>
        <MaterialReactTable table={table} />
      </Box>
    </>
  )
}

export default EvetDetailsById
