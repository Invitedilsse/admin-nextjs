// ** React Imports
import { createRef, Fragment, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
// ** Custom Component Import
import { FieldArray, FormikProvider, useFormik } from 'formik'
// ** Third Party Imports
import { EditorState } from 'draft-js'
import { useDropzone } from 'react-dropzone'
// ** Component Import
// ** Third Party Imports
import * as yup from 'yup'
// ** Icon Imports

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Actions Imports

import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Avatar,
  Badge,
  Button,
  CardHeader,
  Chip,
  Divider,
  Drawer,
  FormGroup,
  FormHelperText,
  Grid2,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  InputAdornment,
  List,
  ListItem,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import { toggleSnackBar } from 'src/store/auth'
import toast from 'react-hot-toast'
import { AddCircleOutline, CameraAlt, DeleteOutline } from '@mui/icons-material'
// import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Check from '@mui/icons-material/Check'
import SettingsIcon from '@mui/icons-material/Settings'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import VideoLabelIcon from '@mui/icons-material/VideoLabel'
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'
import { Grid } from '@mui/system'

const steps = ['Basic Information', 'Special Invitees', 'Helpline Number', 'Firm', 'Files&Images']

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)'
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4'
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
    ...theme.applyStyles('dark', {
      borderColor: theme.palette.grey[800]
    })
  }
}))

const QontoStepIconRoot = styled('div')(({ theme }) => ({
  color: '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  '& .QontoStepIcon-completedIcon': {
    color: '#784af4',
    zIndex: 1,
    fontSize: 18
  },
  '& .QontoStepIcon-circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor'
  },
  ...theme.applyStyles('dark', {
    color: theme.palette.grey[700]
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        color: '#784af4'
      }
    }
  ]
}))

