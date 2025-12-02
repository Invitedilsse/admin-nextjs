// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Actions Imports
import { LoadingButton } from '@mui/lab'
import { Drawer, FormControlLabel, Grid2, IconButton, InputAdornment, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { countryList } from 'src/@core/utils/country-list'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const StyledSelect = styled(Select)(({ theme }) => ({
  boxShadow: 'none !important',
  minWidth: '3.5rem !important',
  width: '6rem !important',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    minWidth: '90px',
  },

}));
const SideBarHelpline = props => {
  // ** Props
  const { open, toggle, id, RowData } = props

  // ** Hooks
  const classes = useStyles()
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const { functionId } = useSelector(state => state.adminMod)

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      number: '',
      isMobile: true,
      country_code: '+91',
      role: '',
    },
    validationSchema: yup.object({
      name: yup.string().min(4).max(50).required('Name is Required'),
      role: yup.string().min(2).required('Role is Required'),
      number: yup.string().when('isMobile', {
        is: true,
        then: (schema) => schema.required('Mobile Number is Required')
          .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
        otherwise: (schema) => schema.required('Other Phone Number is Required')
          .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      }),

      description: yup.string().min(4).max(225, 'Description must be at most 225 characters').required('Description is Required')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          name: values.name,
          role: values.role,
          designation: values.description,
          number: values.number,
          is_mobile: values.isMobile,
          country_code: values.country_code,
          function_id: functionId,
        }
        const result =
          id === ''
            ? await apiPost(`${baseURL}help-line/add`, params)
            : await apiPut(`${baseURL}help-line/update/${RowData.id}`, params)
        console.log(result)
        toggle()
        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toast.success(result?.data?.message)
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
    if (id != '') {
      formik.setFieldValue('name', '')
      formik.setFieldValue('role', '')
      formik.setFieldValue('description', '')
      formik.setFieldValue('number', '')
      formik.setFieldValue('isMobile', true)
      formik.setFieldValue('country_code', '+91')
    }
  }

  const getData = async () => {
    try {
      const data = RowData
      console.log(RowData)
      formik.resetForm()

      if (data && id !== '') {
        formik.setFieldValue('name', data?.name)
        formik.setFieldValue('role', data?.role)
        formik.setFieldValue('description', data?.designation)
        formik.setFieldValue('number', data?.number)
        formik.setFieldValue('isMobile', data?.is_mobile)
        formik.setFieldValue('country_code', data?.country_code)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getData()
    }
  }, [id, userData])

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      className={classes.root}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
    >
      <Box className={classes.root}>
        <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
          <Header>
            <Typography variant='h5'>{id !== '' ? 'Edit Helpline' : 'Create Helpline'}</Typography>
            <IconButton
              size='small'
              onClick={handleClose}
              sx={{
                p: '0.438rem',
                borderRadius: 1,
                color: 'text.primary',
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                }
              }}
            >
              <Icon icon='tabler:x' fontSize='1.125rem' />
            </IconButton>
          </Header>
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  px: 8
                }}
              >
                <TextField
                  sx={{ my: 2 }}
                  label={'Name '}
                  required
                  fullWidth
                  name='name'
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  value={formik.values.name
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={formik.touched.name && formik.errors.name && formik.errors.name}
                />
                <RadioGroup row aria-label='position' name='position' defaultValue='top'>
                  <FormControlLabel
                    value='top'
                    control={<Radio />}
                    label='Mobile Number'
                    onChange={e => {
                      formik.setFieldValue('isMobile', true)
                    }}
                    checked={formik.values.isMobile}
                  />
                  <FormControlLabel
                    value='bottom'
                    control={<Radio />}
                    label='Other Phone Number'
                    onChange={e => {
                      formik.setFieldValue('isMobile', false)
                    }}
                    checked={!formik.values.isMobile}
                  />
                </RadioGroup>
                {!formik.values.isMobile ? <TextField
                  fullWidth
                  required
                  label='Other Phone Number'
                  value={formik.values.number
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  sx={{ my: 2 }}
                  name='number'
                  onChange={e => {
                    const re = /^[0-9\b]+$/
                    if (e.target.value === '' || re.test(e.target.value)) {
                      formik.handleChange(e)
                    }
                  }}
                  placeholder='Other Phone Number'
                  slotProps={{
                    input: {
                      startAdornment: (<InputAdornment position="start" >
                        <StyledSelect
                          size="small"
                          value={formik.values.country_code}
                          onChange={formik.handleChange}
                          name="country_code"
                          variant="outlined"
                        >
                          {countryList?.map((option) => (
                            <MenuItem key={option.code} value={option.dial_code}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {option.code} {option.dial_code}
                              </Box>
                            </MenuItem>
                          ))}
                        </StyledSelect>
                      </InputAdornment>)
                    }
                  }}
                  error={formik.touched.number && Boolean(formik.errors.number)}
                  helperText={formik.touched.number && formik.errors.number && formik.errors.number}
                /> : <TextField
                  fullWidth
                  placeholder="Enter Mobile number"
                  label="Number"
                  required
                  value={formik.values.number?.trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => {
                    const re = /^[0-9\b]+$/
                    if (e.target.value === '' || re.test(e.target.value)) {
                      formik.handleChange(e)
                    }
                  }}
                  name="number"
                  error={formik.touched.number && Boolean(formik.errors.number)}
                  helperText={formik.touched.number && formik.errors.number}
                  slotProps={{
                    input: {
                      startAdornment: (<InputAdornment position="start" >
                        <StyledSelect
                          size="small"
                          value={formik.values.country_code}
                          onChange={formik.handleChange}
                          name="country_code"
                          variant="outlined"
                        >
                          {countryList?.map((option) => (
                            <MenuItem key={option.code} value={option.dial_code}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {option.code} {option.dial_code}
                              </Box>
                            </MenuItem>
                          ))}
                        </StyledSelect>
                      </InputAdornment>)
                    }
                  }}
                  sx={{
                    my: 2,

                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.87)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      }
                    }
                  }}
                />
                }
                <TextField
                  sx={{ my: 2 }}
                  label={'Role '}
                  required
                  // disabled
                  fullWidth
                  name='role'
                  error={formik.touched.role && Boolean(formik.errors.role)}
                  value={formik.values.role
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={formik.touched.role && formik.errors.role && formik.errors.role}
                />
                <TextField
                  sx={{ my: 2 }}
                  label={'Description'}
                  multiline
                  minRows={2}
                  maxRows={3}
                  required
                  fullWidth
                  name='description'
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  value={formik.values.description
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={
                    <>
                      {formik.touched.description && formik.errors.description && formik.errors.description}
                      <span style={{ float: 'right' }}>{formik.values.description.length}/225</span>
                    </>
                  }
                />
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton
                      fullWidth
                      sx={{ mt: 4 }}
                      variant='outlined'
                      onClick={() => handleClose()}
                    >
                      {'Cancel '}
                    </LoadingButton>
                  </Grid2>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton
                      fullWidth
                      sx={{ mt: 4 }}
                      loading={isLoading}
                      variant='contained'
                      onClick={formik.handleSubmit}
                    >
                      {id !== '' ? 'Update' : 'Add '}
                    </LoadingButton>
                  </Grid2>
                </Grid2>
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarHelpline
