import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import {
  Card,
  Box,
  Chip,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Alert,
  Autocomplete,
  CircularProgress
} from '@mui/material'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'

import { apiGet, apiPost, apiPatch } from 'src/hooks/axios'
import { baseURL, chatwiseTemplatesUrl, chatwiseTemplateUrl } from 'src/services/pathConst'

// ** Iconify, not @mui/material's Icon. The two are different components with the
//    same name and only this one understands `icon='tabler:gift'`.
import Icon from 'src/@core/components/icon'

// ** The portal's shared list-page chrome.
import { PageToolbar, EmptyState, TableSkeleton } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * Gift Campaign — the gift events, and how far each one has got.
 *
 * ! THESE ARE NOT THE MOBILE APP'S FUNCTIONS OR EVENTS.
 *   A gift event is a `whatsappgift_parent` row and the gift system has no
 *   connection to `function` or `event` at all. Its receivers table calls the
 *   parent id `function_id`, which is a legacy misnomer — see the header of
 *   admin-nodejs/src/gift-campaign/service.js before writing a query here.
 *
 * Read-only for now. Creating and editing a gift event still happens in the
 * user portal, which is staying where it is.
 */

/**
 * "2026-10-16 06:54:32.305788" → "16 Oct 2026, 6:54 AM".
 *
 * ! BY ITS OWN DIGITS, NEVER THROUGH `new Date()`.
 *   The server sends these as `::text` precisely so nothing rebuilds a Date
 *   from them. `new Date('2026-10-16 06:54:32')` is parsed in the browser's
 *   zone, and an event created at 00:30 then renders as the previous day for
 *   anybody west of the server. That exact bug has shipped in this product
 *   twice and is written up in my-guests-api.md.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const showStamp = value => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!m) return '—'

  const [, year, month, day, hh, mm] = m
  const hour24 = Number(hh)
  const suffix = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${hour12}:${mm} ${suffix}`
}

/** The template's own variables, as the user portal labels them: Field 0, 1, 2. */
const fieldLines = fields => {
  if (!fields || typeof fields !== 'object') return []

  return Object.keys(fields)
    .filter(k => /^field_\d+$/.test(k))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
    .map(k => ({ label: k.replace('field_', 'Field '), value: String(fields[k] ?? '') }))
}

/**
 * Create or edit a gift event.
 *
 * ! `template_feild` IS THE PAYLOAD KEY, MISSPELLED ON PURPOSE.
 *   The user portal's own `/add-gift-template` already names it that, and the
 *   two backends write the same row while both exist. Correcting the spelling
 *   here would make one body work against one backend and not the other.
 *
 * The variables are `field_0, field_1, …` — the storage numbering, which is
 * what both screens show. The send maps them to the template's {{1}}, {{2}}
 * one higher; that translation lives in the dispatcher, not here, so nobody
 * has to hold the off-by-one in their head while filling this in.
 */
