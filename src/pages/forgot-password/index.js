import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import Icon from 'src/@core/components/icon'
import BlankLayout from 'src/@core/layouts/BlankLayout'

import AuthIllustrationV1Wrapper from 'src/views/pages/auth/AuthIllustrationV1Wrapper'
import { InputAdornment, TextField } from '@mui/material'
import { useState } from 'react'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import { apiPost } from 'src/hooks/axios'
import { forgotPasswordUrl } from 'src/services/pathConst'
import { useDispatch } from 'react-redux'
import { handleLoggedInMobile, handleIsResetPassword } from 'src/store/adminMod'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// ** Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '25rem' }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  justifyContent: 'center',
  color: theme.palette.primary.main,
  fontSize: theme.typography.body1.fontSize
}))

const ForgotPasswordV1 = () => {
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const router = useRouter()


  const formik = useFormik({
    initialValues: {
      mobile: "",
      country_code: '+91'
    },
    validationSchema: Yup.object({
      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
        .required('Mobile Number is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      console.log(values)
      try {
        setLoading(true)
        const res = await apiPost(forgotPasswordUrl, values)
        dispatch(handleLoggedInMobile(values.mobile))
        dispatch(handleIsResetPassword(true))
        resetForm()
        toast.success(res?.data?.message)
        router.replace('/verify')
      } catch (e) {
        console.log(e)
        toast.error(e)
      } finally {
        setLoading(false)
      }
    }
  })

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
                Forgot Password?
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Enter your mobile number, and we&prime;ll send you an OTP to verify it's you before resetting your password.
              </Typography>
            </Box>
            <FormikProvider form={formik}>
              <Box sx={{ mb: 4 }}>
                <TextField
                  disabled={otpSent}
                  placeholder='Enter your Mobile Number'
                  fullWidth
                  required
                  value={String(formik.values.mobile || '').trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => {
                    const re = /^[0-9\b]+$/
                    if (e.target.value === '' || re.test(e.target.value)) {
                      formik.handleChange(e)
                    }
                  }}
                  name="mobile"
                  error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                  helperText={formik.touched.mobile && formik.errors.mobile}
                  label='Mobile Number'
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>+91</InputAdornment>
                  }}
                />
              </Box>
              <LoadingButton loading={loading} fullWidth type='submit' onClick={formik.handleSubmit} variant='contained' sx={{ mb: 4 }}>
                Send OTP
              </LoadingButton>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { mr: 1 } }}>
                <LinkStyled href='/login'>
                  <Icon fontSize='1.25rem' icon='tabler:chevron-left' />
                  <span>Back to login</span>
                </LinkStyled>
              </Typography>
            </FormikProvider>
          </CardContent>
        </Card>
      </AuthIllustrationV1Wrapper>
    </Box>
  )
}
ForgotPasswordV1.getLayout = page => <BlankLayout>{page}</BlankLayout>
ForgotPasswordV1.guestGuard = true

export default ForgotPasswordV1
