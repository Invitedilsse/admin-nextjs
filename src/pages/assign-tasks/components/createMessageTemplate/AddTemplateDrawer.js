import { useEffect, useState } from 'react'
import * as yup from 'yup'
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Divider,
  Button
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch } from 'src/hooks/axios'
import { addTemplateListWA, patchTemplateInputList, postTemplateInputList, updateTempalateListWA } from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import { useSelector } from 'react-redux'

const CreateCustomMessageDrawerAdmin = ({ open, toggle, id, RowData, fetchTable,functionId }) => {
  // const { functionId } = useSelector(state => state.adminMod)

  // -----------------------
  // PREFILL DYNAMIC FIELDS
  // -----------------------
  const initialDynamicFields = RowData?.fields
    ? Object.keys(RowData.fields).map(key => ({
        field: key,
        value: RowData.fields[key]
      }))
    : [{ field: 'field_0', value: '' }]

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        functionId,
        tempalte_name: values.tempalte_name
      }

      // add dynamic fields with field_x format
      values.dynamic.forEach((item, index) => {
        payload[`field_${index}`] = item.value
      })

      console.log('payload needed---->',payload)

      if (id) {
        const res = await apiPatch(`${patchTemplateInputList}/${id}`, payload)
        toast.success(res.data.message)
      } else {
       const res= await apiPost(`${postTemplateInputList}`, payload)
        toast.success(res.data.message)
      }
      fetchTable()
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
            dynamic: initialDynamicFields,
            tempalte_name: RowData?.tempalte_name || ''
          }}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, handleChange, isSubmitting }) => (
            <Form>
              {/* ------------------------------
                  Dynamic Fields Section
              -------------------------------- */}
               <Typography variant='h6' sx={{ mt: 2 }}>
                Template Name
              </Typography>
              <TextField
                    fullWidth
                    label={`Temaplate Name`}
                    name={`tempalte_name`}
                    value={values.tempalte_name}
                    onChange={handleChange}
                  />
              <Typography variant='h6' sx={{ mt: 2 }}>
                Template Fields
              </Typography>

              {values.dynamic.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mt: 2
                  }}
                >
                  <TextField
                    fullWidth
                    label={`Field ${index + 1}`}
                    name={`dynamic[${index}].value`}
                    value={item.value}
                    onChange={handleChange}
                  />

                  {/* Remove button */}
                  {values.dynamic.length > 1 && (
                    <IconButton
                      color='error'
                      onClick={() => {
                        const clone = [...values.dynamic]
                        clone.splice(index, 1)
                        setFieldValue('dynamic', clone)
                      }}
                    >
                      <Icon icon='tabler:trash' />
                    </IconButton>
                  )}
                </Box>
              ))}

              {/* Add new field */}
              <Button
                variant='outlined'
                sx={{ mt: 2 }}
                onClick={() => {
                  const newField = {
                    field: `field_${values.dynamic.length}`,
                    value: ''
                  }
                  setFieldValue('dynamic', [...values.dynamic, newField])
                }}
              >
                + Add Field
              </Button>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <LoadingButton
                  variant='outlined'
                  fullWidth
                  onClick={toggle}
                  disabled={isSubmitting}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  fullWidth
                  type='submit'
                  loading={isSubmitting}
                >
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

export default CreateCustomMessageDrawerAdmin
