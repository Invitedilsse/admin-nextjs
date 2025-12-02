// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { Backdrop, CircularProgress, Grid2, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { apiDelete, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useDropzone } from 'react-dropzone'
import { getListOfCustomMedia } from 'src/store/adminMod'
const useStyles = makeStyles({
  root: {}
})

const CustomMediaEvents = props => {
  // ** Props
  const { toggle, id, RowData } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState(new Date())
  const { functionId, eventId, custumMedia,
    isCustomMediaFetching,eventreminderDispatchDatetime } = useSelector(state => state.adminMod)
  const [invitePDFFile, setInvitePdfFile] = useState([])
  const [inviteMusicFile, setInviteMusicFile] = useState([])
  const [inviteVideoFile, setInviteVideoFile] = useState([])
  const [inviteVoiceFile, setInviteVoiceFile] = useState([])
  const { getRootProps: getPDFRootProps, getInputProps: getPdfInputProps } = useDropzone({
    multiple: false,
    maxSize: 52428800,
    accept: {
      'application/pdf': ['.pdf']
    },
    validator: (file) => {
      if (file.size.length > 52428800) {
        return {
          code: "name-too-large",
          message: `Name is larger than ${'5MB'} characters`
        };
      }
      return null
    },
    onDropRejected: (fileRejections) => {
      toast.error(fileRejections.length > 0 ?
        (fileRejections[0].errors[0].code === 'file-too-large' ?
          'File size exceeds the 50MB limit'
          :
          fileRejections[0].errors[0].code)
        : 'Please select a valid file')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles?.length > 0) {
        handleCustomMedia('pdf', acceptedFiles[0])
      }
    }
  })

  const { getRootProps: getMusicRootProps, getInputProps: getMusicInputProps } = useDropzone({
    multiple: false,
    maxSize: 52428800,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    validator: (file) => {
      if (file.size.length > 52428800) {
        return {
          code: "name-too-large",
          message: `Name is larger than ${'5MB'} characters`
        };
      }

      return null
    },
    onDropRejected: (fileRejections) => {
      console.log(fileRejections)
      toast.error(fileRejections.length > 0 ?
        (fileRejections[0].errors[0].code === 'file-too-large' ?
          'File size exceeds the 50MB limit'
          :
          fileRejections[0].errors[0].code)
        : 'Please select a valid file')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles?.length > 0) {
        handleCustomMedia('music', acceptedFiles[0])
      }

    }
  });

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
    multiple: false,
    maxSize: 104857600,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.wmv'],
    },
    validator: (file) => {
      if (file.size.length > 104857600) {
        return {
          code: "name-too-large",
          message: `Name is larger than ${'5MB'} characters`
        };
      }

      return null
    },
    onDropRejected: (fileRejections) => {
      console.log(fileRejections)
      toast.error(fileRejections.length > 0 ?
        (fileRejections[0].errors[0].code === 'file-too-large' ?
          'File size exceeds the 100MB limit'
          :
          fileRejections[0].errors[0].code)
        : 'Please select a valid file')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log(acceptedFiles)
      if (acceptedFiles?.length > 0) {
        handleCustomMedia('video', acceptedFiles[0])
      }
    }
  });

  const { getRootProps: getVoiceRootProps, getInputProps: getVoiceInputProps } = useDropzone({
    multiple: false,
    maxSize: 52428800,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    validator: (file) => {
      if (file.size.length > 52428800) {
        return {
          code: "name-too-large",
          message: `Name is larger than ${'5MB'} characters`
        };
      }

      return null
    },
    onDropRejected: (fileRejections) => {
      console.log(fileRejections)
      toast.error(fileRejections.length > 0 ?
        (fileRejections[0].errors[0].code === 'file-too-large' ?
          'File size exceeds the 50MB limit'
          :
          fileRejections[0].errors[0].code)
        : 'Please select a valid file')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles?.length > 0) {
        handleCustomMedia('voice', acceptedFiles[0])
      }
    }
  });
  const formik = useFormik({
    initialValues: {
      scheduledDateTime: moment(date).toDate(),
      fileImage: '',
      fileImagePreview: null
    },
    validationSchema: yup.object({
      scheduledDateTime: yup.date().required('Scheduled Date Time is required'),
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          scheduled_date_time: eventreminderDispatchDatetime,
          function_id: functionId,
        }
        let mainLogo = null;
        if (values.fileImagePreview !== null) {
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, fileImagePreview, true)
          var temp = [imageRes?.data?.detail]
          mainLogo = temp
          params['image'] = mainLogo
        } else {
          params['image'] = RowData?.image
        }
        const result =
          id === ''
            ? await apiPost(`${baseURL}notification-dispatch/add`, params)
            : await apiPut(`${baseURL}notification-dispatch/update/${RowData.id}`, params)
        toggle()
        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toast.success(result?.data?.message)
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })

  const getallCustomMedia = () => {
    const queryParams = `other_id=${eventId}&limit=${20}&offset=${0}&search_string=${""}&sortDir=${'desc'}&sortBy=${'type'}`
    dispatch(getListOfCustomMedia(queryParams))
  }
  useEffect(() => {
    if (eventId !== '') {
      getallCustomMedia()
    }
  }, [eventId])
  const handleMedia = async (media) => {
    media?.map((item) => {
      if (item?.type === 'pdf') {
        setInvitePdfFile(item)
      } else if (item?.type === 'music') {
        setInviteMusicFile(item)
      } else if (item?.type === 'video') {
        setInviteVideoFile(item)
      } else if (item?.type === 'voice') {
        setInviteVoiceFile(item)
      }
    })
  }
  useEffect(() => {
    if (custumMedia?.length) {
      setInvitePdfFile([])
      setInviteMusicFile([])
      setInviteVideoFile([])
      setInviteVoiceFile([])
      handleMedia(custumMedia)

    } else {
      setInvitePdfFile([])
      setInviteMusicFile([])
      setInviteVideoFile([])
      setInviteVoiceFile([])
    }
  }, [custumMedia])
  const handleCustomMedia = async (type, fileData) => {
    setIsLoading(true)
    try {
      let params = {
        other_id: eventId,
        type: type,
      }
      let fileLogo = null;
      if (fileData !== null) {
        const formData = new FormData()
        formData.append('file', fileData)
        const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
        var temp = [imageRes?.data?.detail]
        fileLogo = temp
        params['file'] = fileLogo
      }

      const result = await apiPost(`${baseURL}custom-media/add`, params)
      toast.success(result?.data?.message)
      getallCustomMedia()
      setTimeout(() => {
        formik.resetForm()
        setIsLoading(false)
      }, 500)
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCustomMedia = async (key, type, id) => {
    try {
      const deleteRes = await apiDelete(`${baseURL}custom-media/delete/${id}`)
      if (deleteRes?.data) {
        if (type === 'pdf') {
          setInvitePdfFile([])
        } else if (type === 'music') {
          setInviteMusicFile([])
        } else if (type === 'video') {
          setInviteVideoFile([])
        } else if (type === 'voice') {
          setInviteVoiceFile([])
        }
        toast.success(deleteRes?.data?.message)
        const result = await apiDelete(`${baseURL}user/file-delete`, { key: key })
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Box
      className={classes.root}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
    >
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={isLoading || isCustomMediaFetching}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box className={classes.root}>
        <Box sx={{ p: theme => theme.spacing(0, 8, 8), width: '100% !important' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' sx={{ mb: 2.5 }}>
              PDF Invitation
            </Typography>
            {!invitePDFFile?.file?.length && <div
              {...getPDFRootProps({
                className: 'dropzone',
                style: {
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '20px',
                  cursor: 'pointer'
                }
              })}
            >
              <input {...getPdfInputProps('host')} />
              <Box
                sx={{
                  display: 'flex',
                  textAlign: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
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
                  <Icon icon='proicons:pdf-2' fontSize='1.75rem' />
                </Box>
                <Typography variant='h6' sx={{ mb: 2.5 }}>
                  Drop PDF Invite here or click to upload. (Max file size: 50MB)
                </Typography>
              </Box>
            </div>}
            {invitePDFFile && invitePDFFile?.file && invitePDFFile?.file.length > 0 && (
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                <List sx={{
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <ListItem disablePadding secondaryAction={
                    <>
                      <IconButton edge='end' aria-label='view' onClick={() => {
                        if (invitePDFFile?.file) {
                          window.open(invitePDFFile?.file[0]?.url, '_blank')
                        }
                      }}>
                        <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                      </IconButton>
                      <IconButton edge='end' aria-label='delete' onClick={() => {
                        handleDeleteCustomMedia(invitePDFFile?.file[0]?.key, 'pdf', invitePDFFile?.id)
                      }}>
                        <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                      </IconButton>
                    </>
                  }>
                    <ListItemButton>
                      <ListItemIcon>
                        <Icon icon='proicons:pdf-2' fontSize='1.75rem' color="primary.main" />
                      </ListItemIcon>
                      <ListItemText primary={invitePDFFile && invitePDFFile?.file && invitePDFFile?.file[0]?.file_name} />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Grid2>
            )}
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' sx={{ mb: 2.5 }}>
              Music Invitation
            </Typography>

            {!inviteMusicFile?.file?.length && <div
              {...getMusicRootProps({
                className: 'dropzone',
                style: {
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '20px',
                  cursor: 'pointer'
                }
              })}
            >
              <input {...getMusicInputProps('host')} />
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
                  <Icon icon='ic:twotone-music-video' fontSize='1.75rem' />
                </Box>
                <Typography variant='h6' sx={{ mb: 2.5 }}>
                  Drop Music Invite here or click to add.(Max file size: 50MB)
                </Typography>
              </Box>
            </div>}
            {inviteMusicFile?.file?.length > 0 && (
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                <List sx={{
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <ListItem disablePadding secondaryAction={
                    <>
                      <IconButton edge='end' aria-label='view' onClick={() => {
                        if (inviteMusicFile?.file[0]?.url) {
                          window.open(inviteMusicFile?.file[0]?.url, '_blank')
                        }
                      }}>
                        <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                      </IconButton>
                      <IconButton edge='end' aria-label='delete' onClick={() => {
                        handleDeleteCustomMedia(inviteMusicFile?.file[0]?.key, 'music', inviteMusicFile?.id)
                        // setInviteMusicFile([])
                      }}>
                        <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                      </IconButton>
                    </>
                  }>
                    <ListItemButton>
                      <ListItemIcon>
                        <Icon icon='ic:twotone-music-video' fontSize='1.75rem' />
                      </ListItemIcon>
                      <ListItemText primary={inviteMusicFile && inviteMusicFile?.file && inviteMusicFile?.file[0]?.file_name} />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Grid2>
            )}
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' sx={{ mb: 2.5 }}>
              Video Invitation
            </Typography>
            {!inviteVideoFile?.file?.length > 0 && <div
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
                  <Icon icon='ri:video-fill' fontSize='1.75rem' />
                </Box>
                <Typography variant='h6' sx={{ mb: 2.5 }}>
                  Drop Video Invite here or click to add.(Max file size: 100MB)
                </Typography>
              </Box>
            </div>}
            {inviteVideoFile?.file?.length > 0 && (
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                <List sx={{
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <ListItem disablePadding secondaryAction={
                    <>
                      <IconButton edge='end' aria-label='view' onClick={() => {
                        if (inviteVideoFile?.file[0]?.url) {
                          window.open(inviteVideoFile?.file[0]?.url, '_blank')
                        }
                      }}>
                        <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                      </IconButton>
                      <IconButton edge='end' aria-label='delete' onClick={() => {
                        handleDeleteCustomMedia(inviteVideoFile?.file[0]?.key, 'video', inviteVideoFile?.id)
                      }}>
                        <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                      </IconButton>
                    </>
                  }>
                    <ListItemButton>
                      <ListItemIcon>
                        <Icon icon='ri:video-fill' fontSize='1.75rem' />
                      </ListItemIcon>
                      <ListItemText primary={inviteVideoFile && inviteVideoFile?.file && inviteVideoFile?.file[0]?.file_name} />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Grid2>
            )}
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6' sx={{ mb: 2.5 }}>
              Voice Invitation
            </Typography>

            {!inviteVoiceFile?.file?.length > 0 && <div
              {...getVoiceRootProps({
                className: 'dropzone',
                style: {
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '20px',
                  cursor: 'pointer'
                }
              })}
            >
              <input {...getVoiceInputProps('host')} />
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
                  <Icon icon='icon-park-twotone:voice-one' fontSize='1.75rem' />
                </Box>
                <Typography variant='h6' sx={{ mb: 2.5 }}>
                  Drop Voice Invite here or click to add.(Max file size: 50MB)
                </Typography>
              </Box>
            </div>}
            {inviteVoiceFile?.file?.length > 0 && (
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                <List sx={{
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  cursor: 'pointer'
                }}>
                  <ListItem disablePadding secondaryAction={
                    <>
                      <IconButton edge='end' aria-label='view' onClick={() => {
                        if (inviteVoiceFile?.file[0]?.url) {
                          window.open(inviteVoiceFile?.file[0]?.url, '_blank')
                        }
                      }}>
                        <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                      </IconButton>
                      <IconButton edge='end' aria-label='delete' onClick={() => {
                        handleDeleteCustomMedia(inviteVoiceFile?.file[0]?.key, 'voice', inviteVoiceFile?.id)
                      }}>
                        <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                      </IconButton>
                    </>
                  }>
                    <ListItemButton>
                      <ListItemIcon>
                        <Icon icon='icon-park-twotone:voice-one' fontSize='1.75rem' />
                      </ListItemIcon>
                      <ListItemText primary={inviteVoiceFile && inviteVoiceFile?.file && inviteVoiceFile?.file[0]?.file_name} />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Grid2>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default CustomMediaEvents
