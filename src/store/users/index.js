// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'
import { errorHandler } from 'src/@core/utils/errorHandler'
import { apiGet } from 'src/hooks/axios'
import {
  listCategoryURL,
  listCourseTopicURL,
  listCoursesURL,
  listUsersURL,
  listsEventsURL
} from 'src/services/pathConst'

export const getListOfStudents = createAsyncThunk('users/getListOfStudents', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listUsersURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
export const getListOfStaff = createAsyncThunk('users/getListOfStaff', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listUsersURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const usersSlice = createSlice({
  name: 'users',
  initialState: {
    allStudents: [],
    isStudentsFetching: false,
    studentCount: '',

    allStaff: [],
    isStaffFetching: false,
    staffCount: ''
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getListOfStudents.pending, (state, action) => {
      state.isStudentsFetching = true
    })
    builder.addCase(getListOfStudents.fulfilled, (state, action) => {
      state.isStudentsFetching = false
      state.allStudents = action.payload[0]?.paginatedResults
      state.studentCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfStudents.rejected, (state, action) => {
      state.isStudentsFetching = false
      state.allStudents = []
      state.studentCount = ''
    })

    builder.addCase(getListOfStaff.pending, (state, action) => {
      state.isStaffFetching = true
    })
    builder.addCase(getListOfStaff.fulfilled, (state, action) => {
      state.isStaffFetching = false
      state.allStaff = action.payload[0]?.paginatedResults
      state.staffCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfStaff.rejected, (state, action) => {
      state.isStaffFetching = false
      state.allStaff = []
      state.staffCount = ''
    })
  }
})

export const {} = usersSlice.actions

export default usersSlice.reducer
