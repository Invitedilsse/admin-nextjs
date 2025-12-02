// ** React Imports
import { useEffect, useState } from 'react'
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
import { CardHeader, Divider, Drawer, Grid, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

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
  description: yup
    .string('Description is required')
    .trim()
    .required('Description is required')
    .min(4, 'Minimum 4 character required')
    .max(700, 'Maximum 700 character only allowed'),
  name: yup
    .string('Category Name is required')
    .trim()
    .required('Category Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})
const SideBarCategory = props => {
  // ** Props
  const { open, toggle, id, RowData, toggleAddUserDrawer } = props

  // ** State
  const [plan, setPlan] = useState('basic')
  const [role, setRole] = useState('subscriber')

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      name: '',
      description: ''
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          category_name: values.name,
          category_description: values.description
        }

        const result =
          id === ''
            ? await apiPost(`${baseURL}category/add`, params)
            : await apiPut(`${baseURL}category/update/${RowData._id}`, params)
        console.log(result)
        sendNotification({
          message: result?.data?.data?.message,
          variant: 'success'
        })
      } catch (e) {
        sendNotification({
          message: e,
          variant: 'error'
        })
      } finally {
        setTimeout(() => {
          toggle()
          formik.resetForm()
          setIsLoading(false)
        }, 2000)
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
        formik.setFieldValue('name', data?.category_name)
        formik.setFieldValue('description', data?.category_description)
      }
    } catch (e) {
      sendNotification({
        message: e,
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getCategory()
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
            <Typography variant='h5'>{id !== '' ? 'Edit a Category' : 'Create a Category'}</Typography>
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
          <Grid container spacing={2}>
            <Grid item lg={12} xl={12} xs={12} md={12} sm={12}>
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
                  label={'Category Name '}
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
                />
                <Grid container spacing={2}>
                  <Grid item lg={6} xl={6} xs={12} md={6} sm={12}>
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
                  </Grid>
                  <Grid item lg={6} xl={6} xs={6} md={12} sm={12}>
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
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarCategory
