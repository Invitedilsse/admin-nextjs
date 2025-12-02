// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Redux Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'

// ** FullCalendar & App Components Imports
import Calendar from 'src/views/pages/calendar/Calendar'
import SidebarLeft from 'src/views/pages/calendar/SidebarLeft'
import CalendarWrapper from 'src/@core/styles/libs/fullcalendar'
import AddEventSidebar from 'src/views/pages/calendar/AddEventSidebar'

// ** Actions
import {
  addEvent,
  fetchEvents,
  deleteEvent,
  updateEvent,
  handleSelectEvent,
  handleAllCalendars,
  handleCalendarsUpdate,
  getListOfEvents
} from 'src/store/calendar'
import moment from 'moment'
import { date } from 'yup'

// ** CalendarColors
const calendarsColor = {
  Regular: 'primary',
  Business: 'error',
  // Family: 'warning',
  // Holiday: 'success',
  ETC: 'warning'
}

const Home = () => {
  // ** States
  const [calendarApi, setCalendarApi] = useState(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState(false)

  // ** Hooks
  const { settings } = useSettings()
  const dispatch = useDispatch()
  const store = useSelector(state => state.calendar)
  console.log(store)
  // ** Vars
  const leftSidebarWidth = 300
  const addEventSidebarWidth = 500
  const { skin, direction } = settings
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const { selectedCalendars } = useSelector(state => state.calendar)
  const { dateRange } = useSelector(state => state.calendar)
  console.log('dateRange', dateRange)
  const getEvents = () => {
    const arr = ['Regular', 'Business', 'ETC']
    const queryParams = `search_string=${''}&from_date=${moment(dateRange?.startStr).toISOString()}&to_date=${moment(
      dateRange?.endStr
    ).toISOString()}&event_type=[${selectedCalendars}]`
    dispatch(getListOfEvents(queryParams))
  }
  useEffect(() => {
    if (dateRange?.startStr && dateRange?.endStr) {
      getEvents()
    }
  }, [selectedCalendars, dateRange])
  useEffect(() => {
    // dispatch(fetchEvents(store.selectedCalendars))
    // const queryParams = `search_param=${filterBy}&limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel?.sort}&sortBy=${sortModel?.field}`;
    // dispatch(getListOfEvents())
  }, [dispatch, store.selectedCalendars])
  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)
  const handleAddEventSidebarToggle = () => setAddEventSidebarOpen(!addEventSidebarOpen)

  return (
    <CalendarWrapper
      className='app-calendar'
      sx={{
        boxShadow: skin === 'bordered' ? 0 : 6,
        ...(skin === 'bordered' && { border: theme => `1px solid ${theme.palette.divider}` })
      }}
    >
      <SidebarLeft
        store={store}
        mdAbove={mdAbove}
        dispatch={dispatch}
        calendarApi={calendarApi}
        calendarsColor={calendarsColor}
        leftSidebarOpen={leftSidebarOpen}
        leftSidebarWidth={leftSidebarWidth}
        handleSelectEvent={handleSelectEvent}
        handleAllCalendars={handleAllCalendars}
        handleCalendarsUpdate={handleCalendarsUpdate}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
      <Box
        sx={{
          p: 6,
          pb: 0,
          flexGrow: 1,
          borderRadius: 1,
          boxShadow: 'none',
          backgroundColor: 'background.paper',
          ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {})
        }}
      >
        <Calendar
          store={store}
          dispatch={dispatch}
          direction={direction}
          updateEvent={updateEvent}
          calendarApi={calendarApi}
          calendarsColor={calendarsColor}
          setCalendarApi={setCalendarApi}
          handleSelectEvent={handleSelectEvent}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          handleAddEventSidebarToggle={handleAddEventSidebarToggle}
        />
      </Box>
      <AddEventSidebar
        store={store}
        dispatch={dispatch}
        addEvent={addEvent}
        updateEvent={updateEvent}
        deleteEvent={deleteEvent}
        calendarApi={calendarApi}
        drawerWidth={addEventSidebarWidth}
        handleSelectEvent={handleSelectEvent}
        addEventSidebarOpen={addEventSidebarOpen}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
    </CalendarWrapper>
  )
}

export default Home
