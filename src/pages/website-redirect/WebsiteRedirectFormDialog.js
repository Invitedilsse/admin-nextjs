// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { CameraAlt, Close, DeleteOutline } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'

// ** Form
import { useFormik } from 'formik'
import * as yup from 'yup'

// ** api hook
import { apiPost } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'

// NOTE: adjust these to match your actual `social_link` enum values in postgres.
const SOCIAL_LINK_OPTIONS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp', 'website']

// converts an ISO / timestamp string into the format <input type="date" /> expects
const toDateInputValue = value => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const validationSchema = yup.object({
  name: yup.string().trim().required('Name is required').min(3, 'Minimum 3 characters required').max(70, 'Maximum 70 characters allowed'),
  linkname_1: yup.string().nullable(),
  link_1: yup.string().nullable().url('Enter a valid URL'),
  active_from: yup.string().nullable(),
  active_till: yup
    .string()
    .nullable()
    .test('is-after', 'Active till must be after active from', function (value) {
      const { active_from } = this.parent
      if (!value || !active_from) return true
      return new Date(value) >= new Date(active_from)
    })
})

const WebsiteRedirectFormDialog = props => {
  // ** Props
  const { open, toggle, id, RowData, getAll } = props

  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const formik = useFormik({
    initialValues: {
      name: '',
      logo: null, // { key, url, file_name }
      is_active: true,
      linkname_1: '',
      link_1: '',
      active_from: '',
      active_till: ''
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        const payload = {
          ...(id ? { id } : {}),
          name: values.name,
          logo: values.logo || null,
          is_active: values.is_active,
          linkname_1: values.linkname_1 || null,
          link_1: values.link_1 || null,
          active_from: values.active_from ? new Date(`${values.active_from}T00:00:00`).toISOString() : null,
          active_till: values.active_till ? new Date(`${values.active_till}T23:59:00`).toISOString() : null
        }

        // Single upsert endpoint — backend decides insert vs update based on `id`.
        // Adjust the path below to match your actual route.
        const result = await apiPost(`${baseURL}ad/upsert-websiteredirect`, payload)

        toast.success(result?.data?.message || (id ? 'Website redirect updated' : 'Website redirect created'))
        toggle()
        setTimeout(() => {
          formik.resetForm()
        }, 300)
        getAll && getAll()
      } catch (e) {
        toast.error(e?.message || 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }
  })

  const handleClose = () => {
    toggle()
    formik.resetForm()
  }

  useEffect(() => {
    if (open) {
      if (id && RowData) {
        formik.setValues({
          name: RowData?.name || '',
          logo: RowData?.logo || null,
          is_active: RowData?.is_active ?? true,
          linkname_1: RowData?.linkname_1 || '',
          link_1: RowData?.link_1 || '',
          active_from: toDateInputValue(RowData?.active_from),
          active_till: toDateInputValue(RowData?.active_till)
        })
      } else {
        formik.resetForm()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id, RowData])

  // ── Logo upload — same flow as handleFileUploadNotification, storing the
  // full response JSON (key, url, file_name) into `logo`.
  const handleLogoUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiPost(`${baseURL}admin/upload-doc`, formData, true)
      if (res?.data?.detail?.url) {
        formik.setFieldValue('logo', res.data.detail)
        toast.success('Logo uploaded')
      }
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = null
    }
  }

  const removeLogo = () => {
    formik.setFieldValue('logo', null)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5'>{id ? 'Edit Website Redirect' : 'Create Website Redirect'}</Typography>
        <IconButton size='small' onClick={handleClose}>
          <Close fontSize='small' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12 }}>
            <Grid2 container justifyContent='center'>
              <input
                style={{ display: 'none' }}
                id='website-redirect-logo-input'
                type='file'
                accept='.jpg,.png,.jpeg,.webp'
                onChange={handleLogoUpload}
              />
              <label htmlFor='website-redirect-logo-input'>
                <Badge
                  overlap='circular'
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    formik.values.logo?.url ? (
                      <IconButton
                        component='span'
                        onClick={ev => {
                          ev.preventDefault()
                          removeLogo()
                        }}
                        sx={{ bgcolor: 'white', width: 22, height: 22, '&:hover': { bgcolor: 'grey.100' } }}
                      >
                        <DeleteOutline sx={{ color: 'black', width: 14, height: 14 }} />
                      </IconButton>
                    ) : (
                      <IconButton component='span' sx={{ bgcolor: 'white', width: 22, height: 22, '&:hover': { bgcolor: 'grey.100' } }}>
                        <CameraAlt sx={{ color: 'black', width: 14, height: 14 }} />
                      </IconButton>
                    )
                  }
                >
                  <Avatar
                    src={formik.values.logo?.url || 'NA'}
                    variant='rounded'
                    sx={{ width: 88, height: 88, cursor: 'pointer' }}
                  />
                </Badge>
              </label>
            </Grid2>
            {uploading && (
              <Typography variant='caption' display='block' textAlign='center' sx={{ mt: 1 }}>
                Uploading...
              </Typography>
            )}
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <TextField
              label='Name'
              required
              fullWidth
              name='name'
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Select
              fullWidth
              displayEmpty
              name='linkname_1'
              value={formik.values.linkname_1}
              onChange={formik.handleChange}
            >
              <MenuItem value=''>
                <em>Select platform</em>
              </MenuItem>
              {SOCIAL_LINK_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Link'
              fullWidth
              name='link_1'
              placeholder='https://...'
              value={formik.values.link_1}
              onChange={formik.handleChange}
              error={formik.touched.link_1 && Boolean(formik.errors.link_1)}
              helperText={formik.touched.link_1 && formik.errors.link_1}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Active From'
              type='date'
              fullWidth
              name='active_from'
              InputLabelProps={{ shrink: true }}
              value={formik.values.active_from}
              onChange={formik.handleChange}
              error={formik.touched.active_from && Boolean(formik.errors.active_from)}
              helperText={(formik.touched.active_from && formik.errors.active_from) || 'Starts at 00:00'}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Active Till'
              type='date'
              fullWidth
              name='active_till'
              InputLabelProps={{ shrink: true }}
              value={formik.values.active_till}
              onChange={formik.handleChange}
              error={formik.touched.active_till && Boolean(formik.errors.active_till)}
              helperText={(formik.touched.active_till && formik.errors.active_till) || 'Ends at 23:59'}
            />
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.is_active}
                  onChange={e => formik.setFieldValue('is_active', e.target.checked)}
                />
              }
              label='Active'
            />
          </Grid2>
        </Grid2>
      </DialogContent>

      <DialogActions sx={{ p: 4 }}>
        <Button variant='outlined' onClick={handleClose}>
          Cancel
        </Button>
        <LoadingButton loading={isLoading} variant='contained' onClick={formik.handleSubmit}>
          {id ? 'Update' : 'Create'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default WebsiteRedirectFormDialog