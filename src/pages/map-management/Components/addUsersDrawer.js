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
  location_title: Yup.string().required('Location name is required'),
  group_type: Yup.string().required('Group type is required'),
  lat: Yup.string().required('Latitude is required'),
  long: Yup.string().required('Longitude is required'),
  keywords: Yup.array().of(
    Yup.object({
      key: Yup.string().required()
    })
  )
})

/* ---------------- CONSTANTS ---------------- */

const key = process.env.KEY
const libraries = ['places']
const groupTypes = ['transport', 'event', 'accommodation']

/* ---------------- COMPONENT ---------------- */

const AddMapTemplateDrawer = ({ open, toggle, RowData, fetchTable,dropValue,setDropValue }) => {
  // alert('in')


  console.log("GOOGLE_KEY========?>>",key,dropValue,RowData)
  let libRef = useRef(libraries)
  const originRef = useRef()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key,
    libraries: libRef.current
  })

  // const[groupTypes,setGroupType] = useState(dropValue)

  const initialValues = {
    location_title: RowData?.location_title || '',
    group_type: RowData?.group_type || '',
    lat: RowData?.lat || '',
    long: RowData?.long || '',
    keywords: RowData?.keywords || []
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...(RowData?.id && { id: RowData.id }),
        location_title: values.location_title,
        group_type: values.group_type,
        lat: values.lat,
        long: values.long,
        keywords: values.keywords
      }

      console.log('payload---->',payload)

      if (RowData?.id) {
        await apiPatch(`${baseURL}map-management/edit-map`, payload)
        toast.success('Location updated successfully')
      } else {
        await apiPost(`${baseURL}map-management/create-map-template`, payload)
        toast.success('Location created successfully')
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




  if (!isLoaded) 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
    else
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
              <Autocomplete
               onLoad={(autocomplete) => {
                  originRef.current = autocomplete
                }}
                onPlaceChanged={() => {
                  const place = originRef.current.getPlace()
                  if (!place?.geometry) return

                  const lat = place.geometry.location.lat()
                  const lng = place.geometry.location.lng()

                  setFieldValue('location_title', place.formatted_address)
                  setFieldValue('lat', lat.toString())
                  setFieldValue('long', lng.toString())
                }}
              >
                  {/* <TextField
                    fullWidth
                    label='Location Name *'
                    error={touched.location_title && Boolean(errors.location_title)}
                    helperText={touched.location_title && errors.location_title}
                    sx={{ mb: 2 }}
                  /> */}
                    <TextField
                    fullWidth
                    name="location_title"
                    label="Location Name *"
                    value={values.location_title}          
                    onChange={handleChange}               
                    error={touched.location_title && Boolean(errors.location_title)}
                    helperText={touched.location_title && errors.location_title}
                    sx={{ mb: 2 }}
                  />

              </Autocomplete>

         
              {/* <InputLabel>Group Type *</InputLabel>
              <Select
                fullWidth
                name='group_type'
                value={values.group_type}
                onChange={handleChange}
                sx={{ mb: 2 }}
              >
                {dropValue.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.toUpperCase()}
                  </MenuItem>
                ))}
              </Select> */}

              <MuiAutocomplete
                freeSolo
                options={dropValue}
                value={values.group_type || ''}
                onChange={(event, newValue) => {
                  if (!newValue) return

                  // If new value typed → add to dropdown list
                  if (!dropValue.includes(newValue)) {
                    setDropValue(prev => [...prev, newValue])
                  }

                  setFieldValue('group_type', newValue)
                }}
                onInputChange={(event, newInputValue) => {
                  setFieldValue('group_type', newInputValue)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Group Type *"
                    placeholder="Select or type new"
                    error={touched.group_type && Boolean(errors.group_type)}
                    helperText={touched.group_type && errors.group_type}
                    sx={{ mb: 2 }}
                  />
                )}
              />


              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label='Latitude'
                  name='lat'
                  value={values.lat}
                  disabled
                />
                <TextField
                  fullWidth
                  label='Longitude'
                  name='long'
                  value={values.long}
                  disabled
                />
              </Box>
              <MuiAutocomplete
                multiple
                freeSolo
                options={[]}
                value={(values.keywords || []).map(k => k.key)}
                onChange={(e, newValue) => {
                  setFieldValue(
                    'keywords',
                    (newValue || []).map(v => ({ key: v.trim() }))
                  )
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Keywords'
                    placeholder='Press enter to add'
                    error={Boolean(touched.keywords && errors.keywords)}
                    helperText={touched.keywords && errors.keywords}
                  />
                )}
                sx={{ mb: 3 }}
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

export default AddMapTemplateDrawer
