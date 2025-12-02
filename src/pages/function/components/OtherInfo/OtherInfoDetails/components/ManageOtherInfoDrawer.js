// ** React Imports
import React, { Fragment, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'

import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiDelete, apiPatch, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import DatePicker from 'react-datepicker'
import { useDropzone } from 'react-dropzone'
const NotificationsDispatchMedia = React.lazy(() => import('../../NotificationDispatchMedia'))
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { handleEventId } from 'src/store/adminMod'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const SideBarAccommodation = props => {
  // ** Props
  const { toggle, id, RowData } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(true)
  const [date, setDate] = useState(new Date())
  const { functionId, eventId } = useSelector(state => state.adminMod)
  const [inviteFile, setInviteFile] = useState([])
  const [inviteImage, setInviteImage] = useState([])
  const [inviteVideo, setInviteVideo] = useState([])

  // const { getRootProps, getInputProps } = useDropzone({
  //   multiple: false,
  //   maxFiles: 1,
  //   accept: {
  //     'image/*': ['.png', '.jpg', '.jpeg', '.pdf']
  //   },
  //   onDropRejected: (fileRejections) => {
  //     toast.error('Please select a valid file')
  //   },
  //   onError: (error) => {
  //     toast.error(error.message)
  //   },
  //   onDrop: acceptedFiles => {
  //     console.log(acceptedFiles)
  //     setInviteFile(acceptedFiles)
  //     formik.setFieldValue('fileImagePreview', acceptedFiles[0])

  //   }
  // })

  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf']
      // 'application/vnd.ms-excel': ['.xls'],
      // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    disabled: !isEdit,
    validator: file => {
      if (file.size.length > 52428800) {
        return {
          code: 'name-too-large',
          message: `Name is larger than ${'50MB'} characters`
        }
      }
      return null
    },
    onDropRejected: fileRejections => {
      toast.error(
        fileRejections.length > 0
          ? fileRejections[0].errors[0].code === 'file-too-large'
            ? 'File size exceeds the 50MB limit'
            : fileRejections[0].errors[0].code
          : 'Please select a valid file'
      )
    },
    onDrop: acceptedFiles => {
      console.log('acceptedFiles---->', acceptedFiles)
      if (acceptedFiles.length > 0) {
        setInviteFile(acceptedFiles)
        formik.setFieldValue('filePdfPreview', acceptedFiles[0])
        handleCustomMedia('pdf', acceptedFiles[0])
      }
    }
  })

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    disabled: !isEdit,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    validator: file => {
      if (file.size.length > 52428800) {
        return {
          code: 'name-too-large',
          message: `File is larger than ${'50MB'} characters`
        }
      }
      return null
    },
    onDropRejected: fileRejections => {
      toast.error(
        fileRejections.length > 0
          ? fileRejections[0].errors[0].code === 'file-too-large'
            ? 'File size exceeds the 50MB limit'
            : fileRejections[0].errors[0].code
          : 'Please select a valid file'
      )
    },
    // onDrop: acceptedFiles => {
    //   setInviteImage(acceptedFiles)
    //   formik.setFieldValue('imagePreview', acceptedFiles[0])
    // },
    onDrop: acceptedFiles => {
      console.log('acceptedFiles---->', acceptedFiles)
      if (acceptedFiles.length > 0) {
        setInviteImage(acceptedFiles)
        formik.setFieldValue('imagePreview', acceptedFiles[0])
        handleCustomMedia('image', acceptedFiles[0])
      }
    }
  })

  // const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
  //   multiple: false,
  //   maxFiles: 1,
  //   accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
  //   onDropRejected: () => toast.error('Only video files are allowed'),
  //   onDrop: acceptedFiles => {
  //     setInviteVideo(acceptedFiles)
  //     formik.setFieldValue('videoPreview', acceptedFiles[0])
  //   }
  // })

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    disabled: !isEdit,
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
    // onDrop: acceptedFiles => {
    //   if (acceptedFiles.length > 0) {
    //     handleCustomMedia('video', acceptedFiles[0])
    //   }
    // },
    onDrop: acceptedFiles => {
      console.log('acceptedFiles---->', acceptedFiles)
      if (acceptedFiles.length > 0) {
        setInviteVideo(acceptedFiles)
        formik.setFieldValue('videoPreview', acceptedFiles[0])
        handleCustomMedia('video', acceptedFiles[0])
      }
    }
  })

  const handleCustomMedia = async (type, fileData) => {
    setIsLoading(true)
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
        // params['file'] = fileLogo
        if (type === 'video') {
          formik.setFieldValue('fileVideo', fileLogo)
        } else if (type === 'image') {
          formik.setFieldValue('fileImage', fileLogo)
        } else if (type === 'pdf') {
          formik.setFieldValue('filePdf', fileLogo)
        }
      }

      // const result = await apiPost(`${baseURL}custom-media/add`, params)
      // toast.success(result?.data?.message)
      // getallCustomMedia()
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const [deleteOnUpdate, setDeleteOnUpdate] = useState([])

  const handleDeleteCustomMedia = async (key, type, id) => {
    try {
      console.log('del id---->', key, type, id)
      setIsLoading(true)

      if (id && id !== '') {
        console.log('edit in')
        // const alterRes = await apiPatch(`${baseURL}other-info/alter/${id}/${type}`)
        setDeleteOnUpdate([...deleteOnUpdate, { key: key, type }])
        toast.success('Add to deleted list')
        // if (alterRes?.data) {
        // const result = await apiDelete(`${baseURL}user/file-delete`, { key: key })
        // console.log(result)
        // toast.success(alterRes?.data?.message)
        // }
      }
      if (id === '' || !id) {
        console.log('upl in')
        const result = await apiDelete(`${baseURL}user/file-delete`, { key: key })
        console.log(result)
        toast.success('deleted successfully')
      }
      if (type === 'pdf') {
        console.log('both in')
        formik.setFieldValue('filePdf', null)
        formik.setFieldValue('filePdfPreview', null)
        setInviteFile([])
      } else if (type === 'image') {
        formik.setFieldValue('fileImage', null)
        formik.setFieldValue('imagePreview', null)
        setInviteImage([])
      } else if (type === 'video') {
        formik.setFieldValue('videoPreview', null)
        formik.setFieldValue('fileVideo', null)
        setInviteVideo([])
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const formik = useFormik({
    initialValues: {
      info_name: '',
      dispatchDateTime: moment(date).toDate(),

      filePdf: null,
      fileImage: null,
      fileVideo: null,

      filePdfPreview: null,
      imagePreview: null,
      videoPreview: null
    },
    validationSchema: yup.object({
      info_name: yup
        .string('Info Name is required')
        .trim()
        .required('Info Name is required')
        .min(3, 'Minimum 3 character required')
        .max(70, 'Maximum 70 character only allowed'),
      dispatchDateTime: yup.date().required('Dispatch Date Time is required')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)

        const params = {
          function_id: functionId,
          info_name: values.info_name,
          dispatch_date_time: values.dispatchDateTime
        }

        if (values.filePdf && values.filePdfPreview) {
          params.invitation_file = values.filePdf
        } else if (RowData?.invitation_file) {
          params.invitation_file = RowData.invitation_file
        }

        if (values.fileImage && values.imagePreview) {
          params.invitation_image = values.fileImage
        } else if (RowData?.invitation_image) {
          params.invitation_image = RowData.invitation_image
        }

        if (values.fileVideo && values.videoPreview) {
          params.invitation_video = values.fileVideo
        } else if (RowData?.invitation_video) {
          params.invitation_video = RowData.invitation_video
        }

        if (id !== '') {
          for (const d of deleteOnUpdate) {
            const result = await apiDelete(`${baseURL}user/file-delete`, { key: d.key })

            if (result.status === 200) {
              console.log(`Deleting ${d.type}...`)

              if (d.type === 'pdf') {
                params.invitation_file = values.filePdf?.length ? values.filePdf : []
              } else if (d.type === 'image') {
                params.invitation_image = values.fileImage?.length ? values.fileImage : []
              } else if (d.type === 'video') {
                params.invitation_video = values.fileVideo?.length ? values.fileVideo : []
              }
            }
          }

          setDeleteOnUpdate([])
        }

        console.log('Final params to send:', params)

        const result =
          id === ''
            ? await apiPost(`${baseURL}other-info/add`, params)
            : await apiPut(`${baseURL}other-info/update/${RowData.id}`, params)

        if (result?.data?.data?.id) {
          dispatch(handleEventId(result?.data?.data?.id))
        }
        toggle()
        setIsEdit(false)
        toast.success(result?.data?.message)
      } catch (e) {
        console.error(e)
        toast.error('Something went wrong.')
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const getInfoData = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        setIsEdit(false)
        formik.setFieldValue('info_name', data?.info_name)
        formik.setFieldValue('dispatchDateTime', data?.dispatch_date_time)
        formik.setFieldValue('filePdf', data?.invitation_file[0]?.url || 'NA')
        formik.setFieldValue('fileImage', data?.invitation_image[0]?.url || 'NA')
        formik.setFieldValue('fileVideo', data?.invitation_video[0]?.url || 'NA')
        setInviteFile(data?.invitation_file)
        setInviteImage(data?.invitation_image)
        setInviteVideo(data?.invitation_video)
      }
      console.log('formikkk---->', formik.values, data)
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  console.log('formikkk---->', formik.values, RowData)

  useEffect(() => {
    if (id !== '') {
      getInfoData()
    }
  }, [id, userData])

  //just for bckup
  //   try {
  //   console.log('in---->')
  //   setIsLoading(true)
  //   let params = {
  //     function_id: functionId,
  //     info_name: values.info_name,
  //     dispatch_date_time: values.dispatchDateTime
  //   }
  //   let fileLogo = null
  //   console.log('in---->', fileLogo, values.filePdfPreview)
  //   if (values.filePdfPreview !== null) {
  //     // const formData = new FormData()
  //     // formData.append('file', values.fileImagePreview)
  //     // const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
  //     // var temp = [imageRes?.data?.detail]
  //     // fileLogo = temp
  //     params['invitation_file'] = values.filePdf
  //   } else {
  //     params['invitation_file'] = RowData?.invitation_file
  //   }
  //   if (values.imagePreview) {
  //     params.invitation_image = values.fileImage
  //   } else {
  //     params['invitation_image'] = RowData?.invitation_image
  //   }
  //   console.log('in---->', fileLogo, values.fileVideo, values.videoPreview)

  //   if (values.videoPreview) {
  //     params['invitation_video'] = values.fileVideo
  //   } else {
  //     params['invitation_video'] = RowData?.invitation_video
  //   }
  //   console.log('params---->', params, deleteOnUpdate)
  //   if (id !== '') {
  //     for (const d of deleteOnUpdate) {
  //       const result = await apiDelete(`${baseURL}user/file-delete`, { key: d.key })
  //       // let result = {
  //       //   status: 200
  //       // }
  //       if (result.status === 200) {
  //         if (d.type === 'pdf') {
  //           console.log('Deleting PDF...')
  //           params['invitation_file'] = values.filePdf ? values.filePdf : []
  //         } else if (d.type === 'image') {
  //           console.log('Deleting Image...')
  //           params['invitation_image'] = values.fileImage ? values.fileImage : []
  //         } else if (d.type === 'video') {
  //           console.log('Deleting Video...')
  //           params['invitation_video'] = values.videoPreview ? values.videoPreview : []
  //         }
  //       }
  //     }
  //     setDeleteOnUpdate([])
  //   }
  //   console.log('params after---->', params, deleteOnUpdate, values.filePdf, values.fileImage, values.videoPreview)

  //   const result =
  //     id === ''
  //       ? await apiPost(`${baseURL}other-info/add`, params)
  //       : await apiPut(`${baseURL}other-info/update/${RowData.id}`, params)
  //   if (result?.data?.data?.id) {
  //     dispatch(handleEventId(result?.data?.data?.id))
  //   }
  //   setIsEdit(false)
  //   toast.success(result?.data?.message)
  // } catch (e) {
  //   toast.error(e)
  // }

  return (
    <Box
      className={classes.root}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
    >
      <Box className={classes.root}>
        <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
          <Header>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconButton
                sx={{
                  p: '0.438rem',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                  }
                }}
                onClick={handleClose}
                variant='outlined'
                size='small'
              >
                <Icon icon='famicons:arrow-back-outline' fontSize={20} />
              </IconButton>
              <Typography variant='h5'>{eventId !== '' ? 'Edit OtherInfo' : 'Create OtherInfo'}</Typography>
            </Box>
            {eventId !== '' && (
              <Button
                sx={{
                  p: '0.438rem',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                  }
                }}
                onClick={() => setIsEdit(!isEdit)}
                variant='outlined'
                size='small'
              >
                {isEdit ? 'View' : 'Edit'}{' '}
              </Button>
            )}
          </Header>
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  px: 8
                }}
              >
                <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                  <TextField
                    sx={{ my: 2 }}
                    label={'Info Name'}
                    required
                    disabled={!isEdit}
                    fullWidth
                    name='info_name'
                    error={formik.touched.info_name && Boolean(formik.errors.info_name)}
                    value={formik.values.info_name
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    onChange={e => formik.handleChange(e)}
                    helperText={formik.touched.info_name && formik.errors.info_name && formik.errors.info_name}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                  <DatePickerWrapper>
                    <DatePicker
                      timeIntervals={1}
                      disabled={!isEdit}
                      // selected={formik.values.dispatchDateTime}
                      selected={formik.values.dispatchDateTime ? new Date(formik.values.dispatchDateTime) : null}
                      id='dispatchDateTime'
                      showTimeSelect
                      dateFormat='dd-MM-YYYY h:mm aa'
                      minDate={moment(new Date()).toDate()}
                      maxDate={moment(new Date()).add(6, 'months').toDate()}
                      maxTime={moment(formik.values.dispatchDateTime).endOf('day').toDate()}
                      minTime={
                        moment(formik.values.dispatchDateTime).isBefore(moment(), 'day')
                          ? moment().endOf('day').toDate()
                          : moment(formik.values.dispatchDateTime).isSame(moment(), 'day')
                            ? moment().toDate()
                            : moment().startOf('day').toDate()
                      }
                      popperPlacement={popperPlacement}
                      onChange={date => {
                        console.log('clicked--->', date)
                        formik.setFieldValue('dispatchDateTime', date)
                      }}
                      placeholderText='Click to select a Dispatch Date Time'
                      customInput={
                        <TextField
                          label='Dispatch Date Time *'
                          required
                          fullWidth
                          disabled={!isEdit}
                          error={formik.touched.dispatchDateTime && Boolean(formik.errors.dispatchDateTime)}
                          helperText={
                            formik.touched.dispatchDateTime &&
                            formik.errors.dispatchDateTime &&
                            formik.errors.dispatchDateTime
                          }
                          sx={{ my: 2 }}
                        />
                      }
                    />
                  </DatePickerWrapper>
                </Grid2>
                <Fragment>
                  <Typography variant='h6' sx={{ mb: 2.5 }}>
                    Invitation
                  </Typography>
                  {!inviteFile.length && (
                    <div
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
                      <input {...getPDFInputProps('host')} />
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
                  {inviteFile.length > 0 && (
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
                                  if (inviteFile[0]?.url) {
                                    window.open(inviteFile[0]?.url, '_blank')
                                  } else if (inviteFile[0]?.name) {
                                    const file = inviteFile[0]
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
                                disabled={RowData ? !isEdit : false}
                                onClick={() => {
                                  console.log('params--->pdf', RowData)
                                  handleDeleteCustomMedia(
                                    RowData?.invitation_file
                                      ? RowData?.invitation_file[0]?.key
                                      : formik.values?.filePdf[0]?.key,
                                    'pdf',
                                    RowData.id
                                  )
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
                                (inviteFile.length > 0 && inviteFile[0]?.name) ||
                                (inviteFile.length > 0 && inviteFile[0]?.file_name)
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Grid2>
                  )}
                </Fragment>
                <Fragment>
                  <Typography variant='h6' sx={{ mb: 2.5 }}>
                    Invitation Image
                  </Typography>
                  {!inviteImage.length && (
                    <div
                      {...getImageRootProps({
                        className: 'dropzone',
                        style: {
                          border: '2px dashed #ccc',
                          borderRadius: '4px',
                          padding: '20px',
                          cursor: 'pointer'
                        }
                      })}
                    >
                      <input {...getImageInputProps('host')} />
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
                  {inviteImage.length > 0 && (
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
                                  if (inviteImage[0]?.url) {
                                    window.open(inviteImage[0]?.url, '_blank')
                                  } else if (inviteImage[0]?.name) {
                                    const file = inviteImage[0]
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
                                disabled={RowData ? !isEdit : false}
                                onClick={() => {
                                  console.log('params--->pdf', RowData)
                                  handleDeleteCustomMedia(
                                    RowData?.invitation_image
                                      ? RowData?.invitation_image[0]?.key
                                      : formik.values?.fileImage[0]?.key,
                                    'image',
                                    RowData.id
                                  )
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
                                (inviteImage.length > 0 && inviteImage[0]?.name) ||
                                (inviteImage.length > 0 && inviteImage[0]?.file_name)
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Grid2>
                  )}
                </Fragment>
                <Fragment>
                  <Typography variant='h6' sx={{ mb: 2.5 }}>
                    Invitation Video
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
                                disabled={RowData ? !isEdit : false}
                                onClick={() => {
                                  console.log('params--->pdf', RowData)
                                  handleDeleteCustomMedia(
                                    RowData?.invitation_video
                                      ? RowData?.invitation_video[0]?.key
                                      : formik.values?.fileVideo[0]?.key,
                                    'video',
                                    RowData.id
                                  )
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
                                (inviteVideo?.length > 0 && inviteVideo[0]?.name) ||
                                (inviteVideo?.length > 0 && inviteVideo[0]?.file_name)
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Grid2>
                  )}
                </Fragment>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100%'
                  }}
                >
                  <LoadingButton
                    sx={{ mt: 4 }}
                    loading={isLoading}
                    disabled={!isEdit}
                    // size='small'
                    variant='contained'
                    onClick={() => formik.handleSubmit()}
                  >
                    {id !== '' ? 'Update' : 'Submit '}
                  </LoadingButton>
                </Box>
                {eventId && (
                  <Fragment>
                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          height: '64px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        Reminder
                      </AccordionSummary>
                      <AccordionDetails>
                        <NotificationsDispatchMedia getAll={() => {}} id={id} />
                      </AccordionDetails>
                    </Accordion>
                  </Fragment>
                )}
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      </Box>
    </Box>
  )
}

export default SideBarAccommodation
