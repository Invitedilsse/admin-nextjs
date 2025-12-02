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

const blankEvent = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: 'https://www.gmail.com',
  extendedProps: {
    calendar: '',
    guests: [],
    hosts: [],
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
  console.log('calendarRef', calendarRef)
  useEffect(() => {
    if (calendarApi === null) {
      // @ts-ignore
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  // useEffect(() => {
  //   if (calendarRef.current) {
  //     var elements = document.getElementsByClassName('fc-next-button')
  //     console.log('elements', elements)
  //     elements?.addEventListener(
  //       'click',
  //       () => {
  //         console.log('elements', elements)
  //         console.log('elements calendarRef', calendarRef)
  //       },
  //       false
  //     )

  //     // @ts-ignore
  //     console.log('calendarRef.current', calendarRef.current)
  //   }
  // })
  if (store) {
    // ** calendarOptions(Props)
    const calendarOptions = {
      events: store.events.length ? store.events : [],
      plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin, bootstrap5Plugin],
      initialView: 'dayGridMonth',
      nowIndicator: true,
      visibleRange: function (currentDate) {
        // Generate a new date for manipulating in the next step
        var startDate = new Date(currentDate.valueOf())
        var endDate = new Date(currentDate.valueOf())
        console.log(currentDate)
        // Adjust the start & end dates, respectively
        startDate.setDate(startDate.getDate() - 1) // One day in the past
        endDate.setDate(endDate.getDate() + 2) // Two days into the future

        return { start: startDate, end: endDate }
      },
      headerToolbar: {
        start: 'sidebarToggle, prev, next, title',
        end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      views: {
        nowIndicator: true,

        week: {
          titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
        }
      },
      datesSet: function (dateInfo) {
        console.log('dateInfo', dateInfo)
      },
      /*
            Enable dragging and resizing event
            ? Docs: https://fullcalendar.io/docs/editable
          */
      editable: true,

      /*
            Enable resizing event from start
            ? Docs: https://fullcalendar.io/docs/eventResizableFromStart
          */
      eventResizableFromStart: true,

      /*
              Automatically scroll the scroll-containers during event drag-and-drop and date selecting
              ? Docs: https://fullcalendar.io/docs/dragScroll
            */
      dragScroll: true,

      /*
              Max number of events within a given day
              ? Docs: https://fullcalendar.io/docs/dayMaxEvents
            */
      dayMaxEvents: 2,

      /*
              Determines if day names and week names are clickable
              ? Docs: https://fullcalendar.io/docs/navLinks
            */
      navLinks: true,
      eventClassNames({ event: calendarEvent }) {
        // @ts-ignore
        const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

        return [
          // Background Color
          `bg-${colorName}`
        ]
      },
      eventClick({ event: clickedEvent }) {
        dispatch(handleSelectEvent(clickedEvent))
        handleAddEventSidebarToggle()
        console.log('clickedEvent', clickedEvent)
        // * Only grab required field otherwise it goes in infinity loop
        // ! Always grab all fields rendered by form (even if it get `undefined`) otherwise due to Vue3/Composition API you might get: "object is not extensible"
        // event.value = grabEventDataFromEventApi(clickedEvent)
        // isAddNewEventSidebarActive.value = true
      },
      customButtons: {
        sidebarToggle: {
          icon: 'bi bi-list',
          click() {
            handleLeftSidebarToggle()
          }
        }
      },
      select: function (info) {
        console.log(info.startStr)
        console.log(info.endStr)
      },
      dateClick(info) {
        const ev = { ...blankEvent }
        ev.start = info.date
        ev.end = info.date
        ev.allDay = true
        console.log('ev', ev)
        // @ts-ignore
        dispatch(handleSelectEvent(ev))
        handleAddEventSidebarToggle()
      },

      /*
              Handle event drop (Also include dragged event)
              ? Docs: https://fullcalendar.io/docs/eventDrop
              ? We can use `eventDragStop` but it doesn't return updated event so we have to use `eventDrop` which returns updated event
            */
      eventDrop({ event: droppedEvent }) {
        dispatch(updateEvent(droppedEvent))
      },

      /*
              Handle event resize
              ? Docs: https://fullcalendar.io/docs/eventResize
            */
      eventResize({ event: resizedEvent }) {
        dispatch(updateEvent(resizedEvent))
      },
      ref: calendarRef,

      // Get direction from app state (store)
      direction
    }

    // @ts-ignore
    return <FullCalendar {...calendarOptions} nowIndicator={true} />
  } else {
    return null
  }
}

export default Calendar
