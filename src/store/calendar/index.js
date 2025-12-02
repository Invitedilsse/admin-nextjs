// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'
import { errorHandler } from 'src/@core/utils/errorHandler'
import { apiGet } from 'src/hooks/axios'
import { listsEventsURL } from 'src/services/pathConst'

export const getListOfEvents = createAsyncThunk('appCalendar/getListOfEvents', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listsEventsURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
// ** Fetch Events
export const fetchEvents = createAsyncThunk('appCalendar/fetchEvents', async calendars => {
  const response = await axios.get('/apps/calendar/events', {
    params: {
      calendars
    }
  })
  console.log('calendars', calendars)
  console.log('response', response)
  return response.data
})

// ** Add Event
export const addEvent = createAsyncThunk('appCalendar/addEvent', async (event, { dispatch }) => {
  const response = await axios.post('/apps/calendar/add-event', {
    data: {
      event
    }
  })
  // await dispatch(fetchEvents(['Personal', 'Business', 'Family', 'Holiday', 'ETC']))

  return event
})

// ** Update Event
export const updateEvent = createAsyncThunk('appCalendar/updateEvent', async (event, { dispatch }) => {
  const response = await axios.post('/apps/calendar/update-event', {
    data: {
      event
    }
  })
  await dispatch(fetchEvents(['Personal', 'Business', 'Family', 'Holiday', 'ETC']))

  return response.data.event
})

// ** Delete Event
export const deleteEvent = createAsyncThunk('appCalendar/deleteEvent', async (id, { dispatch }) => {
  const response = await axios.delete('/apps/calendar/remove-event', {
    params: { id }
  })
  await dispatch(fetchEvents(['Personal', 'Business', 'Family', 'Holiday', 'ETC']))

  return response.data
})

export const appCalendarSlice = createSlice({
  name: 'appCalendar',
  initialState: {
    events: [
      {
        url: '',
        display: 'block',
        title: 'title',
        end: '2024-02-24T11:00:00.255Z',
        allDay: false,
        start: '2024-02-24T10:00:00.255Z',
        extendedProps: {
          calendar: 'Business',
          guests: ['dk2@yopmail.com'],
          hosts: ['dk@yopmail.com']
        }
      }
    ],
    isEventFetching: false,
    selectedEvent: null,
    dateRange: null,
    selectedCalendars: ['Regular', 'Business', 'ETC']
    // token: ''
  },
  reducers: {
    handleSelectEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    handleDateRange: (state, action) => {
      state.dateRange = action.payload
    },
    handleCalendarsUpdate: (state, action) => {
      const filterIndex = state.selectedCalendars.findIndex(i => i === action.payload)
      if (state.selectedCalendars.includes(action.payload)) {
        state.selectedCalendars.splice(filterIndex, 1)
      } else {
        state.selectedCalendars.push(action.payload)
      }
      if (state.selectedCalendars.length === 0) {
        state.events.length = 0
      }
    },
    handleAllCalendars: (state, action) => {
      console.log(action.payload)
      const value = action.payload
      if (value === true) {
        state.selectedCalendars = ['Regular', 'Business', 'ETC']
      } else {
        state.selectedCalendars = []
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(getListOfEvents.pending, (state, action) => {
      state.isEventFetching = true
    })
    builder.addCase(getListOfEvents.fulfilled, (state, action) => {
      state.isEventFetching = false
      console.log('action.payload getListOfEvents', action.payload)
      state.events = action.payload
    })
    builder.addCase(getListOfEvents.rejected, (state, action) => {
      state.isEventFetching = false
      state.events = []
    })
    builder.addCase(fetchEvents.fulfilled, (state, action) => {
      state.events = action.payload
    })
    builder.addCase(addEvent.fulfilled, (state, action) => {
      state.events = [{ ...state.events, ...action.payload }]
    })
  }
})

export const { handleSelectEvent, handleCalendarsUpdate, handleAllCalendars, handleDateRange } =
  appCalendarSlice.actions

export default appCalendarSlice.reducer
