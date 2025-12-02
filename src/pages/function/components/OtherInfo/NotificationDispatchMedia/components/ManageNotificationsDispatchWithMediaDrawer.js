// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Drawer,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import DatePicker from 'react-datepicker'
import { useDropzone } from 'react-dropzone'
const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const SideBarSpecialInvitee = props => {
  // ** Props
  const { open, toggle, id, RowData } = props

  // ** Hooks
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)

  const [date, setDate] = useState(new Date())
  const { functionId, eventId } = useSelector(state => state.adminMod)
  const [inviteFile, setInviteFile] = useState([])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    validator: file => {
      if (file.size.length > 50 * 1024 * 1024) {
        return {
          code: 'name-too-large',
          message: `Name is larger than ${'50MB'} characters`
        }
      }

      return null
    },
    onDropRejected: fileRejections => {
      console.log(fileRejections)
      toast.error(fileRejections.length > 0 ? fileRejections[0].errors[0].message : 'Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: acceptedFiles => {
      console.log(acceptedFiles)
      setInviteFile(acceptedFiles)
      formik.setFieldValue('fileImagePreview', acceptedFiles[0])
    }
  })
  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      scheduledDateTime: moment(date).toDate(),
      fileImage: '',
      fileImagePreview: null
    },
    validationSchema: yup.object({
      scheduledDateTime: yup.date().required('Scheduled Date Time is required'),
      title: yup.string().required('Title is required'),
      description: yup
        .string('Description is required')
        .trim()
        .required('Description is required')
        .min(4, 'Minimum 4 character required')
        .max(225, 'Description must be at most 225 characters')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          scheduled_date_time: moment(values.scheduledDateTime).toISOString(),
          other_id: eventId,
          type: 'otherInfo',
          function_id: functionId,
          title: values.title,
          description: values.description
        }
        let mainLogo = null
        if (values.fileImagePreview !== null) {
          const formData = new FormData()
          formData.append('file', values.fileImagePreview)
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
          var temp = [imageRes?.data?.detail]
          mainLogo = temp
          params['banner_image'] = mainLogo
        } else {
          params['banner_image'] = RowData?.banner_image
        }
        console.log(params)
        const result =
          id === ''
            ? await apiPost(`${baseURL}notification-dispatch-media/add`, params)
            : await apiPut(`${baseURL}notification-dispatch-media/update/${RowData.id}`, params)
        toggle()
        setTimeout(() => {
          formik.resetForm()
          formik.setFieldValue('fileImagePreview', null)
          setInviteFile([])

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
    if (id != '') {
      formik.setFieldValue('title', '')
      formik.setFieldValue('description', '')
      formik.setFieldValue('scheduledDateTime', moment(date).toDate())
    }
    formik.setFieldValue('fileImagePreview', null)
    setInviteFile([])
  }

  const getData = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('scheduledDateTime', moment(data?.scheduled_date_time).toDate())
        formik.setFieldValue('title', data?.title)
        formik.setFieldValue('description', data?.description)
        setInviteFile(data?.banner_image)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getData()
    }
  }, [id, userData])

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
            <Typography variant='h5'>{id !== '' ? 'Edit Reminder' : 'Create Reminder'}</Typography>
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
        <Box sx={{ p: theme => theme.spacing(0, 8, 8), width: '100% !important' }}>
          <TextField
            sx={{ my: 2 }}
            label={'Title'}
            required
            fullWidth
            name='title'
            error={formik.touched.title && Boolean(formik.errors.title)}
            value={formik.values.title
              .trimStart()
              .replace(/\s\s+/g, '')
              .replace(/\p{Emoji_Presentation}/gu, '')}
            onChange={e => formik.handleChange(e)}
            helperText={formik.touched.title && formik.errors.title && formik.errors.title}
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
          <DatePickerWrapper>
            <DatePicker
              selected={formik.values.scheduledDateTime}
              id='scheduledDateTime'
              showTimeSelect
              timeIntervals={1}
              dateFormat='dd-MM-YYYY h:mm aa'
              minDate={moment(new Date()).toDate()}
              maxDate={moment(new Date()).add(6, 'months').toDate()}
              maxTime={moment(formik.values.scheduledDateTime).endOf('day').toDate()}
              minTime={
                moment(formik.values.scheduledDateTime).isBefore(moment(), 'day')
                  ? moment().endOf('day').toDate()
                  : moment(formik.values.scheduledDateTime).isSame(moment(), 'day')
                    ? moment().toDate()
                    : moment().startOf('day').toDate()
              }
              popperPlacement={popperPlacement}
              onChange={date => {
                console.log(date)
                formik.setFieldValue('scheduledDateTime', date)
              }}
              placeholderText='Click to select a Scheduled Date Time'
              customInput={
                <TextField
                  label='Scheduled Date Time *'
                  // size='small'
                  required
                  fullWidth
                  error={formik.touched.scheduledDateTime && Boolean(formik.errors.scheduledDateTime)}
                  helperText={
                    formik.touched.scheduledDateTime &&
                    formik.errors.scheduledDateTime &&
                    formik.errors.scheduledDateTime
                  }
                  sx={{ my: 2 }}
                />
              }
            />
          </DatePickerWrapper>
          <Fragment>
            <Typography variant='h6' sx={{ mb: 2.5 }}>
              Banner Image
            </Typography>

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
                    Drop Invite here or click to add.
                  </Typography>
                </Box>
              </div>
            )}
            {inviteFile.length > 0 && (
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
                          onClick={() => {
                            if (inviteFile[0]?.url) {
                              window.open(inviteFile[0]?.url, '_blank')
                            } else if (inviteFile[0]?.name) {
                              const file = inviteFile[0]
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
                        </IconButton>
                        <IconButton edge='end' aria-label='delete' onClick={() => setInviteFile([])}>
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
                          (inviteFile.length > 0 && inviteFile[0]?.name) ||
                          (inviteFile.length > 0 && inviteFile[0]?.file_name)
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Grid2>
            )}
          </Fragment>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%'
            }}
          >
            <LoadingButton sx={{ mt: 4 }} loading={isLoading} variant='contained' onClick={() => formik.handleSubmit()}>
              {id !== '' ? 'Update' : 'Submit '}
            </LoadingButton>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarSpecialInvitee
