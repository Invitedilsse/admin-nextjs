// ** React Imports
import React, { Fragment, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
// ** Custom Component Import
import { FormikProvider, useFormik } from 'formik'
import { useDropzone } from 'react-dropzone'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'

import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Avatar,
  Badge,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { CameraAlt, DeleteOutline } from '@mui/icons-material'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import DatePicker from 'react-datepicker'
import { getListOfOccasion, handleFunctionId } from 'src/store/adminMod'
import ImageUpload from 'src/hooks/ImageUpload'
import EmblaCarousel from './EmblaCarousel'
import { is } from 'date-fns/locale'

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
  occasion_type: yup.string().required('Occasion Type is required'),
  function_name: yup.string().required('Function Name is required'),
  notes: yup.string().required('Description is required'),
  host_name: yup.string().required('Host Name is required'),
  dispatchDateTime: yup.date().required('Master Dispatch Date Time is required'),
  name: yup
    .string('Name is required')
    .trim()
    .required('Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})
const BasicInfo = props => {
  // ** Props
  const { toggle, id, RowData, getAll, tabValue } = props
  console.log('RowData---->', RowData)
  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [files, setFiles] = useState([])
  const { allOccasion } = useSelector(state => state.adminMod)
  // ** Hooks
  const filer = useRef()
  const [isEdit, setIsEdit] = useState(true)
  const [bannerImage, setBannerImage] = useState('')
  const [openImageEdit, setImageEdit] = useState(false)
  const [date, setDate] = useState(new Date())
  const [isPreview, setPreviewMode] = useState(true)
  const [isLogoTemp, setLogoTemp] = useState(false)
  const [isCoverTemp, setCoverTemp] = useState(false)
  const [functionName, setFunctionName] = useState('')
  const [cropImage, setCropImage] = useState()
  const [cropType, setCropType] = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [logoFormData, setLogoFormData] = useState(null)
  const [uploadedFileData, setUploadedFileData] = useState([{ key: '', url: '', file_name: '' }])
  const [isLogoUploaded, setIsLogoUploaded] = useState(false)

  const [logoFamFormData, setLogoFamFormData] = useState(null)
  const [uploadedFamFileData, setUploadedFamFileData] = useState([{ key: '', url: '', file_name: '' }])
  const [isFamLogoUploaded, setIsFamLogoUploaded] = useState(false)

  const { functionId } = useSelector(state => state.adminMod)
  const [inviteVideo, setInviteVideo] = useState([])
  const [videoloading, setVideoloading] = useState(true)

  const handleOtherMedia = async (type, fileData) => {
    setIsLoading(true)
    try {
      let params = {
        other_id: functionId,
        type: type
      }
      let fileLogo = null
      if (fileData !== null) {
        const formData = new FormData()
        formData.append('file', fileData)
        const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
        var temp = [imageRes?.data?.detail]
        fileLogo = temp
        params['other_image'] = fileLogo
      }

      const result = await apiPost(`${baseURL}other-images/add`, params)
      toast.success(result?.data?.message)
      if (result?.data?.data) {
        if (type === 'host') {
          setFiles([])
          const hostImages = result?.data?.data
            ?.filter(item => item.type === 'host')
            .map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setFiles(hostImages)
        } else if (type === 'host_video') {
          const hostVideo = result?.data?.data
            ?.filter(item => item.type === 'host_video')
            .map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setInviteVideo(hostVideo)
        }
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // '', 'special_invite_video', 'firms'

  const handleDeleteOtherMedia = async (key, type, id) => {
    try {
      console.log('del---->', key, type, id)

      const deleteRes = await apiDelete(`${baseURL}other-images/delete/${id}`)
      if (deleteRes?.data) {
        let filtered = null
        if (type !== 'host_video') {
          // filtered = files.filter(i => i.id !== id)
          // setFiles([...filtered])
          filtered = files.filter(i => i.id !== id)
          setFiles([...filtered])
        }
        toast.success(deleteRes?.data?.message)
        const result = await apiDelete(`${baseURL}user/file-delete`, { key: key })
        if (type === 'host_video') {
          setInviteVideo([])
        }
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.JPG', '.PNG', '.JPEG']
    },
    // maxSize: 50 * 1024 * 1024,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: fileRejections => {
      console.log('fileRejections---->11111', fileRejections)
      toast.error('Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log('fileRejections---->11111 acc', acceptedFiles)

      handleOtherMedia('host', acceptedFiles[0])
    }
  })

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
    multiple: false,
    maxFiles: 1,
    // disabled: !isEdit,
    maxSize: 104857600,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.wmv']
    },
    validator: file => {
      if (file.size.length > 104857600) {
        return {
          code: 'name-too-large',
          message: `Name is larger than ${'100MB'} characters`
        }
      }

      return null
    },
    onDropRejected: fileRejections => {
      toast.error(
        fileRejections.length > 0
          ? fileRejections[0].errors[0].code === 'file-too-large'
            ? 'File size exceeds the 100MB limit'
            : fileRejections[0].errors[0].code
          : 'Please select a valid file'
      )
    },
    onError: error => {
      console.log('upload img---->', error)
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log('acceptedFiles---->', acceptedFiles)
      if (acceptedFiles.length > 0) {
        setInviteVideo(acceptedFiles)
        handleOtherMedia('host_video', acceptedFiles[0])
      }
    }
  })

  const formik = useFormik({
    initialValues: {
      occasion_type: '',
      function_name: '',
      notes: '',
      name: '',
      status: '',
      host_name: '',
      host_address: '',
      description: '',
      dispatchDateTime: moment(date).toDate(),
      hastag: [],
      hastagList: [],
      mainLogo: '',
      mainLogoPreview: null,
      familyLogo: '',
      familyLogoPreview: null
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      console.log(values)
      try {
        setIsLoading(true)
        const hastagData = values?.hastag?.map(item => {
          return {
            tag: item
          }
        })

        let params = {
          occasion_type: values.occasion_type,
          function_name: values.function_name,
          host_address: values.host_address,
          dispatch_date_time: values.dispatchDateTime,
          function_logo: [],
          family_logo: [],
          name: values.name,
          host_name: values.host_name,
          hashtag: hastagData,
          status: 'draft',
          description: values.notes
        }
        console.log(params)
        let mainLogo = null
        if (values.mainLogoPreview !== null) {
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, logoFormData, true)
          var temp = [imageRes?.data?.detail]
          mainLogo = temp
          params['function_logo'] = mainLogo
        } else {
          params['function_logo'] = RowData?.function_logo
        }
        let familyLogo = null
        if (values.familyLogoPreview !== null) {
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, logoFamFormData, true)
          var temp = [imageRes?.data?.detail]
          familyLogo = temp
          params['family_logo'] = familyLogo
        } else {
          params['family_logo'] = RowData?.family_logo
        }
        const result =
          functionId === '' || functionId === undefined || functionId === null
            ? await apiPost(`${baseURL}function/add`, params)
            : await apiPut(`${baseURL}function/update/${RowData.id || functionId}`, params)
        console.log(result)
        getAll()
        if (functionId === '' && result?.data?.data?.id) {
          dispatch(handleFunctionId(result?.data?.data?.id))
        }
        if (result?.data?.data?.function_logo?.length > 0) {
          setIsLogoUploaded(!isLogoUploaded)
        }
        if (result?.data?.data?.family_logo?.length > 0) {
          setIsFamLogoUploaded(!isFamLogoUploaded)
        }
        setFunctionName(values.function_name)
        setIsEdit(false)

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
  }
  const getAllOccasion = () => {
    if (allOccasion.length === 0) {
      const queryParams = `limit=${100}&offset=${0}&search_string=${''}&sortDir=${'desc'}&sortBy=${'occasion_name'}`
      dispatch(getListOfOccasion(queryParams))
    }
  }
  const getCategory = async () => {
    try {
      try {
        setIsFetching(true)
        setIsEdit(false)
        const res = await apiGet(`${baseURL}function/details/${functionId}`)
        if (res?.data?.detail?.length > 0) {
          const detailsData = res?.data?.detail[0]
          formik.setFieldValue('name', detailsData?.name)
          formik.setFieldValue('notes', detailsData?.description)
          formik.setFieldValue('host_name', detailsData?.host_name)
          setFunctionName(detailsData?.function_name)

          formik.setFieldValue('host_address', detailsData?.host_address)
          formik.setFieldValue('function_name', detailsData?.function_name)
          formik.setFieldValue('occasion_type', detailsData?.occasion_type)
          formik.setFieldValue('occasion_type', detailsData?.occasion_type)
          formik.setFieldValue('mainLogo', detailsData?.function_logo[0]?.url || '')
          formik.setFieldValue('familyLogo', detailsData?.family_logo[0]?.url || '')

          formik.setFieldValue('dispatchDateTime', moment(detailsData?.dispatch_date_time || date).toDate())
          const hashtagData = detailsData?.hashtag?.map(item => {
            return item.tag
          })

          formik.setFieldValue('hastag', hashtagData)
          if (detailsData?.function_logo?.length > 0) {
            setUploadedFileData(detailsData?.function_logo)
          }
          if (detailsData?.family_logo?.length > 0) {
            setUploadedFamFileData(detailsData?.family_logo)
          }
          const hostImages = detailsData?.other_images
            ?.filter(item => item.type === 'host')
            ?.map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setFiles(hostImages)

          const hostVideo = detailsData?.other_images
            ?.filter(item => item.type === 'host_video')
            .map(item => ({
              id: item.id,
              other_id: item.other_id,
              type: item.type,
              created_at: item.created_at,
              updated_at: item.updated_at,
              ...item.other_image[0]
            }))
          setInviteVideo(hostVideo)
        }
      } catch (e) {
        console.log(e)
      } finally {
        setIsFetching(false)
      }
      const data = RowData

      if (data && id !== '' && functionId === '') {
        formik.setFieldValue('name', data?.name)
        formik.setFieldValue('notes', data?.description)
        formik.setFieldValue('host_name', data?.host_name)

        formik.setFieldValue('host_address', data?.host_address)
        formik.setFieldValue('function_name', data?.function_name)
        formik.setFieldValue('occasion_type', data?.occasion_type)
        formik.setFieldValue('occasion_type', data?.occasion_type)
        formik.setFieldValue('mainLogo', data?.function_logo[0]?.url || '')
        formik.setFieldValue('familyLogo', data?.family_logo[0]?.url || '')
        formik.setFieldValue('dispatchDateTime', moment(data?.dispatch_date_time || date).toDate())
        const hashtagData = data?.hashtag?.map(item => {
          return item.tag
        })

        formik.setFieldValue('hastag', hashtagData)

        const hostImages = data?.other_images
          ?.filter(item => item.type === 'host')
          ?.map(item => ({
            id: item.id,
            other_id: item.other_id,
            type: item.type,
            created_at: item.created_at,
            updated_at: item.updated_at,
            ...item.other_image[0]
          }))
        setFiles(hostImages)

        const hostVideo = data?.other_images
          ?.filter(item => item.type === 'host_video')
          .map(item => ({
            id: item.id,
            other_id: item.other_id,
            type: item.type,
            created_at: item.created_at,
            updated_at: item.updated_at,
            ...item.other_image[0]
          }))
        setInviteVideo(hostVideo)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    getAllOccasion()
    if (id !== '' || functionId !== '') {
      getCategory()
    }
  }, [id, userData, functionId, isLogoUploaded, isFamLogoUploaded])
  useEffect(() => {
    if (!RowData?.id && functionId) {
      getCategory()
    }
  }, [tabValue])

  const uploadImage = async (type, file, isDelete = false) => {
    setImageEdit(false)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size should be below 50MB.')
      return
    }
    if (!isDelete) {
      const formData = new FormData()
      formData.append('file', file)
      console.log(formData)
      var options = { content: formData }

      if (type == 'logo') {
        setLogoFormData(formData)
        const ur = URL.createObjectURL(file)
        formik.setFieldValue('mainLogoPreview', ur)
      }

      if (type == 'familylogo') {
        setLogoFamFormData(formData)
        const ur = URL.createObjectURL(file)
        formik.setFieldValue('familyLogoPreview', ur)
      }
      if (type === 'host') {
        setImageEdit(false)
        if (file) {
          const filename = uploadedFileData[0]?.key

          const croppedFile = new File([file], filename, { type: file?.type })
          await handleOtherMedia('host', croppedFile)
        } else {
          toast.error('Something went wrong. Please upload again')
        }
      }
    } else {
      if (type == 'logo') {
        setLogoFormData(null)
        const ur = URL.revokeObjectURL(file)
        formik.setFieldValue('mainLogoPreview', ur)
      }
      if (type == 'familylogo') {
        setLogoFamFormData(null)
        const ur = URL.createObjectURL(file)
        formik.setFieldValue('familyLogoPreview', ur)
      }
    }
  }

  const deleteImage = async type => {
    const key = { key: type === 'family' ? uploadedFamFileData[0]?.key : uploadedFileData[0]?.key }
    try {
      const result = await apiDelete(`${baseURL}user/file-delete`, key)
      if (result?.status == 200) {
        const hastagData = formik.values.hastag?.map(item => {
          return {
            tag: item
          }
        })

        let params = {
          occasion_type: formik.values.occasion_type,
          function_name: formik.values.function_name,
          host_address: formik.values.host_address,
          dispatch_date_time: formik.values.dispatchDateTime,
          function_logo: type === 'function' ? [] : uploadedFileData,
          family_logo: type === 'family' ? [] : uploadedFamFileData,
          name: formik.values.name,
          host_name: formik.values.host_name,
          hashtag: hastagData,
          status: 'draft',
          description: formik.values.notes
        }
        const response = await apiPut(`${baseURL}function/update/${RowData.id || functionId}`, params)

        if (response?.status == 200 && type === 'function') {
          setIsLogoUploaded(!isLogoUploaded)
          formik.setFieldValue('mainLogoPreview', null)
          setLogoFormData(null)
          setUploadedFileData([{ key: '', url: '', file_name: '' }])
          toast.success('Function logo deleted successfully')
        } else if (response?.status == 200 && type === 'family') {
          // alert('in')
          setIsFamLogoUploaded(!isFamLogoUploaded)
          formik.setFieldValue('familyLogoPreview', null)
          setLogoFamFormData(null)
          setUploadedFamFileData([{ key: '', url: '', file_name: '' }])
          toast.success('Family logo deleted successfully')
        }
      }
    } catch (e) {
      toast.error(e)
    }
  }

  const editImage = (type, image = '') => {
    console.log('edittype--------->', type)
    setPreviewMode(true)
    if (type == 'cover') {
      setCropAspectRatio(3.29 / 1)

      let banner =
        bannerImage !== ''
          ? bannerImage
          : userData?.profile_cover_image_url
            ? userData?.profile_cover_image_url
            : 'placeholder'
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
    } else if (type === 'host') {
      setCropImage(image)
      setCropAspectRatio(20 / 9)
      setPreviewMode(false)
      setImageEdit(true)
      setCropType(type)
    } else if (type === 'logo') {
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
          console.log('logoImage---->', logoImage)
          setCropImage(logoImage)
          setCropType(type)
          setImageEdit(true)
        }
      }
    } else if (type === 'familylogo') {
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

  const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

  const onChange = e => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    const selectedFile = files[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']

    if (allowedTypes.includes(selectedFile.type)) {
      if (files[0].size < 4000000) {
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
        e.target.value = null
      }
    } else {
      toast.warn('Please upload a valid image file.')
      setCropImage()
      setPreviewMode(true)
      setImageEdit(false)
      e.target.value = null
    }
  }

  console.log(
    'uploadedFamFileData------->',
    uploadedFamFileData,
    formik.values.familyLogo != '',
    uploadedFamFileData[0].url != ''
  )
  console.log('uploadedFileData------->', uploadedFileData, formik.values.mainLogo != '', uploadedFileData[0].url != '')

  return (
    <Box className={classes.root}>
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
        title={cropType == 'logo' ? 'Change Function Logo' : 'Change Family Logo'}
        aspectRatio={cropAspectRatio}
        selectedImage={cropImage}
        handleClose={(e, reason) => {
          if (reason && reason == 'backdropClick') {
            return
          }
          setImageEdit(false)
        }}
      />
      {isFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
          {' '}
          <CircularProgress />{' '}
        </Box>
      ) : (
        <FormikProvider value={formik}>
          <Container maxWidth='xl' sx={{ py: 4 }}>
            <Header>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton
                  sx={{
                    p: '0.438rem',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                    }
                  }}
                  onClick={handleClose}
                  variant='outlined'
                  size='small'
                >
                  <Icon icon='famicons:arrow-back-outline' fontSize={20} />
                </IconButton>
                <Typography variant='h5'>
                  {functionId !== '' ? 'Edit Function - ' + functionName : 'Create Function'}
                </Typography>
              </Box>
              {functionId !== '' && (
                <Button
                  sx={{
                    p: '0.438rem',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                    }
                  }}
                  onClick={() => setIsEdit(!isEdit)}
                  variant='outlined'
                  size='small'
                >
                  {isEdit ? 'View' : 'Edit'}{' '}
                </Button>
              )}
            </Header>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                <Grid2 container spacing={8}>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    {
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 4
                        }}
                      >
                        <Typography>Function Logo</Typography>
                        {formik.values.mainLogo != '' || uploadedFileData[0].url != '' ? (
                          <Badge
                            overlap='circular'
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <IconButton
                                disabled={!isEdit}
                                onClick={() => deleteImage('function')}
                                sx={{
                                  bgcolor: 'white',
                                  width: 22,
                                  height: 22,
                                  '&:hover': { bgcolor: 'grey.100' }
                                }}
                              >
                                {isEdit && (
                                  <DeleteOutline
                                    sx={{
                                      color: 'black',
                                      width: 14,
                                      height: 14
                                    }}
                                  />
                                )}
                              </IconButton>
                            }
                          >
                            <Avatar
                              alt={capitalize(formik.values.function_name)}
                              src={
                                formik.values.mainLogoPreview !== null
                                  ? formik.values.mainLogoPreview
                                  : formik.values.mainLogo !== ''
                                    ? formik.values.mainLogo
                                    : 'NA'
                              }
                              sx={{ width: 88, height: 88 }}
                            />
                          </Badge>
                        ) : (
                          <Badge
                            overlap='circular'
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <IconButton
                                disabled={!isEdit}
                                onClick={() => editImage('logo')}
                                sx={{
                                  bgcolor: 'white',
                                  width: 22,
                                  height: 22,
                                  '&:hover': { bgcolor: 'grey.100' }
                                }}
                              >
                                {isEdit && (
                                  <CameraAlt
                                    sx={{
                                      color: 'black',
                                      width: 14,
                                      height: 14
                                    }}
                                  />
                                )}
                              </IconButton>
                            }
                          >
                            <Avatar
                              alt={capitalize(formik.values.function_name)}
                              src={
                                formik.values.mainLogoPreview !== null
                                  ? formik.values.mainLogoPreview
                                  : formik.values.mainLogo !== ''
                                    ? formik.values.mainLogo
                                    : 'NA'
                              }
                              sx={{ width: 88, height: 88 }}
                            />
                          </Badge>
                        )}
                      </Box>
                    }
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    {
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 4
                        }}
                      >
                        <Typography>Family Logo</Typography>
                        {formik.values.familyLogo != '' || uploadedFamFileData[0].url != '' ? (
                          <Badge
                            overlap='circular'
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <IconButton
                                disabled={!isEdit}
                                onClick={() => deleteImage('family')}
                                sx={{
                                  bgcolor: 'white',
                                  width: 22,
                                  height: 22,
                                  '&:hover': { bgcolor: 'grey.100' }
                                }}
                              >
                                {isEdit && (
                                  <DeleteOutline
                                    sx={{
                                      color: 'black',
                                      width: 14,
                                      height: 14
                                    }}
                                  />
                                )}
                              </IconButton>
                            }
                          >
                            <Avatar
                              alt={capitalize(formik.values.function_name)}
                              src={
                                formik.values.familyLogoPreview !== null
                                  ? formik.values.familyLogoPreview
                                  : formik.values.familyLogo !== ''
                                    ? formik.values.familyLogo
                                    : 'NA'
                              }
                              sx={{ width: 88, height: 88 }}
                            />
                          </Badge>
                        ) : (
                          <Badge
                            overlap='circular'
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <IconButton
                                disabled={!isEdit}
                                onClick={() => editImage('familylogo')}
                                sx={{
                                  bgcolor: 'white',
                                  width: 22,
                                  height: 22,
                                  '&:hover': { bgcolor: 'grey.100' }
                                }}
                              >
                                {isEdit && (
                                  <CameraAlt
                                    sx={{
                                      color: 'black',
                                      width: 14,
                                      height: 14
                                    }}
                                  />
                                )}
                              </IconButton>
                            }
                          >
                            <Avatar
                              alt={capitalize(formik.values.function_name)}
                              src={
                                formik.values.familyLogoPreview !== null
                                  ? formik.values.familyLogoPreview
                                  : formik.values.familyLogo !== ''
                                    ? formik.values.familyLogo
                                    : 'NA'
                              }
                              sx={{ width: 88, height: 88 }}
                            />
                          </Badge>
                        )}
                      </Box>
                    }
                  </Grid2>
                </Grid2>

                <Grid2 container spacing={8}>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Occasion Type '}
                      required
                      select
                      disabled={!isEdit}
                      fullWidth
                      name='occasion_type'
                      error={formik.touched.occasion_type && Boolean(formik.errors.occasion_type)}
                      value={formik.values.occasion_type}
                      onChange={e => formik.handleChange(e)}
                      helperText={
                        formik.touched.occasion_type && formik.errors.occasion_type && formik.errors.occasion_type
                      }
                    >
                      {allOccasion?.map(option => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.occasion_name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Function Name '}
                      disabled={!isEdit}
                      required
                      fullWidth
                      name='function_name'
                      error={formik.touched.function_name && Boolean(formik.errors.function_name)}
                      value={formik.values.function_name
                        .trimStart()
                        .replace(/\s\s+/g, '')
                        .replace(/\p{Emoji_Presentation}/gu, '')}
                      onChange={e => formik.handleChange(e)}
                      helperText={
                        formik.touched.function_name && formik.errors.function_name && formik.errors.function_name
                      }
                    />
                  </Grid2>
                </Grid2>
                <Grid2 container spacing={8}>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Name '}
                      required
                      disabled={!isEdit}
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
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Host Name '}
                      required
                      fullWidth
                      disabled={!isEdit}
                      name='host_name'
                      error={formik.touched.host_name && Boolean(formik.errors.host_name)}
                      value={formik.values.host_name
                        .trimStart()
                        .replace(/\s\s+/g, '')
                        .replace(/\p{Emoji_Presentation}/gu, '')}
                      onChange={e => formik.handleChange(e)}
                      helperText={formik.touched.host_name && formik.errors.host_name && formik.errors.host_name}
                    />
                  </Grid2>
                </Grid2>
                <Grid2 container spacing={8}>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Host Address '}
                      multiline
                      minRows={2}
                      disabled={!isEdit}
                      maxRows={3}
                      fullWidth
                      name='host_address'
                      error={formik.touched.host_address && Boolean(formik.errors.host_address)}
                      value={formik.values.host_address
                        .trimStart()
                        .replace(/\s\s+/g, '')
                        .replace(/\p{Emoji_Presentation}/gu, '')}
                      onChange={e => formik.handleChange(e)}
                      helperText={
                        formik.touched.host_address && formik.errors.host_address && formik.errors.host_address
                      }
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <TextField
                      sx={{ my: 2 }}
                      label={'Description '}
                      required
                      multiline
                      minRows={2}
                      disabled={!isEdit}
                      maxRows={3}
                      fullWidth
                      name='notes'
                      error={formik.touched.notes && Boolean(formik.errors.notes)}
                      value={formik.values.notes
                        .trimStart()
                        .replace(/\s\s+/g, '')
                        .replace(/\p{Emoji_Presentation}/gu, '')}
                      onChange={e => formik.handleChange(e)}
                      helperText={formik.touched.notes && formik.errors.notes && formik.errors.notes}
                    />
                  </Grid2>
                </Grid2>
                <Grid2 container spacing={8} sx={{ mb: 3 }}>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <Autocomplete
                      multiple
                      freeSolo
                      disabled={!isEdit}
                      sx={{ my: 2 }}
                      value={formik.values.hastag}
                      name='hastag'
                      onChange={(event, newValues) => {
                        console.log(event)
                        const updatedValues = newValues.map(value => {
                          if (typeof value === 'string' && !value.startsWith('#')) {
                            return `#${value}`
                          }
                          return value
                        })
                        console.log(updatedValues)
                        formik.setFieldValue('hastag', updatedValues)
                      }}
                      options={[]}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip key={index} variant='outlined' label={`${option}`} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={params => (
                        <TextField
                          {...params}
                          variant='outlined'
                          disabled={!isEdit}
                          label='Hastags'
                          placeholder='Type words and press Enter'
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <DatePickerWrapper>
                      <DatePicker
                        selected={formik.values.dispatchDateTime}
                        id='dispatchDateTime'
                        showTimeSelect
                        disabled={!isEdit}
                        timeIntervals={1}
                        dateFormat='dd-MM-YYYY h:mm aa'
                        minDate={moment(new Date()).toDate()}
                        maxDate={moment(new Date()).add(6, 'months').toDate()}
                        maxTime={moment(formik.values.dispatchDateTime).endOf('day').toDate()}
                        minTime={
                          moment(formik.values.dispatchDateTime).isBefore(moment(), 'day')
                            ? moment().endOf('day').toDate()
                            : moment(formik.values.dispatchDateTime).isSame(moment(), 'day')
                              ? moment().toDate()
                              : moment().startOf('day').toDate()
                        }
                        popperPlacement={popperPlacement}
                        onChange={date => {
                          console.log(date)
                          formik.setFieldValue('dispatchDateTime', date)
                        }}
                        placeholderText='Click to select a Master Dispatch Date Time'
                        customInput={
                          <TextField
                            label='Master Dispatch Date Time *'
                            required
                            fullWidth
                            disabled={!isEdit}
                            error={formik.touched.dispatchDateTime && Boolean(formik.errors.dispatchDateTime)}
                            helperText={
                              formik.touched.dispatchDateTime &&
                              formik.errors.dispatchDateTime &&
                              formik.errors.dispatchDateTime
                            }
                            sx={{ my: 2 }}
                          />
                        }
                      />
                    </DatePickerWrapper>
                  </Grid2>
                </Grid2>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    width: '100%'
                  }}
                >
                  <LoadingButton
                    sx={{ mt: 4 }}
                    disabled={!isEdit}
                    loading={isLoading}
                    variant='contained'
                    onClick={() => formik.handleSubmit()}
                  >
                    {functionId !== '' ? 'Update' : 'Submit '}
                  </LoadingButton>
                </Box>
                {functionId && (
                  <Fragment>
                    <Typography variant='h6' sx={{ mb: 2.5 }}>
                      Host Images ss
                    </Typography>

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
                            height: 48,
                            display: 'flex',
                            borderRadius: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme => `rgba(${theme.palette.primary.main}, 0.08)`
                          }}
                        >
                          <Icon icon='tabler:upload' fontSize='1.75rem' />
                        </Box>
                        <Typography variant='h6' sx={{ mb: 2.5 }}>
                          Drop host images here or click to add.
                        </Typography>
                      </Box>
                    </div>
                    {files?.length > 0 && (
                      <Box sx={{ mt: 8 }}>
                        <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                          <EmblaCarousel slides={files} options={OPTIONS} handleDelete={handleDeleteOtherMedia} />
                        </Grid2>
                      </Box>
                    )}

                    <Fragment>
                      <Typography variant='h6' sx={{ mb: 2.5 }}>
                        Host Video
                      </Typography>
                      {!inviteVideo?.length && (
                        <div
                          {...getVideoRootProps({
                            className: 'dropzone',
                            style: {
                              border: '2px dashed #ccc',
                              borderRadius: '4px',
                              padding: '20px',
                              cursor: 'pointer'
                            }
                          })}
                        >
                          <input {...getVideoInputProps('host')} />
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
                                width: 48,
                                height: 48,
                                display: 'flex',
                                borderRadius: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme => `rgba(${theme.palette.primary.main}, 0.08)`
                              }}
                            >
                              <Icon icon='tabler:upload' fontSize='1.75rem' />
                            </Box>
                            <Typography variant='h6' sx={{ mb: 3.5 }}>
                              Drop invite here or click to add.
                            </Typography>
                          </Box>
                        </div>
                      )}
                      {inviteVideo?.length > 0 && (
                        <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                          <List
                            sx={{
                              border: '2px dashed #ccc',
                              borderRadius: '4px',
                              padding: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <ListItem
                              disablePadding
                              secondaryAction={
                                <>
                                  <IconButton
                                    edge='end'
                                    aria-label='view'
                                    disabled={isLoading}
                                    onClick={() => {
                                      if (inviteVideo[0]?.url) {
                                        window.open(inviteVideo[0]?.url, '_blank')
                                      } else if (inviteVideo[0]?.name) {
                                        const file = inviteVideo[0]
                                        const url = URL.createObjectURL(file)

                                        const a = document.createElement('a')
                                        a.href = url
                                        a.target = '_blank'
                                        document.body.appendChild(a)
                                        a.click()
                                        document.body.removeChild(a)
                                        URL.revokeObjectURL(url)
                                      }
                                    }}
                                  >
                                    {isLoading ? (
                                      <CircularProgress size={24} color='inherit' />
                                    ) : (
                                      <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                                    )}
                                  </IconButton>
                                  {/* <IconButton
                                    edge='end'
                                    aria-label='view'
                                    onClick={() => {
                                      if (inviteVideo[0]?.url) {
                                        window.open(inviteVideo[0]?.url, '_blank')
                                      } else if (inviteVideo[0]?.name) {
                                        const file = inviteVideo[0]
                                        const url = URL.createObjectURL(file)

                                        const a = document.createElement('a')
                                        a.href = url
                                        a.target = '_blank'
                                        document.body.appendChild(a)
                                        a.click()
                                        document.body.removeChild(a)
                                        URL.revokeObjectURL(url)
                                      }
                                    }}
                                  >
                                    <Icon icon='lsicon:view-outline' fontSize='1.75rem' color='grey' />
                                  </IconButton> */}
                                  <IconButton
                                    edge='end'
                                    aria-label='delete'
                                    disabled={isLoading}
                                    onClick={() => {
                                      console.log('params--->pdf', inviteVideo)
                                      inviteVideo?.[0]?.key
                                        ? handleDeleteOtherMedia(inviteVideo[0].key, 'host_video', inviteVideo[0].id)
                                        : setInviteVideo([])
                                      // handleDeleteCustomMedia(
                                      //   RowData?.invitation_video
                                      //     ? RowData?.invitation_video[0]?.key
                                      //     : formik.values?.fileVideo[0]?.key,
                                      //   'video',
                                      //   RowData.id
                                      // )
                                    }}
                                  >
                                    <Icon icon='ic:twotone-delete' fontSize='1.75rem' color='red' />
                                  </IconButton>
                                </>
                              }
                            >
                              <ListItemButton>
                                <ListItemIcon>
                                  <Icon icon='mingcute:invite-line' fontSize='1.75rem' />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    (inviteVideo?.length > 0 && inviteVideo[0]?.name) ||
                                    (inviteVideo?.length > 0 && inviteVideo[0]?.file_name)
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          </List>
                        </Grid2>
                      )}
                    </Fragment>
                  </Fragment>
                )}
              </Grid2>
            </Grid2>
          </Container>
        </FormikProvider>
      )}
    </Box>
  )
}

export default BasicInfo
const OPTIONS = { dragFree: true, loop: true }
const SLIDE_COUNT = 10
