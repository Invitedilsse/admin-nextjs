import { useEffect, useState } from 'react'
import * as yup from 'yup'
import { Box, Drawer, Typography, TextField, IconButton, Divider, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch } from 'src/hooks/axios'
import { baseURL, patchCustomPushTemplates, postCustomPushTemplates, updatemessageHrs } from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { useSelector } from 'react-redux'

const validationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  sub_heading: yup.string(),
  body: yup.string().required('Body is required'),
  banner_url: yup.string().url().nullable(),
  dispatch_date_time: yup.date().required('Dispatch Date & Time is required')
})

const AddCustomMessageDrawer = ({ open, toggle, id, RowData, fetchTable }) => {
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
        await apiPatch(`${patchCustomPushTemplates}/${id}`, { ...values })
        fetchTable()
        toast.success('Message updated successfully')
      } else {
        const res = await apiPost(`${postCustomPushTemplates}/${functionId}`, values) // adjust endpoint
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
            title: RowData?.title || '',
            sub_heading: RowData?.sub_heading || '',
            body: RowData?.body || '',
            banner_url: RowData?.banner_url || '',
            dispatch_date_time: RowData?.dispatch_date_time ? new Date(RowData.dispatch_date_time) : null
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
                label='Message Title'
                name='title'
                value={values.title}
                onChange={handleChange}
                error={touched.title && Boolean(errors.title)}
                helperText={touched.title && errors.title}
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Sub Heading'
                name='sub_heading'
                value={values.sub_heading}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                multiline
                rows={2}
                label='Body'
                name='body'
                value={values.body}
                onChange={handleChange}
                error={touched.body && Boolean(errors.body)}
                helperText={touched.body && errors.body}
              />

              {/* Date Picker Field */}
              <DatePickerWrapper>
                <DatePicker
                  selected={values.dispatch_date_time}
                  id='dispatch_date_time'
                  showTimeSelect
                  timeIntervals={1}
                  dateFormat='dd-MM-yyyy h:mm aa'
                  minDate={moment(new Date()).toDate()}
                  maxDate={moment(new Date()).add(6, 'months').toDate()}
                  maxTime={
                    values.dispatch_date_time
                      ? moment(values.dispatch_date_time).endOf('day').toDate()
                      : moment().endOf('day').toDate()
                  }
                  minTime={
                    values.dispatch_date_time
                      ? moment(values.dispatch_date_time).isBefore(moment(), 'day')
                        ? moment().endOf('day').toDate()
                        : moment(values.dispatch_date_time).isSame(moment(), 'day')
                          ? moment().toDate()
                          : moment(values.dispatch_date_time).startOf('day').toDate()
                      : moment().startOf('day').toDate()
                  }
                  onChange={date => setFieldValue('dispatch_date_time', date)}
                  placeholderText='Click to select a Master Dispatch Date Time'
                  customInput={
                    <TextField
                      label='Master Dispatch Date Time *'
                      required
                      fullWidth
                      error={touched.dispatch_date_time && Boolean(errors.dispatch_date_time)}
                      helperText={touched.dispatch_date_time && errors.dispatch_date_time}
                      sx={{ my: 2 }}
                    />
                  }
                />
              </DatePickerWrapper>

              {/* Banner Upload */}
              <Box sx={{ my: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 1 }}>
                  Banner Image
                </Typography>
                {values.banner_url ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={values.banner_url}
                      alt='banner preview'
                      style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
                    />
                    <Button variant='outlined' component='label' disabled={uploading}>
                      Re-upload
                      <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, setFieldValue)} />
                    </Button>
                  </Box>
                ) : (
                  <Button variant='contained' component='label' disabled={uploading}>
                    Upload Banner
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

export default AddCustomMessageDrawer
