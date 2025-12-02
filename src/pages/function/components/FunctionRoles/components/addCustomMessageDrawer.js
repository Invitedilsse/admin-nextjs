import { useEffect, useState } from 'react'
import * as yup from 'yup'
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch } from 'src/hooks/axios'
import {
  createRoleList,
  patchCustomPushTemplates,
  patchRoleList,
  postCustomPushTemplates
} from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import { useSelector } from 'react-redux'

// Validation schema
const validationSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  mobile: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile is required'),
  notes: yup.string(),
  role: yup.string().required('Role is required'),
  mapped_access: yup.array().of(yup.string()).min(1, 'At least one access is required')
})

const roleOptions = ['co-host', 'manager']
const accessOptions = [
  { value: 'all', key: 'All' },
  { value: 'function', key: 'Function Reports' },
  { value: 'roles', key: 'Roles & Allotmnet' },
  { value: 'call', key: 'Guest Calling Management' }
]

const AddCustomMessageDrawer = ({ open, toggle, id, RowData, fetchTable }) => {
  const { functionId } = useSelector(state => state.adminMod)

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('innn')
      if (id) {
        await apiPatch(`${patchRoleList}/${id}`, { ...values, function_id: functionId })
        fetchTable()
        toast.success('Message updated successfully')
      } else {
        await apiPost(`${createRoleList}`, { ...values, function_id: functionId })
        fetchTable()
        toast.success('Message created successfully')
      }
      toggle()
    } catch (err) {
      console.log(err)
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
          <Typography variant='h5'>{id ? 'Edit Roles' : 'Create Roles'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Formik
          initialValues={{
            name: RowData?.name || '',
            mobile: RowData?.mobile || '',
            notes: RowData?.notes || '',
            role: RowData?.role || '',
            mapped_access: RowData?.mapped_access || []
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
                label='Name'
                name='name'
                value={values.name}
                onChange={handleChange}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
                disabled={id}
              />

              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Mobile'
                name='mobile'
                value={values.mobile}
                // onChange={handleChange}
                onChange={e => {
                  const re = /^[0-9\b]+$/
                  if (e.target.value === '' || re.test(e.target.value)) {
                    handleChange(e)
                  }
                }}
                error={touched.mobile && Boolean(errors.mobile)}
                helperText={touched.mobile && errors.mobile}
                disabled={id}
              />

              <FormControl
                fullWidth
                sx={{ my: 1 }}
                error={touched.role && Boolean(errors.role)} // ✅ move error here
              >
                <InputLabel id='role-label'>Role</InputLabel>
                <Select labelId='role-label' name='role' value={values.role} onChange={handleChange}>
                  {roleOptions.map(role => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
                {touched.role && errors.role && (
                  <Typography color='error' variant='caption' sx={{ mt: 0.5 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>

              {/* Mapped Access Multi Select */}
              {/* <FormControl fullWidth sx={{ my: 1 }}>
                <InputLabel id='mapped-access-label'>Mapped Access</InputLabel>
                <Select
                  labelId='mapped-access-label'
                  multiple
                  value={values.mapped_access}
                  onChange={e => setFieldValue('mapped_access', e.target.value)}
                  input={<OutlinedInput label='Mapped Access' />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {accessOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.key}
                    </MenuItem>
                  ))}
                </Select>
                {touched.mapped_access && errors.mapped_access && (
                  <Typography color='error' variant='caption'>
                    {errors.mapped_access}
                  </Typography>
                )}
              </FormControl> */}

              <FormControl
                fullWidth
                sx={{ my: 1 }}
                error={touched.mapped_access && Boolean(errors.mapped_access)} // ✅ move error here
              >
                <InputLabel id='mapped-access-label'>Mapped Access</InputLabel>
                <Select
                  labelId='mapped-access-label'
                  multiple
                  value={values.mapped_access}
                  onChange={e => {
                    let selected = e.target.value

                    // Case 1: If user explicitly selects "all"
                    if (selected.includes('all')) {
                      selected = ['all']
                    } else if (
                      selected.length === accessOptions.length - 1 && // all except 'all'
                      !selected.includes('all')
                    ) {
                      // Case 2: If all values except 'all' are selected → replace with only 'all'
                      selected = ['all']
                    }

                    setFieldValue('mapped_access', selected)
                  }}
                  input={<OutlinedInput label='Mapped Access' />}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => {
                        const label = accessOptions.find(opt => opt.value === value)?.key || value
                        return <Chip key={value} label={label} />
                      })}
                    </Box>
                  )}
                >
                  {accessOptions.map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={
                        values.mapped_access.includes('all') && option.value !== 'all' // disable others if 'all' is selected
                      }
                    >
                      {option.key}
                    </MenuItem>
                  ))}
                </Select>

                {/* ✅ Show error here (instead of helperText inside Select) */}
                {touched.mapped_access && errors.mapped_access && (
                  <Typography color='error' variant='caption' sx={{ mt: 0.5 }}>
                    {errors.mapped_access}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                sx={{ my: 1 }}
                multiline
                rows={2}
                label='Notes'
                name='notes'
                value={values.notes}
                onChange={handleChange}
                error={touched.notes && Boolean(errors.notes)}
                helperText={touched.notes && errors.notes}
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

export default AddCustomMessageDrawer
