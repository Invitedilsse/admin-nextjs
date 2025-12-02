import { FormikProvider, useFormik } from 'formik'
import React, { useEffect, useRef, useState } from 'react'
// import Geocode from 'react-geocode';
// import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux'
// import { ICONS } from '../../../../../../constants/Icons';
// import { useViewport } from '../../../../../../hooks';
// import { getCountries, getRoles } from '../../../../../../services/Auth';
// import { GOOGLE_MAP_KEY } from '../../../../../../services/Env';
import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormGroup,
  FormHelperText,
  IconButton,
  // Grid2,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  // LoadingButton,
  MenuItem,
  Select,
  TextField,
  Typography
  // makeStyles,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
// import MultiTreeSelect from '../../../../Containers/MultiTree';
// import { useNavigate } from 'react-router-dom';
// import {
//   getTeam,
//   handleAddUserTab,
// } from '../../../../../../redux/Reducer/Profile';
// import { toggleSnackBar } from '../../../../../../redux/Reducer/Utils';
// import { addTeamMember, deleteInvite, resendInvite } from '../../../../../../services/Sfe'
// import { memberValidation } from '../../../../../../utils/ValidationSchema/onBoard';
// import MemberCard from './SplCard'
import { makeStyles } from '@mui/styles'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import {
  AccountCircleOutlined,
  ArticleTwoTone,
  CameraAlt,
  DeleteOutlineTwoTone,
  EditAttributesTwoTone,
  ModeEditOutlineTwoTone
} from '@mui/icons-material'
import SplCard from './SplCard'
import ImageUpload from 'src/hooks/ImageUpload'
const useStyles = makeStyles({
  root: {}
})

const steps = ['Business Details', 'Contact Details', 'Team Members']

