// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

import { FieldArray, FormikProvider, useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import { Button, Drawer, FormGroup, FormHelperText, Grid2, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiDelete, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { getListOfContactsNP } from 'src/store/adminMod'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { AddCircleOutline, CloudUpload, DeleteOutline } from '@mui/icons-material'
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
  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'desc'
    }
  ])
  const { functionId } = useSelector(state => state.adminMod)
  function findDuplicates(arr) {
    if (!arr) {
      return;
    }
    if (Array.isArray(arr)) {
      const filtered = arr.filter((item, index) => arr.indexOf(item) !== index);
      return [...new Set(filtered)];
    }
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      roomDetails: [{ seats: '', tickets: '' }],
    },
    validationSchema: yup.object({
      roomDetails: yup.array().of(
        yup.object().shape({
          seats: yup.string().required('Seat is required'),
          tickets: yup.string().required('Tickets is required')
        })
      )
    }),
    onSubmit: async values => {
      try {
        const params = {
          function_id: functionId,
          contact_id: RowData?.id,// RowData.contact_id.length>0 ? RowData.contact_id[0] : '',
          type: 'transportation',
          oid: oid,
          data: values.roomDetails
        }
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
    const roomNumbers = roomDetails.map(detail => detail.seats);
    return new Set(roomNumbers).size !== roomNumbers.length;
  };

  const getDuplicateRooms = (roomDetails) => {
    const counts = {};
    const duplicates = [];

    roomDetails.forEach(detail => {
      const roomNumber = detail.seats;
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

  const deleteImage = async (index, item) => {
    console.log(item)
    const key = { key: item?.key }
    try {
      const result = await apiDelete(`${baseURL}user/file-delete`, key)
      if (result?.status == 200) {
        return true
      }
    } catch (e) {
      console.log(e)
      toast.error(e)
      return false
    }
  }
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
            <Typography variant='h5'>{'Add/Update Transportation Details'}</Typography>
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
              <FormikProvider value={formik} >
                <FieldArray name="roomDetails" >
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
                              label="Seat"
                              name={`roomDetails.${index}.seats`}
                              value={formik.values.roomDetails[index].seats}
                              onChange={formik.handleChange}
                              error={
                                (formik.touched?.roomDetails?.[index]?.seats &&
                                  formik.errors?.roomDetails?.[index]?.seats) ||
                                hasDuplicateRooms(formik.values.roomDetails)
                              }
                              helperText={
                                (formik.touched?.roomDetails?.[index]?.seats &&
                                  formik.errors?.roomDetails?.[index]?.seats) ? formik.errors?.roomDetails?.[index]?.seats : hasDuplicateRooms(formik.values.roomDetails) &&
                                  getDuplicateRooms(formik.values.roomDetails).includes(detail.seats) && (

                                  "This Seat has already been added"

                                )}

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
                            {formik.values.roomDetails[index].tickets !== "" ?
                              <Box sx={{ width: 300, display: 'flex', height: 40, justifyContent: 'space-between' }}>
                                <Button variant={"outlined"} color="primary" size='small' fullWidth sx={{ mr: 2 }} onClick={() => {

                                  const ticket = JSON.parse(formik.values.roomDetails[index].tickets)
                                  if (ticket) {
                                    window.open(ticket.url)
                                  }
                                }}>
                                  View
                                </Button>
                                <Button variant={"outlined"} color="error" size='small' fullWidth onClick={async () => {

                                  const ticket = JSON.parse(formik.values.roomDetails[index].tickets)
                                  if (ticket) {
                                    const res = await deleteImage(index, ticket)
                                    if (res) {
                                      formik.setFieldValue(`roomDetails.${index}.tickets`, "")

                                    }
                                  }
                                }}>
                                  Delete
                                </Button>
                              </Box> :
                              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <input
                                  type="file"
                                  id={`file-upload-${index}`}
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  hidden
                                  onChange={async (event) => {
                                    const file = event.currentTarget.files[0];

                                    // If no file was selected, exit the function
                                    if (!file) return;

                                    // Check file type
                                    const validFileTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
                                    if (!validFileTypes.includes(file.type)) {
                                      toast.error("Invalid file type. Please upload PDF, PNG, or JPEG files only.");
                                      // Reset the input
                                      event.target.value = null;
                                      return;
                                    }

                                    // Check file size (5MB = 5 * 1024 * 1024 bytes)
                                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                                    if (file && file.size > maxSize) {
                                      // Show error message for file size
                                      toast.error("File size exceeds 5MB limit. Please choose a smaller file.")
                                      // Reset the input
                                      event.target.value = null;
                                      return;
                                    }
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    try {
                                      const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
                                      console.log(imageRes)
                                      if (imageRes?.data && imageRes?.data.detail) {

                                        formik.setFieldValue(`roomDetails.${index}.tickets`, JSON.stringify(imageRes?.data.detail))
                                        toast.success(imageRes?.data.message)

                                      }
                                    } catch (e) {
                                      toast.error(e)
                                    }
                                  }}
                                />
                                <label htmlFor={`file-upload-${index}`}>
                                  <LoadingButton
                                    variant="outlined"
                                    component="span"
                                    size="small"
                                    startIcon={<CloudUpload />}
                                    sx={{
                                      borderColor: 'rgba(0, 0, 0, 0.23)',
                                      color: 'text.primary',
                                      height: '40px',
                                      '&:hover': {
                                        borderColor: 'rgba(0, 0, 0, 0.87)',
                                      }
                                    }}
                                  >
                                    {formik.values.roomDetails[index].file ?
                                      formik.values.roomDetails[index].file.name.substring(0, 15) +
                                      (formik.values.roomDetails[index].file.name.length > 15 ? '...' : '') :
                                      'Upload Ticket'}
                                  </LoadingButton>
                                </label>
                                {formik.touched?.roomDetails?.[index]?.tickets &&
                                  formik.errors?.roomDetails?.[index]?.tickets && (
                                    <FormHelperText error>
                                      {formik.errors.roomDetails[index].tickets}
                                    </FormHelperText>
                                  )}
                              </Box>}

                            {/* Add/Remove Buttons */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {index === 0 ? (
                                <AddCircleOutline
                                  color="primary"
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    const currentValues = formik.values.roomDetails;
                                    const hasEmptyFields = currentValues.some(
                                      v => !v.seats?.trim() || !v.tickets?.trim()
                                    );
                                    const maxFieldsReached = currentValues.length >= 5;

                                    if (!hasEmptyFields && !maxFieldsReached) {
                                      push({ seats: '', tickets: '', file: null });
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
                        </FormGroup>
                      ))}
                    </>
                  )}
                </FieldArray>
              </FormikProvider>
            </Grid2>
            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
              <Button variant='outlined' color='primary' onClick={async () => {
                console.log(await formik.validateForm())
                formik.handleSubmit()
              }} sx={{ mb: 4, mt: 3 }}>
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
