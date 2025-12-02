// ** React Imports
import { Fragment, useEffect, useRef, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useSelector } from 'react-redux'

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

const SideBarSocialLink = props => {
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
  const { functionId } = useSelector(state => state.adminMod)
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
      if (acceptedFiles.length > 0) {
        setInviteFile(acceptedFiles)
        formik.setFieldValue('fileImagePreview', acceptedFiles[0])
      }
    }
  })
  const formik = useFormik({
    initialValues: {
      name: '',
      link: '',
      fileImage: '',
      fileImagePreview: null
    },
    validationSchema: yup.object({
      name: yup.string().required('Name is required'),
      link: yup.string('Link is required').trim().required('Link is required')
    }),
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          name: values.name,
          link: values.link,
          type: 'function',
          function_id: functionId,
          id: id ? id : null
        }
        let mainLogo = null
        if (values.fileImagePreview !== null) {
          const formData = new FormData()
          formData.append('file', values.fileImagePreview)
          const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
          var temp = imageRes?.data?.detail
          console.log('temp------->', temp)
          mainLogo = temp
          params['logo'] = mainLogo
        } else {
          params['logo'] = RowData?.logo
        }

        const result = await apiPost(`${baseURL}function/upsertSocialLink`, params)
        console.log('params========>', params, id)
        toggle()
        setInviteFile([])
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
    if (id != '') {
      formik.setFieldValue('name', '')
      formik.setFieldValue('link', '')
    }
  }

  const getData = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('name', data?.name)
        formik.setFieldValue('link', data?.link)
        setInviteFile([data?.logo])
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
            label={'Name'}
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
            label={'Link'}
            multiline
            minRows={2}
            maxRows={3}
            required
            fullWidth
            name='link'
            error={formik.touched.link && Boolean(formik.errors.link)}
            value={formik.values.link
              .trimStart()
              .replace(/\s\s+/g, '')
              .replace(/\p{Emoji_Presentation}/gu, '')}
            onChange={e => formik.handleChange(e)}
            helperText={
              <>
                {formik.touched.link && formik.errors.link && formik.errors.link}
                <span style={{ float: 'right' }}>{formik.values.link.length}/225</span>
              </>
            }
          />
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
                    Drop invite here or click to add.
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

export default SideBarSocialLink
