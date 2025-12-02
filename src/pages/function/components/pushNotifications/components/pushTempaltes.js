import { useEffect, useState } from 'react'
import * as yup from 'yup'
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPatch, apiPost, apiPut } from 'src/hooks/axios'
import { baseURL, mapTemplatesHrs, updatemessageHrs } from 'src/services/pathConst'

const PushNotificationTemplateDrawer = ({ open, toggle, id, RowData, fetchData }) => {
  console.log('adcfasd=-------->', open, toggle, id, RowData)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState([])

  const handleFileUpload = async (event, index) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const imageRes = await apiPost(`${baseURL}user/upload-doc`, formData, true)
      console.log(imageRes)
      if (imageRes?.data && imageRes?.data.detail.url) {
        handleMessageChange(index, 'banner_url', imageRes?.data.detail.url)
        toast.success(imageRes?.data.message)
      }
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleMessageChange = (index, field, value) => {
    const updated = [...messages]
    updated[index][field] = value
    setMessages(updated)
  }

  const handleMessageUpdate = async message => {
    try {
      console.log('Updating message:', message)
      await apiPatch(`${updatemessageHrs}`, message)
      toast.success(`${message.hrs_type} updated`)
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const handleToggleTime = async (id, msg) => {
    try {
      let body = {
        id: id,
        // [field]: value,
        type: msg.hrs_type,
        boolval: false
      }
      console.log('body', body)
      await apiPatch(mapTemplatesHrs, body)
      fetchData()
      toast.success('Updated successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }

  useEffect(() => {
    if (id !== '') {
      setMessages(RowData?.messages || [])
    }
  }, [id, RowData])

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{id !== '' ? 'Edit Template' : 'Create Template'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {messages.map((msg, index) => (
          <Accordion key={msg.message_id} sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between', // or 'flex-end' if you want right alignment
                  gap: 2,
                  mt: 2,
                  width: '100%',
                  alignItems: 'center'
                }}
              >
                <Typography>{msg.hrs_type}</Typography>
                <LoadingButton
                  variant='outlined'
                  onClick={() => {
                    // const fields = ['message_title', 'sub_heading', 'message_body', 'banner_url']
                    // fields.forEach(field =>
                    //   handleMessageChange(index, field, RowData?.messages?.[index]?.[field] || '')
                    // )
                    handleMessageChange(index, 'message_title', RowData?.messages?.[index]?.message_title || '')
                    handleMessageChange(index, 'sub_heading', RowData?.messages?.[index]?.sub_heading || '')
                    handleMessageChange(index, 'message_body', RowData?.messages?.[index]?.message_body || '')
                    handleMessageChange(index, 'banner_url', RowData?.messages?.[index]?.banner_url || '')
                    toggle()
                  }}
                >
                  Cancel
                </LoadingButton>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Message Title'
                value={msg.message_title}
                onChange={e => handleMessageChange(index, 'message_title', e.target.value)}
                required
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                label='Sub Heading'
                value={msg.sub_heading}
                onChange={e => handleMessageChange(index, 'sub_heading', e.target.value)}
              />
              <TextField
                fullWidth
                sx={{ my: 1 }}
                multiline
                rows={2}
                label='Body'
                value={msg.message_body}
                onChange={e => handleMessageChange(index, 'message_body', e.target.value)}
                required
              />
              <Box sx={{ my: 2 }}>
                <Typography variant='subtitle1' sx={{ mb: 1 }}>
                  Banner Image
                </Typography>
                {msg.banner_url ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={msg.banner_url}
                      alt='banner preview'
                      style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
                    />
                    <Button variant='outlined' component='label' disabled={uploading}>
                      Re-upload
                      <input
                        type='file'
                        hidden
                        accept='image/*'
                        onChange={e => handleFileUpload(e, index)} // pass index for this message
                      />
                    </Button>
                  </Box>
                ) : (
                  <Button variant='contained' component='label' disabled={uploading}>
                    Upload Banner
                    <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, index)} />
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <LoadingButton
                  variant='outlined'
                  color='error'
                  fullWidth
                  onClick={() => {
                    // handleMessageChange(index, 'message_title', RowData?.messages?.[index]?.message_title || '')
                    // handleMessageChange(index, 'sub_heading', RowData?.messages?.[index]?.sub_heading || '')
                    // handleMessageChange(index, 'message_body', RowData?.messages?.[index]?.message_body || '')
                    // handleMessageChange(index, 'banner_url', RowData?.messages?.[index]?.banner_url || '')
                    handleToggleTime(RowData.id, msg)
                  }}
                >
                  Remove
                </LoadingButton>
                <LoadingButton variant='contained' fullWidth onClick={() => handleMessageUpdate(msg)}>
                  Update {msg.hrs_type}
                </LoadingButton>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Drawer>
  )
}

export default PushNotificationTemplateDrawer
