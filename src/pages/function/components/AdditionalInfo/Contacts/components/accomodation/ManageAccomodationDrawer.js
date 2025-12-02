// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

import { FieldArray, FormikProvider, useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Drawer, FormGroup, FormHelperText, Grid2, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost } from 'src/hooks/axios'
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


const ManageDetailsDrawer = props => {
  // ** Props
  const { open, toggle, RowData, oid } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const [searchText, setSearchText] = useState('')
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdd, setIsAdd] = useState(false)
  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'desc'
    }
  ])
  const { functionId } = useSelector(state => state.adminMod)

  const formik = useFormik({
    initialValues: {
      roomDetails: [{ room_number: '', room_key: '' }],
      // other form fields...
    },
    validationSchema: yup.object({
      roomDetails: yup.array().of(
        yup.object().shape({
          room_number: yup.string().required('Room Number is required'),
          room_key: yup.string().required('Room Key is required')
        })
      )
    }),
    onSubmit: async values => {
      console.log(values)
      console.log(RowData)
      const params = {
        function_id: functionId,
        contact_id: RowData.id,// RowData.contact_id.length>0 ? RowData.contact_id[0] : '',
        type: 'accommodation',
        oid: oid,
        data: values.roomDetails
      }
      try {
        setIsLoading(false)
        const result = await apiPost(`${baseURL}additional-detail/add`, params)
        toast.success(result?.data?.message)
        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toggle()
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })
  useEffect(() => {
    if (RowData.additional_details?.length > 0) {
      console.log(RowData.additional_details)
      formik.setFieldValue('roomDetails', RowData.additional_details[0].data)
    }

  }, [RowData])

  const hasDuplicateRooms = (roomDetails) => {
    const roomNumbers = roomDetails.map(detail => detail.room_number);
    return new Set(roomNumbers).size !== roomNumbers.length;
  };

  const getDuplicateRooms = (roomDetails) => {
    const counts = {};
    const duplicates = [];

    roomDetails.forEach(detail => {
      const roomNumber = detail.room_number;
      if (roomNumber) {
        counts[roomNumber] = (counts[roomNumber] || 0) + 1;
        if (counts[roomNumber] > 1 && !duplicates.includes(roomNumber)) {
          duplicates.push(roomNumber);
        }
      }
    });

    return duplicates;
  };
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
                                label="Room Number"
                                name={`roomDetails.${index}.room_number`}
                                value={formik.values.roomDetails[index].room_number}
                                onChange={formik.handleChange}
                                error={
                                  (formik.touched?.roomDetails?.[index]?.room_number &&
                                    formik.errors?.roomDetails?.[index]?.room_number) ||
                                  hasDuplicateRooms(formik.values.roomDetails)
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

                              {/* Key Field */}
                              <TextField
                                size="small"
                                fullWidth
                                variant="outlined"
                                label="Room Key"
                                name={`roomDetails.${index}.room_key`}
                                value={formik.values.roomDetails[index].room_key}
                                onChange={formik.handleChange}
                                error={
                                  formik.touched?.roomDetails?.[index]?.room_key &&
                                  formik.errors?.roomDetails?.[index]?.room_key
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

                              {/* Add/Remove Buttons */}
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {index === 0 ? (
                                  <AddCircleOutline
                                    color="primary"
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      const currentValues = formik.values.roomDetails;
                                      const hasEmptyFields = currentValues.some(
                                        v => !v.room_number?.trim() || !v.room_key?.trim()
                                      );
                                      const maxFieldsReached = currentValues.length >= 5;

                                      if (!hasEmptyFields && !maxFieldsReached) {
                                        push({ room_number: '', room_key: '' });
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
                            {/* Error Messages */}
                            {formik.touched?.roomDetails?.[index]?.room_number &&
                              formik.errors?.roomDetails?.[index]?.room_number && (
                                <FormHelperText error>
                                  {formik.errors.roomDetails[index].room_number}
                                </FormHelperText>
                              )}

                            {formik.touched?.roomDetails?.[index]?.room_key &&
                              formik.errors?.roomDetails?.[index]?.room_key && (
                                <FormHelperText error>
                                  {formik.errors.roomDetails[index].room_key}
                                </FormHelperText>
                              )}

                            {/* Duplicate Room Error Message */}
                            {hasDuplicateRooms(formik.values.roomDetails) &&
                              getDuplicateRooms(formik.values.roomDetails).includes(detail.room_number) && (
                                <FormHelperText error>
                                  This Seat has already been added
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

export default ManageDetailsDrawer
