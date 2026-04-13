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
  FormControl,
  Select,
  MenuItem,
  Grid2,
  Card,
  CardContent
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiPatch, apiGetwithCustomToken, apiPostWithCustomToken } from 'src/hooks/axios'
import {
  addTemplateListWA,
  baseURL,
  patchTemplateInputList,
  postTemplateInputList,
  updateTempalateListWA
} from 'src/services/pathConst'
import { Formik, Form } from 'formik'
import { useSelector } from 'react-redux'
import { AsyncPaginate } from 'react-select-async-paginate'
import CreatableSelect from 'react-select/creatable'
import { Campaign } from '@mui/icons-material'
import dayjs from 'dayjs';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


const CreateTemplateCampaign = ({ open, toggle, id, RowData, fetchTable, functionId }) => {
  const baseBluewaabaURL = process.env.BLUEWAABA_URL
  const baseBluewaabaToken = process.env.BLUEWAABA_TOKEN
  const [templates, setTemplates] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [templateDetails, setTemplatesDetails] = useState({})
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [templateHeaderImgComp, setTemplateHeaderImgComp] = useState(null)
  const [templateBodyComp, setTemplateBodyComp] = useState(null)
  const [templateBodyInpCount, setTemplateBodyInpCount] = useState(null)
  const dynamicFieldOptions = [
    { label: 'contact full name', value: '{full_name}' },
    { label: 'contact first name', value: '{first_name}' },
    { label: 'contact Last name', value: '{last_name}' },
    { label: 'contact Phone', value: '{wa_id}' },
    { label: 'language code', value: '{language_code}' },
    { label: 'contact country', value: '{contact_country}' },
    { label: 'contact Email', value: '{contact_email}' },
    { label: 'OTP', value: '{custom_field_7}' },
    { label: 'Host name', value: '{custom_field_8}' },
    { label: 'occasion', value: '{custom_field_9}' },
    { label: 'function name', value: '{custom_field_10}' },
    { label: 'link', value: '{custom_field_11}' },
    { label: 'link2', value: '{custom_field_12}' },
    { label: 'lnvitation', value: '{custom_field_13}' }
  ]
  const [scheduleType, setScheduleType] = useState('now'); // 'now' | 'later'
  const [scheduleDate, setScheduleDate] = useState(null);
  const [expireType, setexpireType] = useState('no'); // 'now' | 'later'
  const [expireDate, setExpireDate] = useState(null);


  // const [contactDetails, setcontactDetails] = useState({})
  const timezones = Intl.supportedValuesOf('timeZone');
  

    const timezoneOptions = timezones.map(tz => ({
      label: tz,
      value: tz
    }));

  const fetchTemplates = async (pageNo = 1) => {
    try {
      setLoading(true)

      // Replace with your API
      const response = await apiGetwithCustomToken(
        `${baseBluewaabaURL}/contact/template-list?page=${page}`,
        baseBluewaabaToken
      )

      console.log('bluewwaba Templates:', response?.data?.data, response?.data?.data?.templateList?.data)

      if (pageNo === 1) {
        setTemplates(response?.data?.data?.templateList?.data)
      } else {
        setTemplates(prev => [...prev, ...response?.data?.data?.templateList?.data])
      }

      setHasMore(response?.data?.data?.templateList?.current_page <= response?.data?.data?.templateList?.current_page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtertemplateDetails = async id => {
    // const details = templates.find(item=>item._uid === id)
    const response = await apiGetwithCustomToken(
      `${baseBluewaabaURL}/contact/get-template-details/${id}`,
      baseBluewaabaToken
    )
    console.log(
      'details of selecte temp----->',
      response.data?.data,
      response?.data?.data?.__data?.template?.components?.filter(item => item.type === 'BODY')[0]?.example?.body_text
        ?.length
    )
    setTemplatesDetails(response?.data?.data)
    setTemplateHeaderImgComp(
      response?.data?.data?.__data?.template?.components?.find(
        item => item.type === 'HEADER' && item.format === 'IMAGE'
      ) || null
    )
    setTemplateBodyComp(response?.data?.data?.__data?.template?.components?.find(item => item.type === 'BODY') || null)
    setTemplateBodyInpCount(
      response?.data?.data?.__data?.template?.components?.filter(item => item.type === 'BODY')[0]?.example
        ?.body_text?.[0]?.length || 0
    )
  }

  const handleFileUpload = async (event, type, index) => {
    const file = event.target.files[0]
    if (!file) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const imageRes = await apiPost(`${baseURL}admin/upload-doc`, formData, true)
      console.log(imageRes)
      if (imageRes?.data && imageRes?.data.detail.url) {
        console.log('tempalte doc------------>', imageRes?.data.detail)
        if (type === 'template') setImageFile(imageRes?.data.detail.url)
        toast.success(imageRes?.data.message)
      }
    } catch (err) {
      console.log(err)
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    fetchTemplates(page)
  }, [page])

  const [formData, setFormData] = useState({
    template_name: '',
    campaign_title: '',
    contact_group: [],
    timezone:'',
    schedule_at:'',
    expire_at:''
  })

  const [errors, setErrors] = useState({})

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async() => {
    let newErrors = {}

    // ✅ Required: Template Name
    if (!formData.template_name) {
      newErrors.template_name = 'Template is required'
    }

    // ✅ Required: Header Image
    if (templateHeaderImgComp && !imageFile) {
      newErrors.image = 'Header image is required'
    }

    // ✅ Required: Dynamic Fields
    for (let i = 1; i <= templateBodyInpCount; i++) {
      if (!formData[`field_${i}`]) {
        newErrors[`field_${i}`] = `Field {{${i}}} is required`
      }
    }

     if (!formData.contact_group) {
      newErrors.contact_group = 'contact group is required'
    }
      if (!formData.campaign_title) {
      newErrors.campaign_title = 'Campaign title is required'
    }

    if(scheduleType === 'later' && !formData.timezone){
      newErrors.timezone = 'Timezone is required'
      newErrors.schedule_at = 'Schedule time is required'
    }

      if(expireType === 'yes' && !formData.expire_at){
      newErrors.expire_at = 'Expiry time is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    console.log('FINAL PAYLOAD:', formData)
    try{
     const data = 
      {
          "template_name": templateDetails.template_name,
          "template_language": templateDetails?.language,
          "title":formData.campaign_title,
           "header_image": imageFile,
          //need to chnages contacr group from array to
          "contact_group": formData.contact_group[0],
          "timezone": formData.timezone === '' ? 'Asia/Kolkata':formData.timezone,
          "schedule_at": "",
          "expire_at": "",
          "field_1": "{full_name}",
          "field_2": "this is test from web",
          "field_3": "office alwarpet",
          "field_4": "nothing just test",
          "field_5": "abdulkalam"
      }
     
     const response = await apiPostWithCustomToken(
        `${baseBluewaabaURL}/campaign/schedule`,data,
        baseBluewaabaToken
      )
      console.log("Schedule response:",response)
      if(response.status==200 && response.data.data.campaignUid){
        toast.success('Campaign scheduled successfully')
        toggle()
      }
    }catch(err){
      console.error('Error scheduling campaign:',err)
      toast.error('Failed to send campaign messages')
    }
  }

  //   const highlightVariables = text => {
  //     const parts = text.split(/(\{\{\d+\}\})/g)

  //     return parts.map((part, index) =>
  //       /\{\{\d+\}\}/.test(part) ? (
  //         <span key={index} style={{ color: '#25D366', fontWeight: 600 }}>
  //           {part}
  //         </span>
  //       ) : (
  //         part
  //       )
  //     )
  //   }

  const renderTemplateWithValues = (text, values) => {
    if (!text) return null

    const parts = text.split(/(\{\{\d+\}\})/g)

    return parts.map((part, index) => {
      const match = part.match(/\{\{(\d+)\}\}/)

      if (match) {
        const fieldIndex = match[1] // "1", "2"
        const fieldValue = values[`field_${fieldIndex}`]

        return (
          <span
            key={index}
            style={{
              color: fieldValue ? '#000' : '#25D366',
              fontWeight: 600
            }}
          >
            {fieldValue || part}
          </span>
        )
      }

      return part
    })
  }

  const loadTemplateOptions = async (inputValue, loadedOptions, { page }) => {
    try {
      const response = await apiGetwithCustomToken(
        `${baseBluewaabaURL}/contact/template-list?page=${page}&search=${inputValue}`,
        baseBluewaabaToken
      )

      const data = response?.data?.data?.templateList?.data || []

      const options = data.map(item => ({
        label: item.template_name,
        value: item._id,
        raw: item
      }))

      return {
        options,
        hasMore: data.length > 0,
        additional: {
          page: page + 1
        }
      }
    } catch (err) {
      console.error(err)
      return {
        options: [],
        hasMore: false
      }
    }
  }

  const loadTemplateOptionscontacts = async (inputValue, loadedOptions, { page }) => {
    try {
      const response = await apiGetwithCustomToken(
        `${baseBluewaabaURL}/contact/groups?page=${page}&search=${inputValue}`,
        baseBluewaabaToken
      )

      const data = response?.data?.data?.contactList?.data || []
      const lastPage = response?.data?.data?.contactList?.last_page
      const options = data.map(item => ({
        label: item.title,
        value: item.title
        // raw: item,
      }))

      return {
        options,
        hasMore: lastPage > 1,
        additional: {
          page: page + 1
        }
      }
    } catch (err) {
      console.error(err)
      return {
        options: [],
        hasMore: false
      }
    }
  }

  return (
    <>
      <Box sx={{ p: 4 }}>
        {/* HEADER */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>{id ? 'Edit Template' : 'Create Template'}</Typography>
          <IconButton onClick={toggle}>
            <Icon icon='tabler:x' />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* TEMPLATE SELECT */}
        <Typography variant='h6'>Template</Typography>

        {/* <FormControl fullWidth size="small" sx={{ mt: 1 }}>
    <Select
      value={formData.template_name}
      onChange={(e) => {
        const selectedId = e.target.value;
        handleChange('template_name', selectedId);

        if (selectedId) {
          filtertemplateDetails(selectedId);
        }
      }}
      displayEmpty
    >
      <MenuItem value="">Select Template</MenuItem>

      {templates.map((item) => (
        <MenuItem key={item._uid} value={item._id}>
          {item.template_name}
        </MenuItem>
      ))}
    </Select>
  </FormControl> */}

        <AsyncPaginate
          value={
            formData.template_name
              ? {
                  label: templateDetails?.template_name,
                  value: formData.template_name
                }
              : null
          }
          loadOptions={loadTemplateOptions}
          onChange={selected => {
            handleChange('template_name', selected?.value || '')

            if (selected?.value) {
              filtertemplateDetails(selected.value)
            }
          }}
          additional={{
            page: 1
          }}
          placeholder='Search Template...'
          isClearable
        />

        {errors.template_name && <Typography color='error'>{errors.template_name}</Typography>}

        {/* MAIN UI */}
        {formData.template_name && (
          <Grid2 container spacing={2} mt={2} alignItems='stretch'>
            {/* LEFT → 75% */}
            <Grid2 xs={12} md={9}>
              <Card
                sx={{
                  p: 2,
                  flex: 1, // 🔥 fills full height
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '600px !important',
                  minHeight: '900px !important',
                  padding:'20px'
                }}
              >
                <Typography fontWeight={600}>Template Details</Typography>

                <Typography>Name: {templateDetails?.template_name}</Typography>
                <Typography>Language: {templateDetails?.language}</Typography>
                <Typography>Category: {templateDetails?.category}</Typography>

                {/* HEADER IMAGE */}
                {templateHeaderImgComp && (
                  <Box mt={3}>
                    <Typography fontWeight={600}>Header Image</Typography>

                    <Button variant='outlined' component='label' sx={{ mt: 1 }}>
                      Upload Image
                      <input type='file' hidden accept='image/*' onChange={e => handleFileUpload(e, 'template')} />
                    </Button>

                    {errors.image && <Typography color='error'>{errors.image}</Typography>}

                    {imageFile && (
                      <Box mt={2}>
                        <img src={imageFile} width={120} />
                      </Box>
                    )}
                  </Box>
                )}

                {/* INPUT FIELDS */}
                {/* {templateBodyComp && (
            <Box mt={4}>
              <Typography fontWeight={600} mb={2}>
                Body Variables
              </Typography>

              {Array.from({ length: templateBodyInpCount }, (_, i) => {
                const fieldKey = `field_${i + 1}`;

                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 2,
                      alignItems: 'center'
                    }}
                  >
                    <Typography sx={{ minWidth: 50 }}>
                      {`{{${i + 1}}}`}
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Enter value`}
                      value={formData[fieldKey] || ''}
                      onChange={(e) =>
                        handleChange(fieldKey, e.target.value)
                      }
                      error={!!errors[fieldKey]}
                      helperText={errors[fieldKey]}
                    />
                  </Box>
                );
              })}
            </Box>
          )} */}

                {templateBodyComp && (
                  <Box mt={4}>
                    <Typography fontWeight={600} mb={2}>
                      Body Variables
                    </Typography>

                    {Array.from({ length: templateBodyInpCount }, (_, i) => {
                      const fieldKey = `field_${i + 1}`

                      return (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            mb: 2,
                            alignItems: 'center'
                          }}
                        >
                          {/* Label */}
                          <Typography sx={{ minWidth: 50 }}>{`{{${i + 1}}}`}</Typography>

                          {/* Creatable Select */}
                          <Box sx={{ flex: 1 }}>
                            <CreatableSelect
                              isClearable
                              placeholder={`Choose or type value`}
                              value={
                                formData[fieldKey] ? { label: formData[fieldKey], value: formData[fieldKey] } : null
                              }
                              onChange={selected => {
                                handleChange(fieldKey, selected?.value || '')
                              }}
                              options={dynamicFieldOptions}
                              styles={{
                                control: base => ({
                                  ...base,
                                  minHeight: 40,
                                  borderColor: errors[fieldKey] ? 'red' : base.borderColor
                                }),
                                menuList: base => ({
                                  ...base,
                                  maxHeight: 150, // 🔥 control dropdown height
                                  overflowY: 'auto'
                                })
                              }}
                            />

                            {/* Error */}
                            {errors[fieldKey] && (
                              <Typography variant='caption' color='error'>
                                {errors[fieldKey]}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
                <Box m={4}>
                  <Typography sx={{ minWidth: 50 }}>Campaign Title</Typography>

                  <TextField
                    fullWidth
                    size='small'
                    placeholder={`Enter value`}
                    value={formData.campaign_title || ''}
                    onChange={e => handleChange('campaign_title', e.target.value)}
                    error={!!errors.campaign_title}
                    helperText={errors.campaign_title}
                  />
                </Box>
                <Box m={4}>
                  <AsyncPaginate
                    isMulti   // 🔥 IMPORTANT

                    value={
                      formData.contact_group?.map(item => ({
                        label: item,
                        value: item
                      })) || []
                    }

                    loadOptions={loadTemplateOptionscontacts}

                    onChange={(selected) => {
                      const values = selected ? selected.map(item => item.value) : [];
                      handleChange('contact_group', values);
                    }}

                    additional={{
                      page: 1
                    }}

                    placeholder="Search Contact Group..."
                    isClearable

                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: 40,
                        borderColor: errors.contact_group ? 'red' : base.borderColor
                      }),

                      menuList: (base) => ({
                        ...base,
                        maxHeight: 150,
                        overflowY: 'auto'
                      })
                    }}
                  />
                </Box>
               

              <Typography sx={{ minWidth: 50 , margin:'10px'}}>Schedule</Typography>

                <Box
                  sx={{
                    display: 'flex',
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: 'fit-content',
                    border: '1px solid #ddd'
                  }}
                  mb={4}
                >

                  {/* NOW */}
                  <Box
                    onClick={() =>{ 
                      setScheduleType('now')
                      handleChange('timezone','')
                      handleChange('schedule_at','')
                      setScheduleDate(null)
                    }}
                    sx={{
                      px: 3,
                      py: 1,
                      cursor: 'pointer',
                      backgroundColor: scheduleType === 'now' ? '#2ecc71' : '#f5f5f5',
                      color: scheduleType === 'now' ? '#fff' : '#555',
                      fontWeight: 600,
                      transition: '0.3s'
                    }}
                  >
                    Now
                  </Box>

                  {/* LATER */}
                  <Box
                    onClick={() => setScheduleType('later')}
                    sx={{
                      px: 3,
                      py: 1,
                      cursor: 'pointer',
                      backgroundColor: scheduleType === 'later' ? '#f39c12' : '#f5f5f5',
                      color: scheduleType === 'later' ? '#fff' : '#555',
                      fontWeight: 600,
                      transition: '0.3s'
                    }}
                  >
                    Later
                  </Box>
                </Box>
               {scheduleType === 'later' && ( 
                <>
                <Box m={4}>
                  <CreatableSelect
                      placeholder="Select Timezone"
                      options={timezoneOptions}

                      value={
                        formData.timezone
                          ? { label: formData.timezone, value: formData.timezone }
                          : null
                      }

                      onChange={(selected) => {
                        handleChange('timezone', selected?.value == 'Asia/Calcutta' ? 'Asia/Kolkata' : selected?.value || '');
                      }}

                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: 40,
                          borderColor: errors.timezone ? 'red' : base.borderColor
                        }),
                        menuList: (base) => ({
                          ...base,
                          maxHeight: 200,
                          overflowY: 'auto'
                        })
                      }}
                    />
                </Box>
                {/* <Box m={4}> */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Schedule Date & Time"
                  value={scheduleDate}
                  onChange={(newValue) => {
                    setScheduleDate(newValue);

                    if (newValue) {
                      // 🔥 Convert to 24-hour format
                      const formatted = dayjs(newValue).format('YYYY-MM-DDTHH:mm');

                      handleChange('schedule_at', formatted);
                    }
                  }}

                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: !!errors.schedule_at,
                      helperText: errors.schedule_at
                    }
                  }}

                  ampm   // ✅ enables AM/PM UI
                />
              </LocalizationProvider>
              {/* </Box> */}
                </>
              )}

                 <Typography sx={{ minWidth: 50 , margin:'10px'}}>Expiry</Typography>

                <Box
                  sx={{
                    display: 'flex',
                    borderRadius: 2,
                    overflow: 'hidden',
                    width: 'fit-content',
                    border: '1px solid #ddd'
                  }}
                  mb={4}
                >

                  {/* NOW */}
                  <Box
                    onClick={() =>{ 
                      setexpireType('no')
                      handleChange('expire_at','')
                      setExpireDate(null)
                    }}
                    sx={{
                      px: 3,
                      py: 1,
                      cursor: 'pointer',
                      backgroundColor: expireType === 'no' ? '#2ecc71' : '#f5f5f5',
                      color: expireType === 'no' ? '#fff' : '#555',
                      fontWeight: 600,
                      transition: '0.3s'
                    }}
                  >
                    No
                  </Box>

                  {/* LATER */}
                  <Box
                    onClick={() => setexpireType('yes')}
                    sx={{
                      px: 3,
                      py: 1,
                      cursor: 'pointer',
                      backgroundColor: expireType === 'yes' ? '#f39c12' : '#f5f5f5',
                      color: expireType === 'yes' ? '#fff' : '#555',
                      fontWeight: 600,
                      transition: '0.3s'
                    }}
                  >
                    yes
                  </Box>
                </Box>
               {expireType === 'yes' && ( 
                <>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Expiry Date & Time"
                  value={expireDate}
                  onChange={(newValue) => {
                    setExpireDate(newValue);

                    if (newValue) {
                      // 🔥 Convert to 24-hour format
                      const formatted = dayjs(newValue).format('YYYY-MM-DDTHH:mm');

                      handleChange('expire_at', formatted);
                    }
                  }}

                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: !!errors.expire_at,
                      helperText: errors.expire_at
                    }
                  }}

                  ampm   // ✅ enables AM/PM UI
                />
              </LocalizationProvider>
                </>
              )}
              </Card>
            </Grid2>

            {/* RIGHT → 25% */}
            <Grid2 xs={12} md={3}>
              <Card
                sx={{
                  p: 2,
                  flex: 1, // 🔥 same height as left
                  background: '#ece5dd',
                  // display: 'flex',
                  // flexDirection: 'column',
                  // position: 'sticky',
                  minWidth: '400px !important',
                  maxWidth:'450px !important',
                  top: 20
                }}
              >
                <Typography fontWeight={600}>Message Preview</Typography>

                <Box sx={{ background: '#fff', borderRadius: 2, mt: 2 }}>
                  {templateHeaderImgComp && (
                    <Box
                      component='img'
                      src={imageFile || templateHeaderImgComp?.example?.header_handle?.[0]}
                      sx={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                  )}

                  {templateBodyComp && (
                    <Box p={2}>
                      <Typography sx={{ whiteSpace: 'pre-line' }}>
                        {renderTemplateWithValues(templateBodyComp?.text, formData)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
              <Card
                sx={{
                  p: 2,
                  flex: 1, 
                  background: '#ece5dd',
                  minWidth: '400px !important',
                  maxWidth:'450px !important',
                  top: 20
                }}
              >
                <Box mt={2}>
                <Typography fontWeight={600}>Campaign title</Typography>
                <Typography fontWeight={600}>{formData.campaign_title}</Typography>
                </Box>
                <Box mt={2}>
                <Typography fontWeight={600}>Contact Group</Typography>
                <Typography fontWeight={600}>{formData.contact_group}</Typography>
                </Box>
               {scheduleType === 'later' &&(
                <>
                <Box mt={2}>
                <Typography fontWeight={600}>Timezone</Typography>
                <Typography fontWeight={600}>{formData.timezone}</Typography>
                </Box>
                <Box mt={2}>
                <Typography fontWeight={600}>Schedule Time</Typography>
                <Typography fontWeight={600}>{formData.schedule_at}</Typography>
                </Box>
                </>
                )}

                {expireType === 'yes' &&(
                <>
                <Box mt={2}>
                <Typography fontWeight={600}>Expiry Time</Typography>
                <Typography fontWeight={600}>{formData.expire_at}</Typography>
                </Box>
                </>
                )}

                 
              </Card>
            </Grid2>
          </Grid2>
        )}

        {/* ACTIONS */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <LoadingButton variant='outlined' fullWidth onClick={toggle}>
            Cancel
          </LoadingButton>

          <LoadingButton variant='contained' fullWidth onClick={handleSubmit}>
            Submit
          </LoadingButton>
        </Box>
      </Box>
    </>
  )
}

export default CreateTemplateCampaign
