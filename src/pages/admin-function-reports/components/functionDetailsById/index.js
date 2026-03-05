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
  Icon as MUIicon,
  Typography,
  Avatar
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send, Visibility } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  baseURL,
  deleteCustomPushTemplatesAllUsers,
  deleteCustomPushTemplatesFunUsers,
  getnotification,
  mapTemplatesHrs,
  reportFunctionDetailsById
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
import EvetDetailsById from './viewbyeventId'
// import FunctionDetailsDrawer from './components/ManageAssignDrawer'
// import AssignContactsDrawer from './components/ManageAssignDrawer'
import { makeStyles } from '@mui/styles'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { alpha, Stack } from '@mui/system'
import SerialNumberGenerator from 'src/pages/function/components/common/SerialNumberGenerator'
import { capitalize } from 'lodash'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

function FunctionDetailsById({ page, RowData, functionDetails, setfunctionDetails, handleCloseFunctionDetails }) {
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
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [allSpecialInvitees, setAllSpecialInvitees] = useState([])
  const [frims, setFrims] = useState([])
  const [socialLink,setSocialLink] = useState([])
  const [isSpecialInviteesFetching, setisSpecialInviteesFetching] = useState(false)

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
      accessorKey: 'item_name',
      header: 'Event Name',
      Cell: ({ row }) => row.original.item_name || '-'
    },
    {
      accessorKey: 'type',
      header: 'Event Type',
      Cell: ({ row }) => (row.original.type === 'other' ? 'Pre-Invite' : row.original.type) // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'mapped_count',
      header: 'Mapped Contact Count',
      Cell: ({ row }) => row.original.mapped_count || '0' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'View In Detail',
      Cell: ({ row }) => (
        <>
          {/* <Edit onClick={() => onTemplateClick(row.original)}/> */}
          <Visibility onClick={() => onTemplateClick(row.original)} style={{ cursor: 'pointer', marginRight: 8 }} />
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
    setisSpecialInviteesFetching(true)
    try {
      const response = await apiGet(
        `${reportFunctionDetailsById}?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&userId=${RowData?.user_id}&functionId=${RowData?.functionid}`
      )
      console.log('Push Notification Templates:', response.data)
      setContactsFunctionAll(response.data.mappedData || [])
      // setuserDetails(response.data.userDetails[0]||{})
      setfunctionDetails(response.data.functionDetails[0] || {})
      setAllSpecialInvitees(response.data.functionDetails[0].special_invitee || [])
      setFrims(response.data.functionDetails[0].firm || [])
      setSocialLink(response.data.functionDetails[0].social_link || [])
      setTotalCount(response.data.totalMapped || 0)

      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    } finally {
      setisdataloading(false)
      setisSpecialInviteesFetching(false)
    }
  }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  const handlePreview = file => {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedFile(null)
  }
  const columns = [
    {
      size: 100,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
    },
    {
      accessorKey: 'main_logo',
      header: 'Logo',
      Cell: ({ renderedCellValue, row }) => (
        <>
          <Avatar
            src={`${(row?.original?.image && row?.original?.image?.length > 0 && row?.original?.image[0]?.url) || 'NA'}`}
            alt={capitalize(row?.original?.title)}
            sx={{
              mt: 2,
              width: '44px',
              height: '44px',
              objectFit: 'cover'
            }}
          />
        </>
      )
    },
    {
      accessorKey: 'title',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description'
    }
  ]
  const splInvitetable = useMaterialReactTable({
    columns,
    data: allSpecialInvitees,
    enableColumnFilter: false,
    enableHiding: false,
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
      value: isSpecialInviteesFetching
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
    rowCount: allSpecialInvitees.length,
    enableRowOrdering: false
    // onPaginationChange: setPagination,
    // state: {
    //   pagination,
    //   showProgressBars: isSpecialInviteesFetching,
    //   isLoading: isSpecialInviteesFetching,
    //   columnFilters: [],
    //   globalFilter: ''
    // }
  })

  
  const frimstable = useMaterialReactTable({
    columns,
    data: frims,
    enableColumnFilter: false,
    enableHiding: false,
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
      value: isSpecialInviteesFetching
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
    rowCount: frims.length,
    enableRowOrdering: false
    // onPaginationChange: setPagination,
    // state: {
    //   pagination,
    //   showProgressBars: isSpecialInviteesFetching,
    //   isLoading: isSpecialInviteesFetching,
    //   columnFilters: [],
    //   globalFilter: ''
    // }
  })

    const slcolumns = [
    {
      size: 100,
      accessorKey: 'serialNumber',
      header: 'S.No',
      Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
    },
    {
      accessorKey: 'main_logo',
      header: 'Logo',
      Cell: ({ renderedCellValue, row }) => (
        <>
          <Avatar
            src={`${(row?.original?.logo && row?.original?.logo?.length > 0 && row?.original?.logo[0]?.url) || 'NA'}`}
            alt={capitalize(row?.original?.name)}
            sx={{
              mt: 2,
              width: '44px',
              height: '44px',
              objectFit: 'cover'
            }}
          />
        </>
      )
    },
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'link',
      header: 'Link',
       Cell: ({ renderedCellValue, row }) => (
        <>
            <a
              href={row?.original?.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row?.original?.link}
            </a>
        </>
      )
    }
  ]
    const socialtable = useMaterialReactTable({
    columns:slcolumns,
    data: socialLink,
    enableColumnFilter: false,
    enableHiding: false,
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
      value: isSpecialInviteesFetching
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
    rowCount: frims.length,
    enableRowOrdering: false
    // onPaginationChange: setPagination,
    // state: {
    //   pagination,
    //   showProgressBars: isSpecialInviteesFetching,
    //   isLoading: isSpecialInviteesFetching,
    //   columnFilters: [],
    //   globalFilter: ''
    // }
  })

  useEffect(() => {
    fetchData()
    // fetchConatctData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize])

  return (
    <>
      {!addUserOpen && (
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12 }}>
              {/* {JSON.stringify(functionDetails, null, 2)} */}
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
                      title='Function Details'
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
                        <Stack direction='row' spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Function Name:
                          </Typography>
                          <Typography variant='body1' fontWeight={500}>
                            {functionDetails?.function_name || '-'}
                          </Typography>
                        </Stack>

                        <Stack direction='row' spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Occasion Name:
                          </Typography>
                          <Typography variant='body1'>{functionDetails?.occasion_type || '-'}</Typography>
                        </Stack>
                        <Stack direction='row' spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Host Name:
                          </Typography>
                          <Typography variant='body1'>{functionDetails?.host_name || '-'}</Typography>
                        </Stack>
                        <Stack direction='row' spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Name:
                          </Typography>
                          <Typography variant='body1'>{functionDetails?.name || '-'}</Typography>
                        </Stack>
                        <Stack direction='row' spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Description:
                          </Typography>
                          <Typography variant='body1'>{functionDetails?.description || '-'}</Typography>
                        </Stack>

                        {functionDetails?.function_logo?.length > 0 ? (
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                Function Logo
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.function_logo.map(file => {
                                  const url = file?.file?.[0]?.url
                                  const name = file?.file?.[0]?.file_name

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
                                      {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )}
                                      {file.type === 'image' && (
                                        <img
                                          src={file.url}
                                          alt={file.file_name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      )}
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
                              <Typography variant='subtitle2' color='text.secondary'>
                                Function Logo
                              </Typography>
                              <Typography>No Function Logo Found</Typography>
                            </Stack>
                          </>
                        )}

                        {functionDetails?.family_logo?.length > 0 ? (
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                Family Logo
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.family_logo.map(file => {
                                  const url = file?.file?.[0]?.url
                                  const name = file?.file?.[0]?.file_name

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
                                      {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )}
                                      {file.type === 'image' && (
                                        <img
                                          src={file.url}
                                          alt={file.file_name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      )}
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
                              <Typography variant='subtitle2' color='text.secondary'>
                                Family Logo
                              </Typography>
                              <Typography>No Family Logo Found</Typography>
                            </Stack>
                          </>
                        )}

                        
                        {functionDetails?.host_images_other?.length > 0 ? (
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Host Images
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.host_images_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                      {/* {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )} */}
                                      {/* {file.type === 'image' && ( */}
                                        <img
                                          src={url}
                                          alt={name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      {/* )} */}
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Host Images
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Host Images Found
                              </Typography> 
                              </Stack>
                          </>
                        )}

                       {functionDetails?.host_video_other?.length > 0 ?(
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Host Videos
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.host_video_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                      {/* {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )} */}
                                      {/* {file.type === 'image' && ( */}
                                        <img
                                          src={url}
                                          alt={name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      {/* )} */}
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Host Videos
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Host Videos Found
                              </Typography> 
                              </Stack>
                          </>
                        )}

                        {functionDetails?.custom_media?.length > 0 && (
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                Custom Media Files
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.custom_media.map(file => {
                                  const url = file?.file?.[0]?.url
                                  const name = file?.file?.[0]?.file_name

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
                                      {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )}
                                      {file.type === 'image' && (
                                        <img
                                          src={file.url}
                                          alt={file.file_name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      )}
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        )}

                        <Divider />
                        <Stack spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Special invites
                          </Typography>
                          <Box p={4} mt={4}>
                            <MaterialReactTable table={splInvitetable} />
                          </Box>
                          <Box>
                      {functionDetails?.special_invite_other?.length > 0 ?(
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Special Invities Images
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.special_invite_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                      {/* {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )} */}
                                      {/* {file.type === 'image' && ( */}
                                        <img
                                          src={url}
                                          alt={name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      {/* )} */}
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Special Invites Images
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Special Invites Images Found
                              </Typography> 
                              </Stack>
                          </>
                        )}
                          </Box>
                          <Box>
                      {functionDetails?.special_invite_video_other?.length > 0 ?(
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Special Invities Videos
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.special_invite_video_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Special Invities Videos
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Special Invities Videos Found
                              </Typography> 
                              </Stack>
                          </>
                        )}
                          </Box>
                        </Stack>

                        <Divider />
                        <Stack spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Frims
                          </Typography>
                          <Box p={4} mt={4}>
                            <MaterialReactTable table={frimstable} />
                          </Box>
                          <Box>
                      {functionDetails?.firms_other?.length > 0 ?(
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                  Frim Images
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.firms_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                      {/* {file.type === 'pdf' && <PictureAsPdfIcon sx={{ fontSize: 40, color: 'red' }} />}

                                      {file.type === 'audio' && (
                                        <AudiotrackIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                      )}

                                      {file.type === 'video' && (
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                      )} */}
                                      {/* {file.type === 'image' && ( */}
                                        <img
                                          src={url}
                                          alt={name}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                          }}
                                        />
                                      {/* )} */}
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                  Frim Images
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Frim  Images Found
                              </Typography> 
                              </Stack>
                          </>
                        )}
                          </Box>
                          <Box>
                      {functionDetails?.firms_video_other?.length > 0 ?(
                          <>
                            <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Frim Videos
                              </Typography>

                              <Stack direction='row' spacing={2} flexWrap='wrap'>
                                {functionDetails.firms_video_other.map(file => {
                                  console.log(file)
                                  const url = file?.other_image?.[0]?.url
                                  const name = file?.other_image?.[0]?.file_name

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
                                        <PlayCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                    </Box>
                                  )
                                })}
                              </Stack>
                            </Stack>
                          </>
                        ):(
                          <>
                           <Divider />

                            <Stack spacing={1}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                 Frim Videos
                              </Typography> 
                               <Typography variant='subtitle2' color='text.secondary'>
                                 No Frim Videos Found
                              </Typography> 
                              </Stack>
                          </>
                        )}
                          </Box>
                        </Stack>

                        <Divider />
                        <Stack spacing={1}>
                          <Typography variant='subtitle2' color='text.secondary'>
                            Social Link
                          </Typography>
                          <Box p={4} mt={4}>
                            <MaterialReactTable table={socialtable} />
                          </Box>
                        </Stack>

                        {functionDetails?.notes && (
                          <>
                            <Divider />
                            <Stack spacing={0.5}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                Notes
                              </Typography>
                              <Typography variant='body2'>{functionDetails?.notes}</Typography>
                            </Stack>
                          </>
                        )}
                        {functionDetails?.hastag && (
                          <>
                            <Divider />
                            <Stack spacing={0.5}>
                              <Typography variant='subtitle2' color='text.secondary'>
                                Hashtag
                              </Typography>
                              <Typography variant='body2'>{functionDetails?.hastag}</Typography>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid2>
              </Grid2>

              <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth='md' fullWidth>
                <DialogContent sx={{ p: 2 }}>
                  {selectedFile?.type === 'pdf' && (
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
                  )}
                </DialogContent>
              </Dialog>
              <Grid2 container spacing={6} mt={2}>
                <Grid2 size={{ xs: 12 }}>
                  <Card
                    sx={{
                      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
                      borderRadius: 2
                    }}
                  >
                    <CardHeader
                      title='Function Event List'
                      sx={{
                        borderBottom: '1px solid #eee',
                        '& .MuiTypography-root': {
                          fontWeight: 600
                        }
                      }}
                    />

                    <CardContent>
                      <Stack spacing={1}>
                        <Box p={4} mt={4}>
                          <MaterialReactTable table={table} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid2>
              </Grid2>
          </Grid2>
        </Grid2>
      )}

      {addUserOpen && (
        <Grid2 size={{ xs: 12 }}>
          <Card elevation={0}>
            <EvetDetailsById
              open={addUserOpen}
              toggle={toggleAddUserDrawer}
              // id={eid}
              RowData={selectedRow}
              userId={RowData?.user_id}
              functionId={RowData?.functionid}
              getAll={() => {}}
            />
          </Card>
        </Grid2>
      )}
    </>
  )
}

export default FunctionDetailsById
