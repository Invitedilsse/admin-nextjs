import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, TextField, IconButton, Divider, Button,
  Card, CardContent, Switch, FormControlLabel, MenuItem,
  Grid2, Accordion, AccordionSummary, AccordionDetails,
  Chip, Tooltip, CircularProgress, Alert, Avatar, Badge
} from '@mui/material'
import { CameraAlt } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Formik, Form } from 'formik'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { apiPost, apiGet, apiDelete } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import ImageUpload from 'src/hooks/ImageUpload'
import { HexColorPicker } from 'react-colorful'

// ─── Constants ────────────────────────────────────────────────────────────────

const socialOptions = [
  'facebook', 'instagram', 'whatsapp', 'telegram',
  'youtube', 'x', 'website', 'google', 'shop'
]

const AD_DISPLAY_TYPES = [
  { value: 'standard',   label: 'Standard'    },
  { value: 'popup',      label: 'Popup'       },
  { value: 'video',      label: 'Video'       },
  { value: 'banner',     label: 'Banner'      },
  { value: 'fullscreen', label: 'Full Screen' },
]

const EMPTY_RULE = {
  page_name: '', slot_name: '', priority: 0,
  min_interval_seconds: 0, max_shows_per_user: 0,
  max_shows_per_day: 0, max_shows_per_session: 0,
  start_at: '', end_at: '', is_enabled: true
}

const DEFAULT_UI_CONFIG = {
  text_color:        '#111111',
  // body_color:        '#444444',
  // footer_color:      '#666666',
  button_bg_color:   '#FF6B00',
  button_text_color: '#FFFFFF',
  // card_bg_color:     '#FFFFFF',
  // border_color:      '#E5E7EB'
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CreateAdvertisement = ({ id, RowData, toggle, fetchTable }) => {
  // ── Loading states ─────────────────────────────────────────────────────────
  const [uploading,    setUploading]    = useState(false)
  const [rulesLoading, setRulesLoading] = useState(false)
  const [initialRules, setInitialRules] = useState([])

  // ── Logo states ────────────────────────────────────────────────────────────
  const fileInputRef      = useRef()
  const [logoFormData,    setLogoFormData]    = useState(null)
  const [openImageEdit,   setOpenImageEdit]   = useState(false)
  const [cropImage,       setCropImage]       = useState(undefined)
  const [cropType,        setCropType]        = useState('logo')
  const [cropAspectRatio, setCropAspectRatio] = useState(1 / 1)
  const [isPreview,       setIsPreview]       = useState(true)

  // ── Fetch existing rules when editing ──────────────────────────────────────
  useEffect(() => {
    if (id) fetchExistingRules()
    else    setInitialRules([])
  }, [id])

  const fetchExistingRules = async () => {
    setRulesLoading(true)
    try {
      const res = await apiGet(`${baseURL}ad/list-advertisment-rules?ad_id=${id}&limit=100`)
      setInitialRules(res?.data?.data || [])
    } catch {
      toast.error('Could not load targeting rules')
    } finally {
      setRulesLoading(false)
    }
  }

  // ── Logo handlers ──────────────────────────────────────────────────────────
  const onFileInputChange = e => {
    e.preventDefault()
    const files = e.target?.files
    if (!files?.length) return
    if (files[0].size > 5000000) { toast.error('File size should be below 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      setCropImage(reader.result)
      setIsPreview(false)
      setOpenImageEdit(true)
      e.target.value = null
    }
    reader.readAsDataURL(files[0])
  }

  const handleEditLogo = () => {
    setIsPreview(true)
    setCropAspectRatio(1 / 1)
    setCropType('logo')
    fileInputRef.current.click()
  }

  const handleLogoUpload = (type, file, isDelete = false) => {
    setOpenImageEdit(false)
    if (isDelete) { setLogoFormData(null); return }
    if (type === 'logo' && file) {
      const formData = new FormData()
      formData.append('file', file)
      setLogoFormData(formData)
    }
  }

  // ── Multi-file upload ──────────────────────────────────────────────────────
  const handleFileUpload = async (event, values, setFieldValue) => {
    const selectedFiles = Array.from(event.target.files)
    if (!selectedFiles?.length) return
    try {
      setUploading(true)
      const uploadedFiles = []
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const res  = await apiPost(`${baseURL}admin/upload-doc`, formData, true)
        const data = res?.data?.detail || res?.data
        let fileType = 'file'
        if      (file.type.startsWith('image')) fileType = 'image'
        else if (file.type.startsWith('audio')) fileType = 'audio'
        else if (file.type.startsWith('video')) fileType = 'video'
        uploadedFiles.push({ key: data?.key, url: data?.url, type: fileType, file_name: data?.file_name })
      }
     setFieldValue(
        event.target.name,
        [...(values[event.target.name] || []), ...uploadedFiles]
      )
      toast.success('Files uploaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Delete rule ────────────────────────────────────────────────────────────
  const handleDeleteRule = async (rule, index, values, setFieldValue) => {
    try {
      if (rule.id) {
        await apiDelete(`${baseURL}ad/delete-advertisment-rule/${rule.id}`)
        toast.success('Rule removed')
      }
      setFieldValue('rules', values.rules.filter((_, i) => i !== index))
    } catch {
      toast.error('Could not delete rule')
    }
  }

  // ── Main submit ────────────────────────────────────────────────────────────
  const handleSubmit = async values => {
    try {
      // 1. Upload logo if newly selected
      let logoPayload = values.logo || null
      if (logoFormData) {
        const logoRes  = await apiPost(`${baseURL}admin/upload-doc`, logoFormData, true)
        const logoData = logoRes?.data?.detail || logoRes?.data
        logoPayload    = { key: logoData?.key, url: logoData?.url, file_name: logoData?.file_name }
      }

      // 2. Upsert advertisement
      const adPayload = {
        ...(id && { id }),
        name:            values.name,
        logo:            logoPayload,
        header:          values.header          || null,
        subheader:       values.subheader        || null,
        body:            values.body             || null,
        footer:          values.footer           || null,
        is_active:       values.is_active,
        files:           values.files,
        contact_us:      values.contact_us       || null,
        linkname_1:      values.linkname_1       || null,
        link_1:          values.link_1           || null,
        linkname_2:      values.linkname_2       || null,
        link_2:          values.link_2           || null,
        linkname_3:      values.linkname_3       || null,
        link_3:          values.link_3           || null,
        // ── new fields ──────────────────────────────
        ad_type:         values.ad_type          || null,
        ad_display_type: values.ad_display_type  || null,
        offer_header:    values.offer_header     || null,
        offer_subheader: values.offer_subheader  || null,
        offer_details:   values.offer_details    || null,
        link_btn_text:   values.link_btn_text  || null,
        btn_icon:        [values.btn_icon]       || [],
        // ─────────────────────────────────────────────
        ui_config:       values.ui_config,
      }

      const adRes = await apiPost(`${baseURL}ad/upsert-advertisment`, adPayload)
      if (adRes?.status !== 200) throw new Error('Advertisement save failed')

      const adId = adRes.data?.data?.id

      // 3. Upsert targeting rules
      const validRules = values.rules.filter(r => r.page_name?.trim() && r.slot_name?.trim())
      await Promise.all(
        validRules.map(rule =>
          apiPost(`${baseURL}ad/upsert-advertisment-rule`, {
            ...(rule.id && { id: rule.id }),
            ad_id:                 adId,
            page_name:             rule.page_name,
            slot_name:             rule.slot_name,
            priority:              Number(rule.priority)              || 0,
            min_interval_seconds:  Number(rule.min_interval_seconds)  || 0,
            max_shows_per_user:    Number(rule.max_shows_per_user)    || 0,
            max_shows_per_day:     Number(rule.max_shows_per_day)     || 0,
            max_shows_per_session: Number(rule.max_shows_per_session) || 0,
            start_at:              rule.start_at || null,
            end_at:                rule.end_at   || null,
            is_enabled:            rule.is_enabled
          })
        )
      )

      toast.success(id ? 'Updated successfully' : 'Created successfully')
      fetchTable()
      toggle()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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

              {/* Hidden file input for logo cropper */}
              <input
                ref={fileInputRef}
                type='file'
                accept='.jpg,.jpeg,.png,.webp'
                style={{ display: 'none' }}
                onChange={onFileInputChange}
              />

              {/* Logo cropper dialog */}
              <ImageUpload
                isOpen={openImageEdit}
                handleUpload={handleLogoUpload}
                type={cropType}
                isPreview={isPreview}
                title='Upload Logo'
                aspectRatio={cropAspectRatio}
                selectedImage={cropImage}
                handleClose={(e, reason) => {
                  if (reason === 'backdropClick') return
                  setOpenImageEdit(false)
                }}
              />

              {rulesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Formik
                  enableReinitialize
                  initialValues={{
                    name:            RowData?.name            || '',
                    logo:            RowData?.logo            || null,
                    header:          RowData?.header          || '',
                    subheader:       RowData?.subheader       || '',
                    body:            RowData?.body            || '',
                    footer:          RowData?.footer          || '',
                    is_active:       RowData?.is_active       ?? true,
                    files:           RowData?.files           || [],
                    contact_us:      RowData?.contact_us      || '',
                    linkname_1:      RowData?.linkname_1      || '',
                    link_1:          RowData?.link_1          || '',
                    linkname_2:      RowData?.linkname_2      || '',
                    link_2:          RowData?.link_2          || '',
                    linkname_3:      RowData?.linkname_3      || '',
                    link_3:          RowData?.link_3          || '',
                    // ── new fields ──────────────────────────────
                    ad_type:         RowData?.ad_type         || 'sponsored',
                    ad_display_type: RowData?.ad_display_type || 'standard',
                    offer_header:    RowData?.offer_header    || '',
                    offer_subheader: RowData?.offer_subheader || '',
                    offer_details:   RowData?.offer_details   || '',
                    link_btn_text:   RowData?.link_btn_text   || null,
                    btn_icon:        RowData?.btn_icon ? [RowData.btn_icon] : [],

                    // ─────────────────────────────────────────────
                    rules:           initialRules,
                    ui_config:       RowData?.ui_config       || DEFAULT_UI_CONFIG
                  }}
                  onSubmit={handleSubmit}
                >
                  {({ values, handleChange, setFieldValue, isSubmitting }) => (
                    <Form>

                      {/* ══════════════════════════════════════════
                          SECTION 0 — LOGO
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Logo' />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                        <Badge
                          overlap='circular'
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <IconButton
                              onClick={handleEditLogo}
                              size='small'
                              sx={{
                                bgcolor: 'white', width: 26, height: 26,
                                border: '1px solid', borderColor: 'divider',
                                '&:hover': { bgcolor: 'grey.100' }
                              }}
                            >
                              <CameraAlt sx={{ color: 'text.primary', width: 14, height: 14 }} />
                            </IconButton>
                          }
                        >
                          <Avatar
                            alt='Ad Logo'
                            src={
                              logoFormData
                                ? URL.createObjectURL(logoFormData.get('file'))
                                : values.logo?.url || ''
                            }
                            variant='rounded'
                            sx={{ width: 88, height: 88, border: '1px solid', borderColor: 'divider' }}
                          />
                        </Badge>

                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            Recommended: square image, min 200×200 px
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            JPG, PNG or WebP · max 5 MB
                          </Typography>
                          {(logoFormData || values.logo) && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size='small' color='error' variant='text'
                                startIcon={<Icon icon='tabler:trash' />}
                                onClick={() => { setLogoFormData(null); setFieldValue('logo', null) }}
                              >
                                Remove logo
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      {/* ══════════════════════════════════════════
                          SECTION 1 — BASIC DETAILS
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Advertisement Details' />

                      <TextField fullWidth label='Name' name='name'
                        value={values.name} onChange={handleChange} sx={{ mt: 2 }} />
                      <TextField fullWidth label='Header' name='header'
                        value={values.header} onChange={handleChange} sx={{ mt: 2 }} />
                      <TextField fullWidth label='Sub Header' name='subheader'
                        value={values.subheader} onChange={handleChange} sx={{ mt: 2 }} />
                      <TextField fullWidth multiline rows={4} label='Body' name='body'
                        value={values.body} onChange={handleChange} sx={{ mt: 2 }} />
                      <TextField fullWidth label='Footer' name='footer'
                        value={values.footer} onChange={handleChange} sx={{ mt: 2 }} />

                      <Box sx={{ mt: 3 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={values.is_active}
                              onChange={e => setFieldValue('is_active', e.target.checked)}
                            />
                          }
                          label={values.is_active ? 'Active' : 'Inactive'}
                        />
                      </Box>

                      {/* ══════════════════════════════════════════
                          SECTION 2 — AD CONFIGURATION  (new)
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Ad Configuration' sx={{ mt: 4 }} />

                      <Grid2 container spacing={3} sx={{ mt: 1 }}>

                        {/* ad_type — free text */}
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label='Ad Type'
                            name='ad_type'
                            value={values.ad_type}
                            onChange={handleChange}
                            placeholder='e.g. sponsored, promotional, awareness'
                            helperText='Label shown on the ad (default: sponsored)'
                          />
                        </Grid2>

                        {/* ad_display_type — dropdown */}
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select fullWidth
                            label='Display Type'
                            name='ad_display_type'
                            value={values.ad_display_type}
                            onChange={handleChange}
                            helperText='How the ad is rendered on the client'
                          >
                            {AD_DISPLAY_TYPES.map(opt => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid2>

                      </Grid2>

                      {/* ══════════════════════════════════════════
                          SECTION 3 — OFFER DETAILS  (new)
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Offer Details' sx={{ mt: 4 }} />

                      <TextField
                        fullWidth label='Offer Header' name='offer_header'
                        value={values.offer_header} onChange={handleChange}
                        placeholder='e.g. 50% OFF Today Only'
                        sx={{ mt: 2 }}
                      />
                      <TextField
                        fullWidth label='Offer Sub Header' name='offer_subheader'
                        value={values.offer_subheader} onChange={handleChange}
                        placeholder='e.g. Limited time deal'
                        sx={{ mt: 2 }}
                      />
                      <TextField
                        fullWidth multiline rows={3}
                        label='Offer Details' name='offer_details'
                        value={values.offer_details} onChange={handleChange}
                        placeholder='Describe the offer, terms, or any additional info…'
                        sx={{ mt: 2 }}
                      />
                        <TextField
                        fullWidth 
                        // multiline rows={3}
                        label='Link Button Text' name='link_btn_text'
                        value={values.link_btn_text} onChange={handleChange}
                        placeholder='e.g. Shop Now'
                        sx={{ mt: 2 }}
                      />
                      <Button variant='outlined' component='label' sx={{ mt: 2 }} disabled={uploading}>
                        {uploading ? 'Uploading…' : 'Upload Icon'}
                        <input
                          hidden type='file' multiple accept='image/*,audio/*,video/*'
                          name='btn_icon'
                          onChange={e => handleFileUpload(e, values, setFieldValue)}
                        />
                      </Button>

                      <Grid2 container spacing={2} sx={{ mt: 2 }}>
                        {values.btn_icon?.map((file, index) => (
                          <Grid2 key={index}>
                            <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 1, position: 'relative' }}>
                              <IconButton
                                size='small' color='error'
                                sx={{ position: 'absolute', top: -10, right: -10, background: '#fff' }}
                                onClick={() =>
                                  setFieldValue('btn_icon', values.btn_icon.filter((_, i) => i !== index))
                                }
                              >
                                <Icon icon='tabler:x' />
                              </IconButton>

                              {file?.type === 'image' && (
                                <img
                                  src={file?.url} alt='preview' width={120} height={120}
                                  style={{ objectFit: 'cover', borderRadius: 8 }}
                                />
                              ) }
                              <Typography variant='caption' display='block' sx={{ mt: 1 }}>
                                {file?.file_name}
                              </Typography>
                            </Box>
                          </Grid2>
                        ))}
                      </Grid2>
                      {/* ══════════════════════════════════════════
                          SECTION 4 — FILE UPLOAD
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Upload Files' sx={{ mt: 4 }} />

                      <Button variant='outlined' component='label' sx={{ mt: 2 }} disabled={uploading}>
                        {uploading ? 'Uploading…' : 'Upload Files'}
                        <input
                          hidden type='file' multiple accept='image/*,audio/*,video/*'
                          name='files'
                          onChange={e => handleFileUpload(e, values, setFieldValue)}
                        />
                      </Button>

                      <Grid2 container spacing={2} sx={{ mt: 2 }}>
                        {values.files.map((file, index) => (
                          <Grid2 key={index}>
                            <Box sx={{ border: '1px solid #ddd', borderRadius: 2, p: 1, position: 'relative' }}>
                              <IconButton
                                size='small' color='error'
                                sx={{ position: 'absolute', top: -10, right: -10, background: '#fff' }}
                                onClick={() =>
                                  setFieldValue('files', values.files.filter((_, i) => i !== index))
                                }
                              >
                                <Icon icon='tabler:x' />
                              </IconButton>

                              {file.type === 'image' ? (
                                <img
                                  src={file.url} alt='preview' width={120} height={120}
                                  style={{ objectFit: 'cover', borderRadius: 8 }}
                                />
                              ) : (
                                <Box sx={{
                                  width: 120, height: 120,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: '#f5f5f5', borderRadius: 2
                                }}>
                                  <Typography variant='body2'>{file.type}</Typography>
                                </Box>
                              )}
                              <Typography variant='caption' display='block' sx={{ mt: 1 }}>
                                {file.file_name}
                              </Typography>
                            </Box>
                          </Grid2>
                        ))}
                      </Grid2>

                      {/* ══════════════════════════════════════════
                          SECTION 5 — CONTACT & SOCIAL LINKS
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='Contact Details' sx={{ mt: 4 }} />

                      <TextField fullWidth label='Contact Number' name='contact_us'
                        value={values.contact_us} onChange={handleChange} sx={{ mt: 2 }} />

                      <SectionLabel label='Social Links' sx={{ mt: 4 }} />

                      <Grid2 container spacing={3} sx={{ mt: 1 }}>
                        {/* ── Link 1 ── */}
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField select fullWidth label='Link Name 1'
                            name='linkname_1' value={values.linkname_1} onChange={handleChange}>
                            <MenuItem value=''>— None —</MenuItem>
                            {socialOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                          </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth label='Link 1 URL' name='link_1'
                            value={values.link_1} onChange={handleChange} />
                        </Grid2>

                        {/* ── Link 2 ── */}
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField select fullWidth label='Link Name 2'
                            name='linkname_2' value={values.linkname_2} onChange={handleChange}>
                            <MenuItem value=''>— None —</MenuItem>
                            {socialOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                          </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth label='Link 2 URL' name='link_2'
                            value={values.link_2} onChange={handleChange} />
                        </Grid2>

                        {/* ── Link 3 ── */}
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField select fullWidth label='Link Name 3'
                            name='linkname_3' value={values.linkname_3} onChange={handleChange}>
                            <MenuItem value=''>— None —</MenuItem>
                            {socialOptions.map(item => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                          </TextField>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth label='Link 3 URL' name='link_3'
                            value={values.link_3} onChange={handleChange} />
                        </Grid2>
                      </Grid2>

                      {/* ══════════════════════════════════════════
                          SECTION 6 — TARGETING RULES
                      ══════════════════════════════════════════ */}

                      <Box sx={{ mt: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant='h6'>Targeting Rules</Typography>
                            <Chip
                              size='small' color='primary' variant='outlined'
                              label={`${values.rules.length} rule${values.rules.length !== 1 ? 's' : ''}`}
                            />
                          </Box>
                          <Button size='small' variant='contained' startIcon={<Icon icon='tabler:plus' />}
                            onClick={() => setFieldValue('rules', [...values.rules, { ...EMPTY_RULE }])}>
                            Add Rule
                          </Button>
                        </Box>

                        <Alert severity='info' sx={{ mb: 2 }}>
                          Rules control where, when, and how often this ad is shown. Set all limits to{' '}
                          <strong>0</strong> for unlimited.
                        </Alert>

                        {values.rules.length === 0 && (
                          <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center' }}>
                            <Icon icon='tabler:target-arrow' fontSize={32} />
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                              No targeting rules yet. Click "Add Rule" to define where this ad appears.
                            </Typography>
                          </Box>
                        )}

                        {values.rules.map((rule, index) => (
                          <Accordion
                            key={index} defaultExpanded={!rule.id}
                            sx={{
                              mb: 2, border: '1px solid',
                              borderColor: rule.is_enabled ? 'primary.light' : 'divider',
                              borderRadius: '8px !important',
                              '&:before': { display: 'none' }, boxShadow: 'none'
                            }}
                          >
                            <AccordionSummary expandIcon={<Icon icon='tabler:chevron-down' />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 2 }}>
                                <Icon icon='tabler:layout-grid' fontSize={18} />
                                <Typography variant='body1' fontWeight={500}>
                                  {rule.page_name && rule.slot_name
                                    ? `${rule.page_name} › ${rule.slot_name}`
                                    : `Rule ${index + 1}`}
                                </Typography>
                                {rule.priority > 0 && (
                                  <Chip size='small' variant='outlined' color='secondary'
                                    label={`Priority ${rule.priority}`} />
                                )}
                                <Chip
                                  size='small' sx={{ ml: 'auto', mr: 1 }}
                                  color={rule.is_enabled ? 'success' : 'default'}
                                  label={rule.is_enabled ? 'Enabled' : 'Disabled'}
                                />
                              </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ pt: 0 }}>
                              <Divider sx={{ mb: 3 }} />

                              <Typography variant='overline' color='text.secondary' display='block' sx={{ mb: 1.5 }}>
                                Placement
                              </Typography>
                              <Grid2 container spacing={3}>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                  <TextField fullWidth required label='Page Name'
                                    placeholder='e.g. home, profile, dashboard'
                                    value={rule.page_name}
                                    onChange={e => setFieldValue(`rules[${index}].page_name`, e.target.value)} />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                  <TextField fullWidth required label='Slot Name'
                                    placeholder='e.g. top_banner, mid_card, popup'
                                    value={rule.slot_name}
                                    onChange={e => setFieldValue(`rules[${index}].slot_name`, e.target.value)} />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                  <TextField fullWidth type='number' label='Priority'
                                    inputProps={{ min: 0 }} value={rule.priority}
                                    onChange={e => setFieldValue(`rules[${index}].priority`, e.target.value)}
                                    helperText='Higher = shown first when multiple ads compete' />
                                </Grid2>
                              </Grid2>

                              <Typography variant='overline' color='text.secondary' display='block' sx={{ mt: 3, mb: 1.5 }}>
                                Schedule (optional)
                              </Typography>
                              <Grid2 container spacing={3}>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                  <TextField fullWidth label='Start At' type='datetime-local'
                                    InputLabelProps={{ shrink: true }}
                                    value={rule.start_at ? rule.start_at.slice(0, 16) : ''}
                                    onChange={e => setFieldValue(`rules[${index}].start_at`, e.target.value || null)}
                                    helperText='Leave empty to start immediately' />
                                </Grid2>
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                  <TextField fullWidth label='End At' type='datetime-local'
                                    InputLabelProps={{ shrink: true }}
                                    value={rule.end_at ? rule.end_at.slice(0, 16) : ''}
                                    onChange={e => setFieldValue(`rules[${index}].end_at`, e.target.value || null)}
                                    helperText='Leave empty to run indefinitely' />
                                </Grid2>
                              </Grid2>

                              <Typography variant='overline' color='text.secondary' display='block' sx={{ mt: 3, mb: 1.5 }}>
                                Frequency Caps{' '}
                                <Typography component='span' variant='caption'>(0 = unlimited)</Typography>
                              </Typography>
                              <Grid2 container spacing={3}>
                                {[
                                  { field: 'max_shows_per_user',    label: 'Max per User',    helper: 'All-time per user'       },
                                  { field: 'max_shows_per_day',     label: 'Max per Day',     helper: 'Resets every 24 hrs'     },
                                  { field: 'max_shows_per_session', label: 'Max per Session', helper: 'Per device session'      },
                                  { field: 'min_interval_seconds',  label: 'Min Interval (s)',helper: 'Cooldown between shows'  },
                                ].map(({ field, label, helper }) => (
                                  <Grid2 key={field} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <TextField fullWidth type='number' inputProps={{ min: 0 }}
                                      label={label} value={rule[field]}
                                      onChange={e => setFieldValue(`rules[${index}].${field}`, e.target.value)}
                                      helperText={helper} />
                                  </Grid2>
                                ))}
                              </Grid2>

                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={rule.is_enabled}
                                      onChange={e => setFieldValue(`rules[${index}].is_enabled`, e.target.checked)}
                                    />
                                  }
                                  label={rule.is_enabled ? 'Rule enabled' : 'Rule disabled'}
                                />
                                <Tooltip title={rule.id ? 'Delete this rule permanently' : 'Remove'}>
                                  <Button size='small' color='error' variant='outlined'
                                    startIcon={<Icon icon='tabler:trash' />}
                                    onClick={() => handleDeleteRule(rule, index, values, setFieldValue)}>
                                    {rule.id ? 'Delete Rule' : 'Remove'}
                                  </Button>
                                </Tooltip>
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>

                      {/* ══════════════════════════════════════════
                          SECTION 7 — UI CONFIGURATION
                      ══════════════════════════════════════════ */}

                      <SectionLabel label='UI Configuration' sx={{ mt: 4 }} />

                      <Alert severity='info' sx={{ mt: 2, mb: 3 }}>
                        Customize advertisement colors dynamically for Flutter/mobile UI.
                      </Alert>

                      <Grid2 container spacing={3}>
                        {[
                          ['text_color',        'Text Color'        ],
                          ['button_bg_color',   'Button Background' ],
                          ['button_text_color', 'Button Text'       ],
                        ].map(([field, label]) => (
                          <Grid2 key={field} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card variant='outlined' sx={{ borderRadius: 3, overflow: 'hidden' }}>
                              <Box sx={{ height: 70, background: values.ui_config?.[field], borderBottom: '1px solid #eee' }} />
                              <Box sx={{ p: 2 }}>
                                <Typography variant='subtitle2' sx={{ mb: 2 }}>{label}</Typography>
                                <HexColorPicker
                                  color={values.ui_config?.[field]}
                                  onChange={color => setFieldValue(`ui_config.${field}`, color)}
                                  style={{ width: '100%', height: 140 }}
                                />
                                <TextField
                                  fullWidth size='small' sx={{ mt: 2 }}
                                  value={values.ui_config?.[field]}
                                  onChange={e => setFieldValue(`ui_config.${field}`, e.target.value)}
                                />
                              </Box>
                            </Card>
                          </Grid2>
                        ))}
                      </Grid2>

                      {/* ══════════════════════════════════════════
                          ACTION BUTTONS
                      ══════════════════════════════════════════ */}

                      <Box sx={{ display: 'flex', gap: 2, mt: 5 }}>
                        <LoadingButton fullWidth variant='outlined' onClick={toggle}>
                          Cancel
                        </LoadingButton>
                        <LoadingButton fullWidth variant='contained' type='submit' loading={isSubmitting}>
                          {id ? 'Update' : 'Create'}
                        </LoadingButton>
                      </Box>

                    </Form>
                  )}
                </Formik>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  )
}

const SectionLabel = ({ label, sx = {} }) => (
  <Typography variant='h6' sx={sx}>{label}</Typography>
)

export default CreateAdvertisement
