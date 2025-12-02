// ** React Imports
import { useEffect, useRef, useState } from 'react'
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
import { Avatar, Badge, Drawer, Grid2, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut, apiDelete } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { CameraAlt, DeleteOutline } from '@mui/icons-material'
import ImageUpload from 'src/hooks/ImageUpload'

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
  description: yup
    .string('Description is required')
    .trim()
    .required('Description is required')
    .min(4, 'Minimum 4 character required')
    .max(225, 'Description must be at most 225 characters'),
  name: yup
    .string('Name is required')
    .trim()
    .required('Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})
const SideBarFirms = props => {
  // ** Props
  const { open, toggle, id, RowData } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const filer = useRef()
  const [bannerImage, setBannerImage] = useState('')
  const [openImageEdit, setImageEdit] = useState(false)
  const [isPreview, setPreviewMode] = useState(true)
  const [isLogoTemp, setLogoTemp] = useState(false)
  const [isCoverTemp, setCoverTemp] = useState(false)

  const [cropImage, setCropImage] = useState()
  const [cropType, setCropType] = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [logoFormData, setLogoFormData] = useState(null)
  const [uploadedFileData, setUploadedFileData] = useState([{ key: '', url: '', file_name: '' }])
  const { functionId } = useSelector(state => state.adminMod)
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      image: '',
      imagePreview: null
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          function_id: functionId,
          title: values.name,
          description: values.description
        }
        let mainLogo = null;
        if (values.imagePreview !== null) {
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, logoFormData, true)
          var temp = [imageRes?.data?.detail]
          mainLogo = temp
          params['image'] = mainLogo
        } else {
          params['image'] = RowData?.image
        }
        const result =
          id === ''
            ? await apiPost(`${baseURL}firm/add`, params)
            : await apiPut(`${baseURL}firm/update/${RowData.id}`, params)

        setTimeout(() => {
          formik.resetForm()
          setIsLoading(false)
        }, 500)
        toggle()
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
    if (id != '') {
      formik.setFieldValue('name', '')
      formik.setFieldValue('description', '')
      formik.setFieldValue('image', '')
    }
  }

  const getFirmData = async () => {
    try {
      const data = RowData
      formik.resetForm()

      if (data && id !== '') {
        formik.setFieldValue('name', data?.title)
        formik.setFieldValue('description', data?.description)
        formik.setFieldValue('image', data?.image[0]?.url || '')
        if (data?.image?.length > 0) {
          setUploadedFileData(data?.image)
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getFirmData()
    }
  }, [id, userData])
  const uploadImage = async (type, file, isDelete = false) => {
    setImageEdit(false)
    if (!isDelete) {
      const formData = new FormData()
      formData.append('file', file)
      console.log(formData)
      var options = { content: formData }

      console.log(options)

      if (type == 'logo') {
        setLogoFormData(formData)
        const ur = URL.createObjectURL(file)
        formik.setFieldValue('imagePreview', ur)
      } else if (type == 'cover') {
        formData.append('service_type', 'cover_image')

        let res = await uploadFile(formData)
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(false)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    } else {
      if (type == 'logo') {
        setLogoFormData(null)
        const ur = URL.revokeObjectURL(file)
        formik.setFieldValue('imagePreview', ur)
      } else {
        let res = await deleteFile({
          service_type: 'cover_image'
        })
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(true)
          toast.success(res?.message)
        } else {
          toast.error('Something went wrong')
        }
        dispatch(getUserData({}))
      }
    }
  }

  const deleteImage = async () => {
    const key = { key: uploadedFileData[0]?.key }
    try {
      const result = await apiDelete(`${baseURL}user/file-delete`, key)
      if (result?.status == 200) {
        let params = {
          function_id: functionId,
          title: formik.values.name,
          description: formik.values.description
        }

        const response = await await apiPut(`${baseURL}firm/update/${RowData.id}`, params)
        if (response?.status == 200) {
          getFirmData()
          formik.setFieldValue('image', '')
          formik.setFieldValue('imagePreview', null)
          setLogoFormData(null)
          setUploadedFileData([{ key: '', url: '', file_name: '' }])

          toast.success('Firm logo deleted successfully')
        }
      }
    } catch (e) {
      toast.error(e)
    }
  }

  const editImage = type => {
    setPreviewMode(true)
    if (type === 'cover') {
      setCropAspectRatio(3.29 / 1)

      let banner =
        bannerImage !== '' ? bannerImage : userData?.cover_image_url ? userData?.cover_image_url : 'placeholder'
      if (isCoverTemp) {
        filer.current.click()
        setCropType(type)
      } else {
        if (banner == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(banner)
          setCropType(type)
          setImageEdit(true)
        }
      }
    } else {
      setCropAspectRatio(1 / 1)
      let logoImage = 'placeholder'
      if (isLogoTemp) {
        filer.current.click()
        setCropType(type)
      } else {
        if (logoImage == 'placeholder') {
          filer.current.click()
          setCropType(type)
        } else {
          setCropImage(logoImage)
          setCropType(type)
          setImageEdit(true)
        }
      }
    }
  }

  const onChange = e => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    if (files[0].size < 5000000) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result)
        setPreviewMode(false)
        setImageEdit(true)
        e.target.value = null
      }
      reader.readAsDataURL(files[0])
    } else {
      toast.warn('File size should be below 5MB.')
    }
  }

  const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

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
      <input
        style={{ display: 'none' }}
        id='raised-button-file'
        onChange={onChange}
        ref={filer}
        type='file'
        accept='.jpg,.png,.jpeg,.webpp'
      />
      <ImageUpload
        isOpen={openImageEdit}
        handleUpload={uploadImage}
        type={cropType}
        isPreview={isPreview}
        title={cropType == 'logo' ? 'Change Logo2' : 'Change Cover Photo'}
        aspectRatio={cropAspectRatio}
        selectedImage={cropImage}
        handleClose={(e, reason) => {
          if (reason && reason == 'backdropClick') {
            return
          }
          setImageEdit(false)
        }}
      />
      <Box className={classes.root}>
        <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
          <Header>
            <Typography variant='h5'>{id !== '' ? 'Edit Firm' : 'Create Firm'}</Typography>
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
            <Grid2 size={{ xs: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                {formik.values.image != '' || uploadedFileData[0].url != '' ? (
                  <Badge
                    overlap='circular'
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        onClick={() => deleteImage()}
                        sx={{
                          bgcolor: 'white',
                          width: 22,
                          height: 22,
                          '&:hover': { bgcolor: 'grey.100' }
                        }}
                      >
                        <DeleteOutline
                          sx={{
                            color: 'black',
                            width: 14,
                            height: 14
                          }}
                        />
                      </IconButton>
                    }
                  >
                    <Avatar
                      alt={capitalize(formik.values.name)}
                      src={formik.values.imagePreview !== null ?
                        formik.values.imagePreview :
                        formik.values.image !== '' ?
                          formik.values.image : 'NA'}
                      sx={{ width: 88, height: 88 }}
                    />
                  </Badge>
                ) : (
                  <Badge
                    overlap='circular'
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        onClick={() => editImage('logo')}
                        sx={{
                          bgcolor: 'white',
                          width: 22,
                          height: 22,
                          '&:hover': { bgcolor: 'grey.100' }
                        }}
                      >
                        <CameraAlt
                          sx={{
                            color: 'black',
                            width: 14,
                            height: 14
                          }}
                        />
                      </IconButton>
                    }
                  >
                    <Avatar
                      alt={capitalize(formik.values.name)}
                      src={formik.values.imagePreview !== null ?
                        formik.values.imagePreview :
                        formik.values.image !== '' ?
                          formik.values.image : 'NA'}
                      sx={{ width: 88, height: 88 }}
                    />
                  </Badge>
                )}
              </Box>
            </Grid2>
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
                  sx={{ my: 2 }}
                  label={'Description'}
                  multiline
                  minRows={2}
                  maxRows={3}
                  required
                  fullWidth
                  name='description'
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  value={formik.values.description
                    .trimStart()
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '')}
                  onChange={e => formik.handleChange(e)}
                  helperText={
                    <>
                      {formik.touched.description && formik.errors.description && formik.errors.description}
                      <span style={{ float: 'right' }}>{formik.values.description.length}/225</span>
                    </>
                  }
                />
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                    <LoadingButton
                      fullWidth
                      sx={{ mt: 4 }}
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
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarFirms
