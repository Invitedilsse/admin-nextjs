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
  InputAdornment,
  // Grid2,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
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
// import MemberCard from './HelpLineCard'
import { makeStyles } from '@mui/styles'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import {
  AccountCircleOutlined,
  ArticleTwoTone,
  AssignmentIndTwoTone,
  CallOutlined,
  CameraAlt,
  DeleteOutlineTwoTone,
  EditAttributesTwoTone,
  ModeEditOutlineTwoTone,
  Person
} from '@mui/icons-material'
import HelpLineCard from './HelpLineCard'
import ImageUpload from 'src/hooks/ImageUpload'
const useStyles = makeStyles({
  root: {}
})

const steps = ['Business Details', 'Contact Details', 'Team Members']

function HelpLineDetails({ next }) {
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
      name: '',
      number: '',
      designation: ''
    },
    validationSchema: yup.object({
      name: yup.string().min(4).max(50).required('Name is Required'),
      number: yup.string().min(4).required('Number is Required'),
      designation: yup.string().min(4).max(200).required('Designation is Required')
    }),
    onSubmit: async (values, { resetForm }) => {
      console.log(values)
      // handleJsonSubmit()
      const temp = {
        name: values.name,
        number: values.number,
        designation: values.designation
        // image: values.image,
        // imagePreview: values.imagePreview
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

  return (
    <FormikProvider value={formik}>
      <Box
        sx={{
          p: 8,
          mt: 4
        }}
      >
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
                  Add Helpline Numbers
                </Button>
              )}
            </Grid>
          }
        </Grid>
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
            {' '}
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
                      <TextField
                        sx={{ my: 2 }}
                        label={'Name'}
                        size='small'
                        variant={false ? 'standard' : 'outlined'}
                        required
                        fullWidth
                        name='name'
                        error={formik.touched.name && Boolean(formik.errors.name)}
                        value={formik.values.name
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={e => {
                          const regx = /^[a-zA-Z ]*$/
                          if (e.target.value === '' || regx.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        helperText={formik.touched.name && formik.errors.name && formik.errors.name}
                      />
                      <TextField
                        fullWidth
                        size='small'
                        required
                        label='Number'
                        value={formik.values.number
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        sx={{ my: 2 }}
                        name='number'
                        onChange={e => {
                          const re = /^[0-9\b]+$/
                          if (e.target.value === '' || re.test(e.target.value)) {
                            formik.handleChange(e)
                          }
                        }}
                        placeholder='Number'
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position='start'>+91</InputAdornment>
                          }
                        }}
                        error={formik.touched.number && Boolean(formik.errors.number)}
                        helperText={formik.touched.number && formik.errors.number && formik.errors.number}
                      />
                      <TextField
                        sx={{ my: 2 }}
                        variant={false ? 'standard' : 'outlined'}
                        label={'Designation'}
                        size='small'
                        required
                        fullWidth
                        multiline
                        rows={2}
                        name='designation'
                        error={formik.touched.designation && Boolean(formik.errors.designation)}
                        value={formik.values.designation
                          .trimStart()
                          .replace(/\s\s+/g, '')
                          .replace(/\p{Emoji_Presentation}/gu, '')}
                        onChange={formik.handleChange}
                        helperText={
                          formik.touched.designation && formik.errors.designation && formik.errors.designation
                        }
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
                        {/* <ListItemAvatar>
                      <Avatar alt='Profile Picture' src={e?.imagePreview || ''} sx={{ width: 64, height: 64 }} />
                    </ListItemAvatar> */}
                        <ListItemText
                          primary={
                            <ListItem sx={{ py: 1 }}>
                              {/* <ListItemButton> */}
                              <ListItemIcon>
                                <Person />
                              </ListItemIcon>
                              <ListItemText primary={e?.name} />
                              {/* </ListItemButton> */}
                            </ListItem>
                          }
                          secondary={
                            <React.Fragment>
                              <ListItem sx={{ py: 1 }}>
                                {/* <ListItemButton> */}
                                <ListItemIcon>
                                  <CallOutlined />
                                </ListItemIcon>
                                <ListItemText primary={e?.number} />
                                {/* </ListItemButton> */}
                              </ListItem>
                              <ListItem sx={{ py: 1 }}>
                                {/* <ListItemButton> */}
                                <ListItemIcon>
                                  <AssignmentIndTwoTone />
                                </ListItemIcon>
                                <ListItemText
                                  sx={{
                                    // '& .MuiListItemText-primary': {
                                    //   overflow: 'hidden',
                                    //   textOverflow: 'ellipsis',
                                    //   display: '-webkit-box',
                                    //   WebkitLineClamp: 1,
                                    //   WebkitBoxOrient: 'vertical'
                                    // },
                                    '& .MuiListItemText-primary': {
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical'
                                    }
                                  }}
                                  primaryTypographyProps={{
                                    width: '80%'
                                  }}
                                  primary={e?.designation}
                                />
                                {/* </ListItemButton> */}
                              </ListItem>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    )}

                    {e?.flag && (
                      <HelpLineCard
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

export default HelpLineDetails
export const BlockInvalidChar = e => ['e', 'E', '+', '-'].includes(e?.key) && e?.preventDefault()
