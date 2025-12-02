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
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch, apiGet } from 'src/hooks/axios'
import {
  addTemplateListWA,
  baseURL,
  dropDownWATemp,
  dropDownWATempById,
  getCustomPushAdminFunctionList,
  getTemplatesByIdCallers,
  getTemplatesDropDownCallers,
  triggerWA,
  triggerWACallers,
  updateTempalateListWA
} from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { useSelector } from 'react-redux'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Link from 'src/@core/theme/overrides/link'
import { DropdownFilterPushContact } from 'src/@core/components/pushfilterdrop/filterpushcontact'

const validationSchema = yup.object().shape({
  family_name: yup.string().required('Family Name is required'),
  occasion_name: yup.string().required('Occasion is required'),
  name: yup.string().required('Name is required')
})

const PreviewWatemplateDrawer = ({ open, toggle, id, RowData, fetchTable, page,functionId }) => {
  const [uploading, setUploading] = useState(false)
  const [functiondrop, setfunctiondrop] = useState([])
  const [selectedFil, setSelectedFil] = useState('')
  const [tempData, setTempData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      //   if (id) {
      //     await apiPatch(`${updateTempalateListWA}?functionId=${functionId}&id=${id}`, { ...values })
      //     fetchTable()
      //     toast.success('Message updated successfully')
      //   } else {
      //     const res = await apiPost(`${addTemplateListWA}?functionId=${functionId}`, values) // adjust endpoint
      //     console.log(res)
      //     fetchTable()
      //     toast.success('Message created successfully')
      //   }
      toggle()
    } catch (err) {
      toast.error('Save failed')
    } finally {
      setSubmitting(false)
    }
  }
  const getFunctionList = async () => {
    try {
      // alert('in')
      const response = await apiGet(`${getTemplatesDropDownCallers}/${functionId}`)
      console.log('Custom Push Notification Mapping:', response.data)
      setfunctiondrop(response.data.data || [])
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const getFunctionListById = async () => {
    try {
    //   alert('in')
      const response = await apiGet(`${getTemplatesByIdCallers}?functionId=${functionId}&id=${selectedFil}`)
      console.log('Custom Push Notification Mapping temp:', response.data,response.data.data[0].fieldArray)
      setTempData(response.data.data[0].fields || {})
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const triggerWAFun = async () => {
    console.log('triggerWa ========>',`functionId=${functionId}&templateId=${selectedFil}&contactId=${RowData?.contact_id}&oid=${RowData.oid}`)
    setIsSubmitting(true)
    try {
      // alert('in')
      const response = await apiGet(
        `${triggerWACallers}?functionId=${functionId}&templateId=${selectedFil}&contactId=${RowData?.contact_id}&oid=${RowData?.oid}`
      )
      console.log('Custom Push Notification Mapping:', response.data)
      //   fetchData()
      setSelectedFil('')
      toggle()
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
      setIsSubmitting(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  // console.log()
  useEffect(() => {
    getFunctionList()
  }, [])

  useEffect(() => {
    if (selectedFil !== '') getFunctionListById()
    else setTempData({})
  }, [selectedFil])

  console.log('selectedFil------->', selectedFil, RowData)
  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } } }}
    >
      <Box sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>WA Message Template</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Accordion
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
            preview
          </AccordionSummary>

          <AccordionDetails>
            <DropdownFilterPushContact templates={functiondrop} passval={setSelectedFil} />

            <Box p={4} mx={4}>
              <p>
                Hello <b>{RowData?.name ?? ''}</b>,
              </p>
              <p>
                You have received an update from <b>{tempData.field_0 ?? ''}</b> regarding{' '}
                <b>{tempData?.field_1 ?? ''}</b>
              </p>
              <p>
                It relates to the upcoming <b>{tempData?.field_2 ?? ''}</b> for <b>{tempData?.field_3 ?? ''}</b>.
              </p>
              <p>Please open the link below to view or respond:</p>
              <p><b>{tempData?.field_4 ?? ''}</b></p>
              <p><b>{tempData?.field_5 ?? ''}</b></p>
              If you need help, just reply to this message.
              <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                <LoadingButton
                  variant='contained'
                  color='primary'
                  fullWidth
                  type='submit'
                  loading={isSubmitting}
                  disabled={selectedFil === ''}
                  onClick={() => {
                    triggerWAFun()
                    // setIsAdd(true)
                  }}
                >
                  Trigger
                </LoadingButton>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  )
}

export default PreviewWatemplateDrawer