function QontoStepIcon(props) {
  const { active, completed, className } = props

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? <Check className='QontoStepIcon-completedIcon' /> : <div className='QontoStepIcon-circle' />}
    </QontoStepIconRoot>
  )
}
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

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
})
// ** ValidationSchema
const validationSchema = yup.object({
  occasion_type: yup.string().required('Occasion Type is required'),
  function_name: yup.string().required('Function Name is required'),
  notes: yup.string().required('Notes is required'),
  host_name: yup.string().required('Host Name is required'),
  // special_invitee: yup.array().of(
  //   yup.object().shape({
  //     title: yup.string().required('Title is required'),
  //     description: yup.string().required('Description is required'),
  //     // image: yup.mixed().required('Image is required')
  //   })
  // ),
  // special_invitee: yup.array().of(
  //   yup.object().shape({
  //     title: yup.string().required('Title is required'),
  //     description: yup.string().required('Description is required'),
  //     // image: yup.mixed().required('Image is required')
  //   })
  // ).test('no-empty-objects', 'Empty objects are not allowed', (value) => {
  //   if (!value) return true; // Allow empty array
  //   return value.every((item) => Object.values(item).some((field) => field !== ''));
  // }),
  // helpline_number: yup.array().of(
  //   yup.object().shape({
  //     name: yup.string().required('Name is required'),
  //     number: yup.string()
  //       .matches(/^[0-9]{10}$/, 'Must be exactly 10 digits')
  //       .required('Number is required'),
  //     desgination: yup.string().required('Designation is required')
  //   })
  // ),
  // description: yup
  //   .string('Description is required')
  //   .trim()
  //   .required('Description is required')
  //   .min(4, 'Minimum 4 character required')
  //   .max(700, 'Maximum 700 character only allowed'),
  name: yup
    .string('Name is required')
    .trim()
    .required('Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})
const SideBarOccasion = props => {
  // ** Props
  const { open, toggle, id, RowData, toggleAddUserDrawer } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [files, setFiles] = useState([])
  const [mainLogo, setMainLogo] = useState(null)
  const [muiFiles, setMuiFiles] = useState([])
  const { isOccasionFetching, allOccasion, occasionCount } = useSelector(state => state.adminMod)
  // ** Hooks
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      console.log(acceptedFiles)
      let uploadedFiles = files
      let newFiles = acceptedFiles.map(file => Object.assign(file))
      console.log(props)
      setFiles([...uploadedFiles, ...newFiles])
    }
  })
  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } = useDropzone({
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: acceptedFiles => {
      let uploadedLogo = acceptedFiles[0]
      setMainLogo(uploadedLogo)
      formik.setFieldValue('mainLogo', uploadedLogo)
    }
  })
  const renderFilePreview = file => {
    // if (file.type.startsWith("image")) {
    if (true) {
      return (
        <img
          width={'auto'}
          height={100}
          alt={file.name}
          src={file?.internal_name?.includes('https:') ? file?.internal_name : URL.createObjectURL(file)}
        />
      )
    } else {
    }
  }

  const handleRemoveFile = file => {
    console.log(file)
    const uploadedFiles = files
    let filtered = null
    if (file?.internal_name?.includes('https:')) {
      filtered = uploadedFiles.filter(i => i?.internal_name !== file?.internal_name)
    } else {
      filtered = uploadedFiles.filter(i => i.name !== file.name)
    }
    setFiles([...filtered])
  }

  const fileList = files.map(file => (
    // {itemData.map((item) => (
    <ImageListItem
      key={file.name}
      sx={{
        height: '200px !important',
        mb: '44px',
        '& .MuiImageListItem-img': {
          objectFit: 'contain',
          height: '200px'
          // width:'200px'
        }
      }}
    >
      <img
        width={'auto'}
        height={100}
        srcSet={file?.internal_name?.includes('https:') ? file?.internal_name : URL.createObjectURL(file)}
        src={file?.internal_name?.includes('https:') ? file?.internal_name : URL.createObjectURL(file)}
        alt={file.name}

        // loading="lazy"
      />
      <ImageListItemBar
        sx={{ background: 'none !important' }}
        actionPosition='right'
        actionIcon={
          <Box>
            <IconButton
              sx={{ borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.2)' }}
              onClick={() => handleRemoveFile(file)}
            >
              <Icon icon='ic:twotone-delete' fontSize={24} color='red' />
            </IconButton>
          </Box>
        }
        // title={item.title}
        // subtitle={
        //      <IconButton onClick={() => handleRemoveFile(file)} sx={{mb:3}}>
        //        <Icon icon="tabler:x" fontSize={20} />
        //     </IconButton>}
        position='above'
      />
    </ImageListItem>
    // ))}

    // <ListItem key={file.name} sx={{ width: 1 }}>
    //   <div className="file-details">
    //     <div className="file-preview">{renderFilePreview(file)}</div>
    //     {/* <div>
    //       <Typography className="file-name">{file.name}</Typography>
    //       <Typography className="file-size" variant="body2">
    //         {Math.round(file.size / 100) / 10 > 1000
    //           ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
    //           : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
    //       </Typography>
    //     </div> */}
    //   </div>
    //   <IconButton onClick={() => handleRemoveFile(file)}>
    //     <Icon icon="tabler:x" fontSize={20} />
    //   </IconButton>
    // </ListItem>
  ))

  const handleRemoveAllFiles = () => {
    setFiles([])
  }

  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => {
    // let newSkipped = skipped;
    // if (isStepSkipped(activeStep)) {
    //   newSkipped = new Set(newSkipped.values());
    //   newSkipped.delete(activeStep);
    // }

    setActiveStep(prevActiveStep => prevActiveStep + 1)
    // setSkipped(newSkipped);
  }
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  const formik = useFormik({
    initialValues: {
      occasion_type: '',
      function_name: '',
      notes: '',
      name: '',
      status: '',
      host_name: '',
      description: '',
      hastag: [],
      hastagList: [],
      mainLogo: '',
      special_invitee: [{ title: '', description: '', image: '', imagePreview: '' }],
      helpline_number: [{ name: '', number: '', desgination: '' }]
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      console.log(values)
      // try {
      //   setIsLoading(true)
      //   let params = {
      //     occasion_name: values.name,
      //     occasion_description: values.description
      //   }

      //   const result =
      //     id === ''
      //       ? await apiPost(`${baseURL}occasion/add`, params)
      //       : await apiPut(`${baseURL}occasion/update/${RowData.id}`, params)
      //   console.log(result)
      //   toggle()
      //   setTimeout(() => {
      //     formik.resetForm()
      //     setIsLoading(false)
      //   }, 500)

      // } catch (e) {
      //   toast.error(e)

      // } finally {
      //   setIsLoading(false)
      // }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const getCategory = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('name', data?.occasion_name)
        formik.setFieldValue('description', data?.occasion_description)
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
  const handleImageClick = index => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = event => {
      const file = event.target.files[0]
      if (file) {
        formik.setFieldValue(`special_invitee.${index}.image`, file)

        const reader = new FileReader()
        reader.onload = e => {
          formik.setFieldValue(`special_invitee.${index}.imagePreview`, e.target.result)
        }
        reader.readAsDataURL(file)
      }
    }

    input.click()
  }
  return (
    // <Drawer
    //   open={open}
    //   anchor='right'
    //   variant='temporary'
    //   onClose={handleClose}
    //   ModalProps={{ keepMounted: true }}
    //   className={classes.root}
    //   sx={{
    //     '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
    //   }}
    // >
    <Box
      className={classes.root}
      //   sx={{
      //   '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      // }}
    >
      <FormikProvider value={formik}>
        <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
          <Header>
            <Typography variant='h5'>{id !== '' ? 'Edit Occasion' : 'Create a Occasion'}</Typography>
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
        <Box sx={{ width: '100%' }} spacing={4}>
          <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel slots={{ stepIcon: QontoStepIcon }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Grid2 container spacing={2}>
            {
              activeStep === 0 && (
                // <Box
                //   sx={{
                //     display: 'flex',
                //     justifyContent: 'center',
                //     // flexDirection: 'column',
                //     px: 8
                //   }}
                // >
                <Grid2 size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                  {/* <AccordionDetails> */}
                  {/* <div
                        {...getLogoRootProps({
                          className: 'dropzone',
                          style: {
                            border: '2px dashed #ccc',
                            borderRadius: '4px',
                            padding: '20px',
                            cursor: 'pointer'
                          }
                        })}
                      >
                        <input {...getLogoInputProps()} />
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
                           Drop Main Logo here or click to add.
                          </Typography>
                        </Box> 
                      </div>*/}
                  {
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                        // height: '100%'
                      }}
                    >
                      <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <div {...getLogoRootProps()}>
                            <input {...getLogoInputProps()} />
                            <IconButton
                              // onClick={() => handleImageClick(index)}
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
                          </div>
                        }
                      >
                        <Avatar
                          //  variant="square"
                          alt='Main Logo'
                          src={mainLogo !== null ? URL.createObjectURL(mainLogo) : 'NA'}
                          sx={{ width: 88, height: 88 }}
                        />
                      </Badge>
                    </Box>
                  }
                  <TextField
                    sx={{ my: 2 }}
                    label={'Occasion Type '}
                    required
                    size='small'
                    select // disabled
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
                  <TextField
                    sx={{ my: 2 }}
                    label={'Function Name '}
                    required
                    // disabled
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
                    sx={{ my: 2 }}
                    label={'Notes '}
                    required
                    multiline
                    minRows={2}
                    maxRows={3}
                    // disabled
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
                  <Autocomplete
                    multiple
                    freeSolo
                    sx={{ my: 2 }}
                    value={formik.values.hastag}
                    name='hastag'
                    onChange={(event, newValues) => {
                      const updatedValues = newValues.map(value => {
                        if (typeof value === 'string' && !value.startsWith('#')) {
                          return `#${value}`
                        }
                        return value
                      })
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
                        label='Hastags'
                        placeholder='Type words and press Enter'
                      />
                    )}
                  />

                  <Fragment>
                    <Typography variant='h6' sx={{ mb: 2.5 }}>
                      Host Images
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
                    {files?.length ? (
                      <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                        <ImageList sx={{ width: '100%', minHeight: 150, maxHeight: 450 }} cols={3} rowHeight={164}>
                          {fileList}
                        </ImageList>
                      </Grid2>
                    ) : null}
                  </Fragment>
                  <TextField
                    sx={{ mb: 2, mt: 4 }}
                    label={'Host Name '}
                    required
                    // disabled
                    fullWidth
                    name='host_name'
                    error={formik.touched.host_name && Boolean(formik.errors.host_name)}
                    value={formik.values.host_name
                      .trimStart()
                      .replace(/\s\s+/g, '')
                      .replace(/\p{Emoji_Presentation}/gu, '')}
                    onChange={e => formik.handleChange(e)}
                    helperText={formik.touched.host_name && formik.errors.host_name && formik.errors.host_name}
                  />
                  {/* <TextField
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
                      helperText={formik.touched.description && formik.errors.description && formik.errors.description}
                    /> */}
                  {/* <Autocomplete
        multiple
        id="tags-filled"
        // options={['hello', 'world']}
        // defaultValue={'hello'}
        freeSolo
        // renderTags={(value, getTagProps) =>
        //   value.map((option, index) => {
        //     const { key, ...tagProps } = getTagProps({ index });
        //     return (
        //       <Chip variant="outlined" label={option} key={key} {...tagProps} />
        //     );
        //   })
        // }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="filled"
            label="freeSolo"
            placeholder="Favorites"
          />
        )} 
      />*/}
                </Grid2>
              )
              // </Box>
            }

            {/* <Accordion defaultExpanded={Boolean(formik.errors.host_name)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='host-content' id='host-header'>
                    Host Details
                  </AccordionSummary>
                  <AccordionDetails>
                    <Fragment>
                      <Typography variant='h6' sx={{ mb: 2.5 }}>
                        Host Images
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
                        <input {...getInputProps("host")} />
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
                            Drop Host Images here or click to add.
                          </Typography>
                        </Box>
                      </div>
                      {files?.length ? (
                        <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }}>
                          <ImageList sx={{ width: '100%', minHeight: 150, maxHeight: 450 }} cols={3} rowHeight={164}>
                            {fileList}
                          </ImageList>
                        </Grid2>
                      ) : null}
                    </Fragment>
                    <TextField
                      sx={{ mb: 2, mt: 4 }}
                      label={'Host Name '}
                      required
                      // disabled
                      fullWidth
                      name='host_name'
                      error={formik.touched.host_name && Boolean(formik.errors.host_name)}
                      value={formik.values.host_name
                        .trimStart()
                        .replace(/\s\s+/g, '')
                        .replace(/\p{Emoji_Presentation}/gu, '')}
                      onChange={e => formik.handleChange(e)}
                      helperText={formik.touched.host_name && formik.errors.host_name && formik.errors.host_name}
                    />
                  </AccordionDetails>
                </Accordion> */}
            {activeStep === 1 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='host-content' id='host-header'>
                  Special Invitees
                </AccordionSummary>
                <AccordionDetails>
                  <FieldArray name='special_invitee'>
                    {({ push, remove }) => (
                      <>
                        {formik.values.special_invitee?.map((value, index) => {
                          // const fileInputRefs = useRef(Array(5).fill(null).map(() => createRef()));

                          return (
                            <FormGroup key={index} sx={{ mb: 3 }}>
                              <Box
                                sx={{
                                  p: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  position: 'relative'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                  {/* <VisuallyHiddenInput
            type="file"
            id={`file-input-${index}`}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files[0];
              if (file) {
                formik.setFieldValue(`special_invitee.${index}.image`, file);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                  formik.setFieldValue(`special_invitee.${index}.imagePreview`, e.target.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          /> */}
                                </Box>
                                <Grid2 container spacing={2}>
                                  {/* Title Field */}
                                  <Grid2 size={{ xs: 2, lg: 2, xl: 2, md: 2, sm: 2 }}>
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
                                            onClick={() => handleImageClick(index)}
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
                                          src={formik.values.special_invitee[index].imagePreview || ''}
                                          sx={{ width: 88, height: 88 }}
                                        />
                                      </Badge>
                                    </Box>
                                  </Grid2>
                                  <Grid2 size={{ xs: 10, lg: 10, xl: 10, md: 10, sm: 10 }}>
                                    <TextField
                                      size='small'
                                      fullWidth
                                      sx={{ mb: 2 }}
                                      variant='outlined'
                                      required
                                      label='Title'
                                      name={`special_invitee.${index}.title`}
                                      value={formik.values.special_invitee[index].title}
                                      onChange={formik.handleChange}
                                      error={
                                        formik.touched?.special_invitee?.[index]?.title &&
                                        Boolean(formik.errors?.special_invitee?.[index]?.title)
                                      }
                                      helperText={
                                        formik.touched?.special_invitee?.[index]?.title &&
                                        formik.errors?.special_invitee?.[index]?.title
                                      }
                                      slotProps={{
                                        input: {
                                          endAdornment: (
                                            <InputAdornment position='end'>
                                              {
                                                index !== 0 && (
                                                  //(
                                                  //   <AddCircleOutline
                                                  //     color="primary"
                                                  //     sx={{ cursor: 'pointer' }}
                                                  //     onClick={() => {
                                                  //       const currentValues = formik.values.special_invitee;
                                                  //       const hasEmptyFields = currentValues.some(
                                                  //         v => !v.title.trim() || !v.description.trim()
                                                  //       );
                                                  //       const maxFieldsReached = currentValues.length >= 5;

                                                  //       if (!hasEmptyFields && !maxFieldsReached) {
                                                  //         push({ title: '', description: '', image: '' });
                                                  //       }
                                                  //     }}
                                                  //   />
                                                  // ) : (
                                                  <DeleteOutline
                                                    color='primary'
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => remove(index)}
                                                  />
                                                )
                                                // )
                                              }
                                            </InputAdornment>
                                          )
                                        }
                                      }}
                                    />

                                    {/* Description Field */}
                                    <TextField
                                      size='small'
                                      fullWidth
                                      sx={{ mb: 2 }}
                                      variant='outlined'
                                      required
                                      label='Description'
                                      multiline
                                      rows={3}
                                      name={`special_invitee.${index}.description`}
                                      value={formik.values.special_invitee[index].description}
                                      onChange={formik.handleChange}
                                      error={
                                        formik.touched?.special_invitee?.[index]?.description &&
                                        Boolean(formik.errors?.special_invitee?.[index]?.description)
                                      }
                                      helperText={
                                        formik.touched?.special_invitee?.[index]?.description &&
                                        formik.errors?.special_invitee?.[index]?.description
                                      }
                                    />
                                  </Grid2>
                                </Grid2>
                                {/* Image Upload Field */}
                                {/* <TextField
              size="small"
              fullWidth
              type="file"
              variant="outlined"
              label="Image"
              name={`special_invitee.${index}.image`}
              onChange={(event) => {
                const file = event.currentTarget.files[0];
                formik.setFieldValue(`special_invitee.${index}.image`, file);
              }}
              error={
                formik.touched?.special_invitee?.[index]?.image &&
                formik.errors?.special_invitee?.[index]?.image
              }
            
              // InputLabelProps={{ shrink: true }}
            /> */}

                                {/* Add/Remove Buttons */}
                                {/* <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              display: 'flex',
              gap: 1
            }}>
              {index === 0 && (
                <AddCircleOutline
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    const currentValues = formik.values.special_invitee;
                    const hasEmptyFields = currentValues.some(
                      v => !v.title.trim() || !v.description.trim()
                    );
                    const maxFieldsReached = currentValues.length >= 5;

                    if (!hasEmptyFields && !maxFieldsReached) {
                      push({ title: '', description: '', image: '' });
                    }
                  }}
                />
              )}
              {index !== 0 && (
                <DeleteOutline
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => remove(index)}
                />
              )}
            </Box> */}
                              </Box>

                              {/* Error Messages can be added here if needed */}
                              {index === 0 && <FormHelperText>You can add up to 5 entries</FormHelperText>}
                              {/* {index !==0 && }
          { <IconButton>
          <AddCircleOutline
                          color="primary"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            const currentValues = formik.values.special_invitee;
                            const hasEmptyFields = currentValues.some(
                              v => !v.title.trim() || !v.description.trim()
                            );
                            const maxFieldsReached = currentValues.length >= 5;
        
                            if (!hasEmptyFields && !maxFieldsReached) {
                              push({ title: '', description: '', image: '' });
                            }
                          }}
                        />
          </IconButton>} */}
                            </FormGroup>
                          )
                        })}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Button
                            variant='contained'
                            statIcon={<AddCircleOutline />}
                            // disabled
                            onClick={() => {
                              const currentValues = formik.values.special_invitee
                              const maxFieldsReached = currentValues.length >= 5

                              if (maxFieldsReached) {
                                return
                              }

                              let hasErrors = false
                              const lastIndex = currentValues.length - 1

                              // Set all fields as touched
                              const newTouched = {
                                ...formik.touched,
                                special_invitee: {
                                  ...formik.touched?.special_invitee,
                                  [lastIndex]: {
                                    title: true,
                                    description: true
                                  }
                                }
                              }
                              formik.setTouched(newTouched)

                              // Validate the last entry
                              if (!currentValues[lastIndex].title.trim()) {
                                hasErrors = true
                                formik.setFieldTouched(`special_invitee.${lastIndex}.title`, true)
                                formik.setFieldError(`special_invitee.${lastIndex}.title`, 'Title is required')
                              }

                              if (!currentValues[lastIndex].description.trim()) {
                                hasErrors = true
                                formik.setFieldTouched(`special_invitee.${lastIndex}.description`, true)
                                formik.setFieldError(
                                  `special_invitee.${lastIndex}.description`,
                                  'Description is required'
                                )
                              }

                              if (!hasErrors) {
                                push({
                                  title: '',
                                  description: '',
                                  image: '',
                                  imagePreview: ''
                                })
                              } else {
                                console.log(formik.errors)
                                // Optionally show a message that fields need to be filled
                                // toast?.error("Please fill all required fields before adding new entry");
                              }
                            }}
                            // onClick={() => {
                            //                       const currentValues = formik.values.special_invitee;
                            //                       const hasEmptyFields = currentValues.some(
                            //                         v => !v.title.trim() || !v.description.trim()
                            //                       );
                            //                       const maxFieldsReached = currentValues.length >= 5;

                            //                       if (!hasEmptyFields && !maxFieldsReached) {
                            //                         push({ title: '', description: '', image: '' });
                            //                       }
                            //                     }}
                          >
                            Add
                          </Button>
                        </Box>
                      </>
                    )}
                  </FieldArray>
                  {/* <FieldArray name="special_invitee">
      {({ push, remove }) => (
        <>
          {formik.values.special_invitee?.map((value, index) => (
            <FormGroup key={index} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                sx={{ mb: index===0 ? 1: 2 }}
                variant="outlined"
                label="Additional Mobile Number"
                name={`special_invitee.${index}`}
                value={formik.values.special_invitee[index]}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>+91</InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        {index === 0 ? (
                          <AddCircleOutline
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              const currentValues = formik.values.special_invitee;
                              const hasEmptyFields = currentValues.some(v => !v.trim());
                              const maxFieldsReached = currentValues.length >= 5;
                              
                              if (!hasEmptyFields && !maxFieldsReached) {
                                push('');
                              }
                            }}
                          />
                        ) : (
                          <DeleteOutline
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => remove(index)}
                          />
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
                onChange={(e) => {
                  // Remove spaces and emojis
                  const cleanValue = e.target.value
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '');
                  formik.setFieldValue(
                    `special_invitee.${index}`,
                    cleanValue
                  );
                }}
                error={
                  (formik.touched?.special_invitee?.[index] &&
                    formik.errors?.special_invitee?.[index]) 
                 
                }
                
              />
              
              {/* Error Messages */}
                  {/* {formik.touched?.special_invitee?.[index] && 
               formik.errors?.special_invitee?.[index] && (
                <FormHelperText error>
                  {formik.errors.special_invitee[index]}
                </FormHelperText>
              )} */}

                  {/* Duplicate Error Message */}
                  {/* {hasDuplicates(formik.values.special_invitee) && 
               getDuplicates(formik.values.special_invitee).includes(value) && (
                <FormHelperText error>
                  This number has already been added
                </FormHelperText>
              )} */}

                  {/* Helper text for first field */}
                  {/* {index === 0 && (
                <FormHelperText>
                  You can add up to 5 phone numbers
                </FormHelperText>
              )} *
            </FormGroup>
          ))}
        </>
      )}
    </FieldArray> */}
                </AccordionDetails>
              </Accordion>
            )}
            {activeStep === 2 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='host-content' id='host-header'>
                  Helpline Numbers
                </AccordionSummary>
                <AccordionDetails>
                  <FieldArray name='helpline_number'>
                    {({ push, remove }) => (
                      <>
                        {formik.values.helpline_number?.map((value, index) => (
                          <FormGroup key={index} sx={{ mb: 3 }}>
                            <Box
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                position: 'relative'
                              }}
                            >
                              <Grid2 container spacing={2}>
                                {/* Name Field */}
                                <Grid2 size={{ xs: 12, md: 6 }}>
                                  <TextField
                                    size='small'
                                    fullWidth
                                    required
                                    variant='outlined'
                                    label='Name'
                                    name={`helpline_number.${index}.name`}
                                    value={formik.values.helpline_number[index].name}
                                    onChange={formik.handleChange}
                                    error={
                                      formik.touched?.helpline_number?.[index]?.name &&
                                      Boolean(formik.errors?.helpline_number?.[index]?.name)
                                    }
                                    helperText={
                                      formik.touched?.helpline_number?.[index]?.name &&
                                      formik.errors?.helpline_number?.[index]?.name
                                    }
                                  />
                                </Grid2>

                                {/* Number Field */}
                                <Grid2 size={{ xs: 12, md: 6 }}>
                                  <TextField
                                    size='small'
                                    fullWidth
                                    required
                                    variant='outlined'
                                    label='Contact Number'
                                    name={`helpline_number.${index}.number`}
                                    value={formik.values.helpline_number[index].number}
                                    onChange={e => {
                                      // Only allow numbers
                                      const value = e.target.value.replace(/[^0-9]/g, '')
                                      formik.setFieldValue(`helpline_number.${index}.number`, value)
                                    }}
                                    error={
                                      formik.touched?.helpline_number?.[index]?.number &&
                                      Boolean(formik.errors?.helpline_number?.[index]?.number)
                                    }
                                    helperText={
                                      formik.touched?.helpline_number?.[index]?.number &&
                                      formik.errors?.helpline_number?.[index]?.number
                                    }
                                    slotProps={{
                                      input: {
                                        startAdornment: <InputAdornment position='start'>+91</InputAdornment>
                                        // endAdornment: index !== 0 && (
                                        //   <InputAdornment position="end">
                                        //     <DeleteOutline
                                        //       color="error"
                                        //       sx={{ cursor: 'pointer' }}
                                        //       onClick={() => remove(index)}
                                        //     />
                                        //   </InputAdornment>
                                        // )
                                      }
                                    }}
                                  />
                                </Grid2>

                                {/* Designation Field */}
                                <Grid2 size={{ xs: 12, md: 6 }}>
                                  <TextField
                                    required
                                    size='small'
                                    fullWidth
                                    variant='outlined'
                                    label='Designation'
                                    name={`helpline_number.${index}.desgination`}
                                    value={formik.values.helpline_number[index].desgination}
                                    onChange={formik.handleChange}
                                    error={
                                      formik.touched?.helpline_number?.[index]?.desgination &&
                                      Boolean(formik.errors?.helpline_number?.[index]?.desgination)
                                    }
                                    helperText={
                                      formik.touched?.helpline_number?.[index]?.desgination &&
                                      formik.errors?.helpline_number?.[index]?.desgination
                                    }
                                  />
                                </Grid2>
                                {index !== 0 && (
                                  <Grid2 size={{ xs: 12, md: 6 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        height: '100%'
                                      }}
                                    >
                                      <DeleteOutline
                                        color='error'
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => remove(index)}
                                      />
                                    </Box>
                                  </Grid2>
                                )}
                              </Grid2>
                            </Box>

                            {index === 0 && <FormHelperText>You can add up to 5 helpline numbers</FormHelperText>}
                          </FormGroup>
                        ))}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Button
                            variant='contained'
                            startIcon={<AddCircleOutline />}
                            onClick={() => {
                              const currentValues = formik.values.helpline_number
                              const maxFieldsReached = currentValues.length >= 5

                              if (maxFieldsReached) {
                                return
                              }

                              let hasErrors = false
                              const lastIndex = currentValues.length - 1

                              // Set all fields as touched
                              const newTouched = {
                                ...formik.touched,
                                helpline_number: {
                                  ...formik.touched?.helpline_number,
                                  [lastIndex]: {
                                    name: true,
                                    number: true,
                                    desgination: true
                                  }
                                }
                              }
                              formik.setTouched(newTouched)

                              // Validate the last entry
                              if (!currentValues[lastIndex].name.trim()) {
                                hasErrors = true
                                formik.setFieldError(`helpline_number.${lastIndex}.name`, 'Name is required')
                              }

                              if (!currentValues[lastIndex].number.trim()) {
                                hasErrors = true
                                formik.setFieldError(`helpline_number.${lastIndex}.number`, 'Number is required')
                              }

                              if (!currentValues[lastIndex].desgination.trim()) {
                                hasErrors = true
                                formik.setFieldError(
                                  `helpline_number.${lastIndex}.desgination`,
                                  'Designation is required'
                                )
                              }

                              if (!hasErrors) {
                                push({
                                  name: '',
                                  number: '',
                                  desgination: ''
                                })
                              }
                            }}
                            disabled={formik.values.helpline_number?.length >= 5}
                          >
                            Add Helpline Number
                          </Button>
                        </Box>
                      </>
                    )}
                  </FieldArray>{' '}
                  {/* <FieldArray name="special_invitee">
      {({ push, remove }) => (
        <>
          {formik.values.special_invitee?.map((value, index) => (
            <FormGroup key={index} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                sx={{ mb: index===0 ? 1: 2 }}
                variant="outlined"
                label="Additional Mobile Number"
                name={`special_invitee.${index}`}
                value={formik.values.special_invitee[index]}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>+91</InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        {index === 0 ? (
                          <AddCircleOutline
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              const currentValues = formik.values.special_invitee;
                              const hasEmptyFields = currentValues.some(v => !v.trim());
                              const maxFieldsReached = currentValues.length >= 5;
                              
                              if (!hasEmptyFields && !maxFieldsReached) {
                                push('');
                              }
                            }}
                          />
                        ) : (
                          <DeleteOutline
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => remove(index)}
                          />
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
                onChange={(e) => {
                  // Remove spaces and emojis
                  const cleanValue = e.target.value
                    .replace(/\s\s+/g, '')
                    .replace(/\p{Emoji_Presentation}/gu, '');
                  formik.setFieldValue(
                    `special_invitee.${index}`,
                    cleanValue
                  );
                }}
                error={
                  (formik.touched?.special_invitee?.[index] &&
                    formik.errors?.special_invitee?.[index]) 
                 
                }
                
              />
              
              {/* Error Messages */}
                  {/* {formik.touched?.special_invitee?.[index] && 
               formik.errors?.special_invitee?.[index] && (
                <FormHelperText error>
                  {formik.errors.special_invitee[index]}
                </FormHelperText>
              )} */}
                  {/* Duplicate Error Message */}
                  {/* {hasDuplicates(formik.values.special_invitee) && 
               getDuplicates(formik.values.special_invitee).includes(value) && (
                <FormHelperText error>
                  This number has already been added
                </FormHelperText>
              )} */}
                  {/* Helper text for first field */}
                  {/* {index === 0 && (
                <FormHelperText>
                  You can add up to 5 phone numbers
                </FormHelperText>
              )} *
            </FormGroup>
          ))}
        </>
      )}
    </FieldArray> */}
                </AccordionDetails>
              </Accordion>
            )}
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 6, sm: 12 }}>
                <LoadingButton
                  // fullWidth
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
                  // fullWidth
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
            {/* </Box> */}
            {/* </Grid2> */}
          </Grid2>
        </Box>
      </FormikProvider>
    </Box>
    // {/* </Drawer> */}
  )
}

export default SideBarOccasion
