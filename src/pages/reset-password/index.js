// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import InputAdornment from '@mui/material/InputAdornment'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import AuthIllustrationV1Wrapper from 'src/views/pages/auth/AuthIllustrationV1Wrapper'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import { useSelector } from 'react-redux'
import { TextField } from '@mui/material'
import { apiPost } from 'src/hooks/axios'
import { resetPasswordUrl } from 'src/services/pathConst'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { handleLoggedInMobile } from 'src/store/adminMod'

// ** Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '25rem' }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  justifyContent: 'center',
  color: `${theme.palette.primary.main} !important`
}))

const ResetPasswordV1 = () => {
  // ** States
  const { loggedInMobile } = useSelector(state => state.adminMod)
  const [mobile, setMobile] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClickShowPassword = () => setShowPassword(!showPassword)
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)
  const router = useRouter()
  const dispatch = useDispatch()

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),

      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      console.log(values)
      const req = {
        mobile: mobile,
        password: values.password,
        country_code: '+91',
      }
      try {
        setIsLoading(true)
        const res = await apiPost(resetPasswordUrl, req)
        toast.success(res?.data?.message)
        dispatch(handleLoggedInMobile(''))
        router.replace('/login')

      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })

  useEffect(() => {
    if (loggedInMobile) {
      setMobile(loggedInMobile)
    }
  }, [loggedInMobile])

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
                Reset Password 🔒
              </Typography>
            </Box>
            <FormikProvider form={formik}>
              <TextField
                fullWidth
                size='small'
                required
                label='Password'
                sx={{ mb: 4 }}
                value={formik.values.password
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                placeholder='············'
                id='auth-register-password'
                onChange={formik.handleChange}
                type={showPassword ? 'text' : 'password'}
                name='password'
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password && formik.errors.password}
                InputProps={{
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
                }}
              />
              <TextField
                fullWidth
                size='small'
                required
                label='Confirm Password'
                sx={{ mb: 4 }}
                name='confirmPassword'
                value={formik.values.confirmPassword
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                placeholder='············'
                id='auth-register-password'
                onChange={formik.handleChange}
                type={showConfirmPassword ? 'text' : 'password'}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={
                  formik.touched.confirmPassword && formik.errors.confirmPassword && formik.errors.confirmPassword
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowConfirmPassword}
                        aria-label='toggle password visibility'
                      >
                        <Icon fontSize='1.25rem' icon={showConfirmPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <LoadingButton loading={isLoading} onClick={formik.handleSubmit} fullWidth type='submit' variant='contained' sx={{ mb: 4 }}>
                Set New Password
              </LoadingButton>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { mr: 1 } }}>
                <Typography component={LinkStyled} href='/pages/auth/login-v1'>
                  <Icon fontSize='1.25rem' icon='tabler:chevron-left' />
                  <span>Back to login</span>
                </Typography>
              </Typography>
            </FormikProvider>
          </CardContent>
        </Card>
      </AuthIllustrationV1Wrapper>
    </Box>
  )
}
ResetPasswordV1.getLayout = page => <BlankLayout>{page}</BlankLayout>
ResetPasswordV1.guestGuard = true

export default ResetPasswordV1
