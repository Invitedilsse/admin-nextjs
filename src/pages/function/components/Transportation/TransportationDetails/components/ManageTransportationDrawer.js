// ** React Imports
import React, { Fragment, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CircularProgress,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import DatePicker from 'react-datepicker'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
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

const key = process.env.KEY
const libraries = ['places']

const SideBarTransport = props => {
  // ** Props
  const { toggle, id, RowData } = props
  let libRef = useRef(libraries)
  const originRef = useRef()
  const { isLoaded } = useJsApiLoader({
    // id: 'google-map-script',
    googleMapsApiKey: key,
    libraries: libRef.current
  })
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

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf']
    },
    onDropRejected: fileRejections => {
      toast.error('Please select a valid file')
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
      title: '',
      venueName: '',
      locationMap: '',
      notes: '',
      lat: '',
      lng: '',
      transportationName: '',
      dateTime: moment(date).toDate(),
      modeOfTravel: '',
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
      dateTime: yup.date().required('Date Time is required'),
      modeOfTravel: yup.string().required('Mode of Travel is required'),
      transportationName: yup.string().required('Transportation Name is required'),
      locationMap: yup.string().required('Location is required'),
      notes: yup
        .string('Description is required')
        .trim()
        .required('Description is required')
        .min(4, 'Minimum 4 character required')
        .max(700, 'Maximum 700 character only allowed'),
      title: yup
        .string('Title is required')
        .trim()
        .required('Title is required')
        .min(3, 'Minimum 3 character required')
        .max(70, 'Maximum 70 character only allowed')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          function_id: functionId,
          title: values.title,
          venue_name: values.venueName,
          location_map: values.locationMap,
          notes: values.notes,
          date_time: values.dateTime,
          mode_of_travel: values.modeOfTravel,
          transport_name: values.transportationName,
          lat: values.lat,
          long: values.lng,
          dispatch_date_time: values.dispatchDateTime
        }

        let fileLogo = null
        if (values.fileImagePreview !== null) {
          const formData = new FormData()
          formData.append('file', values.fileImagePreview)
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
          var temp = [imageRes?.data?.detail]
          fileLogo = temp
          params['invitation_file'] = fileLogo
        } else {
          params['invitation_file'] = RowData?.invitation_file
        }
        const result =
          id === ''
            ? await apiPost(`${baseURL}transportation/add`, params)
            : await apiPut(`${baseURL}transportation/update/${RowData.id}`, params)
        if (result?.data?.data?.id) {
          dispatch(handleEventId(result?.data?.data?.id))
        }
        setIsEdit(false)
        toast.success(result?.data?.message)
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
      if (status === 'OK') {
        if (results[0]) {
          const address = results[0].formatted_address
          const newLocation = results[0].geometry.location
          const location = {
            lat: newLocation.lat(),
            lng: newLocation.lng()
          }
          console.log('location', location)
          console.log('address', address)
          originRef.current.value = address
          formik.setFieldValue('locationMap', address)
          formik.setFieldValue('lat', `${location?.lat}`)
          formik.setFieldValue('lng', `${location?.lng}`)
        }
      }
    })
  }
  const getTransportation = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        setIsEdit(false)
        formik.setFieldValue('title', data?.title)
        formik.setFieldValue('lat', data?.lat)
        formik.setFieldValue('lng', data?.long)
        formik.setFieldValue('venueName', data?.venue_name)
        formik.setFieldValue('notes', data?.notes)
        formik.setFieldValue('locationMap', data?.location_map)
        formik.setFieldValue('dateTime', moment(data?.date_time).toDate())
        formik.setFieldValue('modeOfTravel', data?.mode_of_travel)
        formik.setFieldValue('transportationName', data?.transport_name)
        formik.setFieldValue('fileImage', data?.invitation_file[0]?.url || 'NA')
        setInviteFile(data?.invitation_file)
        formik.setFieldValue('dispatchDateTime', moment(data?.dispatch_date_time).toDate())
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getTransportation()
    }
  }, [id, userData])

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
                <Typography variant='h5'>{eventId !== '' ? 'Edit Transportation' : 'Create Transportation'}</Typography>
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
                  <Grid2 container spacing={6}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Title'}
                        required
                        disabled={!isEdit}
                        fullWidth
                        name='title'
                        error={formik.touched.title && Boolean(formik.errors.title)}
                        value={formik.values.title
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => formik.handleChange(e)}
                        helperText={formik.touched.title && formik.errors.title && formik.errors.title}
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
                  <Grid2 container spacing={6}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <DatePickerWrapper>
                        <DatePicker
                          selected={formik.values.dateTime}
                          id='dateTime'
                          showTimeSelect
                          disabled={!isEdit}
                          timeIntervals={1}
                          dateFormat='dd-MM-YYYY h:mm aa'
                          minDate={moment(new Date()).toDate()}
                          maxDate={moment(new Date()).add(6, 'months').toDate()}
                          maxTime={moment(formik.values.dateTime).endOf('day').toDate()}
                          minTime={
                            moment(formik.values.dateTime).isBefore(moment(), 'day')
                              ? moment().endOf('day').toDate()
                              : moment(formik.values.dateTime).isSame(moment(), 'day')
                                ? moment().toDate()
                                : moment().startOf('day').toDate()
                          }
                          popperPlacement={popperPlacement}
                          onChange={date => {
                            formik.setFieldValue('dateTime', date)
                          }}
                          placeholderText='Click to select a Date Time'
                          customInput={
                            <TextField
                              label='Date Time *'
                              disabled={!isEdit}
                              required
                              fullWidth
                              error={formik.touched.dateTime && Boolean(formik.errors.dateTime)}
                              helperText={formik.touched.dateTime && formik.errors.dateTime && formik.errors.dateTime}
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
                        disabled={!isEdit}
                        fullWidth
                        name='locationMap'
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
                  <Grid2 container spacing={6}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        fullWidth
                        required
                        select
                        disabled={!isEdit}
                        label='Mode Of Travel'
                        name='modeOfTravel'
                        value={formik.values.modeOfTravel}
                        onChange={formik.handleChange}
                        sx={{ my: 2 }}
                        slotProps={{
                          select: {}
                        }}
                        error={formik.touched.modeOfTravel && Boolean(formik.errors.modeOfTravel)}
                        helperText={
                          formik.touched.modeOfTravel && formik.errors.modeOfTravel && formik.errors.modeOfTravel
                        }
                      >
                        <MenuItem value=''>Select Mode Of Travel</MenuItem>
                        <MenuItem value='flight'>Flight</MenuItem>
                        <MenuItem value='train'>Train</MenuItem>
                        <MenuItem value='bus'>Bus</MenuItem>
                        <MenuItem value='car'>Car</MenuItem>
                      </TextField>
                    </Grid2>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Transportation Name'}
                        disabled={!isEdit}
                        required
                        fullWidth
                        name='transportationName'
                        error={formik.touched.transportationName && Boolean(formik.errors.transportationName)}
                        value={formik.values.transportationName
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => formik.handleChange(e)}
                        helperText={
                          formik.touched.transportationName &&
                          formik.errors.transportationName &&
                          formik.errors.transportationName
                        }
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={6}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                      <TextField
                        sx={{ my: 2 }}
                        label={'Description'}
                        multiline
                        minRows={1}
                        disabled={!isEdit}
                        maxRows={3}
                        required
                        fullWidth
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
                            formik.setFieldValue('dispatchDateTime', date)
                          }}
                          placeholderText='Click to select a Master Dispatch Date Time'
                          customInput={
                            <TextField
                              label='Master Dispatch Date Time *'
                              required
                              disabled={!isEdit}
                              fullWidth
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
                  </Grid2>
                  <Grid2 container spacing={2}>
                    {false && (
                      <>
                        <Grid2 size={{ xs: 12, lg: 3, xl: 3, md: 12, sm: 12 }}>
                          <TextField
                            sx={{ my: 2 }}
                            label={'Latitude'}
                            disabled={!isEdit}
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
                        <Grid2 size={{ xs: 12, lg: 3, xl: 3, md: 12, sm: 12 }}>
                          <TextField
                            sx={{ my: 2 }}
                            label={'Longitude'}
                            disabled={!isEdit}
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
                      </>
                    )}
                  </Grid2>
                  <Fragment>
                    <Typography variant='h6' sx={{ mb: 2.5 }}>
                      Invitation
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
                      disabled={!isEdit}
                      loading={isLoading}
                      variant='contained'
                      onClick={() => formik.handleSubmit()}
                    >
                      {id !== '' ? 'Update' : 'Submit '}
                    </LoadingButton>
                  </Box>
                  {eventId && (
                    <Box sx={{ my: 4 }}>
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
                    </Box>
                  )}
                </Box>
              </Grid2>
            </Grid2>
          </Box>
        </Box>
      </Box>
    )
}

export default SideBarTransport
