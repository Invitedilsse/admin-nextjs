// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import FormHelperText from '@mui/material/FormHelperText'

// ** Third Party Imports
import Cleave from 'cleave.js/react'
import { useForm, Controller } from 'react-hook-form'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import AuthIllustrationV1Wrapper from 'src/views/pages/auth/AuthIllustrationV1Wrapper'

// ** Custom Styled Component
import CleaveWrapper from 'src/@core/styles/libs/react-cleave'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// ** Styles
import 'cleave.js/dist/addons/cleave-phone.us'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useAuth } from 'src/hooks/useAuth'
import { InputAdornment, TextField } from '@mui/material'
import { apiPost } from 'src/hooks/axios'
import toast from 'react-hot-toast'
import { resendUrl, verifyUrl } from 'src/services/pathConst'
import { handleLoggedInMobile, handleIsResetPassword } from 'src/store/adminMod'
import Countdown from 'react-countdown'
// ** Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '25rem' }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.primary.main} !important`
}))

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

const Verify = () => {
  // ** State
  const [isBackspace, setIsBackspace] = useState(false)
  const [url, setUrl] = useState('/')
  const { number } = useSelector(state => state.auth)
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [key, setKey] = useState(Date.now()) // Used to restart the countdown
  const [showResend, setShowResend] = useState(false)
  const dispatch = useDispatch()
  // ** Hooks
  const theme = useTheme()
  const router = useRouter()

  const {
    control,
    formState: { errors }
  } = useForm({ defaultValues })

  // ** Vars
  const errorsArray = Object.keys(errors)
  const { loggedInMobile, isResetPassword } = useSelector(state => state.adminMod)
  const [otpVal, setOtpVal] = useState('')
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
    console.log(defaultValues)
    console.log(defaultValues)

    const otpNumbers = otpVal
    try {
      const res = await apiPost(verifyUrl, { mobile: mobile, mobile_otp: otpNumbers })
      console.log(res)
      if (res?.status === 200) {
        setOtpSent(true)
      }
      toast.success('OTP verified successfully')
      {
        isResetPassword ? dispatch(handleIsResetPassword(false)) : dispatch(handleLoggedInMobile(''))
      }
      router.push(url)
    } catch (error) {
      toast.error(error)
      console.log(error)
    }
  }
  useEffect(() => {
    if (loggedInMobile && isResetPassword) {
      setMobile(loggedInMobile)
      setUrl('/reset-password')
    } else {
      setMobile(loggedInMobile)
    }
  }, [loggedInMobile, isResetPassword])

  const handleSentOTP = async e => {
    setKey(Date.now()) // Reset countdown
    setShowResend(false)
    e.preventDefault()
    try {
      const res = await apiPost(resendUrl, {
        mobile: mobile,
        country_code: '+91'
      })
      console.log(res.status)
      if (res?.status === 200) {
        setOtpSent(true)
      }
      toast.success('OTP sent successfully')
    } catch (error) {
      toast.error(error)
      console.log(error)
    }
  }

  const renderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      return <Button onClick={e => handleSentOTP(e)}>Resend OTP</Button>
    } else {
      return (
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      )
    }
  }

  return (
    <Box className='content-center'>
      <AuthIllustrationV1Wrapper>
        <Card>
          <CardContent sx={{ p: theme => `${theme.spacing(10.5, 8, 8)} !important` }}>
            <Box sx={{ mb: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img height={62} width={'auto'} alt='add-role' src='/images/logo_long_trans.png' />
            </Box>
            <Box sx={{ mb: 6 }}>
              <Typography variant='h4' sx={{ mb: 1.5 }}>
                Verify your Mobile Number
              </Typography>
              <Typography sx={{ mb: 1.5, color: 'text.secondary' }}>
                We sent a verification code to your mobile. Enter the code from the mobile in the field below.
              </Typography>
              <Typography variant='h6'>{number}</Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <TextField
                value={mobile}
                disabled={otpSent || loggedInMobile}
                placeholder='Enter your Mobile Number'
                type='number'
                fullWidth
                required
                onChange={e => setMobile(e.target.value)}
                label='Mobile Number'
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>+91</InputAdornment>
                  }
                }}
              />
            </Box>
            {!otpSent && !loggedInMobile && (
              <>
                <Button
                  fullWidth
                  disabled={mobile.length !== 10}
                  onClick={handleSentOTP}
                  variant='contained'
                  sx={{ mt: 2 }}
                >
                  Resend OTP
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    dispatch(handleLoggedInMobile(''))
                    router.replace('/')
                  }}
                  sx={{ mt: 2 }}
                >
                  Back to Login
                </Button>
              </>
            )}
            {(otpSent || loggedInMobile) && (
              <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>Type your 6 digit security code</Typography>
            )}
            {(otpSent || loggedInMobile) && (
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
                <Button fullWidth type='submit' variant='contained' sx={{ mt: 2 }}>
                  Verify
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    dispatch(handleLoggedInMobile(''))
                    router.replace('/')
                  }}
                  sx={{ mt: 2 }}
                >
                  Back to Login
                </Button>
              </form>
            )}
            {(otpSent || loggedInMobile) && (
              <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'text.secondary' }}>Didn't get the code?</Typography>
                <Box sx={{ ml: 1 }}>
                  <Countdown key={key} date={Date.now() + 30000} renderer={renderer} />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </AuthIllustrationV1Wrapper>
    </Box>
  )
}
Verify.getLayout = page => <BlankLayout>{page}</BlankLayout>
Verify.guestGuard = true

export default Verify
