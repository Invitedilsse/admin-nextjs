import { useFormik } from 'formik'
import React, { useEffect, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  IconButton,
  // Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
  // makeStyles
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { makeStyles } from '@mui/styles'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import { CameraAlt } from '@mui/icons-material'
import ImageUpload from 'src/hooks/ImageUpload'
// import MultiTreeSelect from '../../../../Containers/MultiTree';

const useStyles = makeStyles({
  root: {}
})

function SplCard({ ud, contriesList, memberData, handleExpand, index, handleJsonSubmit }) {
  const classes = useStyles()
  // const dispatch = useDispatch()
  // const { t } = useTranslation()
  // const { isMobile } = useViewport()
  // const [contriesList, setContriesList] = useState([]);
  // const { userData } = useSelector(state => state.user)
  const [showAddCard, setShowAddCard] = useState(false)
  const [roles, setRoles] = useState([
    { name: 'Admin', value: 'admin' },
    { name: 'User', value: 'user' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isMemberDetails, setIsMemberDetails] = useState(false)

  const filer = useRef()
  const [bannerImage, setBannerImage] = useState('')
  const [logo, setLogo] = useState('')
  const [openImageEdit, setImageEdit] = useState(false)

  const [coverLoading, setCoverLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [isPreview, setPreviewMode] = useState(true)
  const [isLogoTemp, setLogoTemp] = useState(false)
  const [isCoverTemp, setCoverTemp] = useState(false)

  const [cropImage, setCropImage] = useState()
  const [cropType, setCropType] = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [logoFormData, setLogoFormData] = useState(null)

  const [logoFormURL, setLogoFormURL] = useState('')
  const toggleAddCard = () => setShowAddCard(!showAddCard)

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      image: '',
      imagePreview: ''
    },
    validationSchema: yup.object({
      title: yup.string().min(3).max(50).required('Title is Required'),
      description: yup.string().min(4).max(200).required('Description is Required')
    }),
    onSubmit: async values => {
      console.log('values in card', values)
      const temp = {
        title: values.title,
        description: values.description,
        image: values.image,
        imagePreview: values.imagePreview
      }

      handleJsonSubmit(temp)
    }
  })

  useEffect(() => {
    // console.log('check ', memberData?.roles && memberData?.roles[0].toLowerCase().includes('user'))
    formik.setFieldValue('title', memberData?.title || '')
    formik.setFieldValue('description', memberData?.description || '')
    formik.setFieldValue('image', memberData?.image || '')
    formik.setFieldValue('imagePreview', memberData?.imagePreview || '')
  }, [memberData])

  const uploadImage = async (type, file, isDelete = false) => {
    setImageEdit(false)
    if (!isDelete) {
      // const formData = new FormData();
      // let randomName = (Math.random() + 1).toString(36).substring(7);
      // console.log(file);
      // formData.append("file", file, randomName + ".png");
      const formData = new FormData()
      formData.append('file', file)
      console.log(formData)
      var options = { content: formData }

      console.log(options)

      if (type == 'logo') {
        setLogoLoading(true)
        console.log('hee')
        setLogoFormData(formData)
        const ur = URL.createObjectURL(file)
        setLogoFormURL(ur)
        formik.setFieldValue('imagePreview', ur)
        // formData.append("service_type", "profile_image");
        // let res = await uploadFile(formData);
        // res = res?.data;
        // if (res.status == "success") {
        //   // setLogo(res?.data?.profile_image_url);
        //   setLogoTemp(false);
        //   toast.success(res?.message);
        //   // sendNotification({
        //   //   message: res?.message,
        //   //   variant: "success",
        //   // });
        // } else {
        //   toast.error("Something went wrong");

        //   // sendNotification({
        //   //   message: "Something went wrong",
        //   //   variant: "error",
        //   // });
        //   // dispatch(
        //   //   snackbarsData({
        //   //     snackbarIsOpen: true,
        //   //     snackbarType: "warning",

        //   //     snackbarMessage: `${"Something went wrong"}`,
        //   //   })
        //   // );
        // }
        // dispatch(getUserData({}));
        setLogoLoading(false)
      } else if (type == 'cover') {
        setCoverLoading(true)
        formData.append('service_type', 'cover_image')
        console.log(formData)

        let res = await uploadFile(formData)
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(false)
          // setBannerImage(res?.data?.cover_image_url);
          // dispatch(
          //   snackbarsData({
          //     snackbarIsOpen: true,
          //     snackbarType: "success",
          //     snackbarMessage: res?.message,
          //   })
          // );
          toast.success(res?.message)
          // sendNotification({
          //   message: res?.message,
          //   variant: "success",
          // });
        } else {
          toast.error('Something went wrong')

          // sendNotification({
          //   message: "Something went wrong",
          //   variant: "error",
          // });
        }
        dispatch(getUserData({}))
        setCoverLoading(false)
      }
    } else {
      if (type == 'logo') {
        setLogoLoading(true)
        setLogoFormData(null)
        const ur = URL.revokeObjectURL(file)
        setLogoFormURL(ur)
        formik.setFieldValue('imagePreview', ur)
        // let res = await deleteFile({
        //   service_type: "profile_image",
        // });
        // res = res?.data;
        // if (res.status == "success") {
        //   // setLogo(LogoPlaceHolder);
        //   setLogoTemp(true);
        //   toast.success(res?.message);

        //   // sendNotification({
        //   //   message: res?.message,
        //   //   variant: "success",
        //   // });
        // } else {
        //   toast.error("Something went wrong");

        //   // sendNotification({
        //   //   message: "Something went wrong",
        //   //   variant: "error",
        //   // });
        // }
        // dispatch(getUserData({}));
        setLogoLoading(false)
      } else {
        setCoverLoading(true)
        let res = await deleteFile({
          service_type: 'cover_image'
        })
        res = res?.data
        if (res.status == 'success') {
          setCoverTemp(true)
          // setBannerImage(BannerPlaceHolder);
          toast.success(res?.message)

          // sendNotification({
          //   message: res?.message,
          //   variant: "success",
          // });
        } else {
          toast.error('Something went wrong')

          // sendNotification({
          //   message: "Something went wrong",
          //   variant: "error",
          // });
        }
        dispatch(getUserData({}))
        setCoverLoading(false)
      }
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
      let logoImage = 'placeholder' // '/images/logo_short.png'
      // logo !== ""
      //   ? logo
      //   : userData?.profile_image_url
      //     ? userData?.profile_image_url
      //     : "placeholder";

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

      // dispatch(
      //   snackbarsData({
      //     snackbarIsOpen: true,
      //     snackbarType: "warning",
      //     snackbarMessage: `${"File size should be below 5MB."}`,
      //   })
      // );
    }
  }

  return (
    <Box
      sx={{
        my: 4
        // px: 4
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
      <Grid container spacing={2}>
        <Card
          elevation={0}
          sx={{
            p: 0
            // mt: 8,
            // boxShadow: 4
          }}
        >
          <CardContent sx={{ px: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                    // width: '100%'
                  }}
                >
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
                      //  variant="square"
                      alt='Profile Picture'
                      src={formik.values.imagePreview || ''}
                      sx={{ width: 88, height: 88 }}
                    />
                  </Badge>
                </Box>
              </Grid>
              <TextField
                sx={{ my: 2 }}
                label={'Title'}
                size='small'
                variant={false ? 'standard' : 'outlined'}
                required
                fullWidth
                name='title'
                error={formik.touched.title && Boolean(formik.errors.title)}
                value={formik.values.title
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                onChange={e => {
                  const regx = /^[a-zA-Z ]*$/
                  if (e.target.value === '' || regx.test(e.target.value)) {
                    formik.handleChange(e)
                  }
                }}
                helperText={formik.touched.title && formik.errors.title && formik.errors.title}
              />

              <TextField
                sx={{ my: 2 }}
                variant={false ? 'standard' : 'outlined'}
                label={'Description'}
                size='small'
                multiline
                rows={2}
                required
                fullWidth
                name='description'
                error={formik.touched.description && Boolean(formik.errors.description)}
                value={formik.values.description
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                onChange={formik.handleChange}
                helperText={formik.touched.description && formik.errors.description && formik.errors.description}
              />
            </Grid>

            <Grid container spacing={2} mt={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  // alignItems: 'center'
                  width: '100%'
                }}
              >
                <Grid size={{ xs: 12, md: 6 }}>
                  <Button
                    variant='outlined'
                    fullWidth
                    // onClick={formik.handleSubmit}
                    onClick={() => handleExpand(index, false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Button variant='contained' fullWidth onClick={formik.handleSubmit} sx={{ mr: 1 }}>
                    Update
                  </Button>
                </Grid>
              </Box>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Box>
  )
}

export default SplCard
