// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete, apiPost } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageSpecialInviteeDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfSpecialInvitees } from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'
import EmblaCarousel from '../BasicInfo/EmblaCarousel'
import { useDropzone } from 'react-dropzone'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'

const SpecialInvitee = ({ isOpen }) => {
  // ** Hooks
  const dispatch = useDispatch()
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [files, setFiles] = useState([])
  const handleClose = () => {
    setdOpen(false)
  }

  const { isSpecialInviteesFetching, allSpecialInvitees, specialInviteeCount, functionId, functionData } = useSelector(
    state => state.adminMod
  )
  const [inviteVideo, setInviteVideo] = useState([])

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const getAllSpecialInvitee = () => {
    const params = {
      page: pagination?.pageIndex,
      size: pagination?.pageSize
    }
    const queryParams = `function_id=${functionId}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'title'}`
    dispatch(getListOfSpecialInvitees(queryParams))
  }
  useEffect(() => {
    if (addUserOpen === false && isOpen === true) {
      getAllSpecialInvitee()
    }
  }, [searchText, addUserOpen, isOpen, pagination?.pageIndex, pagination?.pageSize])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  const handleOtherMedia = async (type, fileData) => {
    try {
      let params = {
        other_id: functionId,
        type: type
      }
      let fileLogo = null
      if (fileData !== null) {
        const formData = new FormData()
        formData.append('file', fileData)
        const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
        var temp = [imageRes?.data?.detail]
        fileLogo = temp
        params['other_image'] = fileLogo
      }

      const result = await apiPost(`${baseURL}other-images/add`, params)
      toast.success(result?.data?.message)
      if (result?.data?.data) {
        if (type === 'special_invite') {
          setFiles([])
          const hostImages = result?.data?.data
            ?.filter(item => item.type === 'special_invite')
            .map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setFiles(hostImages)
        } else if (type === 'special_invite_video') {
          const hostVideo = result?.data?.data
            ?.filter(item => item.type === 'special_invite_video')
            .map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setInviteVideo(hostVideo)
        }
      }
    } catch (e) {
      toast.error(e)
    }
  }

  const handleDeleteOtherMedia = async (key, type, id) => {
    try {
      const deleteRes = await apiDelete(`${baseURL}other-images/delete/${id}`)
      if (deleteRes?.data) {
        let filtered = null
        if (type !== 'special_invite_video') {
          filtered = files.filter(i => i.id !== id)
          setFiles([...filtered])
        }

        toast.success(deleteRes?.data?.message)

        const result = await apiDelete(`${baseURL}user/file-delete`, { key: key })
        if (type === 'special_invite_video') {
          setInviteVideo([])
        }
      }
    } catch (e) {
      toast.error(e)
    }
  }
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024,
    validator: file => {
      if (file.size.length > 50 * 1024 * 1024) {
        return {
          code: 'name-too-large',
          message: `Name is larger than ${'50MB'} characters`
        }
      }

      return null
    },
    onDropRejected: fileRejections => {
      toast.error(fileRejections.length > 0 ? fileRejections[0].errors[0].message : 'Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleOtherMedia('special_invite', acceptedFiles[0])
      }
    }
  })
  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    // disabled: !isEdit,
    maxSize: 104857600,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.wmv']
    },
    validator: file => {
      if (file.size.length > 104857600) {
        return {
          code: 'name-too-large',
          message: `Name is larger than ${'100MB'} characters`
        }
      }

      return null
    },
    onDropRejected: fileRejections => {
      toast.error(
        fileRejections.length > 0
          ? fileRejections[0].errors[0].code === 'file-too-large'
            ? 'File size exceeds the 100MB limit'
            : fileRejections[0].errors[0].code
          : 'Please select a valid file'
      )
    },
    onError: error => {
      console.log('upload img---->', error)
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log('acceptedFiles---->', acceptedFiles)
      if (acceptedFiles.length > 0) {
        setInviteVideo(acceptedFiles)
        handleOtherMedia('special_invite_video', acceptedFiles[0])
      }
    }
  })
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        id: delId
      }
      let url = `${baseURL}special-invitee/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllSpecialInvitee()
      toast.success(result?.data?.message)
    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
  const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

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
    },
    {
      accessorKey: 'city',
      header: 'Actions',
      enableSorting: false,
      Cell: ({ renderedCellValue, row }) => {
        return (
          <>
            <Tooltip title='Edit'>
              <IconButton
                onClick={() => {
                  setEid(row?.original?.id)
                  setEntireRow(row?.original)
                  toggleAddUserDrawer()
                }}
                color='primary'
                sx={{ fontSize: '18px' }}
              >
                {' '}
                <Icon icon='tabler:pencil' color='primary' />
              </IconButton>
            </Tooltip>
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
    rowCount: specialInviteeCount,
    enableRowOrdering: false,
    onPaginationChange: setPagination,
    state: {
      pagination,
      showProgressBars: isSpecialInviteesFetching,
      isLoading: isSpecialInviteesFetching,
      columnFilters: [],
      globalFilter: ''
    }
  })

  useEffect(() => {
    const hostImages = functionData?.other_images
      ?.filter(item => item.type === 'special_invite')
      ?.map(item => ({
        id: item.id,
        other_id: item.other_id,
        type: item.type,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ...item.other_image[0]
      }))
    setFiles(hostImages)
    const hostVideo = functionData?.other_images
      ?.filter(item => item.type === 'special_invite_video')
      .map(item => ({
        id: item.id,
        other_id: item.other_id,
        type: item.type,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ...item.other_image[0]
      }))
    setInviteVideo(hostVideo)
  }, [functionData])
  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12 }}>
        <Card
          sx={{
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <CardContent></CardContent>
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'space-between'}>
            <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Special Invitee'
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
            <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
              <Button
                fullWidth
                onClick={() => {
                  setEid('')
                  setEntireRow([])
                  setEntireRow([])
                  toggleAddUserDrawer()
                }}
                variant='contained'
                color='primary'
                sx={{ '& svg': { mr: 2 } }}
              >
                Add Special Invitee
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4}>
            <MaterialReactTable table={table} />
            {functionId && (
              <Fragment>
                <Box sx={{ mt: 8 }}>
                  <Typography variant='h6' sx={{ mb: 2.5 }}>
                    Other Images
                  </Typography>
                  <div
                    {...getRootProps({
                      className: 'dropzone',
                      style: {
                        border: '2px dashed #ccc',
                        borderRadius: '4px',
                        padding: '20px',
                        cursor: 'pointer'
                      }
                    })}
                  >
                    <input {...getInputProps('host')} />
                    <Box
                      sx={{
                        display: 'flex',
                        textAlign: 'center',
                        alignItems: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <Box
                        sx={{
                          mb: 8.75,
                          width: 48,
                          height: 48,
                          display: 'flex',
                          borderRadius: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme => `rgba(${theme.palette.primary.main}, 0.08)`
                        }}
                      >
                        <Icon icon='tabler:upload' fontSize='1.75rem' />
                      </Box>
                      <Typography variant='h6' sx={{ mb: 2.5 }}>
                        Drop Images here or click to add.
                      </Typography>
                    </Box>
                  </div>
                  {files?.length > 0 && (
                    <Box sx={{ mt: 8 }}>
                      <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                        <EmblaCarousel slides={files} options={OPTIONS} handleDelete={handleDeleteOtherMedia} />
                      </Grid2>
                    </Box>
                  )}
                </Box>

                <Fragment>
                  <Typography variant='h6' sx={{ mb: 2.5 }}>
                    SpecialInvitee Video
                  </Typography>
                  {!inviteVideo?.length && (
                    <div
                      {...getVideoRootProps({
                        className: 'dropzone',
                        style: {
                          border: '2px dashed #ccc',
                          borderRadius: '4px',
                          padding: '20px',
                          cursor: 'pointer'
                        }
                      })}
                    >
                      <input {...getVideoInputProps('host')} />
                      <Box
                        sx={{
                          display: 'flex',
                          textAlign: 'center',
                          alignItems: 'center',
                          flexDirection: 'column'
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            borderRadius: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme => `rgba(${theme.palette.primary.main}, 0.08)`
                          }}
                        >
                          <Icon icon='tabler:upload' fontSize='1.75rem' />
                        </Box>
                        <Typography variant='h6' sx={{ mb: 3.5 }}>
                          Drop invite here or click to add.
                        </Typography>
                      </Box>
                    </div>
                  )}
                  {inviteVideo?.length > 0 && (
                    <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                      <List
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: '4px',
                          padding: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <ListItem
                          disablePadding
                          secondaryAction={
                            <>
                              <IconButton
                                edge='end'
                                aria-label='view'
                                onClick={() => {
                                  if (inviteVideo[0]?.url) {
                                    window.open(inviteVideo[0]?.url, '_blank')
                                  } else if (inviteVideo[0]?.name) {
                                    const file = inviteVideo[0]
                                    const url = URL.createObjectURL(file)

                                    const a = document.createElement('a')
                                    a.href = url
                                    a.target = '_blank'
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    URL.revokeObjectURL(url)
                                  }
                                }}
                              >
                                <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                              </IconButton>
                              <IconButton
                                edge='end'
                                aria-label='delete'
                                // disabled={functionData ? !isEdit : false}
                                onClick={() => {
                                  console.log('params--->spl', inviteVideo)

                                  inviteVideo?.[0]?.key
                                    ? handleDeleteOtherMedia(
                                        inviteVideo[0].key,
                                        'special_invite_video',
                                        inviteVideo[0].id
                                      )
                                    : setInviteVideo([])
                                  // handleDeleteCustomMedia(
                                  //   RowData?.invitation_video
                                  //     ? RowData?.invitation_video[0]?.key
                                  //     : formik.values?.fileVideo[0]?.key,
                                  //   'video',
                                  //   RowData.id
                                  // )
                                }}
                              >
                                <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                              </IconButton>
                            </>
                          }
                        >
                          <ListItemButton>
                            <ListItemIcon>
                              <Icon icon='mingcute:invite-line' fontSize='1.75rem' />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                (inviteVideo.length > 0 && inviteVideo[0]?.name) ||
                                (inviteVideo.length > 0 && inviteVideo[0]?.file_name)
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Grid2>
                  )}
                </Fragment>
              </Fragment>
            )}
          </Box>
        </Card>
      </Grid2>

      <Box p={4}>
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
      </Dialog>
    </Grid2>
  )
}

export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Special Invitees Found
    </Stack>
  )
}
export default SpecialInvitee
const OPTIONS = { dragFree: true, loop: true }
