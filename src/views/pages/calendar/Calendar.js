// ** React Import
import { useEffect, useRef } from 'react'

// ** Full Calendar & it's Plugins
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import interactionPlugin from '@fullcalendar/interaction'

// ** Third Party Style Import
import 'bootstrap-icons/font/bootstrap-icons.css'
import { getListOfEvents, handleDateRange } from 'src/store/calendar'
import moment from 'moment'
import { useSelector } from 'react-redux'

const blankEvent = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  extendedProps: {
    calendar: 'Regular',
    guests: [],
    location: '',
    description: ''
  }
}

const Calendar = props => {
  // ** Props
  const {
    store,
    dispatch,
    direction,
    updateEvent,
    calendarApi,
    calendarsColor,
    setCalendarApi,
    handleSelectEvent,
    handleLeftSidebarToggle,
    handleAddEventSidebarToggle
  } = props

  // ** Refs
  const calendarRef = useRef()
  const { selectedCalendars } = useSelector(state => state.calendar)

  useEffect(() => {
    if (calendarApi === null) {
      // @ts-ignore
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])
  if (store) {
    const calendarOptions = {
      events: store.events.length ? store.events : [],
      plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        start: 'sidebarToggle, prev, next, title',
        end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      views: {
        week: {
          titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
        }
      },
      editable: false,
      eventResizableFromStart: false,
      dragScroll: false,
      dayMaxEvents: 2,
      navLinks: false,
      eventClassNames({ event: calendarEvent }) {
        // @ts-ignore
        const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

        return [
          `bg-${colorName}`
        ]
      },
      customButtons: {
        sidebarToggle: {
          icon: 'bi bi-list',
          click() {
            handleLeftSidebarToggle()
          }
        }
      },
      datesSet: function (dateInfo) {
        const ar2r = ['Regular', 'Business', 'ETC']
        const arr = ['Regular', 'Business', 'ETC']
        console.log('dateInfo', dateInfo)
        dispatch(handleDateRange(dateInfo))
      },
      dateClick(info) {
        const ev = { ...blankEvent }
        ev.start = info.date
        ev.end = info.date
        ev.allDay = true

        // @ts-ignore
        handleAddEventSidebarToggle()
      },
      eventDrop({ event: droppedEvent }) {
        dispatch(updateEvent(droppedEvent))
      },
      eventClick: function (info) {
        var eventObj = info.event

        if (eventObj.url) {
          info.jsEvent.preventDefault() // prevents browser from following link in current tab.
          dispatch(handleSelectEvent(info.event))
          handleAddEventSidebarToggle()
        } else {
          dispatch(handleSelectEvent(info.event))
          handleAddEventSidebarToggle()
        }
      },
      eventResize({ event: resizedEvent }) {
        dispatch(updateEvent(resizedEvent))
      },
      ref: calendarRef,

      direction
    }
    // @ts-ignore
    return (
      <FullCalendar
        {...calendarOptions}
        nowIndicator={true}
      />
    )
  } else {
    return null
  }
}

export default Calendar
