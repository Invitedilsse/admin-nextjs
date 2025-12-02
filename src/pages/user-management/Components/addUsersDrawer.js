import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Divider,
  Button,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch } from 'src/hooks/axios'
import {
  baseURL
} from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import { useSelector } from 'react-redux'

const validationSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required').min(3).max(50),
  last_name: Yup.string().nullable(),
  user_name: Yup.string().nullable(),
  country_code: Yup.string().required('Country code required').min(1).max(4),
  mobile: Yup.string().required('Mobile is required').min(8).max(15),
  email: Yup.string().email('Invalid email').nullable(),
  address: Yup.string().nullable(),
  country: Yup.string().nullable(),
  city: Yup.string().nullable(),
  state: Yup.string().nullable(),
  pin_code: Yup.string().nullable(),
  dob: Yup.string().nullable(),
  gender: Yup.string().nullable(),
  role: Yup.string().oneOf(['main', 'admin', 'super-admin', 'support']).required('Role required')
})

const AddCustomMessageDrawerAdmin = ({ open, toggle, id, RowData, fetchTable, page }) => {
  const [uploading, setUploading] = useState(false)
  const { functionId } = useSelector(state => state.adminMod)
 const { userData } = useSelector(state => state.auth)

  const handleFileUpload = async (event, setFieldValue) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const imageRes = await apiPost(`${baseURL}admin/upload-doc`, formData, true)

      if (imageRes?.data?.detail?.url) {
        setFieldValue('profile_pic', {
          url: imageRes.data.detail.url,
          file_name: file.name
        })
        toast.success(imageRes.data.message)
      }
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ✅ Form Submit
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (RowData?.id) {
        await apiPatch(`${baseURL}admin/update-web`, {id:RowData?.id,...values})
        toast.success('User updated successfully')
      } else {
        let res = await apiPost(`${baseURL}admin/register-web`, values)
        console.log("res------>",res.data)
        toast.success('User created successfully')
      }
      fetchTable()
      toggle()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err)
    } finally {
      setSubmitting(false)
    }
  }

  // console.log()
    const initialValues = {
    first_name: RowData?.first_name || '',
    last_name: RowData?.last_name || '',
    user_name: RowData?.user_name || '',
    mobile: RowData?.mobile || '',
    email: RowData?.email || '',
    country_code: RowData?.country_code || '+91',
    address: RowData?.address || '',
    country: RowData?.country || '',
    city: RowData?.city || '',
    state: RowData?.state || '',
    pin_code: RowData?.pin_code || '',
    dob: RowData?.dob || '',
    gender: RowData?.gender || '',
    role: RowData?.role || 'main',
    profile_pic: RowData?.profile_pic || {}
  }

  const roleOptions = {
  main: ['main', 'super-admin', 'support'],
  'super-admin': ['super-admin', 'support'],
};

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } } }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{id ? 'Edit User' : 'Create User'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              {/* User Basic Info */}
              <TextField
                fullWidth sx={{ mb: 2 }} label='First Name *'
                name='first_name' value={values.first_name}
                onChange={handleChange}
                error={touched.first_name && Boolean(errors.first_name)}
                helperText={touched.first_name && errors.first_name}
              />
              <TextField
                fullWidth sx={{ mb: 2 }} label='Last Name'
                name='last_name' value={values.last_name}
                onChange={handleChange}
              />
              <TextField
                fullWidth sx={{ mb: 2 }} label='User Name'
                name='user_name' value={values.user_name}
                onChange={handleChange}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth label='Country Code *'
                  name='country_code' value={values.country_code}
                  onChange={handleChange}
                  error={touched.country_code && Boolean(errors.country_code)}
                  helperText={touched.country_code && errors.country_code}
                />
                <TextField
                  fullWidth label='Mobile *'
                  name='mobile' value={values.mobile}
                  onChange={handleChange}
                  error={touched.mobile && Boolean(errors.mobile)}
                  helperText={touched.mobile && errors.mobile}
                />
              </Box>

              <TextField
                fullWidth sx={{ my: 2 }} label='Email'
                name='email' value={values.email}
                onChange={handleChange}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />

              {/* Role Selection */}
              <InputLabel id='role_label'>Role *</InputLabel>
              <Select
                labelId='role_label'
                name='role'
                fullWidth
                sx={{ mb: 2 }}
                value={values.role || ''}
                onChange={handleChange}
              >
                 {(roleOptions[userData?.role] || []).map(r => (
                    <MenuItem key={r} value={r}>
                    {r.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </MenuItem>
                ))}
              </Select>

              {/* Address Section */}
              <TextField fullWidth sx={{ mb: 2 }} label='Address' name='address' value={values.address} onChange={handleChange} />
              <TextField fullWidth sx={{ mb: 2 }} label='City' name='city' value={values.city} onChange={handleChange} />
              <TextField fullWidth sx={{ mb: 2 }} label='State' name='state' value={values.state} onChange={handleChange} />
              <TextField fullWidth sx={{ mb: 2 }} label='Country' name='country' value={values.country} onChange={handleChange} />
              <TextField fullWidth sx={{ mb: 2 }} label='Pin Code' name='pin_code' value={values.pin_code} onChange={handleChange} />

              {/* Profile Image */}
              <Box sx={{ my: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 1 }}>Profile Picture</Typography>
                {values.profile_pic?.url ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={values.profile_pic.url}
                      alt='profile preview'
                      style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
                    />
                    <Button variant='outlined' component='label' disabled={uploading}>
                      Re-upload
                      <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, setFieldValue)} />
                    </Button>
                  </Box>
                ) : (
                  <Button variant='contained' component='label' disabled={uploading}>
                    Upload Profile
                    <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, setFieldValue)} />
                  </Button>
                )}
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <LoadingButton variant='outlined' fullWidth onClick={toggle} disabled={isSubmitting}>
                  Cancel
                </LoadingButton>
                <LoadingButton variant='contained' fullWidth type='submit' loading={isSubmitting}>
                  {id ? 'Update' : 'Create'}
                </LoadingButton>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Drawer>
  )
}

export default AddCustomMessageDrawerAdmin

