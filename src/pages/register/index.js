// ** React Imports
import { useRef, useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import InputAdornment from '@mui/material/InputAdornment'
import MuiFormControlLabel from '@mui/material/FormControlLabel'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import { useFormik, FieldArray, FormikProvider } from 'formik'
import * as Yup from 'yup'
import { LoadingButton } from '@mui/lab'
import { apiPost } from 'src/hooks/axios'
import { baseURL, registerUrl } from 'src/services/pathConst'
import { getUserData } from 'src/store/auth'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { FormGroup, FormHelperText, Grid2, MenuItem, Select, TextField, Badge } from '@mui/material'
import { CameraAlt } from '@mui/icons-material'
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material'
import AuthIllustrationV1WrapperV2 from 'src/views/pages/auth/AuthIllustrationV2Wrapper'
import ImageUpload from 'src/hooks/ImageUpload'
import toast from 'react-hot-toast'
import { handleLoggedInMobile } from 'src/store/adminMod'
import { countryList } from 'src/@core/utils/country-list'
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '60rem' }
}))
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
const ProfilePicture = styled('img')(({ theme }) => ({
  width: 108,
  height: 108,
  borderRadius: '100px',
  border: `1px solid ${theme.palette.primary.main}`,
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  }
}))
const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.primary.main} !important`
}))

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1.75),
  '& .MuiFormControlLabel-label': {
    color: theme.palette.text.secondary
  }
}))

const signupSchema = Yup.object().shape({
  additional_phone_number: Yup.array().of(
    Yup.string()
      .matches(/^[0-9]+$/, 'Only numbers are allowed')
      .max(15, 'Mobile number cannot exceed 12 digits')
      .min(6, 'Mobile number must be at least 6 digits')
  ),
  first_name: Yup.string()
    .min(2, 'First Name must be at least 2 characters')
    .matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed')
    .required('First Name is required'),

  last_name: Yup.string()
    .min(2, 'Last Name must be at least 2 characters')
    .matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed'),

  family_name: Yup.string()
    .min(2, 'Family Name must be at least 2 characters')
    .matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed'),

  address: Yup.string().min(10, 'Address must be at least 10 characters'),

  country: Yup.string().matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed'),

  city: Yup.string().matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed'),

  state: Yup.string().matches(/^[a-zA-Z ]*$/, 'Only alphabets are allowed'),

  pin_code: Yup.string().matches(/^[0-9]{6}$/, 'Pin code must be 6 digits'),

  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile is required'),

  email: Yup.string().email('Enter a valid email').optional(),

  religion: Yup.string(),

  // password: Yup.string()
  //   .min(6, 'Password must be at least 6 characters')
  //   .required('Password is required'),

  // confirm_password: Yup.string()
  //   .oneOf([Yup.ref('password'), null], 'Passwords must match')
  //   .required('Confirm Password is required'),

  agreeToTerms: Yup.boolean().oneOf([true], 'You must agree to the terms and conditions')
})
const RegisterV1 = () => {
  // ** Hook
  const theme = useTheme()
  const router = useRouter()

  const dispatch = useDispatch()
  //** State */
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClickShowPassword = () => setShowPassword(!showPassword)
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)
  const filer = useRef()
  const [openImageEdit, setImageEdit] = useState(false)

  const [isPreview, setPreviewMode] = useState(true)
  const [isLogoTemp, setLogoTemp] = useState(false)
  const [isCoverTemp, setCoverTemp] = useState(false)
  const [checked, setChecked] = useState(false)

  const [cropImage, setCropImage] = useState()
  const [cropType, setCropType] = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [logoFormData, setLogoFormData] = useState(null)
  const [logoFormURL, setLogoFormURL] = useState('')
  const [familyLogoFormData, setFamilyLogoFormDate] = useState(null)
  const [familyLogoFormURL, setFamilyLogoFormURL] = useState('')

  const hasDuplicates = array => {
    const filtered = array.filter(item => item !== '')
    return filtered.length !== new Set(filtered).size
  }

  // Helper function to get duplicate values
  const getDuplicates = array => {
    const counts = {}
    const duplicates = []

    array.forEach(value => {
      if (value !== '') {
        counts[value] = (counts[value] || 0) + 1
        if (counts[value] > 1) duplicates.push(value)
      }
    })

    return [...new Set(duplicates)]
  }
  const uploadImage = async (type, file, isDelete = false) => {
    setImageEdit(false)
    if (!isDelete) {
      const formData = new FormData()
      formData.append('file', file)
      var options = { content: formData }

      if (type == 'logo') {
        setLogoFormData(formData)
        const ur = URL.createObjectURL(file)
        setLogoFormURL(ur)
      } else if (type == 'familyLogo') {
        console.log('family logo')
        setFamilyLogoFormDate(formData)
        const ur = URL.createObjectURL(file)
        setFamilyLogoFormURL(ur)
      } else if (type == 'cover') {
        formData.append('service_type', 'cover_image')
        console.log(formData)

        let res = await uploadFile(formData)
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(false)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    } else {
      if (type == 'logo') {
        setLogoFormData(null)
        const ur = URL.revokeObjectURL(file)
        setLogoFormURL(ur)
      } else if (type == 'familyLogo') {
        setFamilyLogoFormDate(null)
        const ur = URL.revokeObjectURL(file)
        setFamilyLogoFormURL(ur)
      } else {
        let res = await deleteFile({
          service_type: 'cover_image'
        })
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(true)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    }
  }

  const editImage = type => {
    setPreviewMode(true)
    if (type === 'cover') {
      setCropAspectRatio(3.29 / 1)

      let banner = userData?.cover_image_url ? userData?.cover_image_url : 'placeholder'
      if (isCoverTemp) {
        filer.current.click()
        setCropType(type)
      } else if (type == 'familyLogo') {
        if (banner == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(banner)
          setCropType(type)
          setImageEdit(true)
        }
      } else {
        if (banner == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(banner)
          setCropType(type)
          setImageEdit(true)
        }
      }
    } else {
      setCropAspectRatio(1 / 1)
      let logoImage = 'placeholder'
      if (isLogoTemp) {
        filer.current.click()
        setCropType(type)
      } else {
        if (logoImage == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(logoImage)
          setCropType(type)
          setImageEdit(true)
        }
      }
    }
  }

  const onChange = e => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    if (files[0].size < 5000000) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result)
        setPreviewMode(false)
        setImageEdit(true)
        e.target.value = null
      }
      reader.readAsDataURL(files[0])
    } else {
      toast.warn('File size should be below 5MB.')
    }
  }
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      family_name: '',
      family_logo: '',
      address: '',
      country: 'India',
      city: '',
      state: '',
      countryCode: '+91',
      pin_code: '',
      mobile: '',
      email: '',
      religion: '',
      // confirm_password: '',
      // password: '',
      additional_phone_number: [''],
      profile_logo: '',
      dob: '1990-01-01',
      gender: 'Male'
    },
    validationSchema: signupSchema,
    onSubmit: async (values, { resetForm }) => {
      if (checked) {
        console.log(values)
        try {
          setIsLoading(true)
          let params = {
            ...values,
            name: values.first_name,
            country_code: values.countryCode,
            family_logo: {},
            profile_logo: {}
          }

          let profileLogo = {}
          let familyLogo = {}

          if (logoFormData != null) {
            const response = await apiPost(`${baseURL}user/upload-doc`, logoFormData, true)

            profileLogo = response?.data.detail || {}
          }

          if (familyLogoFormData != null) {
            const response = await apiPost(`${baseURL}user/upload-doc`, familyLogoFormData, true)

            familyLogo = response?.data.detail || {}
          }

          params = {
            ...values,
            name: values.first_name,
            country_code: values.countryCode,
            family_logo: familyLogo,
            profile_logo: profileLogo
          }

          const res = await apiPost(registerUrl, params)
          dispatch(handleLoggedInMobile(params?.mobile))
          resetForm()
          toast.success(res?.data?.message)
          router.replace('/verify')
        } catch (e) {
          toast.error(e)
        } finally {
          setIsLoading(false)
        }
      } else {
        toast.error('You must agree to the terms and conditions.')
      }
    }
  })

  const handleCheckboxChange = event => {
    const checked = event.target.checked
    setChecked(checked)
  }
  return (
    <Box className='content-center'>
      <AuthIllustrationV1WrapperV2>
        <Card>
          <CardContent sx={{ p: theme => `${theme.spacing(10.5, 8, 8)} !important` }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img height={62} width={'auto'} alt='add-role' src='/images/logo_long_trans.png' />
            </Box>
            <Box
              sx={{ mb: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}
            >
              <Typography variant='h4' sx={{ mb: 1.5 }}>
                {`Welcome to ${themeConfig.templateName}! `}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>Please register your account</Typography>
            </Box>
            <input
              style={{ display: 'none' }}
              id='raised-button-file'
              onChange={onChange}
              ref={filer}
              type='file'
              accept='.jpg,.png,.jpeg,.webpp'
            />
            <ImageUpload
              isOpen={openImageEdit}
              handleUpload={uploadImage}
              type={cropType}
              isPreview={isPreview}
              title={cropType == 'logo' || 'FamilyLogo' ? 'Change Logo' : 'Change Cover Photo'}
              aspectRatio={cropAspectRatio}
              selectedImage={cropImage}
              handleClose={(e, reason) => {
                if (reason && reason == 'backdropClick') {
                  return
                }
                setImageEdit(false)
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <Badge
                overlap='circular'
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={<CameraAlt sx={{ color: 'black' }} onClick={() => editImage('logo')} />}
              >
                <ProfilePicture src={logoFormURL || '/images/logo_short.png'} alt='profile-picture' />
              </Badge>
            </Box>
            <FormikProvider value={formik}>
              <Grid2 container spacing={6}>
                <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        required
                        label='First Name'
                        autoFocus
                        value={formik.values.first_name
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        sx={{ mb: 4 }}
                        name='first_name'
                        onChange={e => {
                          const regx = /^[a-zA-Z ]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        placeholder='Full Name'
                        error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                        helperText={formik.touched.first_name && formik.errors.first_name && formik.errors.first_name}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Last Name'
                        value={formik.values.last_name
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        sx={{ mb: 4 }}
                        name='last_name'
                        onChange={e => {
                          const regx = /^[a-zA-Z ]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        placeholder='Last Name'
                        // error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                        // helperText={formik.touched.last_name && formik.errors.last_name && formik.errors.last_name}
                      />
                    </Grid2>
                  </Grid2>
                  <TextField
                    fullWidth
                    size='small'
                    label='Family Name'
                    value={formik.values.family_name
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    sx={{ mb: 4 }}
                    name='family_name'
                    onChange={e => {
                      const regx = /^[a-zA-Z ]*$/
                      if (e.target.value === '' || regx.test(e.target.value)) {
                        formik.handleChange(e)
                      }
                    }}
                    placeholder='Family Name'
                    // error={formik.touched.family_name && Boolean(formik.errors.family_name)}
                    // helperText={formik.touched.family_name && formik.errors.family_name && formik.errors.family_name}
                  />
                  <Box>
                    <Typography>Family Logo</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<CameraAlt sx={{ color: 'black' }} onClick={() => editImage('familyLogo')} />}
                      >
                        <ProfilePicture src={familyLogoFormURL || '/images/family_logo_short.png'} alt='family-logo' />
                      </Badge>
                    </Box>
                  </Box>
                  <TextField
                    fullWidth
                    label='Email'
                    size='small'
                    // required
                    value={formik.values.email
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    sx={{ mb: 4 }}
                    name='email'
                    onChange={formik.handleChange}
                    placeholder='Email'
                    error={Boolean(formik.errors.email)}
                    helperText={formik.errors.email && formik.errors.email}
                  />
                  <TextField
                    fullWidth
                    size='small'
                    placeholder='Enter mobile number'
                    label='Mobile'
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
                  <FieldArray name='additional_phone_number'>
                    {({ push, remove }) => (
                      <>
                        {formik.values.additional_phone_number?.map((value, index) => (
                          <FormGroup key={index} sx={{ mb: 2 }}>
                            <TextField
                              size='small'
                              fullWidth
                              variant='outlined'
                              label='Additional Mobile Number'
                              name={`additional_phone_number.${index}`}
                              value={formik.values.additional_phone_number[index]}
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
                                  ),
                                  endAdornment: (
                                    <InputAdornment position='end'>
                                      {index === 0 ? (
                                        <AddCircleOutline
                                          color='primary'
                                          sx={{ cursor: 'pointer' }}
                                          onClick={() => {
                                            const currentValues = formik.values.additional_phone_number
                                            const hasEmptyFields = currentValues.some(v => !v.trim())
                                            const maxFieldsReached = currentValues.length >= 5

                                            if (!hasEmptyFields && !maxFieldsReached) {
                                              push('')
                                            }
                                          }}
                                        />
                                      ) : (
                                        <DeleteOutline
                                          color='primary'
                                          sx={{ cursor: 'pointer' }}
                                          onClick={() => remove(index)}
                                        />
                                      )}
                                    </InputAdornment>
                                  )
                                }
                              }}
                              onChange={e => {
                                const re = /^[0-9\b]+$/
                                if (e.target.value === '' || re.test(e.target.value)) {
                                  formik.setFieldValue(`additional_phone_number.${index}`, e.target.value)
                                }
                              }}
                              sx={{
                                mb: index === 0 ? 1 : 2,
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
                              error={
                                (formik.touched?.additional_phone_number?.[index] &&
                                  formik.errors?.additional_phone_number?.[index]) ||
                                hasDuplicates(formik.values.additional_phone_number)
                              }
                            />
                            {formik.touched?.additional_phone_number?.[index] &&
                              formik.errors?.additional_phone_number?.[index] && (
                                <FormHelperText error>{formik.errors.additional_phone_number[index]}</FormHelperText>
                              )}

                            {hasDuplicates(formik.values.additional_phone_number) &&
                              getDuplicates(formik.values.additional_phone_number).includes(value) && (
                                <FormHelperText error>This number has already been added</FormHelperText>
                              )}
                          </FormGroup>
                        ))}
                      </>
                    )}
                  </FieldArray>
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                  {/* <TextField
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
                    name='confirm_password'
                    value={formik.values.confirm_password
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    placeholder='············'
                    id='auth-register-password'
                    onChange={formik.handleChange}
                    type={showConfirmPassword ? 'text' : 'password'}
                    error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
                    helperText={
                      formik.touched.confirm_password &&
                      formik.errors.confirm_password &&
                      formik.errors.confirm_password
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
                  /> */}
                  <TextField
                    fullWidth
                    size='small'
                    select
                    label='Religion'
                    name='religion'
                    value={formik.values.religion}
                    onChange={formik.handleChange}
                    sx={{ mb: 4 }}
                    slotProps={{
                      select: {}
                    }}
                    // error={formik.touched.religion && Boolean(formik.errors.religion)}
                    // helperText={formik.touched.religion && formik.errors.religion && formik.errors.religion}
                  >
                    <MenuItem value=''>Select Religion</MenuItem>
                    <MenuItem value='hindu'>Hindu</MenuItem>
                    <MenuItem value='christian'>Christian</MenuItem>
                    <MenuItem value='muslim'>Muslim</MenuItem>
                    <MenuItem value='other'>Other</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    size='small'
                    multiline
                    rows={3.5}
                    label='Address'
                    name='address'
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    sx={{ mb: 4 }}
                    // error={formik.touched.address && Boolean(formik.errors.address)}
                    // helperText={formik.touched.address && formik.errors.address && formik.errors.address}
                  />
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        disabled
                        label='Country'
                        name='country'
                        value={formik.values.country
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => {
                          const regx = /^[a-zA-Z]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        sx={{ mb: 4 }}
                        // error={formik.touched.country && Boolean(formik.errors.country)}
                        // helperText={formik.touched.country && formik.errors.country && formik.errors.country}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='City'
                        name='city'
                        value={formik.values.city
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => {
                          const regx = /^[a-zA-Z ]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        sx={{ mb: 4 }}
                        // error={formik.touched.city && Boolean(formik.errors.city)}
                        // helperText={formik.touched.city && formik.errors.city && formik.errors.city}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='State'
                        name='state'
                        value={formik.values.state
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => {
                          const regx = /^[a-zA-Z ]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        sx={{ mb: 4 }}
                        // error={formik.touched.state && Boolean(formik.errors.state)}
                        // helperText={formik.touched.state && formik.errors.state && formik.errors.state}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Pin Code'
                        name='pin_code'
                        value={formik.values.pin_code
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => {
                          const regx = /^[0-9]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        sx={{ mb: 4 }}
                        // error={formik.touched.pin_code && Boolean(formik.errors.pin_code)}
                        // helperText={formik.touched.pin_code && formik.errors.pin_code && formik.errors.pin_code}
                      />
                    </Grid2>
                  </Grid2>
                </Grid2>
              </Grid2>
              <FormControlLabel
                control={
                  <Checkbox name='agreeToTerms' checked={checked} onChange={handleCheckboxChange} color='primary' />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Typography sx={{ color: 'text.secondary' }}>I agree to </Typography>
                    <Typography component={LinkStyled} href='/' onClick={e => e.preventDefault()} sx={{ ml: 1 }}>
                      Privacy policy & terms
                    </Typography>
                  </Box>
                }
              />
              <LoadingButton
                loading={isLoading}
                fullWidth
                type='submit'
                variant='contained'
                onClick={formik.handleSubmit}
                sx={{ mb: 4 }}
              >
                Register
              </LoadingButton>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography sx={{ color: 'text.secondary', mr: 2 }}>Already have an account?</Typography>
                <Typography component={LinkStyled} href='/login' sx={{ fontSize: theme.typography.body1.fontSize }}>
                  Login
                </Typography>
              </Box>
            </FormikProvider>
          </CardContent>
        </Card>
      </AuthIllustrationV1WrapperV2>
    </Box>
  )
}
RegisterV1.getLayout = page => <BlankLayout>{page}</BlankLayout>
RegisterV1.guestGuard = true
export default RegisterV1
