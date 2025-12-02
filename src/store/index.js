// ** Toolkit imports
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore, createTransform } from 'redux-persist'
// ** Reducers
import CryptoJS from 'crypto-js'
import { encryptTransform } from 'redux-persist-transform-encrypt'

import auth from './auth/index.js'
import calendar from './calendar/index.js'
import meetToken from './meetToken/index.js'
import adminMod from './adminMod/index.js'
import users from './users/index.js'

const encrypt = createTransform(
  (inboundState, key) => {
    if (!inboundState) return inboundState

    if (typeof window !== 'undefined' ? window.localStorage.getItem('persist:root') : false) {
      const cryptedText = CryptoJS.AES.encrypt(
        JSON.stringify(inboundState),
        window.localStorage.getItem('persist:root')
      )
      return cryptedText.toString()
    }
  },
  (outboundState, key) => {
    if (!outboundState) return outboundState

    if (typeof window !== 'undefined' ? window.localStorage.getItem('persist:root') : false) {
      const bytes = CryptoJS.AES.decrypt(outboundState, window.localStorage.getItem('persist:root'))
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      console.log(decrypted, 'decrypted')
      return decrypted
    }
  }
)

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['meetToken'],
  transforms: [encrypt]
}

const rootReducer = combineReducers({
  auth,
  calendar,
  meetToken,
  adminMod,
  users
})
const persistedReducer = persistReducer(persistConfig, rootReducer)
export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
