// ** React Imports
import React, { Fragment, useEffect, useRef, useState } from 'react'
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
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid2,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Modal,
  TextField,
  Typography
} from '@mui/material'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { makeStyles } from '@mui/styles'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { CameraAlt, DeleteOutline } from '@mui/icons-material'
import ImageUpload from 'src/hooks/ImageUpload'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import DatePicker from 'react-datepicker'
import { useDropzone } from 'react-dropzone'
const NotificationsDispatchMedia = React.lazy(() => import('../../NotificationDispatchMedia'))
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CustomMediaEvents from '../../CustomMedia'
import { handleEventId } from 'src/store/adminMod'

const useStyles = makeStyles({
  root: {}
})
const key = process.env.KEY
const libraries = ['places']

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const SideBarEvents = props => {
  // ** Props
  const { toggle, id, RowData } = props
  let libRef = useRef(libraries)
  const originRef = useRef()
  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const filer = useRef()
  const [bannerImage, setBannerImage] = useState('')
  const [openImageEdit, setImageEdit] = useState(false)
  const [dopen, setdOpen] = useState(false)
  const [delLoading, setDelLoading] = useState(false)

  const handledClose = () => {
    setdOpen(false)
  }
  const [isPreview, setPreviewMode] = useState(true)
  const [isLogoTemp, setLogoTemp] = useState(false)
  const [isCoverTemp, setCoverTemp] = useState(false)
  const [isEdit, setIsEdit] = useState(true)
  const [titleName, setTitleName] = useState('')
  const [cropImage, setCropImage] = useState()
  const [cropType, setCropType] = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [logoFormData, setLogoFormData] = useState(null)
  const [uploadedFileData, setUploadedFileData] = useState([{ key: '', url: '', file_name: '' }])
  const [isLogoUploaded, setIsLogoUploaded] = useState(false)
  const [date, setDate] = useState(new Date())
  const { functionId, eventId } = useSelector(state => state.adminMod)
  const [modelOpen, setModelOpen] = useState(false)
  const [inviteFile, setInviteFile] = useState([])

  const handleModelClose = () => {
    setModelOpen(false)
  }
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key,
    libraries: libRef.current
  })

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf']
    },
    validator: file => {
      if (file.size.length > 50 * 1024 * 1024) {
        return {
          code: 'name-too-large',
          message: `File is larger than ${'50MB'} characters`
        }
      }
      return null
    },
    onDropRejected: fileRejections => {
      console.log(fileRejections)
      toast.error(fileRejections.length > 0 ? fileRejections[0].errors[0].message : 'Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log(acceptedFiles)
      setInviteFile(acceptedFiles)
      formik.setFieldValue('fileImagePreview', acceptedFiles[0])
    }
  })
  const formik = useFormik({
    initialValues: {
      eventName: '',
      venueName: '',
      locationMap: '',
      notes: '',
      lat: '',
      lng: '',
      eventDateTime: moment(date).toDate(),
      giftPreference: '',
      dispatchDateTime: moment(date).toDate(),
      image: '',
      imagePreview: null,
      fileImage: '',
      fileImagePreview: null
    },
    validationSchema: yup.object({
      dispatchDateTime: yup.date().required('Master Dispatch Date Time is required'),
      venueName: yup
        .string('Venue Name is required')
        .trim()
        .required('Venue Name is required')
        .min(3, 'Minimum 3 character required')
        .max(200, 'Maximum 70 character only allowed'),
      eventDateTime: yup.date().required('Event Date Time is required'),
      giftPreference: yup.string().required('Gift Preference is required'),
      locationMap: yup.string().required('Location is required'),
      notes: yup
        .string('Description is required')
        .trim()
        .required('Description is required')
        .min(4, 'Minimum 4 character required')
        .max(700, 'Maximum 700 character only allowed'),
      eventName: yup
        .string('Event Name is required')
        .trim()
        .required('Event Name is required')
        .min(3, 'Minimum 3 character required')
        .max(70, 'Maximum 70 character only allowed')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        handledClose()
        let params = {
          function_id: functionId,
          event_name: values.eventName,
          venue_name: values.venueName,
          location_map: values.locationMap,
          notes: values.notes,
          date_time: values.eventDateTime,
          gift_preference: values.giftPreference,
          dispatch_date_time: values.dispatchDateTime,
          lat: values.lat,
          long: values.lng
        }
        let mainLogo = null
        if (values.imagePreview !== null) {
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, logoFormData, true)
          var temp = [imageRes?.data?.detail]
          mainLogo = temp
          params['event_logo'] = mainLogo
        } else {
          params['event_logo'] = RowData?.event_logo
        }

        let fileLogo = null
        if (values.fileImagePreview !== null) {
          const formData = new FormData()
          formData.append('file', values.fileImagePreview)
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
          var temp = [imageRes?.data?.detail]
          fileLogo = temp
          params['invitation_files'] = fileLogo
        } else {
          params['invitation_files'] = RowData?.invitation_files
        }
        const result =
          eventId === ''
            ? await apiPost(`${baseURL}event/add`, params)
            : await apiPut(`${baseURL}event/update/${RowData.id || eventId}`, params)
        console.log(result)
        if (result?.data?.data?.id) {
          setIsEdit(false)
          setTitleName(values.eventName)
          dispatch(handleEventId(result?.data?.data?.id))
        }
        if (result?.data?.data?.event_logo?.length > 0) {
          setIsLogoUploaded(!isLogoUploaded)
        }
        toast.success(
          eventId === '' ? 'Event created Successfully, You can proceed creating the reminders' : result?.data?.message
        )
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const handleOrigin = () => {
    if (!originRef.current?.value) {
      return
    }
    formik.setFieldValue('venueName', originRef.current.value)
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: originRef.current.value }, (results, status) => {
      console.log('Geocode status:', status, results, originRef.current.value)
      console.log('results[0]------>', results)
      if (status === 'OK') {
        if (results[0]) {
          const address = results[0].formatted_address
          const newLocation = results[0].geometry.location
          const location = {
            lat: newLocation.lat(),
            lng: newLocation.lng()
          }
          formik.setFieldValue('locationMap', address)
          formik.setFieldValue('lat', `${location?.lat}`)
          formik.setFieldValue('lng', `${location?.lng}`)
        }
      }
    })
  }
  const getEventData = async () => {
    try {
      const result = await apiGet(`${baseURL}event/details/${eventId}`)
      console.log(result)
      if (result?.data?.detail[0]?.id != '') {
        setIsEdit(false)
        const data = result?.data?.detail[0]
        setTitleName(data?.event_name)

        formik.setFieldValue('eventName', data?.event_name)
        formik.setFieldValue('venueName', data?.venue_name)
        formik.setFieldValue('lat', data?.lat?.toString())
        formik.setFieldValue('lng', data?.long?.toString())
        formik.setFieldValue('notes', data?.notes)
        formik.setFieldValue('locationMap', data?.location_map)
        formik.setFieldValue('eventDateTime', moment(data?.date_time).toDate())
        formik.setFieldValue('giftPreference', data?.gift_preference)
        formik.setFieldValue('image', data?.event_logo[0]?.url || '')
        formik.setFieldValue('fileImage', data?.invitation_files[0]?.url || 'NA')
        setInviteFile(data?.invitation_files)
        formik.setFieldValue('dispatchDateTime', moment(data?.dispatch_date_time).toDate())
        if (data?.event_logo?.length > 0) {
          setUploadedFileData(data?.event_logo)
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '' || eventId !== '') {
      getEventData()
    }
  }, [id, userData, eventId, isLogoUploaded])

  const deleteImage = async () => {
    const key = { key: uploadedFileData[0]?.key }
    try {
      const result = await apiDelete(`${baseURL}user/file-delete`, key)
      if (result?.status == 200) {
        let params = {
          function_id: functionId,
          event_name: formik.values.eventName,
          venue_name: formik.values.venueName,
          location_map: formik.values.locationMap,
          notes: formik.values.notes,
          date_time: formik.values.eventDateTime,
          gift_preference: formik.values.giftPreference,
          dispatch_date_time: formik.values.dispatchDateTime,
          lat: formik.values.lat,
          long: formik.values.lng
        }
        const response = await apiPut(`${baseURL}event/update/${RowData.id || eventId}`, params)

        if (response?.status == 200) {
          setIsLogoUploaded(!isLogoUploaded)
          formik.setFieldValue('imagePreview', null)
          formik.setFieldValue('image', '')
          setLogoFormData(null)
          setUploadedFileData([{ key: '', url: '', file_name: '' }])
          toast.success('Event logo deleted successfully')
        }
      }
    } catch (e) {
      console.log(e)
      toast.error(e)
    }
  }

  const uploadImage = async (type, file, isDelete = false) => {
    setImageEdit(false)
    if (!isDelete) {
      const formData = new FormData()
      formData.append('file', file)
      var options = { content: formData }
      if (type == 'logo') {
        setLogoFormData(formData)
        const ur = URL.createObjectURL(file)
        formik.setFieldValue('imagePreview', ur)
      } else if (type == 'cover') {
        formData.append('service_type', 'cover_image')
        let res = await uploadFile(formData)
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(false)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    } else {
      if (type == 'logo') {
        setLogoFormData(null)
        const ur = URL.revokeObjectURL(file)
        formik.setFieldValue('imagePreview', ur)
      } else {
        let res = await deleteFile({
          service_type: 'cover_image'
        })
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(true)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    }
  }

  const editImage = type => {
    setPreviewMode(true)
    if (type === 'cover') {
      setCropAspectRatio(3.29 / 1)
      let banner =
        bannerImage !== '' ? bannerImage : userData?.cover_image_url ? userData?.cover_image_url : 'placeholder'
      if (isCoverTemp) {
        filer.current.click()
        setCropType(type)
      } else {
        if (banner == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(banner)
          setCropType(type)
          setImageEdit(true)
        }
      }
    } else {
      setCropAspectRatio(1 / 1)
      let logoImage = 'placeholder'
      if (isLogoTemp) {
        filer.current.click()
        setCropType(type)
      } else {
        if (logoImage == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(logoImage)
          setCropType(type)
          setImageEdit(true)
        }
      }
    }
  }

  const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

  const onChange = e => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    if (files[0].size < 5000000) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result)
        setPreviewMode(false)
        setImageEdit(true)
        e.target.value = null
      }
      reader.readAsDataURL(files[0])
    } else {
      toast.warn('File size should be below 5MB.')
    }
  }
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  } else
    return (
      <Box
        className={classes.root}
        sx={{
          '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
        }}
      >
        <Modal
          open={modelOpen}
          onClose={handleModelClose}
          aria-labelledby='modal-modal-title'
          aria-describedby='modal-modal-description'
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 600,
              bgcolor: 'background.paper',
              border: '2px solid #000',
              boxShadow: 24,
              p: 4
            }}
          >
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant='h5' sx={{ mb: 3, fontWeight: 'bold' }}>
                  Sharing QR Code Upfront:
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Host (QR Code Distribution):</Typography>
                  <Typography>
                    "Share this gift QR code with all guests. They will then show you their QR code for confirmation."
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Guest (QR Presentation):</Typography>
                  <Typography>"Show this QR code to the host so they can confirm you received the gift."</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Host (Scanning Guest QR):</Typography>
                  <Typography>"Scan the guest's QR code to confirm gift handover."</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant='h5' sx={{ mb: 3, fontWeight: 'bold' }}>
                  Scanning QR Code on the Spot:
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Host (QR Display):</Typography>
                  <Typography>
                    "Guests will scan the QR code displayed by the host to identify the gift assigned to them."
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Guest (Scanning Host QR):</Typography>
                  <Typography>
                    "Upon scanning, the host device uses this QR code to inform the host you are ready to receive your
                    gift."
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 'bold' }}>Host (Confirmation):</Typography>
                  <Typography>"Tap 'Yes' to confirm you have given the gift to the guest."</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Modal>
        <input
          style={{ display: 'none' }}
          id='raised-button-file'
          onChange={onChange}
          ref={filer}
          type='file'
          accept='.jpg,.png,.jpeg,.webpp'
        />
        <ImageUpload
          isOpen={openImageEdit}
          handleUpload={uploadImage}
          type={cropType}
          isPreview={isPreview}
          title={cropType == 'logo' ? 'Change Logo' : 'Change Cover Photo'}
          aspectRatio={cropAspectRatio}
          selectedImage={cropImage}
          handleClose={(e, reason) => {
            if (reason && reason == 'backdropClick') {
              return
            }
            setImageEdit(false)
          }}
        />
        <Box className={classes.root}>
          <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
            <Header justifyContent={'space-between'}>
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
                <Typography variant='h5'>
                  {eventId !== '' ? 'Edit Event - ' + `${titleName}` : 'Create Event'}
                </Typography>
              </Box>
              <Box>
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
              </Box>
            </Header>
          </Box>
          <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  {formik.values.image != '' || uploadedFileData[0].url != '' ? (
                    <Badge
                      overlap='circular'
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <IconButton
                          disabled={!isEdit}
                          onClick={() => deleteImage()}
                          sx={{
                            bgcolor: 'white',
                            width: 22,
                            height: 22,
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                        >
                          {isEdit && (
                            <DeleteOutline
                              sx={{
                                color: 'black',
                                width: 14,
                                height: 14
                              }}
                            />
                          )}
                        </IconButton>
                      }
                    >
                      <Avatar
                        alt={capitalize(formik.values.eventName)}
                        src={
                          formik.values.imagePreview !== null
                            ? formik.values.imagePreview
                            : formik.values.image !== ''
                              ? formik.values.image
                              : 'NA'
                        }
                        sx={{ width: 88, height: 88 }}
                      />
                    </Badge>
                  ) : (
                    <Badge
                      overlap='circular'
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <IconButton
                          disabled={!isEdit}
                          onClick={() => editImage('logo')}
                          sx={{
                            bgcolor: 'white',
                            width: 22,
                            height: 22,
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                        >
                          {isEdit && (
                            <CameraAlt
                              sx={{
                                color: 'black',
                                width: 14,
                                height: 14
                              }}
                            />
                          )}
                        </IconButton>
                      }
                    >
                      <Avatar
                        alt={capitalize(formik.values.eventName)}
                        src={
                          formik.values.imagePreview !== null
                            ? formik.values.imagePreview
                            : formik.values.image !== ''
                              ? formik.values.image
                              : 'NA'
                        }
                        sx={{ width: 88, height: 88 }}
                      />
                    </Badge>
                  )}
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    px: 8
                  }}
                >
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Event Name'}
                        required
                        disabled={!isEdit}
                        fullWidth
                        name='eventName'
                        error={formik.touched.eventName && Boolean(formik.errors.eventName)}
                        value={formik.values.eventName
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => formik.handleChange(e)}
                        helperText={formik.touched.eventName && formik.errors.eventName && formik.errors.eventName}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <Autocomplete>
                        <TextField
                          sx={{ my: 2 }}
                          label={'Venue Name'}
                          required
                          disabled={!isEdit}
                          inputRef={originRef}
                          onBlur={handleOrigin}
                          fullWidth
                          name='venueName'
                          error={formik.touched.venueName && Boolean(formik.errors.venueName)}
                          value={formik.values.venueName
                            .trimStart()
                            .replace(/\s\s+/g, '')
                            .replace(/\p{Emoji_Presentation}/gu, '')}
                          onChange={e => formik.handleChange(e)}
                          helperText={formik.touched.venueName && formik.errors.venueName && formik.errors.venueName}
                        />
                      </Autocomplete>
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <DatePickerWrapper>
                        <DatePicker
                          selected={formik.values.eventDateTime}
                          id='eventDateTime'
                          showTimeSelect
                          disabled={!isEdit}
                          timeIntervals={1}
                          dateFormat='dd-MM-YYYY h:mm aa'
                          minDate={moment(new Date()).toDate()}
                          maxDate={moment(new Date()).add(6, 'months').toDate()}
                          maxTime={moment(formik.values.eventDateTime).endOf('day').toDate()}
                          minTime={
                            moment(formik.values.eventDateTime).isBefore(moment(), 'day')
                              ? moment().endOf('day').toDate()
                              : moment(formik.values.eventDateTime).isSame(moment(), 'day')
                                ? moment().toDate()
                                : moment().startOf('day').toDate()
                          }
                          popperPlacement={popperPlacement}
                          onChange={date => {
                            console.log(date)
                            formik.setFieldValue('eventDateTime', date)
                          }}
                          placeholderText='Click to select a Event Date Time'
                          customInput={
                            <TextField
                              label='Event Date Time *'
                              required
                              fullWidth
                              disabled={!isEdit}
                              error={formik.touched.eventDateTime && Boolean(formik.errors.eventDateTime)}
                              helperText={
                                formik.touched.eventDateTime &&
                                formik.errors.eventDateTime &&
                                formik.errors.eventDateTime
                              }
                              sx={{ my: 2 }}
                            />
                          }
                        />
                      </DatePickerWrapper>
                    </Grid2>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Location'}
                        required
                        fullWidth
                        name='locationMap'
                        disabled={!isEdit}
                        error={formik.touched.locationMap && Boolean(formik.errors.locationMap)}
                        value={formik.values.locationMap
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => formik.handleChange(e)}
                        helperText={
                          formik.touched.locationMap && formik.errors.locationMap && formik.errors.locationMap
                        }
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        fullWidth
                        required
                        select
                        label='Gift Preference'
                        name='giftPreference'
                        disabled={!isEdit}
                        value={formik.values.giftPreference}
                        onChange={formik.handleChange}
                        sx={{ my: 2 }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position='end'>
                                <IconButton onClick={() => setModelOpen(true)}>
                                  <Icon icon='ic:twotone-info' />
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                        error={formik.touched.giftPreference && Boolean(formik.errors.giftPreference)}
                        helperText={
                          formik.touched.giftPreference && formik.errors.giftPreference && formik.errors.giftPreference
                        }
                      >
                        <MenuItem value=''>Select Gift Preference</MenuItem>
                        <MenuItem value='scan'>Scan</MenuItem>
                        <MenuItem value='qr_code'>QR Code</MenuItem>
                        <MenuItem value='none'>None</MenuItem>
                      </TextField>
                    </Grid2>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Description'}
                        multiline
                        minRows={1}
                        maxRows={3}
                        required
                        fullWidth
                        disabled={!isEdit}
                        name='notes'
                        error={formik.touched.notes && Boolean(formik.errors.notes)}
                        value={formik.values.notes
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => formik.handleChange(e)}
                        helperText={formik.touched.notes && formik.errors.notes && formik.errors.notes}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <DatePickerWrapper>
                        <DatePicker
                          selected={formik.values.dispatchDateTime}
                          id='dispatchDateTime'
                          showTimeSelect
                          disabled={!isEdit}
                          timeIntervals={1}
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
                            console.log(date)
                            formik.setFieldValue('dispatchDateTime', date)
                          }}
                          placeholderText='Click to select a Master Dispatch Date Time'
                          customInput={
                            <TextField
                              label='Master Dispatch Date Time *'
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
                    {false && (
                      <Grid2 size={{ xs: 12, lg: 3, xl: 3, md: 12, sm: 12 }}>
                        <TextField
                          sx={{ my: 2 }}
                          label={'Latitude'}
                          fullWidth
                          name='lat'
                          error={formik.touched.lat && Boolean(formik.errors.lat)}
                          value={formik.values.lat
                            ?.trimStart()
                            .replace(/\s\s+/g, '')
                            .replace(/\p{Emoji_Presentation}/gu, '')}
                          onChange={e => formik.handleChange(e)}
                          helperText={formik.touched.lat && formik.errors.lat && formik.errors.lat}
                        />
                      </Grid2>
                    )}
                    {false && (
                      <Grid2 size={{ xs: 12, lg: 3, xl: 3, md: 12, sm: 12 }}>
                        <TextField
                          sx={{ my: 2 }}
                          label={'Longitude'}
                          fullWidth
                          name='lng'
                          error={formik.touched.lng && Boolean(formik.errors.lng)}
                          value={formik.values.lng
                            .trimStart()
                            .replace(/\s\s+/g, '')
                            .replace(/\p{Emoji_Presentation}/gu, '')}
                          onChange={e => formik.handleChange(e)}
                          helperText={formik.touched.lng && formik.errors.lng && formik.errors.lng}
                        />
                      </Grid2>
                    )}
                  </Grid2>
                  <Box my={2}>
                    <Typography variant='h6' sx={{ mb: 2.5 }}>
                      PDF ATTACHMENT FOR MASTER INVITE
                    </Typography>

                    {!inviteFile.length && isEdit && (
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
                              // mb: 2.75,
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
                                {isEdit && (
                                  <IconButton
                                    edge='end'
                                    aria-label='delete'
                                    onClick={() => {
                                      setInviteFile([])
                                      formik.setFieldValue('fileImagePreview', null)
                                    }}
                                  >
                                    <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                                  </IconButton>
                                )}
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
                  </Box>
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
                      variant='contained'
                      onClick={async () => {
                        const err = await formik.validateForm()
                        console.log(err)
                        if (Object.keys(err).length === 0) {
                          console.log(formik.values.giftPreference)
                          formik.values.giftPreference === 'none' ? formik.handleSubmit() : setdOpen(true)
                        } else {
                          Object.keys(err).map(key => {
                            formik.setFieldError(key, err[key])
                            formik.setFieldTouched(key, true)
                          })
                        }
                      }}
                    >
                      {eventId !== '' ? 'Update' : 'Submit '}
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
                      {/* <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          Other Media Files
                        </AccordionSummary>
                        <AccordionDetails>
                          <CustomMediaEvents getAll={() => { }} id={id}  />
                        </AccordionDetails>
                      </Accordion> */}
                    </Fragment>
                  )}
                </Box>
              </Grid2>
            </Grid2>
          </Box>
        </Box>
        <Dialog
          open={dopen}
          onClose={handledClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{'Note'}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              Gift type Selected : <strong>{formatString(formik.values.giftPreference)}</strong>. Please ensure all
              arrangements are in place for gift distribution.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button varient='outlined' onClick={handledClose}>
              Cancel
            </Button>
            <LoadingButton
              loading={delLoading}
              varient='contained'
              onClick={formik.handleSubmit}
              sx={{ color: 'green' }}
            >
              Ok
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Box>
    )
}

export default SideBarEvents
function formatString(str) {
  if (!str) return '' // Handle empty input
  return str
    .split('_')
    .map(word => {
      if (!word.trim()) return ''
      return word.toLowerCase().charAt(0).toUpperCase() + word.toLowerCase().slice(1)
    })
    .join(' ')
    .trim()
}