function SplDetails({ next }) {
  const classes = useStyles()
  const dispatch = useDispatch()
  // const navigate = useNavigate();

  // const { t } = useTranslation();
  // const { isMobile } = useViewport();
  const [contriesList, setContriesList] = useState([])
  // const { isRabcUsers } = useSelector((state) => state?.auth);

  const [showAddCard, setShowAddCard] = useState(false)
  const [roles, setRoles] = useState([
    { name: 'Admin', value: 'admin' },
    { name: 'User', value: 'user' }
  ])
  const [info, setInfo] = useState([
    {
      name: 'Admin',
      permissions: [
        'Unrestricted access to all features within the Partner Portal',
        'Manage team members (add or remove members)',
        'Authorised to edit and maintain accuracy of company’s business profile'
      ]
    },
    {
      name: 'User',
      permissions: [
        'Access to Data Validation and Financing application review features',
        "Restricted from modifying the company's business profile",
        'Unable to manage team members'
      ]
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isResendLoading, setIsResendLoading] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [isMemberDetails, setIsMemberDetails] = useState(true)
  const [ud, setUd] = useState([])

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
  // const { userData, teamMembers, isTeamLoading, navToAddUserTab } = useSelector(
  //   (state) => state.user
  // );
  const toggleAddCard = () => setShowAddCard(!showAddCard)
  // const handleForm = () => {
  //   // console.log(formik);
  // };
  // const getCountriesList = async () => {
  //   var res = await getCountries();
  //   // console.log(res);

  //   if (res) {
  //     const newData = res?.data?.data?.countries?.filter(
  //       (li, idx, self) =>
  //         self.map((itm) => itm.dialCode).indexOf(li.dialCode) === idx
  //     );
  //     setContriesList(newData);
  //   }
  // };

  const handleExpand = (index, flag) => {
    const updatedData = [...ud]
    updatedData[index] = {
      ...updatedData[index],
      flag: flag
    }
    // console.log(updatedData);
    setUd(updatedData)
    // setUd(updatedData);
  }
  const sortByProperty = property => {
    return function (a, b) {
      if (a[property] > b[property]) return 1
      else if (a[property] < b[property]) return -1

      return 0
    }
  }
  // const getRolesForAccess = async () => {
  //   try {
  //     const result = await getRoles();
  //     if (result) {
  //       setRoles(result?.data?.data?.roles);
  //     }
  //   } catch (e) {
  //     // console.log(e);
  //   }
  // };

  // const handleDeleteInvite = async (userId) => {
  //   setSelectedId(userId);
  //   const params = {
  //     user_id: userId,
  //     source: 'dashboard',
  //   };
  //   // // console.log(params);

  //   try {
  //     setIsDeleteLoading(true);
  //     const res = await deleteInvite(params);
  //     // setShowAddCard(false);
  //     // console.log(res);
  //     dispatch(
  //       toggleSnackBar({
  //         isOpen: true,
  //         type: 'success',
  //         message: res?.data?.message,
  //       })
  //     );
  //     dispatch(getTeam());

  //     // next(2);
  //   } catch (e) {
  //     dispatch(
  //       toggleSnackBar({
  //         isOpen: true,
  //         type: 'error',
  //         message: e,
  //       })
  //     );
  //   } finally {
  //     setIsDeleteLoading(false);
  //     setSelectedId('');
  //   }
  // };
  // const handleResendInvite = async (userId) => {
  //   setSelectedId(userId);
  //   const params = {
  //     user_id: userId,
  //     source: 'dashboard',
  //   };

  //   try {
  //     setIsResendLoading(true);
  //     const res = await resendInvite(params);

  //     dispatch(
  //       toggleSnackBar({
  //         isOpen: true,
  //         type: 'success',
  //         message: res?.data?.message,
  //       })
  //     );
  //   } catch (e) {
  //     dispatch(
  //       toggleSnackBar({
  //         isOpen: true,
  //         type: 'error',
  //         message: e,
  //       })
  //     );
  //   } finally {
  //     setIsResendLoading(false);
  //     setSelectedId('');
  //   }
  // };
  const handleJsonSubmit = async newData => {
    console.log('values in card', newData)
    setUd([...ud, newData])
  }
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
    onSubmit: async (values, { resetForm }) => {
      console.log(values)
      // handleJsonSubmit()
      const temp = {
        title: values.title,
        description: values.description,
        image: values.image,
        imagePreview: values.imagePreview
      }
      handleJsonSubmit(temp)
      resetForm()

      // const params = {
      //   first_name: values.firstName,
      //   last_name: values.lastName,
      //   designation: values.designation,
      //   email: values.email,
      //   country_code: values.code,
      //   phone: values.phone,
      //   role: values.role,
      //   source: 'dashboard',
      // };
      // // console.log(params);

      // try {
      //   setIsLoading(true);
      //   const res = await addTeamMember(params);
      //   resetForm();
      //   setShowAddCard(false);
      //   dispatch(getTeam());
      //   dispatch(
      //     toggleSnackBar({
      //       isOpen: true,
      //       type: 'success',
      //       message: res?.data.message,
      //     })
      //   );
      //   // next(2);
      // } catch (e) {
      //   dispatch(
      //     toggleSnackBar({
      //       isOpen: true,
      //       type: 'error',
      //       message: e,
      //     })
      //   );
      // } finally {
      //   setIsLoading(false);
      // }
    }
  })
  // const handleAddObject = () => {
  //   if (formik.values.code !== '' && formik.values.phone !== '') {
  //     const currentOtherPhoneNumbers = formik.values.other_phone_numbers;

  //     const newPhoneNumber = {
  //       code: '',
  //       phone: '',
  //     };
  //     const lastObject =
  //       currentOtherPhoneNumbers[currentOtherPhoneNumbers.length - 1];

  //     if (lastObject && lastObject.code === '' && lastObject.phone === '') {
  //       // Don't push the newPhoneNumber object
  //     } else {
  //       currentOtherPhoneNumbers.push(newPhoneNumber);
  //     }

  //     formik.setFieldValue('other_phone_numbers', currentOtherPhoneNumbers);
  //   }
  // };
  useEffect(() => {
    // if (false) {
    // if (userData?.platformDetail?.country_of_incorporation === 'Singapore') {
    // getEntityType('SingaporeEntityType');
    // } else {
    // }
    // getRolesForAccess();
    // getCountriesList();
  }, [])

  // useEffect(() => {
  //   if (teamMembers) {
  //     setUd(teamMembers);
  //   }
  // }, [teamMembers]);

  // useEffect(() => {
  //   if (navToAddUserTab) {
  //     setShowAddCard(true);
  //     dispatch(handleAddUserTab(false));
  //   }
  // }, [navToAddUserTab]);
  const handleImageClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = event => {
      const file = event.target.files[0]
      if (file) {
        formik.setFieldValue(`image`, file)

        const reader = new FileReader()
        reader.onload = e => {
          formik.setFieldValue(`imagePreview`, e.target.result)
        }
        reader.readAsDataURL(file)
      }
    }

    input.click()
  }

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
    <FormikProvider value={formik}>
      <Box
        sx={{
          p: 8,
          mt: 4
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
        <Grid
          container
          spacing={2}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          {
            <Grid item lg={12} xl={12} md={12} xs={12} sm={12}>
              {!showAddCard && (
                <Button
                  variant='outlined'
                  fullWidth
                  onClick={() => setShowAddCard(true)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'start',
                    ml: 4
                  }}
                >
                  Add Special Invitees
                </Button>
              )}
            </Grid>
          }
        </Grid>
        {showAddCard && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Card
              variant='outlined'
              elevation={0}
              sx={{
                p: 4
                // mt: 8,
                // boxShadow: 4
              }}
            >
              <CardContent sx={{ px: 8 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
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
                    required
                    fullWidth
                    multiline
                    rows={2}
                    name='description'
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    value={formik.values.description
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    onChange={formik.handleChange}
                    helperText={formik.touched.description && formik.errors.description && formik.errors.description}
                  />
                  <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                    <Grid container spacing={2} mt={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'end',
                          // alignItems: 'center',
                          width: '100%'
                        }}
                      >
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ mr: 1 }}>
                          <Button
                            variant='outlined'
                            fullWidth
                            // onClick={formik.handleSubmit}

                            onClick={toggleAddCard}
                            sx={{ mr: 1 }}
                          >
                            Cancel
                          </Button>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                          <LoadingButton
                            loading={isLoading}
                            variant='contained'
                            fullWidth
                            onClick={() => {
                              formik.handleSubmit()
                            }}
                            sx={{ mr: 1 }}
                          >
                            Add
                          </LoadingButton>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
        {ud.length === 0 && !showAddCard ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh'
            }}
          >
            No Data Found
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {/* <List sx={{ width: 1 }}> */}
              {ud?.map((e, i) => (
                <Grid size={{ xs: 12, md: 4, lg: 4 }} key={i}>
                  <Card
                    variant='outlined'
                    sx={{
                      mt: 4,
                      // boxShadow: 4,
                      // border: '1px solid #e0e0e0',
                      // pointer: 'cursor',
                      '& :hover': {
                        // boxShadow: 4
                      }
                      // px: 4
                    }}
                    key={i}
                    elevation={0}
                  >
                    {!e?.flag && (
                      <ListItem
                        alignItems='flex-start'
                        // disableGutters
                        secondaryAction={
                          <>
                            {isMemberDetails && (
                              <Box
                                sx={{
                                  pointer: 'cursor'
                                  // marginLeft:2
                                }}
                              >
                                <LoadingButton
                                  sx={{ minWidth: '16px', ml: 1, px: 2 }}
                                  onClick={() => handleExpand(i, true)}
                                >
                                  <ModeEditOutlineTwoTone color='primary' sx={{ fontSize: 24 }} />
                                </LoadingButton>

                                <LoadingButton
                                  sx={{ minWidth: '18px', px: 2 }}
                                  loading={isDeleteLoading}
                                  disabled={isDeleteLoading}
                                >
                                  {!isDeleteLoading && (
                                    <DeleteOutlineTwoTone
                                      color='error'
                                      sx={{ fontSize: 24 }}
                                      // onClick={() => handleDeleteInvite(e?._id)}
                                    />
                                  )}
                                </LoadingButton>
                              </Box>
                            )}
                          </>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar alt='Profile Picture' src={e?.imagePreview || ''} sx={{ width: 64, height: 64 }} />
                        </ListItemAvatar>
                        <ListItemText
                          sx={{
                            // '& .MuiListItemText-primary': {
                            //   overflow: 'hidden',
                            //   textOverflow: 'ellipsis',
                            //   display: '-webkit-box',
                            //   WebkitLineClamp: 1,
                            //   WebkitBoxOrient: 'vertical'
                            // },
                            '& .MuiListItemText-secondary': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }
                          }}
                          secondaryTypographyProps={{
                            width: '80%'
                          }}
                          primary={e?.title}
                          secondary={
                            e?.description
                            // <React.Fragment>
                            //   <Typography component='p' variant='body2' sx={{ color: 'text.primary' }}>
                            //     {e?.description}
                            //   </Typography>
                            // </React.Fragment>
                          }
                        />
                      </ListItem>
                    )}

                    {e?.flag && (
                      <SplCard
                        // contriesList={contriesList}
                        ud={ud}
                        memberData={e}
                        handleExpand={handleExpand}
                        handleJsonSubmit={handleJsonSubmit}
                        index={i}
                      />
                    )}
                  </Card>
                </Grid>
              ))}
              {/* </List> */}
            </Grid>
          </>
        )}
      </Box>
    </FormikProvider>
  )
}

export default SplDetails
export const BlockInvalidChar = e => ['e', 'E', '+', '-'].includes(e?.key) && e?.preventDefault()
