// ** React Imports
import { useState } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Components
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'

// ** Custom Component Import
import MuiCard from '@mui/material/Card'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'
import 'react-phone-input-2/lib/semantic-ui.css'
import * as Yup from 'yup'
import AuthIllustrationV1Wrapper from 'src/views/pages/auth/AuthIllustrationV1Wrapper'
import { CardContent, FormHelperText, Grid, MenuItem, Select, TextField } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { getUserData, handleIsOtpReady } from 'src/store/auth'
import { useFormik, useFormikContext } from 'formik'
import { loginUrl, loginVerifyOtp, loginWithOtp } from 'src/services/pathConst'
import { LoadingButton } from '@mui/lab'
import { apiPost } from 'src/hooks/axios'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { countryList } from 'src/@core/utils/country-list'
import CleaveWrapper from 'src/@core/styles/libs/react-cleave'
import { Controller, useForm } from 'react-hook-form'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import Cleave from 'cleave.js/react'

// ** Styled Components
const StyledSelect = styled(Select)(({ theme }) => ({
  boxShadow: 'none !important',
  minWidth: '3.5rem !important',
  width: '6rem !important',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    minWidth: '90px'
  }
}))
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '25rem' }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.primary.main} !important`
}))

const loginSchema = Yup.object().shape({
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile number is required'),
  countryCode: Yup.string().required('Country code is required')
  // password: Yup.string('Enter your password')
  //   .trim()
  //   .max(99, 'Maximum of 99 characters is allowed')
  //   .required('Password is required')
})
const loginOptSchema = Yup.object().shape({
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile number is required'),
  mobile_otp: Yup.string('Enter your OTP')
    .trim()
    .max(4, 'Maximum of 4 characters is allowed')
    .required('OTP is required')
})

const CleaveInput = styled(Cleave)(({ theme }) => ({
  maxWidth: 48,
  textAlign: 'center',
  height: '48px !important',
  fontSize: '150% !important',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  '&:not(:last-child)': {
    marginRight: theme.spacing(2)
  },
  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
    margin: 0,
    WebkitAppearance: 'none'
  }
}))

const defaultValues = {
  val1: '',
  val2: '',
  val3: '',
  val4: ''
}

const LoginPage = () => {
  // ** Hooks
  const auth = useAuth()
  const theme = useTheme()
  const { userData, isOtpReady } = useSelector(state => state.auth)

  const dispatch = useDispatch()
  //** State */
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // const [isOtpReady, setIsOtpReady] = useState(false)
  const [isBackspace, setIsBackspace] = useState(false)
  const [otpVal, setOtpVal] = useState('')
  // const { values } = useFormikContext()

  const {
    control,
    formState: { errors }
  } = useForm({ defaultValues })

  // ** Vars
  const errorsArray = Object.keys(errors)

  const handleClickShowPassword = () => setShowPassword(!showPassword)

  const formik = useFormik({
    initialValues: {
      mobile: '',
      countryCode: '+91',
      mobile_otp: otpVal
      // password: ''
    },
    validationSchema: !isOtpReady ? loginSchema : loginOptSchema,
    onSubmit: async (values, { resetForm }) => {
      const params = {
        mobile: values.mobile,
        // password: values.password,
        country_code: values.countryCode
      }
      try {
        setIsLoading(true)
        // const response = await apiPost(loginUrl, params)
        if (!isOtpReady) {
          const response = await apiPost(loginWithOtp, params)
          console.log('data---->', response)
          if (response.status === 200) {
            // setIsOtpReady(true)
            console.log('out---->2')

            dispatch(handleIsOtpReady(true))
            console.log('out---->3')

            toast.success(response?.data?.message)
            console.log('out---->4')
          }
        }
        console.log('out---->5')
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })

  useEffect(() => {
    if (userData?.id) {
      auth.login(userData, () => {
        setError('email', {
          type: 'manual',
          message: 'Email or Password is invalid'
        })
      })
    }
  }, [userData])

  const handleChange = (event, onChange) => {
    if (!isBackspace) {
      onChange(event)

      // @ts-ignore
      const form = event.target.form
      const index = [...form].indexOf(event.target)
      if (form[index].value && form[index].value.length) {
        form.elements[index + 1].focus()
        const values = [...form].map(input => input.value).join('')
        setOtpVal(values)
      }

      event.preventDefault()
    }
  }
  const handleKeyDown = event => {
    if (event.key === 'Backspace') {
      setIsBackspace(true)

      // @ts-ignore
      const form = event.target.form
      const index = [...form].indexOf(event.target)
      if (index >= 1) {
        if (!(form[index].value && form[index].value.length)) {
          form.elements[index - 1].focus()
        }
      }
    } else {
      setIsBackspace(false)
    }
  }

  const renderInputs = () => {
    return Object.keys(defaultValues).map((val, index) => (
      <Controller
        key={val}
        name={val}
        control={control}
        rules={{ required: true }}
        render={({ field: { value, onChange } }) => (
          <Box
            type='tel'
            maxLength={1}
            value={value}
            autoFocus={index === 0}
            component={CleaveInput}
            onKeyDown={handleKeyDown}
            onChange={event => handleChange(event, onChange)}
            options={{ blocks: [1], numeral: true, numeralPositiveOnly: true }}
            sx={{ [theme.breakpoints.down('sm')]: { px: `${theme.spacing(2)} !important` } }}
          />
        )}
      />
    ))
  }

  const handleLoginSubmit = async w => {
    w.preventDefault()

    // const otpNumbers = otpVal
    try {
      console.log({
        mobile: formik.values.mobile,
        mobile_otp: otpVal,
        country_code: formik.values.countryCode
      })
      let params = {
        mobile: formik.values.mobile,
        mobile_otp: otpVal,
        country_code: formik.values.countryCode

      }
      const response = await apiPost(loginVerifyOtp, params)
      if (response.status === 200) {
        console.log('out---->1', response)

        if (response?.data) {
          localStorage.setItem('idToken', response?.data?.token)
        }
        console.log('out---->2')
        toast.success(response?.data?.message)
        console.log('out---->2')
        formik.resetForm()
        dispatch(handleIsOtpReady(false))
        dispatch(getUserData({}))
      }
      // router.push(url)
    } catch (error) {
      toast.error(error)
      console.log(error)
    }
  }

  useEffect(() => {
    if (!formik.values.mobile) {
      dispatch(handleIsOtpReady(false))
    }
  }, [formik.values.mobile])

  return (
    <Box className='content-center'>
      <AuthIllustrationV1Wrapper>
        <Card>
          <CardContent sx={{ p: theme => `${theme.spacing(10.5, 8, 8)} !important` }}>
            <Box sx={{ mb: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img height={62} width={'auto'} alt='add-role' src='/images/logo_long_trans.png' />
            </Box>
            <Box
              sx={{ mb: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}
            >
              <Typography variant='h4' sx={{ mb: 1.5 }}>
                {`${themeConfig.templateName}! `}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>Please sign-in to your account</Typography>
            </Box>
            <TextField
              fullWidth
              size='small'
              placeholder='Enter mobile number'
              label='Mobile Number'
              required
              value={formik.values.mobile
                ?.trimStart()
                .replace(/\s\s+/g, '')
                .replace(/\p{Emoji_Presentation}/gu, '')}
              onChange={e => {
                const re = /^[0-9\b]+$/
                if (e.target.value === '' || re.test(e.target.value)) {
                  formik.handleChange(e)
                }
              }}
              name='mobile'
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <StyledSelect
                        size='small'
                        value={formik.values.countryCode}
                        onChange={formik.handleChange}
                        name='countryCode'
                        variant='outlined'
                      >
                        {countryList?.map(option => (
                          <MenuItem key={option.code} value={option.dial_code}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {option.code} {option.dial_code}
                            </Box>
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                my: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.87)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main'
                  }
                }
              }}
            />
            {isOtpReady && (
              <>
                <form onSubmit={handleLoginSubmit}>
                  <CleaveWrapper
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-evenly',
                      ...(errorsArray.length && {
                        '& .invalid:focus': {
                          borderColor: theme => `${theme.palette.error.main} !important`,
                          boxShadow: theme => `0 1px 3px 0 ${hexToRGBA(theme.palette.error.main, 0.4)}`
                        }
                      })
                    }}
                  >
                    {renderInputs()}
                  </CleaveWrapper>
                  {errorsArray.length ? (
                    <FormHelperText sx={{ color: 'error.main', fontSize: theme => theme.typography.body2.fontSize }}>
                      Please enter a valid OTP
                    </FormHelperText>
                  ) : null}
                  <LoadingButton loading={isLoading} fullWidth type='submit' variant='contained' sx={{ mb: 4, mt: 4 }}>
                    Login
                  </LoadingButton>
                </form>
              </>
            )}
            {/* <TextField
              size='small'
              required
              fullWidth
              label='Password'
              sx={{ mb: 4 }}
              value={formik.values.password
                ?.trimStart()
                .replace(/\s\s+/g, '')
                .replace(/\p{Emoji_Presentation}/gu, '')}
              placeholder='············'
              id='auth-register-password'
              onChange={formik.handleChange}
              type={showPassword ? 'text' : 'password'}
              name='password'
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password && formik.errors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPassword}
                        aria-label='toggle password visibility'
                      >
                        <Icon fontSize='1.25rem' icon={showPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )
                },
              }}
            /> */}
            {/* <Box
              sx={{
                my: 1.75,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography component={LinkStyled} href='/verify'>
                Resend OTP?
              </Typography>{' '}
              <Typography component={LinkStyled} href='/forgot-password'>
                Forgot Password?
              </Typography>{' '}
            </Box> */}

            {!isOtpReady && (
              <>
                <LoadingButton
                  loading={isLoading}
                  fullWidth
                  type='submit'
                  variant='contained'
                  onClick={formik.handleSubmit}
                  sx={{ mb: 4, mt: 4 }}
                >
                  Get Otp
                </LoadingButton>
                {/* <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'text.secondary', mr: 2 }}>Don't have an account?</Typography>
                  <Typography component={LinkStyled} href='/register'>
                    Create an account
                  </Typography>
                </Box> */}
              </>
            )}
          </CardContent>
        </Card>
      </AuthIllustrationV1Wrapper>
    </Box>
  )
}
LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage
