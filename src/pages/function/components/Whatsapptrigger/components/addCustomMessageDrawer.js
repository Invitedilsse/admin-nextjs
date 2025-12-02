import { useEffect, useState } from 'react'
import * as yup from 'yup'
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
import { addTemplateListWA, baseURL, updateTempalateListWA } from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { useSelector } from 'react-redux'

const validationSchema = yup.object().shape({
  family_name: yup.string().required('Family Name is required'),
  occasion_name: yup.string().required('Occasion is required'),
  name: yup.string().required('Name is required')
})

const AddCustomMessageDrawerAdmin = ({ open, toggle, id, RowData, fetchTable, page }) => {
  const [uploading, setUploading] = useState(false)
  const { functionId } = useSelector(state => state.adminMod)

  const handleFileUpload = async (event, setFieldValue) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)

      if (imageRes?.data && imageRes?.data.detail.url) {
        setFieldValue('banner_url', imageRes.data.detail.url)
        toast.success(imageRes?.data.message)
      }
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (id) {
        await apiPatch(`${updateTempalateListWA}?functionId=${functionId}&id=${id}`, { ...values })
        fetchTable()
        toast.success('Message updated successfully')
      } else {
        const res = await apiPost(`${addTemplateListWA}?functionId=${functionId}`, values) // adjust endpoint
        console.log(res)
        fetchTable()
        toast.success('Message created successfully')
      }
      toggle()
    } catch (err) {
      toast.error('Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  // console.log()

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } } }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{id ? 'Edit Template' : 'Create Template'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Formik
          initialValues={{
            family_name: RowData?.family_name || '',
            occasion_name: RowData?.occasion_name || '',
            name: RowData?.name || ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Family Name'
                name='family_name'
                value={values.family_name}
                onChange={handleChange}
                error={touched.family_name && Boolean(errors.family_name)}
                helperText={touched.family_name && errors.family_name}
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Occasion name'
                name='occasion_name'
                value={values.occasion_name}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                multiline
                rows={2}
                label='Name'
                name='name'
                value={values.name}
                onChange={handleChange}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
              />

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
