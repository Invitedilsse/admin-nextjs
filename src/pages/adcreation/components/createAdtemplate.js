import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Divider,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  MenuItem,
  Grid2
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { Formik, Form } from 'formik'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

const socialOptions = [
  'facebook',
  'instagram',
  'whatsapp',
  'telegram',
  'youtube',
  'x',
  'website',
  'google',
  'shop'
]

const CreateAdvertisement = ({ id, RowData, toggle ,fetchTable}) => {
  const [uploading, setUploading] = useState(false)

  // const handleFileUpload = async (event, values, setFieldValue) => {
  //   const file = event.target.files[0]
  //   if (!file) return

  //   try {
  //     setUploading(true)

  //     // ===========================
  //     // YOUR API UPLOAD HERE
  //     // ===========================
  //     const formData = new FormData()
  //           formData.append('file', file)
  //           const imageRes = await apiPost(`${baseURL}admin/upload-doc`, formData, true)
  //           console.log(imageRes)
  //           if (imageRes?.data && imageRes?.data.detail.url) {
  //             console.log('tempalte doc------------>', imageRes?.data)
  //             // if (type === 'template') setImageFile(imageRes?.data.detail.url)
  //             // toast.success(imageRes?.data.message)
  //           }

  //     const uploadedFile = {
  //       key: file.name,
  //       url: URL.createObjectURL(file),
  //       type: file.type.startsWith('image')
  //         ? 'image'
  //         : file.type.startsWith('audio')
  //         ? 'audio'
  //         : 'video',
  //       file_name: file.name
  //     }

  //     setFieldValue('files', [...values.files, uploadedFile])

  //     toast.success('File uploaded')
  //   } catch (err) {
  //     toast.error('Upload failed')
  //   } finally {
  //     setUploading(false)
  //   }
  // }

  const handleFileUpload = async (event, values, setFieldValue) => {
  const selectedFiles = Array.from(event.target.files)

  if (!selectedFiles?.length) return

  try {
    setUploading(true)

    const uploadedFiles = []

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('file', file)

      // =========================
      // API CALL
      // =========================
      const res = await apiPost(
        `${baseURL}admin/upload-doc`,
        formData,
        true
      )

      const data = res?.data?.detail || res?.data

      // =========================
      // FILE TYPE
      // =========================
      let fileType = 'file'

      if (file.type.startsWith('image')) {
        fileType = 'image'
      } else if (file.type.startsWith('audio')) {
        fileType = 'audio'
      } else if (file.type.startsWith('video')) {
        fileType = 'video'
      }

      // =========================
      // FINAL OBJECT
      // =========================
      uploadedFiles.push({
        key: data?.key,
        url: data?.url,
        type: fileType,
        file_name: data?.file_name
      })
    }

    setFieldValue('files', [
      ...values.files,
      ...uploadedFiles
    ])

    toast.success('Files uploaded successfully')
  } catch (err) {
    console.log(err)
    toast.error('Upload failed')
  } finally {
    setUploading(false)
  }
}

  const handleSubmit = async values => {
    try {
      const payload = !id ?{
        name: values.name,
        header: values.header,
        body: values.body,
        footer: values.footer,
        is_active: values.is_active,
        files: values.files,
        contact_us: values.contact_us,
        linkname_1: values.linkname_1 === ''? null : values.linkname_1,
        link_1: values.link_1 === ''? null : values.link_1,
        linkname_2: values.linkname_2 === ''? null : values.linkname_2,
        link_2: values.link_2 === ''? null : values.link_2
      }:{
        id,
        name: values.name,
        header: values.header,
        body: values.body,
        footer: values.footer,
        is_active: values.is_active,
        files: values.files,
        contact_us: values.contact_us,
        linkname_1: values.linkname_1 === ''? null : values.linkname_1,
        link_1: values.link_1 === ''? null : values.link_1,
        linkname_2: values.linkname_2 === ''? null : values.linkname_2,
        link_2: values.link_2 === ''? null : values.link_2
      }

      console.log(payload)
      const res = await apiPost(
          `${baseURL}ad/upsert-advertisment`,
          payload
        )
        console.log("res----->",res.data)
        if(res?.status === 200){
          toast.success(id ? 'Updated Successfully' : 'Created Successfully')
          fetchTable()
          toggle()
        }

    } catch (err) {
      console.log(err)
      toast.error('Something went wrong')
    }
  }

  return (
    <Grid2 container spacing={6}>
      <Grid2 xs={12}>
        <Card sx={{ width: '100%', boxShadow: 'rgba(0,0,0,0.2) 0px 0px 3px 0px' }}>
          <Divider sx={{ m: '0 !important' }} />

          <CardContent>
            <Box sx={{ p: 4 }}>
              <Typography variant='h5'>
                {id ? 'Edit Advertisement' : 'Create Advertisement'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Formik
                initialValues={{
                  name: RowData?.name || '',
                  header: RowData?.header || '',
                  body: RowData?.body || '',
                  footer: RowData?.footer || '',
                  is_active: RowData?.is_active ?? true,
                  files: RowData?.files || [],
                  contact_us: RowData?.contact_us || '',
                  linkname_1: RowData?.linkname_1 || '',
                  link_1: RowData?.link_1 || '',
                  linkname_2: RowData?.linkname_2 || '',
                  link_2: RowData?.link_2 || ''
                }}
                enableReinitialize
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  handleChange,
                  setFieldValue,
                  isSubmitting
                }) => (
                  <Form>
                    {/* ================= BASIC DETAILS ================= */}

                    <Typography variant='h6'>
                      Advertisement Details
                    </Typography>

                    <TextField
                      fullWidth
                      label='Name'
                      name='name'
                      value={values.name}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    <TextField
                      fullWidth
                      label='Header'
                      name='header'
                      value={values.header}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label='Body'
                      name='body'
                      value={values.body}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    <TextField
                      fullWidth
                      label='Footer'
                      name='footer'
                      value={values.footer}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    {/* ================= ACTIVE SWITCH ================= */}

                    <Box sx={{ mt: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.is_active}
                            onChange={e =>
                              setFieldValue(
                                'is_active',
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={
                          values.is_active ? 'Active' : 'Inactive'
                        }
                      />
                    </Box>

                    {/* ================= FILE UPLOAD ================= */}

                    <Typography variant='h6' sx={{ mt: 4 }}>
                      Upload Files
                    </Typography>

                    <Button
                      variant='outlined'
                      component='label'
                      sx={{ mt: 2 }}
                      disabled={uploading}
                    >
                      Upload Files

                      <input
                        hidden
                        type='file'
                        multiple
                        accept='image/*,audio/*,video/*'
                        onChange={e =>
                          handleFileUpload(
                            e,
                            values,
                            setFieldValue
                          )
                        }
                      />
                    </Button>

                    {/* ================= FILE PREVIEW ================= */}

                    <Grid2 container spacing={2} sx={{ mt: 2 }}>
                      {values.files.map((file, index) => (
                        <Grid2 key={index}>
                          <Box
                            sx={{
                              border: '1px solid #ddd',
                              borderRadius: 2,
                              p: 1,
                              position: 'relative'
                            }}
                          >
                            <IconButton
                              size='small'
                              color='error'
                              sx={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                background: '#fff'
                              }}
                              onClick={() => {
                                const updated =
                                  values.files.filter(
                                    (_, i) => i !== index
                                  )

                                setFieldValue(
                                  'files',
                                  updated
                                )
                              }}
                            >
                              <Icon icon='tabler:x' />
                            </IconButton>

                            {file.type === 'image' ? (
                              <img
                                src={file.url}
                                alt='preview'
                                width={120}
                                height={120}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: 8
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 120,
                                  height: 120,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#f5f5f5',
                                  borderRadius: 2
                                }}
                              >
                                <Typography variant='body2'>
                                  {file.type}
                                </Typography>
                              </Box>
                            )}

                            <Typography
                              variant='caption'
                              display='block'
                              sx={{ mt: 1 }}
                            >
                              {file.file_name}
                            </Typography>
                          </Box>
                        </Grid2>
                      ))}
                    </Grid2>

                    {/* ================= CONTACT ================= */}

                    <Typography variant='h6' sx={{ mt: 4 }}>
                      Contact Details
                    </Typography>

                    <TextField
                      fullWidth
                      label='Contact Number'
                      name='contact_us'
                      value={values.contact_us}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    {/* ================= LINK 1 ================= */}

                    <Typography variant='h6' sx={{ mt: 4 }}>
                      Social Links
                    </Typography>

                    <TextField
                      select
                      fullWidth
                      label='Link Name 1'
                      name='linkname_1'
                      value={values.linkname_1}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    >
                      {socialOptions.map(item => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      label='Link 1'
                      name='link_1'
                      value={values.link_1}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    {/* ================= LINK 2 ================= */}

                    <TextField
                      select
                      fullWidth
                      label='Link Name 2'
                      name='linkname_2'
                      value={values.linkname_2}
                      onChange={handleChange}
                      sx={{ mt: 3 }}
                    >
                      {socialOptions.map(item => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      label='Link 2'
                      name='link_2'
                      value={values.link_2}
                      onChange={handleChange}
                      sx={{ mt: 2 }}
                    />

                    {/* ================= ACTION BUTTONS ================= */}

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mt: 5
                      }}
                    >
                      <LoadingButton
                        fullWidth
                        variant='outlined'
                        onClick={toggle}
                      >
                        Cancel
                      </LoadingButton>

                      <LoadingButton
                        fullWidth
                        variant='contained'
                        type='submit'
                        loading={isSubmitting}
                      >
                        {id ? 'Update' : 'Create'}
                      </LoadingButton>
                    </Box>
                  </Form>
                )}
              </Formik>
            </Box>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  )
}

export default CreateAdvertisement