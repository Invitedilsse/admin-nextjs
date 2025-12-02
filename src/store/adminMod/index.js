// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Importss
import axios from 'axios'
import { errorHandler } from 'src/@core/utils/errorHandler'
import { apiGet, apiPost } from 'src/hooks/axios'
import {
  getFunctionReportList,
  listAccommodationURL,
  listAllContactsTypeURL,
  listBatchesURL,
  listCategoryURL,
  listContactsTypeURL,
  listCourseTopicURL,
  listCoursesURL,
  listCustomMedia,
  listEventDetailsURL,
  listEventURL,
  listFirmsURL,
  listFunctionURL,
  listGiftTypeURL,
  listHelplineURL,
  listInviteeContactURL,
  listInviteeGroupURL,
  listInviteeInternalGroupURL,
  listKeyTypeURL,
  listMappedContactURL,
  listNotificationDispatchMediaURL,
  listNotificationDispatchURL,
  listOccasionURL,
  listOtherInfoURL,
  listSpecialInviteeURL,
  listTransportationURL,
  listTravelTypeURL,
  listUserGroupTypeURL,
  listsEventsURL,
  notificationReportList,
  rsvpReportList
} from 'src/services/pathConst'

export const getListOfCategories = createAsyncThunk(
  'adminMod/getListOfCategories',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listCategoryURL}?${params}`)

      return response?.data?.detail
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfCourses = createAsyncThunk('adminMod/getListOfCourses', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listCoursesURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
export const getListOfTopics = createAsyncThunk('adminMod/getListOfTopics', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listCourseTopicURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfBatches = createAsyncThunk('adminMod/getListOfBatches', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listBatchesURL}?${params}`)

    return response?.data?.detail
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfFunctions = createAsyncThunk(
  'adminMod/getListOfFunctions',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listFunctionURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfOccasion = createAsyncThunk('adminMod/getListOfOccasion', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listOccasionURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfGiftType = createAsyncThunk('adminMod/getListOfGiftType', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listGiftTypeURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfContacts = createAsyncThunk('adminMod/getListOfContacts', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listContactsTypeURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfGroups = createAsyncThunk('adminMod/getListOfGroups', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listUserGroupTypeURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
export const getListOfContactsNP = createAsyncThunk(
  'adminMod/getListOfContactsNP',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listAllContactsTypeURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfFunctionGroups = createAsyncThunk(
  'adminMod/getListOfFunctionGroups',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listInviteeGroupURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfFunctionGroupsInternal = createAsyncThunk(
  'adminMod/getListOfFunctionGroupsInternal',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listInviteeInternalGroupURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)
export const getListOfFunctionContacts = createAsyncThunk(
  'adminMod/getListOfFunctionContacts',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listInviteeContactURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfFunctionContactsSelected = createAsyncThunk(
  'adminMod/getListOfFunctionContactsSelected',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listInviteeContactURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)
export const getListOfMappedContacts = createAsyncThunk(
  'adminMod/getListOfMappedContacts',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listMappedContactURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)
export const getListOfKeyType = createAsyncThunk('adminMod/getListOfKeyType', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listKeyTypeURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
export const getListOfTravelType = createAsyncThunk(
  'adminMod/getListOfTravelType',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listTravelTypeURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfFirms = createAsyncThunk('adminMod/getListOfFirms', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listFirmsURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfSpecialInvitees = createAsyncThunk(
  'adminMod/getListOfSpecialInvitees',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listSpecialInviteeURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfHelpline = createAsyncThunk('adminMod/getListOfHelpline', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listHelplineURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})

export const getListOfNotificationDispatchMedia = createAsyncThunk(
  'adminMod/getListOfNotificationDispatchMedia',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listNotificationDispatchMediaURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)
export const getListOfNotificationDispatch = createAsyncThunk(
  'adminMod/getListOfNotificationDispatch',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listNotificationDispatchURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfEvents = createAsyncThunk('adminMod/getListOfEvents', async (params, { rejectWithValue }) => {
  try {
    let response = await apiGet(`${listEventURL}?${params}`)

    return response?.data
  } catch (error) {
    return rejectWithValue(errorHandler(error))
  }
})
export const getListOfEventDetails = createAsyncThunk(
  'adminMod/getListOfEventDetails',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listEventDetailsURL}/${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)
// export const getListOfEventDetailsMapped = createAsyncThunk(
//   'adminMod/getListOfEventDetails',
//   async (params, { rejectWithValue }) => {
//     try {
//       let response = await apiPost(`${listEventDetailsURL}/${params}`)

//       return response?.data
//     } catch (error) {
//       return rejectWithValue(errorHandler(error))
//     }
//   }
// )
export const getListOfTransportation = createAsyncThunk(
  'adminMod/getListOfTransportation',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listTransportationURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfAccomodation = createAsyncThunk(
  'adminMod/getListOfAccomodation',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listAccommodationURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfOtherInfo = createAsyncThunk(
  'adminMod/getListOfOtherInfo',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listOtherInfoURL}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfCustomMedia = createAsyncThunk(
  'adminMod/getListOfCustomMedia',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${listCustomMedia}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfFunctionReport = createAsyncThunk(
  'adminMod/getListOfFunctionReport',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${getFunctionReportList}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfRsvpReport = createAsyncThunk(
  'adminMod/getListOfRsvpReport',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${rsvpReportList}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const getListOfNotificationReport = createAsyncThunk(
  'adminMod/getListOfNotificationReport',
  async (params, { rejectWithValue }) => {
    try {
      let response = await apiGet(`${notificationReportList}?${params}`)

      return response?.data
    } catch (error) {
      return rejectWithValue(errorHandler(error))
    }
  }
)

export const adminModSlice = createSlice({
  name: 'adminMod',
  initialState: {
    functionData: [],
    functionId: '',
    eventId: '',
    loggedInMobile: '',
    isResetPassword: false,
    custumMedia: [],
    isCustomMediaFetching: false,

    contactsFunctionAll: [],
    isContactFunctionFetching: false,
    contactsFunctionCount: '',

    selectedContactsFunctionAll: [],
    isSelectedContactFunctionFetching: false,
    selectedContactsFunctionCount: '',

    groupsInterFunctionAll: [],
    isGroupsInterFunctionFetching: false,
    groupsInterFunctionCount: '',

    groupsFunctionAll: [],
    isGroupsFunctionFetching: false,
    groupsFunctionCount: '',

    eventDetailsAll: [],
    isEventDetailsFetching: false,
    eventDetailsCount: '',

    allOtherInfo: [],
    isOtherInfoFetching: false,
    otherInfoCount: '',

    allFunctions: [],
    isFunctionsFetching: false,
    functionsCount: '',

    allOccasion: [],
    isOccasionFetching: false,
    occasionCount: '',

    allGiftType: [],
    isGiftTypeFetching: false,
    giftTypeCount: '',

    allContacts: [],
    isContactsFetching: false,
    contactsCount: '',

    allGroups: [],
    isGroupdFetching: false,
    groupsCount: '',

    allContactsNP: [],
    isContactsFetchingNP: false,
    contactsCountNP: '',

    allKeyType: [],
    isKeyTypeFetching: false,
    keyTypeCount: '',

    allTravelType: [],
    isTravelTypeFetching: false,
    travelTypeCount: '',

    allFirms: [],
    isFirmsFetching: false,
    firmsCount: '',

    allSpecialInvitees: [],
    isSpecialInviteesFetching: false,
    specialInviteeCount: '',

    allHelplines: [],
    isHelplinesFetching: false,
    helplinessCount: '',

    allNotificationsDispatch: [],
    isNotificationsDispatchFetching: false,
    notificationsDispatchCount: '',

    allNotificationsDispatchMedia: [],
    isNotificationsDispatchMediaFetching: false,
    notificationsDispatchMediaCount: '',

    allEvents: [],
    isEventssFetching: false,
    eventsCount: '',

    allAccomodations: [],
    isAccomodationsFetching: false,
    accomodationsCount: '',

    allTransportation: [],
    isTransportationFetching: false,
    transportationCount: '',

    allCategory: [],
    isCategoryFetching: false,
    cateCount: '',
    // pageCount: '',

    allCourses: [],
    isCoursesFetching: false,
    courseCount: '',

    allTopics: [],
    isTopicsFetching: false,
    topicCount: '',

    allBatches: [],
    isBatchesFetching: false,
    batchCount: '',

    mappedContact: [],
    isMappedContactFetching: false,
    mappedContactCount: '',

    excelAutoSelected: [],
    isExcelAutoSelect: false,

    eventreminderDispatchDatetime: '',
    isEventRemDTChanged: false,

    functionReportDetailByStatus: {},
    isViewInDetail: false,
    isDataLoading: false,

    rsvpReportDetailByStatus: {},
    isViewRsvpInDetail: false,

    notiReportDetailByStatus: {},
    isViewNotfiInDetail: false
  },
  reducers: {
    handleIsViewinDetail: (state, action) => {
      console.log('isViewInDetail in redux', action.payload)
      state.isViewInDetail = action.payload.isViewDetail
    },
    handleIsViewRsvpinDetail: (state, action) => {
      console.log('isViewRsvpInDetail in redux', action.payload)
      state.isViewRsvpInDetail = action.payload.isViewDetail
    },
    handleIsViewNotifiinDetail: (state, action) => {
      console.log('isViewInDetail in redux', action.payload)
      state.isViewNotfiInDetail = action.payload.isViewDetail
    },
    handleFunctionId: (state, action) => {
      console.log('function id in redux', action.payload)
      state.functionId = action.payload
    },
    handleFunction: (state, action) => {
      console.log('function in redux', action.payload)
      state.functionData = action.payload
    },
    handleEventId: (state, action) => {
      console.log('event id in redux', action.payload)
      state.eventId = action.payload
    },
    handleLoggedInMobile: (state, action) => {
      state.loggedInMobile = action.payload
    },
    handleIsResetPassword: (state, action) => {
      state.isResetPassword = action.payload
    },
    syncEventDetailsContacts: (state, action) => {
      const updates = action.payload

      const normalizeType = type => {
        const map = {
          transportation: 'transport',
          transport: 'transport',
          accommodation: 'accommodation',
          event: 'event',
          other: 'other'
        }
        return map[type] || type
      }

      state.eventDetailsAll = state.eventDetailsAll.map(eventDetail => {
        const matchedUpdate = updates.find(
          update => update.oid === eventDetail.oid && normalizeType(update.type) === normalizeType(eventDetail.type)
        )

        if (!matchedUpdate) return eventDetail

        const newContactIds = matchedUpdate.contact_id

        const updatedContacts = []

        newContactIds.forEach(newId => {
          const existing = eventDetail.contact_id.find(c => c.id === newId)
          if (existing) {
            updatedContacts.push(existing)
          } else {
            updatedContacts.push({ id: newId, data: 'pending' })
          }
        })
        return {
          ...eventDetail,
          contact_id: updatedContacts
        }
      })
    },
    handleExcelAutoSelected: (state, action) => {
      console.log('data----->', state.excelAutoSelected, action.payload)
      state.excelAutoSelected = action.payload.data
      state.isExcelAutoSelect = action.payload.booleanval
    },
    handleEventReminderDT: (state, action) => {
      console.log('data handleEventReminderDT----->', state.eventreminderDispatchDatetime, action.payload)
      state.eventreminderDispatchDatetime = action.payload.data
      state.isEventRemDTChanged = action.payload.booleanval
    }

    //end of reducer add reducers above this line
  },
  extraReducers: builder => {
    builder.addCase(getListOfFunctionReport.pending, (state, action) => {
      state.isDataLoading = true
    })
    builder.addCase(getListOfFunctionReport.fulfilled, (state, action) => {
      state.isDataLoading = false
      console.log('result of report-------->', action.payload.data)
      state.functionReportDetailByStatus = action.payload?.data ?? {}
    })
    builder.addCase(getListOfFunctionReport.rejected, (state, action) => {
      state.isDataLoading = false
      state.functionReportDetailByStatus = {}
    })

    builder.addCase(getListOfRsvpReport.pending, (state, action) => {
      state.isDataLoading = true
    })
    builder.addCase(getListOfRsvpReport.fulfilled, (state, action) => {
      state.isDataLoading = false
      console.log('result of report-------->', action.payload.data)
      state.rsvpReportDetailByStatus = action.payload?.data ?? {}
    })
    builder.addCase(getListOfRsvpReport.rejected, (state, action) => {
      state.isDataLoading = false
      state.rsvpReportDetailByStatus = {}
    })

    builder.addCase(getListOfNotificationReport.pending, (state, action) => {
      state.isDataLoading = true
    })
    builder.addCase(getListOfNotificationReport.fulfilled, (state, action) => {
      state.isDataLoading = false
      console.log('result of report-------->', action.payload.data)
      state.notiReportDetailByStatus = action.payload?.data ?? {}
    })
    builder.addCase(getListOfNotificationReport.rejected, (state, action) => {
      state.isDataLoading = false
      state.notiReportDetailByStatus = {}
    })

    builder.addCase(getListOfFunctionContacts.pending, (state, action) => {
      state.isContactFunctionFetching = true
    })
    builder.addCase(getListOfFunctionContacts.fulfilled, (state, action) => {
      state.isContactFunctionFetching = false
      state.contactsFunctionAll = action.payload?.detail || []
      state.contactsFunctionCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFunctionContacts.rejected, (state, action) => {
      state.isContactFunctionFetching = false
      state.contactsFunctionAll = []
      state.contactsFunctionCount = ''
    })

    builder.addCase(getListOfFunctionContactsSelected.pending, (state, action) => {
      state.isSelectedContactFunctionFetching = true
    })
    builder.addCase(getListOfFunctionContactsSelected.fulfilled, (state, action) => {
      state.isSelectedContactFunctionFetching = false
      state.selectedContactsFunctionAll = action.payload?.detail || []
      state.selectedContactsFunctionCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFunctionContactsSelected.rejected, (state, action) => {
      state.isSelectedContactFunctionFetching = false
      state.selectedContactsFunctionAll = []
      state.selectedContactsFunctionCount = ''
    })

    builder.addCase(getListOfFunctionGroups.pending, (state, action) => {
      state.isGroupsFunctionFetching = true
    })
    builder.addCase(getListOfFunctionGroups.fulfilled, (state, action) => {
      state.isGroupsFunctionFetching = false
      state.groupsFunctionAll = action.payload?.detail || []
      state.groupsFunctionCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFunctionGroups.rejected, (state, action) => {
      state.isGroupsFunctionFetching = false
      state.groupsFunctionAll = []
      state.groupsFunctionCount = ''
    })

    builder.addCase(getListOfFunctionGroupsInternal.pending, (state, action) => {
      state.isGroupsInterFunctionFetching = true
    })
    builder.addCase(getListOfFunctionGroupsInternal.fulfilled, (state, action) => {
      state.isGroupsInterFunctionFetching = false
      state.groupsInterFunctionAll = action.payload?.detail || []
      state.groupsInterFunctionCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFunctionGroupsInternal.rejected, (state, action) => {
      state.isGroupsInterFunctionFetching = false
      state.groupsInterFunctionAll = []
      state.groupsInterFunctionCount = ''
    })

    builder.addCase(getListOfEventDetails.pending, (state, action) => {
      state.isEventDetailsFetching = true
      // state.eventDetailsAll = []
    })
    builder.addCase(getListOfEventDetails.fulfilled, (state, action) => {
      const data = action.payload?.detail || []

      const dataWithDate = data?.filter(event => event.date_time)
      const otherTypeData = data?.filter(event => event.type === 'other')

      dataWithDate.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))

      const sortedData = [...dataWithDate, ...otherTypeData] || []

      state.isEventDetailsFetching = false
      state.eventDetailsAll = sortedData // Array.isArray(action.payload) ?  action.payload : []
      state.eventDetailsCount = action.payload?.totalCount || 0
    })
    builder.addCase(getListOfEventDetails.rejected, (state, action) => {
      state.isEventDetailsFetching = false
      state.eventDetailsAll = []
      state.eventDetailsCount = 0
    })

    builder.addCase(getListOfCustomMedia.pending, (state, action) => {
      state.isCustomMediaFetching = true
    })
    builder.addCase(getListOfCustomMedia.fulfilled, (state, action) => {
      state.isCustomMediaFetching = false
      state.custumMedia = action.payload?.detail
    })
    builder.addCase(getListOfCustomMedia.rejected, (state, action) => {
      state.isCustomMediaFetching = false
      state.custumMedia = []
    })

    builder.addCase(getListOfOtherInfo.pending, (state, action) => {
      state.isOtherInfoFetching = true
    })
    builder.addCase(getListOfOtherInfo.fulfilled, (state, action) => {
      state.isOtherInfoFetching = false
      state.allOtherInfo = action.payload?.detail
      state.otherInfoCount = action.payload?.totalCount
    })
    builder.addCase(getListOfOtherInfo.rejected, (state, action) => {
      state.isOtherInfoFetching = false
      state.allOtherInfo = []
      state.otherInfoCount = ''
    })

    builder.addCase(getListOfTransportation.pending, (state, action) => {
      state.isTransportationFetching = true
    })
    builder.addCase(getListOfTransportation.fulfilled, (state, action) => {
      state.isTransportationFetching = false
      state.allTransportation = action.payload?.detail
      state.transportationCount = action.payload?.totalCount
    })
    builder.addCase(getListOfTransportation.rejected, (state, action) => {
      state.isTransportationFetching = false
      state.allTransportation = []
      state.transportationCount = ''
    })

    builder.addCase(getListOfAccomodation.pending, (state, action) => {
      state.isAccomodationsFetching = true
    })
    builder.addCase(getListOfAccomodation.fulfilled, (state, action) => {
      state.isAccomodationsFetching = false
      state.allAccomodations = action.payload?.detail
      state.accomodationsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfAccomodation.rejected, (state, action) => {
      state.isAccomodationsFetching = false
      state.allAccomodations = []
      state.accomodationsCount = ''
    })

    builder.addCase(getListOfEvents.pending, (state, action) => {
      state.isEventssFetching = true
    })
    builder.addCase(getListOfEvents.fulfilled, (state, action) => {
      state.isEventssFetching = false
      state.allEvents = action.payload?.detail
      state.eventsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfEvents.rejected, (state, action) => {
      state.isEventssFetching = false
      state.allEvents = []
      state.eventsCount = ''
    })

    builder.addCase(getListOfSpecialInvitees.pending, (state, action) => {
      state.isSpecialInviteesFetching = true
    })
    builder.addCase(getListOfSpecialInvitees.fulfilled, (state, action) => {
      state.isSpecialInviteesFetching = false
      state.allSpecialInvitees = action.payload?.detail
      state.specialInviteeCount = action.payload?.totalCount
    })
    builder.addCase(getListOfSpecialInvitees.rejected, (state, action) => {
      state.isSpecialInviteesFetching = false
      state.allSpecialInvitees = []
      state.specialInviteeCount = ''
    })

    builder.addCase(getListOfHelpline.pending, (state, action) => {
      state.isHelplinesFetching = true
    })
    builder.addCase(getListOfHelpline.fulfilled, (state, action) => {
      console.log('action.payloadchelpline', action.payload)
      state.isHelplinesFetching = false
      state.allHelplines = action.payload?.detail
      state.helplinessCount = action.payload?.totalCount
    })
    builder.addCase(getListOfHelpline.rejected, (state, action) => {
      state.isHelplinesFetching = false
      state.allHelplines = []
      state.helplinessCount = ''
    })

    builder.addCase(getListOfNotificationDispatch.pending, (state, action) => {
      state.isNotificationsDispatchFetching = true
    })
    builder.addCase(getListOfNotificationDispatch.fulfilled, (state, action) => {
      state.isNotificationsDispatchFetching = false
      state.allNotificationsDispatch = action.payload?.detail
      state.notificationsDispatchCount = action.payload?.totalCount
    })
    builder.addCase(getListOfNotificationDispatch.rejected, (state, action) => {
      state.isNotificationsDispatchFetching = false
      state.allNotificationsDispatch = []
      state.notificationsDispatchCount = ''
    })

    builder.addCase(getListOfNotificationDispatchMedia.pending, (state, action) => {
      state.isNotificationsDispatchMediaFetching = true
    })
    builder.addCase(getListOfNotificationDispatchMedia.fulfilled, (state, action) => {
      state.isNotificationsDispatchMediaFetching = false
      state.allNotificationsDispatchMedia = action.payload?.detail
      state.notificationsDispatchMediaCount = action.payload?.totalCount
    })
    builder.addCase(getListOfNotificationDispatchMedia.rejected, (state, action) => {
      state.isNotificationsDispatchMediaFetching = false
      state.allNotificationsDispatchMedia = []
      state.notificationsDispatchMediaCount = ''
    })

    builder.addCase(getListOfFunctions.pending, (state, action) => {
      state.isFunctionsFetching = true
    })
    builder.addCase(getListOfFunctions.fulfilled, (state, action) => {
      state.isFunctionsFetching = false
      state.allFunctions = action.payload?.detail
      state.functionsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFunctions.rejected, (state, action) => {
      state.isFunctionsFetching = false
      state.allFunctions = []
      state.functionsCount = ''
    })

    builder.addCase(getListOfFirms.pending, (state, action) => {
      state.isFirmsFetching = true
    })
    builder.addCase(getListOfFirms.fulfilled, (state, action) => {
      state.isFirmsFetching = false
      state.allFirms = action.payload?.detail
      state.firmsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfFirms.rejected, (state, action) => {
      state.isFirmsFetching = false
      state.allFirms = []
      state.firmsCount = ''
    })

    builder.addCase(getListOfOccasion.pending, (state, action) => {
      state.isOccasionFetching = true
    })
    builder.addCase(getListOfOccasion.fulfilled, (state, action) => {
      state.isOccasionFetching = false
      state.allOccasion = action.payload?.detail
      state.occasionCount = action.payload?.totalCount
    })
    builder.addCase(getListOfOccasion.rejected, (state, action) => {
      state.isOccasionFetching = false
      state.allOccasion = []
      state.occasionCount = ''
    })

    builder.addCase(getListOfGiftType.pending, (state, action) => {
      state.isGiftTypeFetching = true
    })
    builder.addCase(getListOfGiftType.fulfilled, (state, action) => {
      state.isGiftTypeFetching = false
      state.allGiftType = action.payload?.detail
      state.giftTypeCount = action.payload?.totalCount
    })
    builder.addCase(getListOfGiftType.rejected, (state, action) => {
      state.isGiftTypeFetching = false
      state.allGiftType = []
      state.giftTypeCount = ''
    })

    builder.addCase(getListOfKeyType.pending, (state, action) => {
      state.isKeyTypeFetching = true
    })
    builder.addCase(getListOfKeyType.fulfilled, (state, action) => {
      state.isKeyTypeFetching = false
      state.allKeyType = action.payload?.detail
      state.keyTypeCount = action.payload?.totalCount
    })
    builder.addCase(getListOfKeyType.rejected, (state, action) => {
      state.isKeyTypeFetching = false
      state.allKeyType = []
      state.keyTypeCount = ''
    })

    builder.addCase(getListOfTravelType.pending, (state, action) => {
      state.isTravelTypeFetching = true
    })
    builder.addCase(getListOfTravelType.fulfilled, (state, action) => {
      state.isTravelTypeFetching = false
      state.allTravelType = action.payload?.detail
      state.travelTypeCount = action.payload?.totalCount
    })
    builder.addCase(getListOfTravelType.rejected, (state, action) => {
      state.isTravelTypeFetching = false
      state.allTravelType = []
      state.travelTypeCount = ''
    })
    builder.addCase(getListOfContactsNP.pending, (state, action) => {
      state.isContactsFetchingNP = true
    })
    builder.addCase(getListOfContactsNP.fulfilled, (state, action) => {
      state.isContactsFetchingNP = false
      state.allContactsNP = action.payload?.detail
      state.contactsCountNP = action.payload?.totalCount
    })
    builder.addCase(getListOfContactsNP.rejected, (state, action) => {
      state.isContactsFetchingNP = false
      state.allContactsNP = []
      state.contactsCountNP = ''
    })
    builder.addCase(getListOfContacts.pending, (state, action) => {
      state.isContactsFetching = true
    })
    builder.addCase(getListOfContacts.fulfilled, (state, action) => {
      state.isContactsFetching = false
      state.allContacts = action.payload?.detail
      state.contactsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfContacts.rejected, (state, action) => {
      state.isContactsFetching = false
      state.allContacts = []
      state.contactsCount = ''
    })

    builder.addCase(getListOfGroups.pending, (state, action) => {
      state.isGroupdFetching = true
    })
    builder.addCase(getListOfGroups.fulfilled, (state, action) => {
      state.isGroupdFetching = false
      state.allGroups = action.payload?.detail
      state.groupsCount = action.payload?.totalCount
    })
    builder.addCase(getListOfGroups.rejected, (state, action) => {
      state.isGroupdFetching = false
      state.allGroups = []
      state.groupsCount = ''
    })

    builder.addCase(getListOfCategories.pending, (state, action) => {
      state.isCategoryFetching = true
    })
    builder.addCase(getListOfCategories.fulfilled, (state, action) => {
      state.isCategoryFetching = false
      state.allCategory = action.payload[0]?.paginatedResults
      state.cateCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfCategories.rejected, (state, action) => {
      state.isCategoryFetching = false
      state.allCategory = []
      state.cateCount = ''
    })

    builder.addCase(getListOfCourses.pending, (state, action) => {
      state.isCoursesFetching = true
    })
    builder.addCase(getListOfCourses.fulfilled, (state, action) => {
      state.isCoursesFetching = false
      state.allCourses = action.payload[0]?.paginatedResults
      state.courseCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfCourses.rejected, (state, action) => {
      state.isCoursesFetching = false
      state.allCourses = []
      state.courseCount = ''
    })

    builder.addCase(getListOfTopics.pending, (state, action) => {
      state.isTopicsFetching = true
    })
    builder.addCase(getListOfTopics.fulfilled, (state, action) => {
      state.isTopicsFetching = false
      state.allTopics = action.payload[0]?.paginatedResults
      state.topicCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfTopics.rejected, (state, action) => {
      state.isTopicsFetching = false
      state.allTopics = []
      state.topicCount = ''
    })

    builder.addCase(getListOfBatches.pending, (state, action) => {
      state.isBatchesFetching = true
    })
    builder.addCase(getListOfBatches.fulfilled, (state, action) => {
      state.isBatchesFetching = false
      state.allBatches = action.payload[0]?.paginatedResults
      state.batchCount = action.payload[0]?.totalCount[0]
    })
    builder.addCase(getListOfBatches.rejected, (state, action) => {
      state.isBatchesFetching = false
      state.allBatches = []
      state.batchCount = ''
    })
    builder.addCase(getListOfMappedContacts.pending, (state, action) => {
      state.isMappedContactFetching = true
    })
    builder.addCase(getListOfMappedContacts.fulfilled, (state, action) => {
      state.isMappedContactFetching = false
      state.mappedContact =
        action.payload?.detail && action.payload?.detail?.length > 0
          ? action.payload?.detail[0]?.contact_details.length > 0
            ? action.payload?.detail[0]?.contact_details
            : []
          : []
      state.mappedContactCount = action.payload?.totalCount
    })
    builder.addCase(getListOfMappedContacts.rejected, (state, action) => {
      state.isMappedContactFetching = false
      state.mappedContact = []
      state.mappedContactCount = ''
    })
  }
})

export const {
  handleFunctionId,
  handleFunction,
  handleEventId,
  handleLoggedInMobile,
  handleIsResetPassword,
  syncEventDetailsContacts,
  handleExcelAutoSelected,
  handleEventReminderDT,
  handleIsViewinDetail,
  handleIsViewRsvpinDetail,
  handleIsViewNotifiinDetail
} = adminModSlice.actions

export default adminModSlice.reducer
