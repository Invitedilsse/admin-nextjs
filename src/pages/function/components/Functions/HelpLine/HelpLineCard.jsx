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
  InputAdornment,
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

function HelpLineCard({ ud, contriesList, memberData, handleExpand, index, handleJsonSubmit }) {
  const classes = useStyles()
  // const dispatch = useDispatch()
  // const { t } = useTranslation()
  // const { isMobile } = useViewport()
  // const [contriesList, setContriesList] = useState([]);
  // const { userData } = useSelector(state => state.user)
  const [showAddCard, setShowAddCard] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isMemberDetails, setIsMemberDetails] = useState(false)

  const toggleAddCard = () => setShowAddCard(!showAddCard)

  const formik = useFormik({
    initialValues: {
      name: '',
      number: '',
      designation: ''
    },
    validationSchema: yup.object({
      name: yup.string().min(2).max(50).required('Name is Required'),
      number: yup.string().min(4).required('Number is Required'),
      designation: yup.string().min(4).max(200).required('Designation is Required')
    }),
    onSubmit: async values => {
      console.log('values in card', values)
      const temp = {
        name: values.name,
        number: values.number,
        designation: values.designation
      }

      handleJsonSubmit(temp)
    }
  })

  useEffect(() => {
    // console.log('check ', memberData?.roles && memberData?.roles[0].toLowerCase().includes('user'))
    formik.setFieldValue('name', memberData?.name || '')
    formik.setFieldValue('number', memberData?.number || '')
    formik.setFieldValue('designation', memberData?.designation || '')
  }, [memberData])

  return (
    <Box
      sx={{
        my: 4
        // px: 4
      }}
    >
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
                helperText={formik.touched.designation && formik.errors.designation && formik.errors.designation}
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

export default HelpLineCard
