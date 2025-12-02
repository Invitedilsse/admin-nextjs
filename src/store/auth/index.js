import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiGet } from 'src/hooks/axios'
import { errorHandler } from 'src/@core/utils/errorHandler'
import { userProfileUrl } from 'src/services/pathConst'
const userData2 = [
  {
    _id: '65a387f0fd9a90aadc13a35d',
    is_verified: true,
    UserID: '1200',
    UserName: 'k1@yopmail.com',
    RoleID: '0',
    CompName: 'The Pitt Macdonald Lodge',
    LocationName: 'Chennai',
    Address: 'Lakshman Marere , R 17, 4B 6th Main Road, Anna Nagar',
    City: 'Chennai',
    Pincode: '600 040',
    Country: 'India',
    Mobile: '9876543210',
    DoI: '1996-08-26T18:30:00.000Z',
    Dob: '1937-09-21T18:30:00.000Z',
    CreateDate: '2018-05-09T10:50:00.000Z',
    enable: '0',
    LodgeNo: '1198',
    LodgeName: 'The Pitt Macdonald Lodge',
    EmailAlert: '0',
    hasLoginAccess: true,
    Doa: '2024-02-20T11:11:47.807Z',
    role_details: {
      _id: '65a134e10c8d942af508a495',
      RoleID: '0',
      RoleDesc: 'Administrator',
      CreatedBy: '1',
      CreatedOn: '2012-03-06 18:09:38.850000000',
      Enable: '-1',
      RecordStatus: 'I'
    },
    name: 'Test ADMIN',
    role: 'admin',
    email: 'k1@yopmail.com'
  }
]
export const getUserData = createAsyncThunk('auth/getUserData', async ({}, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${userProfileUrl}`)

    return response?.data?.detail[0] || []
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
  // return userData2[0]
})
export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoading: false,
    isOtpReady: false,
    userData: [],
    number: null,
    snackbar: {
      isOpen: false,
      type: 'success',
      message: ''
    },
    backDrop: {
      isOpen: false
    }
  },
  reducers: {
    handleLoginNumber: (state, action) => {
      state.number = action.payload
    },
    toggleSnackBar: function (state, action) {
      state.snackbar = action.payload
    },
    handleUserData: (state, action) => {
      state.userData = action.payload
    },
    handleIsOtpReady: (state, action) => {
      state.isOtpReady = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(getUserData.pending, (state, action) => {
      state.isLoading = true
    })
    builder.addCase(getUserData.fulfilled, (state, action) => {
      state.isLoading = false
      console.log('action.payload', action.payload)
      state.userData = action.payload
    })
    builder.addCase(getUserData.rejected, (state, action) => {
      state.isLoading = false
    })
  }
})

export const { handleLoginNumber, toggleSnackBar, handleUserData, handleIsOtpReady } = authSlice.actions

export default authSlice.reducer
