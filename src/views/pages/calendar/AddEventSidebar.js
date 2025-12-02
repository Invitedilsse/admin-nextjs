// ** React Imports
import { useState, useEffect, forwardRef, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import DatePicker from 'react-datepicker'
import { useForm, Controller } from 'react-hook-form'
import { styled, useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { ReactMultiEmail } from 'react-multi-email'
import 'react-multi-email/dist/style.css'
import { Chip, Divider, FormHelperText, Grid, InputLabel, ListItem, Paper } from '@mui/material'
import moment from 'moment'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { is } from 'date-fns/locale'
import { apiPost } from 'src/hooks/axios'
import { addEventURL } from 'src/services/pathConst'
import { handleAddEvent } from 'src/services/Events-api'
import { toggleSnackBar } from 'src/store/auth'
import { getListOfEvents } from 'src/store/calendar'
import { use } from 'i18next'
import { useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import { Route } from '@mui/icons-material'
import { useRouter } from 'next/router'

const schema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  guests: Yup.array().min(1, 'At least one Participant is required').required('Participant are required'),
  // hosts: Yup.array().min(1, 'At least one host is required').required('Hosts are required'),

  endDate: Yup.date().min(Yup.ref('startDate'), 'End date must be after start date').required('End date is required'),
  calendar: Yup.string().required('Calendar is required'),
  startDate: Yup.date().required('Start date is required')
})
const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

const defaultState = {
  url: 'https://www.google.com',
  title: '',
  guests: [],
  hosts: ['dk@yopmail.com'],
  allDay: false,
  description: '',
  endDate: new Date(),
  calendar: 'Regular',
  startDate: new Date()
}

const AddEventSidebar = props => {
  // ** Props
  const {
    store,
    dispatch,
    addEvent,
    updateEvent,
    drawerWidth,
    calendarApi,
    deleteEvent,
    handleSelectEvent,
    addEventSidebarOpen,
    handleAddEventSidebarToggle
  } = props
  const route = useRouter()
  // ** States
  const [values, setValues] = useState(defaultState)
  const [isHostFocus, setIsHostFocus] = useState(false)
  const [isEditable, setIsEditable] = useState(false)
  const [isGuestFocus, setIsGuestFocus] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { dateRange } = useSelector(state => state.calendar)
  const { userData } = useSelector(state => state.auth)
  const theme = useTheme()
  const { selectedCalendars } = useSelector(state => state.calendar)

  const {
    control,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues: { title: '' } })

  const handleSidebarClose = async () => {
    setValues(defaultState)
    clearErrors()
    dispatch(handleSelectEvent(null))
    handleAddEventSidebarToggle()
  }

  const onSubmit = data => {
    const modifiedEvent = {
      url: values.url,
      display: 'block',
      title: data.title,
      end: values.endDate,
      allDay: values.allDay || false,
      start: values.startDate,
      extendedProps: {
        calendar: capitalize(values.calendar),
        guests: values.guests && values.guests.length ? values.guests : undefined,
        description: values.description.length ? values.description : undefined
      }
    }
    if (store.selectedEvent === null || (store.selectedEvent !== null && !store.selectedEvent.title.length)) {
      console.log(modifiedEvent)
      dispatch(addEvent(modifiedEvent))
    } else {
      dispatch(updateEvent({ id: store.selectedEvent.id, ...modifiedEvent }))
    }
    calendarApi.refetchEvents()
    handleSidebarClose()
  }

  const handleDeleteEvent = () => {
    if (store.selectedEvent) {
      dispatch(deleteEvent(store.selectedEvent.id))
    }

    // calendarApi.getEventById(store.selectedEvent.id).remove()
    handleSidebarClose()
  }

  const handleStartDate = date => {
    if (date > values.endDate) {
      setValues({ ...values, startDate: new Date(date), endDate: new Date(date) })
    }
  }

  const resetToStoredValues = useCallback(() => {
    if (store.selectedEvent !== null) {
      const event = store.selectedEvent
      setValue('title', event.title || '')
      setValues({
        url: event.url || '',
        title: event.title || '',
        allDay: event.allDay,
        guests: event.extendedProps.guests || [],
        description: event.extendedProps.description || '',
        calendar: event.extendedProps.calendar || 'Business',
        endDate: event.end !== null ? event.end : event.start,
        startDate: event.start !== null ? event.start : new Date()
      })
    }
  }, [setValue, store.selectedEvent])

  const resetToEmptyValues = useCallback(() => {
    setValue('title', '')
    setValues(defaultState)
  }, [setValue])
  useEffect(() => {
    if (store.selectedEvent !== null) {
      resetToStoredValues()
    } else {
      resetToEmptyValues()
    }
  }, [addEventSidebarOpen, resetToStoredValues, resetToEmptyValues, store.selectedEvent])

  const PickersComponent = forwardRef(({ ...props }, ref) => {
    return (
      <CustomTextField
        inputRef={ref}
        fullWidth
        {...props}
        label={props.label || ''}
        sx={{ width: '100%' }}
        error={props.error}
      />
    )
  })

  const RenderSidebarFooter = () => {
    if (store.selectedEvent === null || (store.selectedEvent !== null && !store.selectedEvent.title.length)) {
      return (
        <Fragment>
          <LoadingButton
            type='submit'
            loading={isLoading}
            onClick={formik.handleSubmit}
            variant='contained'
            sx={{ mr: 4 }}
          >
            Add Event
          </LoadingButton>
          <Button variant='outlined' color='primary' onClick={handleSidebarClose}>
            Cancel
          </Button>
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          {store.selectedEvent !== null && store.selectedEvent.title.length && isEditable && (
            <LoadingButton type='submit loading={isLoading} ' variant='contained' sx={{ mr: 4 }}>
              Update Event
            </LoadingButton>
          )}
          <Button
            variant='outlined'
            fullWidth={store.selectedEvent !== null && store.selectedEvent.title.length && isEditable ? false : true}
            color='primary'
            onClick={handleSidebarClose}
          >
            Cancel
          </Button>
        </Fragment>
      )
    }
  }
  const getEvents = () => {
    const arr = ['Regular', 'Business', 'ETC']
    const queryParams = `search_string=${''}&from_date=${moment(dateRange?.startStr).toISOString()}&to_date=${moment(
      dateRange?.endStr
    ).toISOString()}&event_type=[${selectedCalendars}]`
    // dispatch(getListOfEvents(queryParams))
  }
  const formik = useFormik({
    initialValues: defaultState,
    validationSchema: schema,
    onSubmit: async (values, { resetForm }) => {
      console.log(values)
      console.log('addEventURL', [...values.guests, userData?.email])
      const modifiedEvent = {
        url: '',
        display: 'block',
        title: values.title,
        end: values.endDate,
        allDay: values.allDay || false,
        start: values.startDate,
        // user_id:'id',
        extendedProps: {
          calendar: capitalize(values.calendar),
          // guests: [...values.guests, userData?.email],
          guests: values.guests && values.guests.length ? values.guests : undefined,
          hosts: [...values.hosts, userData?.email] //values.hosts && values.hosts.length ? values.hosts : undefined
          // description: values.description.length ? values.description : undefined
        }
      }

      console.log(modifiedEvent)

      try {
        setIsLoading(true)
        const response = await handleAddEvent(addEventURL, modifiedEvent)
        getEvents()
        calendarApi.gotoDate(values.startDate)
        resetForm()

        dispatch(
          toggleSnackBar({
            isOpen: true,
            type: 'success',
            message: response?.data?.message
          })
        )
        handleSidebarClose()
      } catch (e) {
        dispatch(
          toggleSnackBar({
            isOpen: true,
            type: 'error',
            message: e
          })
        )
      } finally {
        setIsLoading(false)
      }
    }
  })
  console.log('selectedEvent', store.selectedEvent)

  useEffect(() => {
    // formik.setValues(store.selectedEvent)
    const event = store.selectedEvent

    console.log('event', event)
    console.log('event title', event?.title)

    formik.setFieldValue('title', event?.title || '')
    formik.setFieldValue('startDate', event?.start || new Date())
    formik.setFieldValue('endDate', event?.end || new Date())
    formik.setFieldValue('allDay', event?.allDay)
    formik.setFieldValue('calendar', event?.extendedProps?.calendar || 'Business')
    formik.setFieldValue('hosts', event?.extendedProps?.hosts || [])
    formik.setFieldValue('guests', event?.extendedProps?.guests || [])
  }, [store.selectedEvent])

  useEffect(() => {
    const event = store.selectedEvent
    console.log('selectedEvent 33', userData)
    console.log('selectedEvent ', event)
    console.log(
      'store.selectedEvent?.extendedProps?.hosts?.includes(userData?.email)',
      event?.extendedProps?.hosts?.includes(userData?.email)
    )
    console.log('event?.extendedProps?.hosts?.includes(userData?.email)', event?.extendedProps?.hosts)
    if (event === null) {
      console.log('sert 22', false)
      setIsEditable(true)
    }
    if (event !== null && userData?.email) {
      if (event?.extendedProps?.hosts?.includes(userData?.email)) {
        console.log('selectedEvent 21', true)

        setIsEditable(true)
      } else {
        console.log('selectedEvent 22', false)

        setIsEditable(false)
      }
    }
  }, [userData, store.selectedEvent])

  const handleJoinEvent = token => {
    console.log('token', token?.extendedProps?.token)
    route.push(`/meet/${token?.extendedProps?.token}`)
  }
  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleSidebarClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {store.selectedEvent !== null && store.selectedEvent.title.length ? (
        <>
          <Box
            className='sidebar-header'
            sx={{
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant='h5'>
              {store.selectedEvent !== null && store.selectedEvent.title.length && 'Join Event'}
            </Typography>
            <Button
              fullWidth
              variant='contained'
              sx={{ '& svg': { mr: 2 }, mt: 4 }}
              onClick={() => handleJoinEvent(store.selectedEvent)}
              // onClick={() => dispatch(fetchEvents(['Personal', 'Business', 'Family', 'Holiday', 'ETC']))}
            >
              <Icon icon='streamline:group-meeting-call-solid' fontSize='1.125rem' />
              Join
            </Button>
            <Divider
              sx={{
                color: 'text.disabled',
                '& .MuiDivider-wrapper': { px: 6 },
                fontSize: theme.typography.body2.fontSize,
                my: theme => `${theme.spacing(6)} !important`
              }}
            />
          </Box>
          {/* </Divider> */}
        </>
      ) : null}
      <Box
        className='sidebar-header'
        sx={{
          p: 6,
          pt: store.selectedEvent !== null && store.selectedEvent.title.length ? 0 : 6,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant='h5'>
          {store.selectedEvent !== null && store.selectedEvent.title.length
            ? isEditable
              ? 'Update Event'
              : 'Event Details'
            : 'Add Event'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {store.selectedEvent !== null && store.selectedEvent.title.length && isEditable ? (
            <IconButton
              size='small'
              onClick={handleDeleteEvent}
              sx={{ color: 'text.primary', mr: store.selectedEvent !== null ? 1 : 0 }}
            >
              <Icon icon='tabler:trash' fontSize='1.25rem' />
            </IconButton>
          ) : null}
          {store.selectedEvent !== null && store.selectedEvent.title.length && isEditable && (
            <IconButton
              size='small'
              onClick={handleSidebarClose}
              sx={{
                p: '0.375rem',
                borderRadius: 1,
                color: 'text.primary',
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                }
              }}
            >
              <Icon icon='tabler:x' fontSize='1.25rem' />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(0, 6, 6) }}>
        <DatePickerWrapper>
          <CustomTextField
            fullWidth
            label='Title'
            value={formik.values.title}
            sx={{ mb: 4 }}
            InputProps={{
              readOnly: !isEditable
            }}
            name='title'
            onChange={formik.handleChange}
            placeholder='Event Title'
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title && formik.errors.title}
          />
          <Box sx={{ mb: 4 }}>
            <DatePicker
              selectsStart
              readOnly={!isEditable}
              id='event-start-date'
              endDate={formik.values.endDate}
              selected={formik.values.startDate}
              startDate={formik.values.startDate}
              showTimeSelect={!formik.values.allDay}
              timeIntervals={1}
              dateFormat={!formik.values.allDay ? 'yyyy-MM-dd hh:mm a' : 'yyyy-MM-dd'}
              customInput={<PickersComponent label='Start Date' registername='startDate' />}
              // onChange={date => setValues({ ...values, startDate: new Date(date) })}
              onChange={date => formik.setFieldValue('startDate', new Date(date))}
              onSelect={handleStartDate}
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <DatePicker
              selectsEnd
              id='event-end-date'
              readOnly={!isEditable}
              name='endDate'
              endDate={formik.values.endDate}
              selected={formik.values.endDate}
              minDate={formik.values.startDate}
              timeIntervals={1}
              startDate={formik.values.startDate}
              showTimeSelect={!formik.values.allDay}
              dateFormat={!formik.values.allDay ? 'yyyy-MM-dd hh:mm a' : 'yyyy-MM-dd'}
              customInput={<PickersComponent label='End Date' registername='endDate' />}
              // onChange={date => setValues({ ...values, endDate: new Date(date) })}
              onChange={date => formik.setFieldValue('endDate', new Date(date))}
            />
          </Box>
          <FormHelperText sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
            {formik.touched.endDate && formik.errors.endDate && formik.errors.endDate}
          </FormHelperText>
          <FormControl sx={{ mb: 4 }}>
            <FormControlLabel
              label='All Day'
              control={
                <Switch
                  checked={formik.values.allDay}
                  onChange={e => formik.setFieldValue('allDay', e.target.checked)}
                />
              }
            />
          </FormControl>
          <CustomTextField
            select
            fullWidth
            sx={{ mb: 4 }}
            InputProps={{
              readOnly: !isEditable
            }}
            label='Calendar'
            error={formik.touched.calendar && Boolean(formik.errors.calendar)}
            helperText={formik.touched.calendar && formik.errors.calendar && formik.errors.calendar}
            SelectProps={{
              value: formik.values.calendar,
              onChange: e => formik.setFieldValue('calendar', e.target.value)
            }}
          >
            <MenuItem value='Regular'>Regular</MenuItem>
            <MenuItem value='Business'>Business</MenuItem>
            <MenuItem value='ETC'>ETC</MenuItem>
          </CustomTextField>
          <Grid item lg={12} xl={12} xs={12} md={12} sm={12} sx={{ my: 2 }}>
            {/* <FormControl size="small" fullWidth sx={{ my: 2 }}>  */}
            <InputLabel
              sx={{
                fontSize: '0.8125rem',
                marginBottom: '0.25rem',
                color: 'rgba(47, 43, 61, 0.78)'
              }}
            >
              Host Email (by default your email is added as host)
            </InputLabel>
            {!isEditable ? (
              <Paper
                sx={{
                  display: 'flex',
                  // justifyContent: 'center',
                  flexWrap: 'wrap',
                  whiteSpace: 'nowrap',
                  listStyle: 'none',
                  p: 0.5,
                  m: 0
                }}
                component='ul'
              >
                {formik.values.hosts.map((data, index) => {
                  return <Chip key={index} sx={{ m: 1 }} label={data} />
                })}
              </Paper>
            ) : (
              <ReactMultiEmail
                style={{
                  border:
                    formik.touched.hosts && formik.errors.hosts && formik.errors.hosts
                      ? '1px solid #ea5455'
                      : !isHostFocus
                      ? '1px solid rgba(34, 36, 38, 0.15)'
                      : '1px solid #85b7d9'
                }}
                onFocus={() => {
                  setIsHostFocus(true)
                }}
                onBlur={() => {
                  setIsHostFocus(false)
                }}
                placeholder='Host email'
                id='hostEmail'
                name='hosts'
                emails={formik.values.hosts}
                onChange={_emails => {
                  // setValues({ ...values, hosts: _emails })
                  formik.setFieldValue('hosts', _emails)
                }}
                getLabel={(email, index, removeEmail) => {
                  return (
                    <div data-tag key={index}>
                      {email}
                      {index !== 0 && (
                        <span data-tag-handle onClick={() => removeEmail(index)}>
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}
                // error={formik.touched.hosts && Boolean(formik.errors.hosts)}
                // helperText={formik.touched.hosts && formik.errors.hosts && formik.errors.hosts}
              />
            )}
            <FormHelperText sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
              {formik.touched.hosts && formik.errors.hosts && formik.errors.hosts}
            </FormHelperText>
          </Grid>
          <Grid item lg={12} xl={12} xs={12} md={12} sm={12} sx={{ my: 2 }}>
            {/* <FormControl size="small" fullWidth sx={{ my: 2 }}>  */}
            <InputLabel
              sx={{
                fontSize: '0.8125rem',
                marginBottom: '0.25rem',
                color: 'rgba(47, 43, 61, 0.78)'
              }}
            >
              Participants Email
            </InputLabel>
            {!isEditable ? (
              <Paper
                sx={{
                  display: 'flex',
                  // justifyContent: 'center',
                  flexWrap: 'wrap',
                  whiteSpace: 'nowrap',

                  listStyle: 'none',
                  p: 0.5,
                  m: 0
                }}
                component='ul'
              >
                {formik.values.guests.map((data, index) => {
                  return <Chip key={index} sx={{ m: 1 }} label={data} />
                })}
              </Paper>
            ) : (
              <ReactMultiEmail
                style={{
                  border:
                    formik.touched.guests && formik.errors.guests && formik.errors.guests
                      ? '1px solid #ea5455'
                      : !isGuestFocus
                      ? '1px solid rgba(34, 36, 38, 0.15)'
                      : '1px solid #85b7d9'
                }}
                placeholder='Participants email'
                id='ParticipantEmail'
                name='ParticipantEmail'
                emails={formik.values.guests}
                onFocus={() => {
                  setIsGuestFocus(true)
                }}
                onBlur={() => {
                  setIsGuestFocus(false)
                }}
                onChange={_emails => {
                  // setValues({ ...values, guests: _emails })
                  formik.setFieldValue('guests', _emails)
                }}
                getLabel={(email, index, removeEmail) => {
                  return (
                    <div data-tag key={index}>
                      {email}
                      {index !== 0 && (
                        <span data-tag-handle onClick={() => removeEmail(index)}>
                          ×
                        </span>
                      )}
                    </div>
                  )
                }}
              />
            )}
            <FormHelperText sx={{ color: 'error.main', fontSize: '0.8125rem' }}>
              {formik.touched.guests && formik.errors.guests && formik.errors.guests}
            </FormHelperText>
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: '', mt: 4 }}>
            <RenderSidebarFooter />
          </Box>
        </DatePickerWrapper>
      </Box>
    </Drawer>
  )
}

export default AddEventSidebar