const GiftEventDialog = ({ open, row, onClose, onSaved }) => {
  const editing = Boolean(row?.id)

  const [form, setForm] = useState({})
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // The header picture is uploaded the moment it is chosen, not on Save:
  // what the row stores is an address, and there is no address until the
  // file is in S3.
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // ! THE PORTAL'S OWN PROXY, NOT chatwise.in DIRECTLY.
  //   admin-nodejs already has GET /chatwise/templates, which calls
  //   ChatWise with CHATWISE_API_TOKEN from its .env. Calling chatwise.in
  //   from here would mean shipping that token in the browser bundle,
  //   where anyone who can open the portal can read it - and it is the
  //   token for the whole WhatsApp account, not for this screen.
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templatesFailed, setTemplatesFailed] = useState(false)

  // The chosen template's body: its text, and how many {{n}} it declares.
  const [tplBody, setTplBody] = useState('')
  const [tplVars, setTplVars] = useState(0)
  const [tplHasHeaderImage, setTplHasHeaderImage] = useState(false)
  const [tplThin, setTplThin] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  /**
   * ! THE NUMBER OF VALUE BOXES IS THE TEMPLATE'S TO DECIDE, NOT THE ADMIN'S.
   *   Three boxes were hard-coded because thank_you_main happens to have
   *   three. Pick a template with two and the third is sent as a value
   *   WhatsApp has nowhere to put; pick one with four and the fourth
   *   arrives as the literal text "Missing Field 4" (see sendWhatsappGift).
   *
   * ! THE TEMPLATE SITS AT A DIFFERENT DEPTH IN EACH ANSWER.
   *   /chatwise/template/:uid tries ChatWise's get-template-details and
   *   falls back to the row in the template list, which nests differently
   *   and carries no components at all. Resolve it once, here.
   */
  const loadTemplateShape = useCallback(async uid => {
    setTplBody('')
    setTplVars(0)
    setTplHasHeaderImage(false)
    setTplThin(false)

    if (!uid) return

    setLoadingTemplate(true)
    try {
      const res = await apiGet(chatwiseTemplateUrl(uid))
      const payload = res?.data?.data
      const tpl = payload?.__data?.template || payload?.template || payload || {}
      const components = tpl?.components || []

      const body = components.find(c => c?.type === 'BODY')
      const text = body?.text || ''

      // {{1}} {{2}} ... — the highest number it uses, not how many times
      // it uses them: a template may repeat {{1}} and still take one value.
      const numbers = [...String(text).matchAll(/\{\{\s*(\d+)\s*\}\}/g)]
        .map(m => Number(m[1]))
        .filter(n => Number.isFinite(n))

      const count = numbers.length ? Math.max(...numbers) : 0

      setTplBody(text)
      setTplVars(count)
      setTplHasHeaderImage(
        Boolean(components.find(c => c?.type === 'HEADER' && c?.format === 'IMAGE'))
      )
      setTplThin(components.length === 0)

      // Keep what has been typed, add or drop boxes to match the template.
      if (count > 0) {
        setFields(list => {
          const next = list.slice(0, count)
          while (next.length < count) next.push('')

          return next
        })
      }
    } catch {
      setTplThin(true)
    } finally {
      setLoadingTemplate(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    let live = true

    setLoadingTemplates(true)
    setTemplatesFailed(false)

    // 200 a page: the account had 65 at the time of writing and the
    // response is one page, so there is nothing to page through yet.
    apiGet(`${chatwiseTemplatesUrl}?page=1&page_size=200`)
      .then(res => {
        if (!live) return

        const rows = res?.data?.data?.templateList?.data || []

        // ! APPROVED ONLY, AND ONE ROW PER NAME.
        //   A template Meta has not approved cannot be sent with, so
        //   offering it would only produce a failure at send time. The same
        //   name can also appear once per language (hello_world is en and
        //   en_US), and the gift event stores a NAME - so two identical
        //   options would be a choice with no difference.
        const seen = new Set()
        const names = []

        rows.forEach(t => {
          const name = (t?.template_name || '').trim()

          if (!name || t?.status !== 'APPROVED' || seen.has(name)) return

          seen.add(name)
          names.push({
            name,
            category: t?.category || '',
            // The details call needs an id; _uid is what ChatWise's own
            // endpoint takes, and the server's fallback matches either.
            uid: t?._uid || t?._id || ''
          })
        })

        names.sort((a, b) => a.name.localeCompare(b.name))
        setTemplates(names)
      })
      .catch(() => {
        if (!live) return

        // Not a toast: the field below says it, and stays usable by hand.
        setTemplatesFailed(true)
      })
      .finally(() => {
        if (live) setLoadingTemplates(false)
      })

    return () => {
      live = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setError('')
    setUploadError('')
    setForm({
      eventname: row?.eventname || '',
      name: row?.name || '',
      mobile: row?.mobile || '',
      country_code: row?.country_code || '+91',
      tempalte_name: row?.template_name || row?.tempalte_name || '',
      tempalte_image_url: row?.template_image_url || row?.tempalte_image_url || '',
      host_bwnum_code: row?.host_bwnum_code || ''
    })

    const existing = fieldLines(row?.fields)
    // Three is what the approved `thank_you_main` template declares, so a new
    // event starts with three empty ones rather than a blank list nobody knows
    // the shape of.
    setFields(existing.length ? existing.map(l => l.value) : ['', '', ''])
  }, [open, row])

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  /**
   * Chosen file -> S3 -> the address goes in the form.
   *
   * ! admin/upload-doc, NOT user/upload-doc.
   *   The host portal uploads through the app's backend; this portal talks
   *   to admin-nodejs on its own base URL, and only that one carries an
   *   admin token. Both put the object in the same bucket under
   *   user-section/, so a picture uploaded here is fetched exactly like one
   *   uploaded there.
   */
  const uploadImage = async e => {
    const file = e.target.files && e.target.files[0]

    // ! CLEARED BEFORE ANYTHING ELSE.
    //   The same input serves Replace, and a browser fires no change event
    //   when the SAME file is picked a second time unless the value is
    //   reset - so a failed upload could not be retried with that file.
    e.target.value = ''

    if (!file) return

    // The server checks this too (admin/schema.js), but its answer names no
    // field, so an unsupported file would fail with nothing to act on.
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setUploadError('That file is not a JPG or a PNG.')

      return
    }

    setUploadError('')
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', file)

      const res = await apiPost(`${baseURL}admin/upload-doc`, data, true)
      const url = res?.data?.detail?.url

      if (!url) throw new Error('The upload finished without returning an address.')

      set('tempalte_image_url', url)
    } catch (err) {
      setUploadError(
        err?.response?.data?.message || err?.message || 'Could not upload that image.'
      )
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const template_feild = {}
      fields.forEach((v, i) => {
        template_feild[`field_${i}`] = v
      })

      const body = { ...form, template_feild }

      if (editing) {
        await apiPatch(`${baseURL}gift-campaign/${row.id}`, body)
      } else {
        await apiPost(`${baseURL}gift-campaign/create`, body)
      }

      onSaved()
    } catch (e) {
      // The server's own message, not a generic one: it names the field that
      // failed validation, which is the only useful thing to show here.
      setError(e?.response?.data?.message || e?.message || 'Could not save that.')
    } finally {
      setSaving(false)
    }
  }

  const blankVariables = fields.filter(v => !String(v).trim()).length

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{editing ? 'Edit gift event' : 'New gift event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ pt: 1 }}>
          {error ? <Alert severity='error'>{error}</Alert> : null}

          <TextField
            label='Event name'
            value={form.eventname || ''}
            onChange={e => set('eventname', e.target.value)}
            fullWidth
            size='small'
            required
          />

          <Stack direction='row' spacing={2}>
            <TextField
              label='Host name'
              value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              size='small'
              sx={{ flex: 2 }}
              required
            />
            <TextField
              label='Code'
              value={form.country_code || ''}
              onChange={e => set('country_code', e.target.value)}
              size='small'
              sx={{ width: 90 }}
              required
            />
            <TextField
              label='Mobile'
              value={form.mobile || ''}
              onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))}
              size='small'
              sx={{ flex: 2 }}
              required
            />
          </Stack>

          {/* ! NOT OPTIONAL IN PRACTICE, THOUGH THE COLUMN ALLOWS NULL.
                dispatch.js refuses an event without one: with no from-number
                the panel picks its own, and a gift message arriving from an
                unrelated business number reads as a scam. Better to be told
                here than at the moment of sending. */}
          <TextField
            label='Host Number Code'
            value={form.host_bwnum_code || ''}
            onChange={e => set('host_bwnum_code', e.target.value)}
            size='small'
            fullWidth
            helperText='The WhatsApp number this event sends from. Dispatch is refused without it.'
          />

          {/* ! freeSolo, SO THE FIELD NEVER THROWS A NAME AWAY.
                A plain Select would blank an event whose template has since
                been renamed or un-approved, and would leave the admin with
                nothing to type into on the day ChatWise is unreachable. The
                list is a shortcut, not a gate. */}
          <Autocomplete
            freeSolo
            autoHighlight
            options={templates}
            getOptionLabel={option =>
              typeof option === 'string' ? option : option?.name || ''
            }
            value={form.tempalte_name || ''}
            onChange={(e, chosen) => {
              set(
                'tempalte_name',
                typeof chosen === 'string' ? chosen : chosen?.name || ''
              )

              loadTemplateShape(typeof chosen === 'string' ? '' : chosen?.uid)
            }}
            onInputChange={(e, text, reason) => {
              if (reason === 'input') set('tempalte_name', text)
            }}
            loading={loadingTemplates}
            renderOption={(props, option) => (
              <Box
                component='li'
                {...props}
                key={option.name}
                sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}
              >
                <Typography variant='body2' sx={{ flexGrow: 1 }}>
                  {option.name}
                </Typography>
                {option.category ? (
                  <Typography
                    variant='caption'
                    sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    {option.category.toLowerCase()}
                  </Typography>
                ) : null}
              </Box>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label='WhatsApp template name'
                size='small'
                fullWidth
                helperText={
                  templatesFailed
                    ? 'Could not reach ChatWise — type the name exactly as approved in Meta'
                    : 'Approved templates on the WhatsApp account. Type to search.'
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingTemplates ? (
                        <CircularProgress color='inherit' size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          {/* ! A PICTURE IS CHOSEN, NOT AN ADDRESS TYPED.
                The column still holds a URL, because that is what WhatsApp
                fetches - but nobody has an https address for a picture
                sitting on their laptop, and pasting one by hand is how an
                event ends up pointing at a file that moves or disappears.
                Upload puts it in the same bucket the host portal uses and
                fills the column from what S3 answers. */}
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Template image
            </Typography>

            <Stack direction='row' spacing={2} alignItems='center'>
              <Button
                component='label'
                variant='outlined'
                size='small'
                disabled={uploading}
                startIcon={
                  uploading ? <CircularProgress size={14} /> : <Icon icon='tabler:upload' />
                }
              >
                {uploading ? 'Uploading...' : form.tempalte_image_url ? 'Replace image' : 'Upload image'}
                <input type='file' hidden accept='image/jpeg,image/png' onChange={uploadImage} />
              </Button>

              {form.tempalte_image_url && !uploading ? (
                <Button size='small' color='secondary' onClick={() => set('tempalte_image_url', '')}>
                  Remove
                </Button>
              ) : null}
            </Stack>

            {uploadError ? (
              <Alert severity='error' sx={{ mt: 2 }}>
                {uploadError}
              </Alert>
            ) : null}

            {form.tempalte_image_url ? (
              <Stack direction='row' spacing={2} sx={{ mt: 2 }} alignItems='center'>
                <Box
                  component='img'
                  src={form.tempalte_image_url}
                  alt='Template header'
                  sx={{
                    width: 96,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: theme => `1px solid ${theme.palette.divider}`
                  }}
                />
                <Typography
                  variant='caption'
                  sx={{ color: 'text.secondary', wordBreak: 'break-all' }}
                >
                  {form.tempalte_image_url}
                </Typography>
              </Stack>
            ) : (
              <Typography
                variant='caption'
                sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
              >
                JPG or PNG. The file is stored, and its address is what WhatsApp fetches
                when the message is sent.
              </Typography>
            )}
          </Box>

          <Divider />

          <Box>
            <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 1 }}>
              <Typography variant='subtitle2'>Template values</Typography>
              {loadingTemplate ? <CircularProgress size={14} /> : null}
              {tplVars > 0 ? (
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                  {tplVars} in this template
                </Typography>
              ) : null}
            </Stack>

            {/* ! THE NOTE GOES ABOVE THE FIRST BOX, NOT IN A TOOLTIP.
                  Somebody filling these in has no way to know a value can be
                  a column name rather than a fixed word, and a feature
                  nobody can see is a feature nobody uses. */}
            <Alert severity='info' sx={{ mb: 2 }}>
              A value can be fixed text, or one of these, filled in per guest
              from the gift table when the message is sent:{' '}
              <strong>{'{{name}}'}</strong>, <strong>{'{{code}}'}</strong>,{' '}
              <strong>{'{{mobile}}'}</strong>, <strong>{'{{eventname}}'}</strong>.
            </Alert>

            {tplThin ? (
              <Alert severity='warning' sx={{ mb: 2 }}>
                ChatWise did not return this template&apos;s body, so the number of
                values below could not be checked against it. Add exactly as many
                as the approved template declares.
              </Alert>
            ) : null}

            <Stack spacing={2}>
              {fields.map((value, i) => (
                <TextField
                  key={i}
                  label={tplVars > 0 ? `{{${i + 1}}}` : `Field ${i}`}
                  value={value}
                  onChange={e => setFields(list => list.map((v, j) => (j === i ? e.target.value : v)))}
                  size='small'
                  fullWidth
                />
              ))}
            </Stack>

            {/* The buttons stay for a template whose body never arrived -
                see the warning above - and go when the count is known. */}
            {tplVars > 0 ? null : (
              <Stack direction='row' spacing={2} sx={{ mt: 2 }} alignItems='center'>
                <Button size='small' onClick={() => setFields(l => [...l, ''])}>
                  Add a field
                </Button>
                {fields.length > 1 ? (
                  <Button size='small' color='secondary' onClick={() => setFields(l => l.slice(0, -1))}>
                    Remove the last
                  </Button>
                ) : null}
              </Stack>
            )}

            {tplBody ? (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  border: theme => `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Message preview
                </Typography>

                {tplHasHeaderImage ? (
                  <Typography
                    variant='caption'
                    sx={{ display: 'block', mb: 1, color: 'text.secondary' }}
                  >
                    {form.tempalte_image_url
                      ? 'Header image: the picture above'
                      : 'This template has a header image — upload one above'}
                  </Typography>
                ) : null}

                {/* ! WHAT IT WILL LOOK LIKE, NOT WHAT IT WILL SAY.
                      A value of {{name}} is a different guest's name in every
                      message, so the preview shows the value as typed rather
                      than pretending to know whose it is. */}
                <Typography
                  variant='body2'
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                >
                  {String(tplBody)
                    .split(/(\{\{\s*\d+\s*\}\})/g)
                    .map((part, i) => {
                      const hit = /^\{\{\s*(\d+)\s*\}\}$/.exec(part)

                      if (!hit) return <span key={i}>{part}</span>

                      const typed = fields[Number(hit[1]) - 1]

                      return (
                        <Box
                          key={i}
                          component='span'
                          sx={{
                            color: typed ? 'success.main' : 'warning.main',
                            fontWeight: 600
                          }}
                        >
                          {typed || part}
                        </Box>
                      )
                    })}
                </Typography>
              </Box>
            ) : null}

            {/* A blank variable is not a cosmetic problem: the dispatcher
                refuses to send a campaign whose template has one, because the
                old one-at-a-time path put the literal text "Missing Field 1"
                in the message body and sent it. Said here, where it can still
                be fixed in a second. */}
            {blankVariables ? (
              <Alert severity='warning' sx={{ mt: 3 }}>
                {blankVariables} of {fields.length} values are blank. A campaign will refuse to send until every one is
                filled.
              </Alert>
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={save} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const GiftCampaign = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [typed, setTyped] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet(
        `${baseURL}gift-campaign/list?limit=${pagination.pageSize}` +
          `&offset=${pagination.pageIndex * pagination.pageSize}` +
          `&search=${encodeURIComponent(searchText)}`
      )

      // controllerHandler does a bare res.json(result), so the controller's own
      // `data` key sits inside axios's `data`. Hence data.data — the same shape
      // travel-plan returns.
      setRows(res?.data?.data?.rows || [])
      setTotal(res?.data?.data?.total || 0)
    } catch (e) {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize, searchText])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Typing is debounced rather than firing a query per keystroke; an operator
  // searching a mobile number types ten of them.
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination(p => ({ ...p, pageIndex: 0 }))
      setSearchText(typed.trim())
    }, 300)

    return () => clearTimeout(t)
  }, [typed])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'eventname',
        header: 'Event',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
              {row.original.eventname || '—'}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {row.original.template_name || 'no template'}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'name',
        header: 'Host',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {row.original.name || '—'}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
              {[row.original.country_code, row.original.mobile].filter(Boolean).join(' ')}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'fields',
        header: 'Template values',
        enableSorting: false,
        Cell: ({ row }) => {
          const lines = fieldLines(row.original.fields)
          if (!lines.length) {
            return (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                none set
              </Typography>
            )
          }

          return (
            <Box sx={{ maxWidth: 320 }}>
              {lines.map(l => (
                <Typography
                  key={l.label}
                  variant='caption'
                  sx={{ display: 'block', color: 'text.secondary' }}
                  noWrap
                  title={l.value}
                >
                  <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {l.label}:
                  </Box>{' '}
                  {l.value || <em>blank</em>}
                </Typography>
              ))}
            </Box>
          )
        }
      },
      {
        accessorKey: 'receiver_count',
        header: 'Receivers',
        Cell: ({ row }) => {
          const { receiver_count: all, coded_count: coded, sent_count: sent } = row.original

          // The three numbers the old screen does not show, and the operator's
          // first question: how many are on the list, how many have a code,
          // how many have actually gone out.
          if (!all) {
            return (
              <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                none uploaded
              </Typography>
            )
          }

          return (
            <Stack direction='row' spacing={1} alignItems='center'>
              <Chip size='small' label={`${all} on list`} variant='outlined' />
              <Chip
                size='small'
                label={`${coded} coded`}
                color={coded === all ? 'success' : 'warning'}
                variant='outlined'
              />
              <Chip
                size='small'
                label={`${sent} sent`}
                color={sent === all ? 'success' : 'default'}
                variant='outlined'
              />
            </Stack>
          )
        }
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 100,
        Cell: ({ row }) => (
          <Stack direction='row' spacing={0} onClick={e => e.stopPropagation()}>
            {/* Open before Edit: opening the event is what an operator does
                twenty times a day and editing the template is what they do
                once, so the common action sits first. */}
            <Tooltip title='Open this gift event'>
              <IconButton size='small' onClick={() => router.push(`/gift-campaign/${row.original.id}`)}>
                <Icon icon='tabler:external-link' fontSize='1.25rem' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit this gift event'>
              <IconButton
                size='small'
                onClick={() => {
                  setEditingRow(row.original)
                  setDialogOpen(true)
                }}
              >
                <Icon icon='tabler:edit' fontSize='1.25rem' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        Cell: ({ row }) => (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {showStamp(row.original.created_at)}
          </Typography>
        )
      }
    ],
    // `router` is in here because the actions cell closes over it. An empty
    // list captures the first render's router for the life of the page, which
    // is the stale-closure bug that makes a button work once and then stop.
    [router]
  )

  const table = useMaterialReactTable({
    // ** One table look for the whole portal. The page's own options below still
    //    win, because they are spread after these.
    ...tableDefaults,
    columns,
    data: rows,
    manualPagination: true,
    rowCount: total,
    state: { pagination },
    onPaginationChange: setPagination,
    enableRowSelection: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableTopToolbar: false,

    /**
     * The whole row opens the event.
     *
     * The actions cell stops propagation on its own buttons below, so Edit
     * opens the dialog rather than doing both — a row click that fires while
     * a dialog is opening leaves the operator on a different page than the
     * one they are typing into.
     */
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => router.push(`/gift-campaign/${row.original.id}`),
      sx: { cursor: 'pointer' }
    })
  })

  return (
    <Card>
      <PageToolbar
        title='Gift Campaign'
        // Never a bare 0 while loading — that reads as "there are none".
        count={loading ? undefined : total}
        actions={
          <Button
            variant='contained'
            startIcon={<Icon icon='tabler:plus' />}
            onClick={() => {
              setEditingRow(null)
              setDialogOpen(true)
            }}
          >
            New gift event
          </Button>
        }
        search={
          <TextField
            size='small'
            value={typed}
            placeholder='Search event, host or number'
            onChange={e => setTyped(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 } }}
            InputProps={{
              startAdornment: <Icon icon='tabler:search' fontSize='1.25rem' style={{ marginRight: 8 }} />
            }}
          />
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon='tabler:gift'
          title={searchText ? 'No gift events match that search' : 'No gift events yet'}
          description={
            searchText
              ? 'Try the host’s name, or their mobile number without the country code.'
              : 'Gift events are created in the user portal. One will appear here as soon as it exists.'
          }
        />
      ) : (
        <MaterialReactTable table={table} />
      )}

      <GiftEventDialog
        open={dialogOpen}
        row={editingRow}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false)
          fetchRows()
        }}
      />
    </Card>
  )
}

export default GiftCampaign
