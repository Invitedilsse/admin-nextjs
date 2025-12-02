// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
// ** Third Party Imports
import { EditorState } from 'draft-js'

// ** Component Import
// ** Third Party Imports
import * as yup from 'yup'
// ** Icon Imports

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Actions Imports

import { LoadingButton } from '@mui/lab'
import {
  Button,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Grid2,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import { toggleSnackBar } from 'src/store/auth'
import toast from 'react-hot-toast'
import { countryList } from 'src/@core/utils/country-list'
import { useDropzone } from 'react-dropzone'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
  // background: '#f8f8f8'
}))

// ** ValidationSchema
const validationSchema = yup.object({
  mobile: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile is required'),
  code: yup.string('code is required').trim().required('code is required'),
  name: yup
    .string('Name is required')
    .trim()
    .required('Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})

const StyledSelect = styled(Select)(({ theme }) => ({
  boxShadow: 'none !important',
  minWidth: '3.5rem !important',
  width: '6rem !important',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    minWidth: '90px'
    // width: '100%',
  }
}))
const SideBarGiftType = props => {
  // ** Props
  const { open, toggle, id, RowData, toggleAddUserDrawer } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)
  const [inviteFile, setInviteFile] = useState([])
  const formik = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      code: '+91'
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          contacts: [
            {
              name: values.name,
              country_code: values.code,
              mobile: values.mobile
            }
          ]
        }

        const result =
          id === ''
            ? await apiPost(`${baseURL}contacts/bulk-add`, params)
            : await apiPut(`${baseURL}contacts/update/${RowData.id}`, {
                name: values.name,
                country_code: values.code,
                mobile: values.mobile
              })
        console.log(result)
        toggle()
        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toast.success(result?.data?.message)
        // dispatch(
        //   toggleSnackBar({
        //     isOpen: true,
        //     type: 'success',
        //     message: result?.data?.message
        //   })
        // )
      } catch (e) {
        toast.error(e)
        // dispatch(
        //   toggleSnackBar({
        //     isOpen: true,
        //     type: 'error',
        //     message: e
        //   })
        // )
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const getCategory = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('name', data?.name)
        formik.setFieldValue('code', data?.country_code)
        formik.setFieldValue('mobile', data?.mobile)
      }
    } catch (e) {
      // sendNotification({
      //   message: e,
      //   variant: 'error'
      // })
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getCategory()
    }
  }, [id, userData])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDropRejected: fileRejections => {
      toast.error('Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: async acceptedFiles => {
      console.log(acceptedFiles)
      try {
        setIsLoadingExcel(true)
        const formData = new FormData()
        formData.append('file', acceptedFiles[0])
        // formData.append('file', values.imagePreview)
        const imageRes = await apiPost(`${baseURL}contacts/file-upload`, formData, true)
        toast.success(imageRes?.data?.message)
        toggle()
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoadingExcel(false)
      }
      //  setInviteFile(acceptedFiles)
      //  formik.setFieldValue('fileImagePreview', acceptedFiles[0])
    }
  })
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
            <Typography variant='h5'>{id !== '' ? 'Edit Contact' : 'Create a Contact'}</Typography>
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
            {/* <CardHeader
            sx={{
              py: 0
            }}
            title={id !== '' ? 'Edit a Category' : 'Create a Category'}
          /> */}
          </Header>
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  px: 8
                }}
              >
                <TextField
                  sx={{ my: 2 }}
                  label={'Name '}
                  required
                  // disabled
                  fullWidth
                  name='name'
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  value={formik.values.name
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={formik.touched.name && formik.errors.name && formik.errors.name}
                />
                <TextField
                  fullWidth
                  size='medium'
                  placeholder='Enter mobile number'
                  label='Mobile'
                  required
                  value={formik.values.mobile
                    ?.trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => {
                    const re = /^[0-9\b]+$/
                    if (e.target.value === '' || re.test(e.target.value)) {
                      formik.handleChange(e)
                    }
                  }}
                  name='mobile'
                  error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                  helperText={formik.touched.mobile && formik.errors.mobile}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <StyledSelect
                            size='small'
                            value={formik.values.code}
                            onChange={formik.handleChange}
                            name='code'
                            variant='outlined'
                          >
                            {countryList?.map(option => (
                              <MenuItem key={option.code} value={option.dial_code}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {option.code} {option.dial_code}
                                </Box>
                              </MenuItem>
                            ))}
                          </StyledSelect>
                          {/* <VerticalDivider orientation="vertical" /> */}
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    my: 2,

                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.23)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.87)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                {/* <TextField
                  sx={{ my: 2 }}
                  label={'mobile'}
                  multiline
                  minRows={2}
                  maxRows={3}
                  required
                  fullWidth
                  name='mobile'
                  error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                  value={formik.values.mobile
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={formik.touched.mobile && formik.errors.mobile && formik.errors.mobile}
                /> */}
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton
                      fullWidth
                      sx={{ mt: 4 }}
                      // loading={isLoading}
                      // size='small'
                      variant='outlined'
                      onClick={() => handleClose()}
                    >
                      {'Cancel '}
                    </LoadingButton>
                  </Grid2>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton
                      fullWidth
                      sx={{ mt: 4 }}
                      loading={isLoading}
                      // size='small'
                      variant='contained'
                      onClick={() => formik.handleSubmit()}
                    >
                      {id !== '' ? 'Update' : 'Add '}
                    </LoadingButton>
                  </Grid2>
                </Grid2>
              </Box>
            </Grid2>
          </Grid2>

          <Divider sx={{ my: 8 }}>
            <Chip label='OR' size='small' variant='outlined' />
          </Divider>

          <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'row'
                // px: 8
              }}
            >
              <Button variant='h6' sx={{ mb: 2.5 }}>
                Upload From Excel
              </Button>
              <Button
                sx={{
                  mb: 2.5
                }}
                onClick={() => {
                  window.open(
                    'https://my-invite-s3.s3.ap-south-1.amazonaws.com/user-section/1738691608285-cantact.xlsx',
                    '_blank'
                  )
                }}
              >
                Download sample Excel
              </Button>
            </Box>

            {!inviteFile.length && (
              <div
                {...getRootProps({
                  className: 'dropzone',
                  style: {
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    padding: '20px',
                    cursor: 'pointer'
                  }
                })}
              >
                <input {...getInputProps('host')} />
                {isLoadingExcel ? (
                  <Box
                    sx={{
                      display: 'flex',
                      textAlign: 'center',
                      alignItems: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      textAlign: 'center',
                      alignItems: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Box
                      sx={{
                        mb: 8.75,
                        width: 48,
                        height: 18,
                        display: 'flex',
                        borderRadius: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme => `rgba(${theme.palette.primary.main}, 0.08)`
                      }}
                    >
                      <Icon icon='vscode-icons:file-type-excel' fontSize='1.75rem' />
                    </Box>
                    <Typography variant='h6' sx={{ mb: 2.5 }}>
                      Drop Excel here or click to add.
                    </Typography>
                  </Box>
                )}
              </div>
            )}
            {/* {inviteFile.length>0 && (
                  <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                   <List sx={{  border: '2px dashed #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      cursor: 'pointer'}}>
          <ListItem disablePadding secondaryAction={
            <>
             <IconButton edge='end' aria-label='view' onClick={() => {
           
              if(inviteFile[0]?.url){
              window.open(inviteFile[0]?.url, '_blank')
              }else if(inviteFile[0]?.name){
                const file = inviteFile[0];
                const url = URL.createObjectURL(file);
                
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              }}>
            <Icon icon='lsicon:view-outline' fontSize='1.75rem'  color='grey' />
          </IconButton>
            <IconButton edge='end' aria-label='delete' onClick={() => setInviteFile([])}>
            <Icon icon='ic:twotone-delete' fontSize='1.75rem'  color='red' />
          </IconButton>
          </>
          }>
            <ListItemButton>
              <ListItemIcon>
              <Icon icon='mingcute:invite-line' fontSize='1.75rem' />
              </ListItemIcon>
              <ListItemText primary={inviteFile.length>0&&inviteFile[0]?.name || inviteFile.length>0&&inviteFile[0]?.file_name} />
            </ListItemButton>
          </ListItem>
          </List>
                  </Grid2>
                ) } */}
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarGiftType
