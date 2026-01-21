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
  occasion_name: Yup.string().required('Occasion name is required'),
})


const AddOccasionTemplateDrawer = ({ open, toggle, RowData, fetchTable }) => {
  // alert('in')


  console.log("GOOGLE_KEY========?>>",RowData)

  // const[groupTypes,setGroupType] = useState(dropValue)

  const initialValues = {
    occasion_name: RowData?.occasion_name || '',
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...(RowData?.id && { id: RowData.id }),
        occasion_name: values.occasion_name,
      }

      console.log('payload---->',payload)

      if (RowData?.id) {
        await apiPatch(`${baseURL}map-management/edit-occasion`, payload)
        toast.success('Event updated successfully')
      } else {
        await apiPost(`${baseURL}map-management/create-occasion-template`, payload)
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
                    name="occasion_name"
                    label="Occasion Name *"
                    value={values.occasion_name}          
                    onChange={handleChange}               
                    error={touched.occasion_name && Boolean(errors.occasion_name)}
                    helperText={touched.occasion_name && errors.occasion_name}
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

export default AddOccasionTemplateDrawer
