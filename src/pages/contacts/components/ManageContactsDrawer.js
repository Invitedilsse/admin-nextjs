// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { apiGet, apiPost, apiPut, getAccessToken } from 'src/hooks/axios'
import { baseURL, userProfileUrl } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { countryList } from 'src/@core/utils/country-list'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/router'
import { handleExcelAutoSelected } from 'src/store/adminMod'
import { QrCodeScannerOutlined } from '@mui/icons-material'
import { convertBase64Blob } from 'src/utils/blobconverter'
import axios from 'axios'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { io } from 'socket.io-client'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
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
    .max(70, 'Maximum 70 character only allowed'),
  alternate_po: yup
    .array()
    .of(yup.string().matches(/^[0-9+ ]{10,15}$/, 'Invalid number'))
    .max(5, 'Max 5 alternate numbers')
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
  }
}))
const SideBarGiftType = props => {
  const socket = io(process.env.SOCKETKEY, {
    transports: ['websocket', 'polling'], // include both
    withCredentials: true
  }) //check dev
  // socket.on('connect', () => {
  //   console.log('Socket connected:', socket.id)
  //   socket.emit('registerUser', userId) // register immediately
  // })
  // ** Props
  const { open, toggle, id, RowData } = props

  // ** Hooks
  const classes = useStyles()
  const router = useRouter()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)
  const [inviteFile, setInviteFile] = useState([])
  const [errorTable, setErrorTable] = useState([])
  const [isErrorTable, setIsErrorTable] = useState(false)
  const [popupData, setPopupData] = useState(null)
  const [isReplaceVal, setIsReplaceVal] = useState(false)
  const [timer, setTimer] = useState(30)
  const [countdownActive, setCountdownActive] = useState(false)
  const [existingUsers, setexistingUsers] = useState([])
  const [isExistingUser, setIsExistingUser] = useState(false)
  console.log('manage contact drawer add cont--->', router.pathname)
  const formik = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      code: '+91',
      alternate_po: [],
      address: '',
      family_name: '',
      // door_no: '',
      // street_name: '',
      area_1: '',
      area_2: '',
      city: '',
      state: '',
      pin_code: '',
      relation: '',
      last_name: ''
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
              mobile: values.mobile,
              ...values
            }
          ]
        }
        console.log('values--->', values, params)

        const result =
          id === ''
            ? await apiPost(`${baseURL}contacts/bulk-add`, params)
            : await apiPut(`${baseURL}contacts/update/${RowData.id}`, {
                name: values.name,
                country_code: values.code,
                mobile: values.mobile,
                ...values
              })
        console.log('single add--->', result)
        if (result.status === 200) {
          if (router.pathname === '/function' && id === '') {
            let excelAddedData =
              result.data.result && result.data.result.length ? result.data.result.map(d => d.id) : []
            console.log('excelAddedData--->', excelAddedData)
            dispatch(handleExcelAutoSelected({ data: excelAddedData, booleanval: true }))
            console.log('out----->')
          }
        }
        toggle()
        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toast.success(result?.data?.message)
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
    if (id != '' || formik.values.name === '' || formik.values.mobile === '') {
      formik.resetForm()
    }
  }

  const getContactData = async () => {
    try {
      const data = RowData

      if (data && id !== '') {
        console.log('data--->', data)
        formik.setFieldValue('name', data?.name)
        formik.setFieldValue('code', data?.country_code)
        formik.setFieldValue('mobile', data?.mobile)
        formik.setFieldValue('address', data?.address)
        formik.setFieldValue('family_name', data?.family_name)
        // formik.setFieldValue('street_name', data?.street_name)
        formik.setFieldValue('area_1', data?.area_1)
        formik.setFieldValue('area_2', data?.area_2)
        formik.setFieldValue('city', data?.city)
        formik.setFieldValue('state', data?.state)
        formik.setFieldValue('pin_code', data?.pin_code)
        formik.setFieldValue('relation', data?.relation)
        formik.setFieldValue('alternate_po', data?.alternate_po)
        formik.setFieldValue('last_name', data?.last_name)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  const exportSeclectedExcelFun = async () => {
    try {
      // let url = `${baseURL}invitee-contact/export-excel?function_id=${functionId}`
      // console.log('url----->', url)

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.post(
        `${baseURL}contacts/export-excel`,
        {
          // columnNames: selectedColumns
          columnNames: []
        },
        config
      )
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, 'addcontactlist.xlsx')
      toast.success('excel file downloaded successfully')
    } catch (e) {
      console.log('res----->', e)
      toast.error(e)
    } finally {
    }
  }
  useEffect(() => {
    if (id !== '') {
      getContactData()
    }
  }, [id, userData])

  useEffect(() => {
    console.log('registerUser------->', userData)
    socket.emit('registerUser', userData.id)
    socket.on('duplicateContact', data => {
      console.log('registerUser Duplicate received:', data)
      setPopupData(data)
    })
    return () => {
      socket.off('duplicateContact') // cleanup listener
    }
    // socket.on('duplicateContact', data => {
    //   console.log('data----->', data)
    //   setPopupData(data)
    // })
  }, [])

  useEffect(() => {
    if (popupData) {
      setIsReplaceVal(true)
    }
  }, [popupData])

  useEffect(() => {
    let interval
    if (isReplaceVal) {
      setTimer(30)
      setCountdownActive(true)
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setCountdownActive(false)
            handleDecision('no-replace') // auto-close after timeout
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isReplaceVal])

  useEffect(() => {
    if (existingUsers.length > 0) {
      setIsExistingUser(true)
    }
  }, [existingUsers])

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
      try {
        setIsLoadingExcel(true)
        const formData = new FormData()
        formData.append('file', acceptedFiles[0])
        const imageRes = await apiPost(`${baseURL}contacts/file-upload`, formData, true)
        console.log('imageRes------>', imageRes)
        if (imageRes.status === 200) {
          if (!imageRes.data.status && imageRes.data.status !== 400 && !imageRes.data.errors) {
            if (router.pathname === '/function') {
              let excelAddedData =
                imageRes.data.result && imageRes.data.result.length ? imageRes.data.result.map(d => d.id) : []
              let existing = imageRes.data?.existingUsers || []
              setexistingUsers(existing)
              console.log('existing---------->', existing)
              console.log('excelAddedData--->', excelAddedData)
              dispatch(handleExcelAutoSelected({ data: excelAddedData, booleanval: true }))
              toast.success(imageRes?.data?.message)
              toggle()
              console.log('out----->')
            }
          } else {
            console.log('err blk----->', imageRes.data)
            setErrorTable(imageRes.data.errors || [])
            toast.error('Errors In Excel. Please Check And Re-upload!')
            setIsErrorTable(true)
          }
        }
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoadingExcel(false)
      }
    }
  })

  const handleCloseModal = () => {
    setIsErrorTable(false)
    setIsExistingUser(false)
    setErrorTable([])
    setexistingUsers([])
  }
  const handleCloseModalReplace = () => {
    setIsReplaceVal(false)
    setPopupData(null)
  }

  const handleDecision = decision => {
    console.log('popupData=======>', popupData, decision)
    if (decision === 'replace') {
      socket.emit('replaceContact', popupData)
    } else {
      socket.emit('skipContact', popupData)
    }
    setCountdownActive(false)
    setPopupData(null)
    setIsReplaceVal(false)
  }

  const generateColumns = () =>
    !isExistingUser
      ? [
          {
            accessorKey: 'name',
            header: 'Name',
            Cell: ({ row }) => row.original.row.name || '-'
          },
          {
            accessorKey: 'mobile',
            header: 'Mobile Number',
            Cell: ({ row }) => row.original.row.mobile || '-'
          },
          {
            accessorKey: 'errors',
            header: 'Errors',
            Cell: ({ row }) => {
              return row.original.errors && row.original.errors.length ? row.original.errors + ', ' : '-'
            }
          }
        ]
      : [
          {
            accessorKey: 'name',
            header: 'Name',
            Cell: ({ row }) => row.original.name || '-'
          },
          {
            accessorKey: 'mobile',
            header: 'Mobile Number',
            Cell: ({ row }) => row.original.mobile || '-'
          }
        ]
  const table = useMaterialReactTable({
    columns: generateColumns(),
    data: !isExistingUser ? errorTable : existingUsers,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['name', 'mobile'] }
    },
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: !isExistingUser ? errorTable.length : existingUsers.length,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false
  })
  return (
    <>
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
            </Header>
          </Box>
          <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                {/* <Box
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
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton fullWidth sx={{ mt: 4 }} variant='outlined' onClick={() => handleClose()}>
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
              </Box> */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    px: 8
                  }}
                >
                  {/* Name */}
                  <TextField
                    sx={{ my: 2 }}
                    label={'Name '}
                    required
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

                  {/* Last Name */}
                  <TextField
                    sx={{ my: 2 }}
                    label='Last Name'
                    fullWidth
                    name='last_name'
                    value={formik.values.last_name || ''}
                    onChange={formik.handleChange}
                  />
                  <TextField
                    sx={{ my: 2 }}
                    label='Family Name'
                    fullWidth
                    name='family_name'
                    value={formik.values.family_name || ''}
                    onChange={formik.handleChange}
                  />
                  {/* Mobile */}
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
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{ my: 2 }}
                  />

                  <TextField
                    sx={{ my: 2 }}
                    label='Relation: Friend, Family, Colleague, etc.,'
                    fullWidth
                    name='relation'
                    value={formik.values.relation || ''}
                    onChange={formik.handleChange}
                  />
                  {/* Alternate Numbers */}
                  <Box sx={{ my: 2 }}>
                    <Typography variant='subtitle1'>Alternate Numbers</Typography>
                    {formik.values.alternate_po?.map((num, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          size='medium'
                          placeholder='Enter alternate number'
                          value={num}
                          error={formik.touched.alternate_po && Boolean(formik.errors.alternate_po)}
                          helperText={formik.touched.alternate_po && formik.errors.alternate_po}
                          onChange={e => {
                            // const re = /^[0-9\b+ ]+$/ // allow +, digits, spaces
                            const re = /^[0-9\b]+$/ // digits only
                            if (e.target.value === '' || re.test(e.target.value)) {
                              const updated = [...formik.values.alternate_po]
                              updated[index] = e.target.value
                              formik.setFieldValue('alternate_po', updated)
                            }
                          }}
                          inputProps={{ maxLength: 10 }}
                        />
                        <IconButton
                          sx={{ ml: 1 }}
                          color='error'
                          onClick={() => {
                            const updated = formik.values.alternate_po.filter((_, i) => i !== index)
                            formik.setFieldValue('alternate_po', updated)
                          }}
                        >
                          ❌
                        </IconButton>
                      </Box>
                    ))}
                    {(formik.values.alternate_po?.length < 5 || !formik.values.alternate_po) && (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() =>
                          formik.setFieldValue(
                            'alternate_po',
                            formik.values.alternate_po ? [...formik.values.alternate_po, ''] : ['']
                          )
                        }
                      >
                        ➕ Add Alternate Number
                      </Button>
                    )}
                  </Box>

                  {/* New Address Fields */}
                  <TextField
                    sx={{ my: 2 }}
                    label='Enter Address: Apart. Name, Flat No, Door No, Street Name'
                    fullWidth
                    name='address'
                    value={formik.values.address || ''}
                    onChange={formik.handleChange}
                  />
                  {/* <TextField
                  sx={{ my: 2 }}
                  label='Flat No'
                  fullWidth
                  name='flat_no'
                  value={formik.values.flat_no || ''}
                  onChange={formik.handleChange}
                />
                <TextField
                  sx={{ my: 2 }}
                  label='Door No'
                  fullWidth
                  name='door_no'
                  value={formik.values.door_no || ''}
                  onChange={formik.handleChange}
                /> */}

                  <TextField
                    sx={{ my: 2 }}
                    label='Area 1'
                    fullWidth
                    name='area_1'
                    value={formik.values.area_1 || ''}
                    onChange={formik.handleChange}
                  />
                  <TextField
                    sx={{ my: 2 }}
                    label='Area 2'
                    fullWidth
                    name='area_2'
                    value={formik.values.area_2 || ''}
                    onChange={formik.handleChange}
                  />
                  <TextField
                    sx={{ my: 2 }}
                    label='City'
                    fullWidth
                    name='city'
                    value={formik.values.city || ''}
                    onChange={formik.handleChange}
                  />
                  <TextField
                    sx={{ my: 2 }}
                    label='State'
                    fullWidth
                    name='state'
                    value={formik.values.state || ''}
                    onChange={formik.handleChange}
                  />
                  <TextField
                    sx={{ my: 2 }}
                    label='Pin Code'
                    fullWidth
                    name='pin_code'
                    value={formik.values.pin_code || ''}
                    onChange={formik.handleChange}
                  />

                  {/* Actions */}
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                      <LoadingButton fullWidth sx={{ mt: 4 }} variant='outlined' onClick={() => handleClose()}>
                        Cancel
                      </LoadingButton>
                    </Grid2>
                    <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                      <LoadingButton
                        fullWidth
                        sx={{ mt: 4 }}
                        loading={isLoading}
                        variant='contained'
                        onClick={() => formik.handleSubmit()}
                      >
                        {id !== '' ? 'Update' : 'Add'}
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
                    // window.open(
                    //   // 'https://my-invite-s3.s3.ap-south-1.amazonaws.com/user-section/1742441220989-Sample%20Excel%20Format.xlsx',
                    //   'https://my-invite-s3.s3.ap-south-1.amazonaws.com/user-section/1755855976774-Sample%20Contact%20Format.xlsx',
                    //   '_blank'
                    // )
                    exportSeclectedExcelFun()
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
            </Box>
          </Box>
        </Box>
      </Drawer>
      <Dialog
        open={isErrorTable || isExistingUser}
        onClose={handleCloseModal}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>
          {!isExistingUser ? 'Excel Error List' : 'Already Existing list'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            <Box p={4} sx={{ width: '100%' }}>
              <MaterialReactTable
                table={table}
                muiTableContainerProps={{ sx: { width: '100%' } }}
                muiTableBodyCellProps={{ sx: { whiteSpace: 'nowrap' } }}
              />
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleCloseModal}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isReplaceVal}
        onClose={handleCloseModalReplace}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to Replace ${popupData?.existingName} with ${popupData?.newName} ?`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={() => handleDecision('no-replace')}>
            No
          </Button>
          <LoadingButton
            // loading={delLoading}
            varient='contained'
            onClick={() => handleDecision('replace')}
            sx={{ color: 'red' }}
          >
            Yes {countdownActive && `(${timer}s)`}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SideBarGiftType
