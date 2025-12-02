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
  AccordionDetails,
  Tooltip,
  Grid2
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch, apiGet } from 'src/hooks/axios'
import { addTemplateListWA, getCallHistoryReasonById, patchTemplateInputList, postTemplateInputList, updateTempalateListWA, upsertInviteCallers } from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import { useSelector } from 'react-redux'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'


const CreateMessageRecordDrawerAdmin = ({ open, toggle, RowData, fetchTable,functionId }) => {
  // const { functionId } = useSelector(state => state.adminMod)

  // -----------------------
  // PREFILL DYNAMIC FIELDS
  // -----------------------
  const [editData,setEditData] = useState({})
  const [messageList,setMessageList] = useState([])


  const handleSubmit = async (values, { setSubmitting ,resetForm }) => {
    try {
      const payload = {
        id:editData?.id||null,
        call_history_id:RowData?.id, 
        msg : values.msg, 
        response: values.response
      }

      console.log('payload needed---->',payload)

        const res = await apiPost(`${upsertInviteCallers}`, payload)
        toast.success(res.data.message)
        getMessageList()
        setEditData({})
        resetForm()
    //   fetchTable()
    //   toggle()
    } catch (err) {
      toast.error(err)
    } finally {
      setSubmitting(false)
      
    }
  }

    const getMessageList = async () => {
    try {
        const res = await apiGet(`${getCallHistoryReasonById}?callid=${RowData?.id}`)
        toast.success(res.data.message)
        setMessageList(res.data.data||[])
    } catch (err) {
      toast.error(err)
    } finally {
    }
  }
 
  useEffect(()=>{
    // console
    if(RowData){
     getMessageList()
    }
  },[RowData])
  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } } }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{editData?.id ? 'Edit Template' : 'Create Template'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Formik
          initialValues={{
            msg: editData?.msg || '',
            response: editData?.response || '',
          }}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, handleChange, isSubmitting }) => (
            <Form>
               <Typography variant='h6' sx={{ mt: 2 }}>
                Message Passed
              </Typography>
              <TextField
                    fullWidth
                    label={`Message Passed`}
                    name={`msg`}
                    value={values.msg}
                    onChange={handleChange}
                    multiline
                    rows={4}
                  />
              <Typography variant='h6' sx={{ mt: 2 }}>
               Invitee's Response
              </Typography>
                <TextField
                    fullWidth
                    label={`Invitee's Response`}
                    name={`response`}
                    value={values.response}
                    onChange={handleChange}
                    multiline
                    rows={4}
                  />
            


              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <LoadingButton
                  variant='outlined'
                  fullWidth
                  onClick={toggle}
                  disabled={isSubmitting}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  variant='contained'
                  fullWidth
                  type='submit'
                  loading={isSubmitting}
                >
                  {editData.id ? 'Update' : 'Create'}
                </LoadingButton>
              </Box>
            </Form>
          )}
        </Formik>
        {messageList?.map((d,i)=>
            (<Accordion
          sx={{
            margin: '0.5rem 1.5rem !important',
            '& .MuiPaper-root.MuiAccordion-root.Mui-expanded': {
              margin: '0.5rem 1.5rem !important'
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Typography variant='h6' sx={{ mt: 2 }}>
                            Message Record {i+1}
              </Typography>
            <Tooltip title='Edit'>
              <IconButton
                onClick={() => {
                  setEditData(d)
                }}
                color='primary'
                sx={{ fontSize: '14px' }}
              >
                {' '}
                <Icon icon='tabler:pencil' color='primary' />
              </IconButton>
            </Tooltip>
            </Grid2>

          </AccordionSummary>

          <AccordionDetails>
            <Box p={4} mx={4}>
            <Typography variant='h6' sx={{ mt: 2 }}>
                <b>Message Passed</b>
              </Typography>
              <p>{d.msg}</p>
              <Typography variant='h6' sx={{ mt: 2 }}>
              <b>Invitee's Response</b> 
              </Typography>
              <p>{d.response}</p>
            </Box>
          </AccordionDetails>
        </Accordion>)
    )}
      </Box>
    </Drawer>
  )
}

export default CreateMessageRecordDrawerAdmin
