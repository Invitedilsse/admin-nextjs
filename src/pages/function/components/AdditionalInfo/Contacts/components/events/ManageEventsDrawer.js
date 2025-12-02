// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// ** Custom Component Import
import { FieldArray, FormikProvider, useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Drawer, FormGroup, FormHelperText, Grid2, IconButton,TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { getListOfContactsNP } from 'src/store/adminMod'
import { AddCircleOutline, DeleteOutline } from '@mui/icons-material'
const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const ManageEventsDrawer = props => {
  // ** Props
  const { open, toggle, RowData, oid } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const [searchText, setSearchText] = useState('')
  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'desc'
    }
  ])
  const { functionId } = useSelector(state => state.adminMod)

  const formik = useFormik({
    initialValues: {
      roomDetails: [{ note: '', }],
    },
    validationSchema: yup.object({
      roomDetails: yup.array().of(
        yup.object().shape({
          note: yup.string().required('Note is required'),
        })
      )
    }),
    onSubmit: async values => {
      const params = {
        function_id: functionId,
        contact_id: RowData.id,// RowData.contact_id.length>0 ? RowData.contact_id[0] : '',
        type: 'events',
        oid: oid,
        data: values.roomDetails
      }
      try {
        const result = await apiPost(`${baseURL}additional-detail/add`, params)
        toast.success(result?.data?.message)
        setTimeout(() => {
          formik.resetForm()
        }, 500)
        toggle()
      } catch (e) {
        toast.error(e)
      }
    }
  })
  useEffect(() => {
    if (RowData.additional_details?.length > 0) {
      formik.setFieldValue('roomDetails', RowData.additional_details[0].data)
    }

  }, [RowData])

  const handleClose = () => {
    toggle()
  }

  const getAllContactsNP = () => {
    const queryParams = `search_string=${searchText}&sortDir=${sortModel.length > 0 ? sortModel[0]?.sort : 'desc'}&sortBy=${sortModel.length > 0 ? sortModel[0]?.field : 'name'}`
    dispatch(getListOfContactsNP(queryParams))
  }

  useEffect(() => {
    getAllContactsNP()
  }, [searchText, sortModel])

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
            <Typography variant='h5'>{'Add/Update Accomodation Details'}</Typography>
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
          <Box p={4} mx={4}>
            <Grid2 size={12}>
              <FormikProvider value={formik}>
                <FormikProvider value={formik}>
                  <FieldArray name="roomDetails">
                    {({ push, remove }) => (
                      <>
                        {formik.values.roomDetails?.map((detail, index) => (
                          <FormGroup key={index} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: index === 0 ? 1 : 2, my: 2 }}>
                              {/* Room Number Field */}
                              <TextField
                                size="small"
                                fullWidth
                                variant="outlined"
                                label="Note"
                                name={`roomDetails.${index}.note`}
                                value={formik.values.roomDetails[index].note}
                                onChange={formik.handleChange}
                                error={
                                  (formik.touched?.roomDetails?.[index]?.note &&
                                    formik.errors?.roomDetails?.[index]?.note)
                                  // hasDuplicateRooms(formik.values.roomDetails)
                                }
                                sx={{
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
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 ? (
                                  <AddCircleOutline
                                    color="primary"
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const currentValues = formik.values.roomDetails;
                                      const hasEmptyFields = currentValues.some(
                                        v => !v.note?.trim()
                                      );
                                      const maxFieldsReached = currentValues.length >= 5;

                                      if (!hasEmptyFields && !maxFieldsReached) {
                                        push({ note: '', });
                                      }
                                    }}
                                  />
                                ) : (
                                  <DeleteOutline
                                    color="error"
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => remove(index)}
                                  />
                                )}
                              </Box>
                            </Box>
                            {formik.touched?.roomDetails?.[index]?.note &&
                              formik.errors?.roomDetails?.[index]?.note && (
                                <FormHelperText error>
                                  {formik.errors.roomDetails[index].note}
                                </FormHelperText>
                              )}
                          </FormGroup>
                        ))}
                      </>
                    )}
                  </FieldArray>
                </FormikProvider>
              </FormikProvider>
            </Grid2>
            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
              <Button variant='outlined' color='primary' onClick={() => formik.handleSubmit()} sx={{ mb: 4, mt: 3 }}>
                Add
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ManageEventsDrawer
