// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'
import { useDispatch, useSelector } from 'react-redux'
import { userProfileUrl } from 'src/services/pathConst'
import { handleUserData } from 'src/store/auth'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const { userData } = useSelector(state => state.auth)
  // ** Hooks
  const router = useRouter()
  const dispatch = useDispatch()
  useEffect(() => {
    const initAuth = async () => {
      const returnUrl = router.pathname
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      if (router.pathname === '/verify') {
        setLoading(false)
        router.replace({
          pathname: '/verify',
        })
        return
      }
      if (storedToken) {
        setLoading(true)
        axios
          .get(userProfileUrl, {
            headers: {
              Authorization: storedToken
            }
          })
          .then(async response => {
            setLoading(false)
            setUser(response?.data?.detail[0])
            dispatch(handleUserData(response?.data?.detail[0]))

            const redirectURL = returnUrl && returnUrl !== '/login' ? returnUrl : '/'
            router.replace(redirectURL)
          })
          .catch(() => {
            localStorage.removeItem('userData')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('idToken')
            setUser(null)
            setLoading(false)
            if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
              router.replace('/login')
            }
          })
      } else {
        console.log('no token')
        localStorage.removeItem('userData')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('idToken')
        setUser(null)
        setLoading(false)
      }
    }
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (userData, errorCallback) => {
    const returnUrl = router.query.returnUrl
    setUser(userData)
    const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/home'
    router.replace(redirectURL)
  }

  const handleLogout = () => {
    setUser(null)
    dispatch(handleUserData(null))
    localStorage.removeItem('meetToken')
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem('idToken')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.replace('/login')
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
