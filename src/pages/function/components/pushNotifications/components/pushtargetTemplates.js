import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { Box, Drawer, Typography, TextField, IconButton, Divider, Button, Grid2, makeStyles } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
// import { makeStyles } from '@mui/styles'

// const useStyles = makeStyles({
//   root: {}
// })
const validationSchema = yup.object({
  user_id: yup.string().required('User is required'),
  device_id: yup.string().required('Device ID is required'),
  fcm_id: yup.string().required('FCM ID is required')
})

const PushNotificationTargetDrawer = ({ open, toggle, id, RowData, templateId }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  //   const classes = useStyles()

  const formik = useFormik({
    initialValues: {
      user_id: '',
      device_id: '',
      fcm_id: '',
      title: '',
      sub_heading: '',
      body: '',
      banner_url: ''
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        const payload = { ...values, notification_id: templateId }
        const result =
          id === ''
            ? await apiPost(`${baseURL}push/targets`, payload)
            : await apiPut(`${baseURL}push/targets/${RowData.id}`, payload)
        toast.success(result?.data?.message)
        toggle()
        formik.resetForm()
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Error')
      } finally {
        setIsLoading(false)
      }
    }
  })

  //   useEffect(() => {
  //     alert('Use Effect Called')
  //     console.log('RowData:', RowData)
  //     if (id !== '') {
  //       formik.setValues({
  //         user_id: RowData?.user_id || '',
  //         device_id: RowData?.device_id || '',
  //         fcm_id: RowData?.fcm_id || '',
  //         title: RowData?.title || '',
  //         sub_heading: RowData?.sub_heading || '',
  //         body: RowData?.body || '',
  //         banner_url: RowData?.banner_url || ''
  //       })
  //     }
  //   }, [id, RowData])

  const handleFileUpload = async event => {
    const file = event.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      // call your backend upload API (assuming it returns file URL)
      const res = await apiPost(`${baseURL}file/upload`, formData, true)
      const imageUrl = res?.data?.url
      if (imageUrl) {
        formik.setFieldValue('banner_url', imageUrl)
        toast.success('Image uploaded successfully')
      }
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      //   className={classes.root}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{id !== '' ? 'Edit Target' : 'Add Target'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='User ID'
            name='user_id'
            value={formik.values.user_id}
            onChange={formik.handleChange}
            error={formik.touched.user_id && Boolean(formik.errors.user_id)}
            helperText={formik.touched.user_id && formik.errors.user_id}
          />
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='Device ID'
            name='device_id'
            value={formik.values.device_id}
            onChange={formik.handleChange}
            error={formik.touched.device_id && Boolean(formik.errors.device_id)}
            helperText={formik.touched.device_id && formik.errors.device_id}
          />
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='FCM ID'
            name='fcm_id'
            value={formik.values.fcm_id}
            onChange={formik.handleChange}
            error={formik.touched.fcm_id && Boolean(formik.errors.fcm_id)}
            helperText={formik.touched.fcm_id && formik.errors.fcm_id}
          />
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='Title'
            name='title'
            value={formik.values.title}
            onChange={formik.handleChange}
          />
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='Sub Heading'
            name='sub_heading'
            value={formik.values.sub_heading}
            onChange={formik.handleChange}
          />
          <TextField
            fullWidth
            sx={{ my: 2 }}
            label='Body'
            name='body'
            value={formik.values.body}
            onChange={formik.handleChange}
          />

          <Box sx={{ my: 3 }}>
            <Typography variant='subtitle1' sx={{ mb: 1 }}>
              Banner Image
            </Typography>
            {formik.values.banner_url ? (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={formik.values.banner_url}
                  alt='banner preview'
                  style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
                />
                <Button variant='outlined' component='label' disabled={uploading}>
                  Re-upload
                  <input type='file' hidden accept='image/*' onChange={handleFileUpload} />
                </Button>
              </Box>
            ) : (
              <Button variant='contained' component='label' disabled={uploading}>
                Upload Banner
                <input type='file' hidden accept='image/*' onChange={handleFileUpload} />
              </Button>
            )}
          </Box>

          <Grid2 container spacing={2} sx={{ mt: 2 }}>
            <Grid2 item xs={6}>
              <LoadingButton fullWidth variant='outlined' onClick={toggle}>
                Cancel
              </LoadingButton>
            </Grid2>
            <Grid2 item xs={6}>
              <LoadingButton fullWidth variant='contained' type='submit' loading={isLoading}>
                {id !== '' ? 'Update' : 'Create'}
              </LoadingButton>
            </Grid2>
          </Grid2>
        </form>
      </Box>
    </Drawer>
  )
}

export default PushNotificationTargetDrawer
