import { useEffect, useRef, useState } from 'react'
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
  MenuItem,
  CircularProgress,
  Autocomplete as MuiAutocomplete,
  Grid2
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useFormik } from 'formik'
import * as yup from 'yup'
/* ---------------- VALIDATION ---------------- */

const validationSchema = Yup.object({
  event_name: Yup.string().required('Event name is required'),
})


const AddEventTemplateDrawer = ({ open, toggle, RowData, fetchTable }) => {
  // alert('in')


  console.log("GOOGLE_KEY========?>>",RowData)

  // const[groupTypes,setGroupType] = useState(dropValue)

  const initialValues = {
    event_name: RowData?.event_name || '',
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...(RowData?.id && { id: RowData.id }),
        event_name: values.event_name,
      }

      console.log('payload---->',payload)

      if (RowData?.id) {
        await apiPatch(`${baseURL}map-management/edit-event`, payload)
        toast.success('Event updated successfully')
      } else {
        await apiPost(`${baseURL}map-management/create-event-template`, payload)
        toast.success('Event created successfully')
      }

      fetchTable()
      toggle()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    toggle()
  }




  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', lg: '40%' } } }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>
            {RowData?.id ? 'Edit Location' : 'Create Location'}
          </Typography>
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

                    <TextField
                    fullWidth
                    name="event_name"
                    label="Event Name *"
                    value={values.event_name}          
                    onChange={handleChange}               
                    error={touched.event_name && Boolean(errors.event_name)}
                    helperText={touched.event_name && errors.event_name}
                    sx={{ mb: 2 }}
                  />


              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth variant='outlined' onClick={toggle}>
                  Cancel
                </Button>
                <LoadingButton
                  fullWidth
                  variant='contained'
                  type='submit'
                  loading={isSubmitting}
                >
                  {RowData?.id ? 'Update' : 'Create'}
                </LoadingButton>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Drawer>
  )
}

export default AddEventTemplateDrawer
