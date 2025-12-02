// ** Redux Imports
import { createSlice } from '@reduxjs/toolkit'

export const meetTokenSlice = createSlice({
  name: 'meetToken',
  initialState: {
    token: ''
  },
  reducers: {
    handleToken: (state, action) => {
      state.token = action.payload
    }
  },
  extraReducers: builder => {}
})

export const { handleToken } = meetTokenSlice.actions

export default meetTokenSlice.reducer
