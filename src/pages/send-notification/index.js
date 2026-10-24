import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Grid2,
  Card,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  AlertTitle,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  FormControl,
  Autocomplete,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material'

// ** Iconify's Icon, not @mui/material's: only this one has an `icon` prop.
import Icon from 'src/@core/components/icon'

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'
import toast from 'react-hot-toast'

import { apiGet, apiPost } from 'src/hooks/axios'
import {
  notificationComposerOptions,
  notificationComposerFunctions,
  notificationComposerAudience,
  notificationComposerSend,
  notificationComposerHistory,
  adminUploadDoc
} from 'src/services/pathConst'

import { PageToolbar, EmptyState } from 'src/@core/components/list-page'
import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'

/**
 * Writing a notification and sending it.
 *
 * ! THE SEND BUTTON CANNOT BE UNDONE. Everything on this page before it is a
 *   read; that one reaches real phones and there is no recall. So the page is
 *   built around making the audience impossible to misread: the count that
 *   matters is repeated next to the button, the confirmation names it again,
 *   and the button is disabled whenever the audience is empty or the message
 *   has no title.
 *
 * ! TWO COUNTS, AND THEY ARE NOT THE SAME NUMBER.
 *   PEOPLE is who the message is addressed to. REACHABLE is how many of them
 *   have a phone that can be pushed right now. Somebody signed out is in the
 *   first and not the second - they get nothing on their screen today, and
 *   still find the message in their notification tab when they sign back in,
 *   provided it was kept there. Showing one number for both would hide that.
 */

const DASH = '—'

const n = value =>
  value === null || value === undefined ? DASH : Number(value).toLocaleString('en-IN')

const PAGE = { pageIndex: 0, pageSize: 25 }

const AUDIENCE_HINT = {
  all: 'Everyone who has had the app on a phone. Not invitation placeholders — somebody who was invited but never downloaded anything cannot receive this.',
  active:
    'Only the people whose phone answered the most recent check on the Active Users screen.',
  function: "The guests of one function who have an account. Guests who never signed up cannot be sent anything."
}

const ComposeNotification = () => {
  // ── what the server offers ───────────────────────────────────────────────
  const [options, setOptions] = useState({ destinations: [], audiences: [] })
  const [functions, setFunctions] = useState([])

  // ── the audience ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState('all')
  const [fn, setFn] = useState(null)
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState(PAGE)
  const [loading, setLoading] = useState(false)

  /**
   * How the ticking is expressed, and why it is two sets rather than one.
   *
   * The table is paginated on the server, so "everybody except these four" can
   * never be a list of ticked ids — the page only ever holds 25 of them. In
   * `everyone` mode the server sends to the whole audience minus `exclude`; in
   * `picked` mode it sends to `only`. Both are id lists that survive paging,
   * searching and reloading, which a list of checked rows would not.
   */
  const [pick, setPick] = useState('everyone')
  const [exclude, setExclude] = useState(() => new Set())
  const [only, setOnly] = useState(() => new Set())

  // ── the message ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [subHeading, setSubHeading] = useState('')
  const [body, setBody] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)

  const [keepInTab, setKeepInTab] = useState('yes')
  const [destination, setDestination] = useState('home')

  // ── sending ──────────────────────────────────────────────────────────────
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const [tab, setTab] = useState('compose')
  const [history, setHistory] = useState([])

  // ── loaders ──────────────────────────────────────────────────────────────
  useEffect(() => {
    apiGet(notificationComposerOptions)
      .then(res => setOptions(res?.data || { destinations: [], audiences: [] }))
      .catch(() => toast.error('Could not load the composer options'))

    apiGet(notificationComposerFunctions)
      .then(res => setFunctions(res?.data?.data || []))
      .catch(() => toast.error('Could not load the function list'))
  }, [])

  const loadAudience = useCallback(async () => {
    if (mode === 'function' && !fn) {
      setRows([])
      setCount(0)
      setSummary(null)

      return
    }

    setLoading(true)

    try {
      const query = new URLSearchParams({
        mode,
        limit: String(pagination.pageSize),
        page: String(pagination.pageIndex + 1)
      })

      if (search) query.set('search', search)
      if (mode === 'function' && fn) query.set('function_id', fn.id)

      const res = await apiGet(`${notificationComposerAudience}?${query.toString()}`)
      const payload = res?.data || {}

      setRows(payload.data || [])
      setCount(payload.count || 0)
      setSummary(payload.summary || null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load the audience')
      setRows([])
      setCount(0)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [mode, fn, search, pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    loadAudience()
  }, [loadAudience])

  /**
   * Changing the audience throws the ticking away, deliberately.
   *
   * Carrying "everybody except Suresh" from the guests of one wedding over to
   * every user of the product would be a silent, invisible filter on a send to
   * twelve thousand people. The ticking belongs to the audience it was done
   * in.
   */
  useEffect(() => {
    setExclude(new Set())
    setOnly(new Set())
    setPick('everyone')
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [mode, fn])

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiGet(`${notificationComposerHistory}?limit=25&page=1`)
      setHistory(res?.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load what has been sent')
    }
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  // ── ticking ──────────────────────────────────────────────────────────────
  const isTicked = id => (pick === 'everyone' ? !exclude.has(id) : only.has(id))

  const toggle = id => {
    if (pick === 'everyone') {
      setExclude(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)

        return next
      })

      return
    }

    setOnly(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })
  }

  const willSendTo =
    pick === 'everyone' ? Math.max((summary?.people || 0) - exclude.size, 0) : only.size

  // ── the banner ───────────────────────────────────────────────────────────
  /**
   * Uploaded through the portal's own /admin/upload-doc, which answers with a
   * plain permanent S3 URL. NOT a presigned one: this image has to still
   * render in somebody's notification tab months from now, and a signed URL
   * cannot outlive seven days.
   */
  const upload = async event => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('That image is over 5MB. Please use a smaller one.')

      return
    }

    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await apiPost(adminUploadDoc, form, true)
      const url = res?.data?.detail?.url

      if (!url) throw new Error('The upload did not return a URL')

      setBannerUrl(url)
      toast.success('Image uploaded')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not upload that image')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  // ── sending ──────────────────────────────────────────────────────────────
  const send = async () => {
    setConfirming(false)
    setSending(true)
    setResult(null)

    try {
      const res = await apiPost(notificationComposerSend, {
        mode,
        function_id: mode === 'function' ? fn?.id : undefined,
        only: pick === 'picked' ? [...only] : [],
        exclude: pick === 'everyone' ? [...exclude] : [],
        title: title.trim(),
        sub_heading: subHeading.trim() || undefined,
        body: body.trim() || undefined,
        banner_url: bannerUrl || undefined,
        keep_in_tab: keepInTab === 'yes',
        destination: keepInTab === 'yes' ? destination : undefined
      })

      const payload = res?.data || {}

      setResult(payload)
      toast.success(payload.message || 'Sent')
      setTab('compose')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'The notification could not be sent')
    } finally {
      setSending(false)
    }
  }

  // ── the table ────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: 'tick',
        header: '',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => (
          <Checkbox
            size='small'
            checked={isTicked(row.original.id)}
            onChange={() => toggle(row.original.id)}
          />
        )
      },
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ row }) => (
          <Stack direction='row' spacing={2} alignItems='center'>
            <Typography variant='body2'>{row.original.name || DASH}</Typography>
            {row.original.accounts > 1 ? (
              <Tooltip
                title={`This mobile number has ${row.original.accounts} accounts. They are shown once and will receive one notification.`}
              >
                <Chip size='small' variant='outlined' color='warning' label={row.original.accounts} />
              </Tooltip>
            ) : null}
          </Stack>
        )
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        Cell: ({ row }) => (
          <Typography variant='body2'>
            {`${row.original.country_code || ''} ${row.original.mobile || ''}`.trim() || DASH}
          </Typography>
        )
      },
      {
        accessorKey: 'reachable_devices',
        header: 'Phones reached now',
        Cell: ({ cell }) => {
          const value = cell.getValue()

          if (value > 0) return <Typography variant='body2'>{n(value)}</Typography>

          return (
            <Tooltip title='Nobody is signed in on any of their phones, so nothing will appear on a screen. If the notification is kept in the tab, they will find it when they sign back in.'>
              <Chip size='small' variant='outlined' label='Signed out' />
            </Tooltip>
          )
        }
      }
    ],
    // isTicked/toggle close over the pick state, so the cells must be rebuilt
    // when it changes or every box keeps the tick it had under the old rule.
    [pick, exclude, only]
  )

  const table = useMaterialReactTable({
    ...tableDefaults,
    columns,
    data: rows,
    rowCount: count,
    manualPagination: true,
    onPaginationChange: setPagination,
    enableSorting: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    state: { pagination, isLoading: loading },
    muiTableBodyRowProps: { hover: true }
  })

  const chosen = options.destinations.find(d => d.key === destination) || null
  const ready = title.trim().length > 0 && willSendTo > 0 && !sending

  const cards = [
    { label: 'People in this audience', value: summary?.people },
    { label: 'Will be sent to', value: willSendTo, strong: true },
    { label: 'Have a phone signed in', value: summary?.reachable_people },
    { label: 'Phones that will buzz', value: summary?.reachable_devices }
  ]

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card>
            <PageToolbar
              title='Send a notification'
              subtitle='Goes to the app, as a notification on the phone and — if you choose — in the notification tab.'
            />

            <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ px: 4 }}>
              <Tab value='compose' label='Compose' />
              <Tab value='history' label='Already sent' />
            </Tabs>

            <Divider sx={{ m: '0 !important' }} />

            {result ? (
              <CardContent>
                <Alert
                  severity={result.failed ? 'warning' : 'success'}
                  onClose={() => setResult(null)}
                >
                  <AlertTitle sx={{ mb: 1 }}>{result.message}</AlertTitle>
                  <Typography variant='body2'>
                    {n(result.people)} people · {n(result.devices)} phones addressed ·{' '}
                    {n(result.delivered)} delivered · {n(result.failed)} failed
                    {result.kept_in_tab
                      ? ` · kept in ${n(result.kept_in_tab)} notification tabs`
                      : ' · not kept in the notification tab'}
                  </Typography>
                  {Object.keys(result.reasons || {}).length ? (
                    <Stack direction='row' sx={{ mt: 2, flexWrap: 'wrap', gap: 2 }}>
                      {Object.entries(result.reasons).map(([code, times]) => (
                        <Chip key={code} size='small' variant='outlined' label={`${code} · ${times}`} />
                      ))}
                    </Stack>
                  ) : null}
                </Alert>
              </CardContent>
            ) : null}

            {tab === 'history' ? (
              <CardContent>
                {history.length === 0 ? (
                  <EmptyState
                    title='Nothing has been sent from here yet'
                    subtitle='Messages you send on the Compose tab are listed here with how they went.'
                  />
                ) : (
                  <Stack spacing={3}>
                    {history.map(item => (
                      <Box
                        key={item.id}
                        sx={{ p: 3, borderRadius: 1, bgcolor: 'customColors.surfaceSunken' }}
                      >
                        <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 1 }}>
                          <Typography variant='subtitle2'>{item.title}</Typography>
                          <Chip size='small' variant='outlined' label={item.mode === 'function' ? item.function_name || 'One function' : item.mode} />
                          {item.keep_in_tab ? (
                            <Chip size='small' variant='outlined' color='info' label='Kept in the tab' />
                          ) : null}
                        </Stack>
                        <Typography variant='body2' color='text.secondary'>
                          {item.body || item.sub_heading || ''}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {item.sent_at_ist} IST · {n(item.people)} people · {n(item.delivered)} delivered ·{' '}
                          {n(item.failed)} failed
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            ) : (
              <>
                {/* ── 1. who it goes to ───────────────────────────────── */}
                <CardContent>
                  <Typography variant='subtitle2' sx={{ mb: 3 }}>
                    1. Who gets it
                  </Typography>

                  <Grid2 container spacing={4}>
                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size='small'
                        label='Audience'
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                      >
                        {(options.audiences || []).map(a => (
                          <MenuItem key={a.key} value={a.key}>
                            {a.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                        {AUDIENCE_HINT[mode]}
                      </Typography>
                    </Grid2>

                    {mode === 'function' ? (
                      <Grid2 size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          size='small'
                          options={functions}
                          value={fn}
                          onChange={(e, value) => setFn(value)}
                          getOptionLabel={o => `${o.function_name}${o.host_name ? ` — ${o.host_name}` : ''}`}
                          isOptionEqualToValue={(o, v) => o.id === v?.id}
                          renderInput={params => <TextField {...params} label='Which function' />}
                        />
                      </Grid2>
                    ) : null}

                    <Grid2 size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Search name or mobile'
                        value={search}
                        onChange={e => {
                          setSearch(e.target.value)
                          setPagination(p => ({ ...p, pageIndex: 0 }))
                        }}
                      />
                    </Grid2>
                  </Grid2>

                  {summary?.guests_without_an_account ? (
                    <Alert severity='info' sx={{ mt: 3 }}>
                      {n(summary.guests_without_an_account)} guest
                      {summary.guests_without_an_account === 1 ? '' : 's'} on this function never
                      installed the app, so they cannot be sent a notification. They are not counted
                      below.
                    </Alert>
                  ) : null}

                  <Grid2 container spacing={3} sx={{ mt: 2 }}>
                    {cards.map(card => (
                      <Grid2 key={card.label} size={{ xs: 6, md: 3 }}>
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 1,
                            textAlign: 'center',
                            bgcolor: card.strong ? 'primary.main' : 'customColors.surfaceSunken',
                            color: card.strong ? 'primary.contrastText' : 'inherit'
                          }}
                        >
                          <Typography variant='h5' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {n(card.value)}
                          </Typography>
                          <Typography variant='caption'>{card.label}</Typography>
                        </Box>
                      </Grid2>
                    ))}
                  </Grid2>

                  <FormControl sx={{ mt: 4 }}>
                    <RadioGroup row value={pick} onChange={e => setPick(e.target.value)}>
                      <FormControlLabel
                        value='everyone'
                        control={<Radio size='small' />}
                        label='Everyone above, except the ones I untick'
                      />
                      <FormControlLabel
                        value='picked'
                        control={<Radio size='small' />}
                        label='Only the ones I tick'
                      />
                    </RadioGroup>
                  </FormControl>

                  {pick === 'everyone' && exclude.size ? (
                    <Chip
                      size='small'
                      color='warning'
                      variant='outlined'
                      sx={{ ml: 2 }}
                      onDelete={() => setExclude(new Set())}
                      label={`${exclude.size} unticked`}
                    />
                  ) : null}
                </CardContent>

                {rows.length === 0 && !loading ? (
                  <EmptyState
                    title={
                      mode === 'function' && !fn
                        ? 'Pick a function first'
                        : search
                          ? 'Nobody matches that search'
                          : 'Nobody in this audience'
                    }
                    subtitle={
                      mode === 'function' && !fn
                        ? 'Choose which function above, and its guests will be listed here.'
                        : 'Try another audience above.'
                    }
                  />
                ) : (
                  <MaterialReactTable table={table} />
                )}

                <Divider sx={{ m: '0 !important' }} />

                {/* ── 2. what it says ─────────────────────────────────── */}
                <CardContent>
                  <Typography variant='subtitle2' sx={{ mb: 3 }}>
                    2. What it says
                  </Typography>

                  <Grid2 container spacing={4}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Stack spacing={4}>
                        <TextField
                          fullWidth
                          size='small'
                          label='Title'
                          required
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          inputProps={{ maxLength: 120 }}
                          helperText={`${title.length}/120 — a phone shows about 40 characters of this on the lock screen`}
                        />
                        <TextField
                          fullWidth
                          size='small'
                          label='Sub heading'
                          value={subHeading}
                          onChange={e => setSubHeading(e.target.value)}
                          inputProps={{ maxLength: 160 }}
                          helperText={`${subHeading.length}/160 — shown in the notification tab, under the title`}
                        />
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          size='small'
                          label='Body'
                          value={body}
                          onChange={e => setBody(e.target.value)}
                          inputProps={{ maxLength: 1000 }}
                          helperText={`${body.length}/1000`}
                        />
                      </Stack>
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <FormLabel sx={{ fontSize: '0.8125rem' }}>Image</FormLabel>
                      <Box
                        sx={{
                          mt: 2,
                          p: 3,
                          border: theme => `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1,
                          textAlign: 'center'
                        }}
                      >
                        {bannerUrl ? (
                          <Box
                            component='img'
                            src={bannerUrl}
                            alt='Notification banner'
                            sx={{ maxWidth: '100%', maxHeight: 160, borderRadius: 1, mb: 2 }}
                          />
                        ) : (
                          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            No image
                          </Typography>
                        )}

                        {uploading ? <LinearProgress sx={{ mb: 2 }} /> : null}

                        <Stack direction='row' spacing={2} justifyContent='center'>
                          <Button
                            size='small'
                            variant='outlined'
                            component='label'
                            disabled={uploading}
                            startIcon={<Icon icon='tabler:upload' />}
                          >
                            {bannerUrl ? 'Replace' : 'Upload'}
                            <input
                              hidden
                              type='file'
                              accept='image/*'
                              ref={fileInput}
                              onChange={upload}
                            />
                          </Button>
                          {bannerUrl ? (
                            <Button size='small' color='error' onClick={() => setBannerUrl('')}>
                              Remove
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                      {/*
                        Said here rather than discovered later: the image is
                        reliable in the app's own notification tab on both
                        platforms, but it only appears in the pop-up banner on
                        Android. iPhones need a Notification Service Extension
                        in the app to show an image there, and this app does
                        not have one.
                      */}
                      <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                        Shows in the notification tab on every phone. In the pop-up banner it shows on
                        Android only — iPhones need an app change to display it there.
                      </Typography>
                    </Grid2>
                  </Grid2>
                </CardContent>

                <Divider sx={{ m: '0 !important' }} />

                {/* ── 3. where it opens ───────────────────────────────── */}
                <CardContent>
                  <Typography variant='subtitle2' sx={{ mb: 3 }}>
                    3. Where it goes afterwards
                  </Typography>

                  <FormControl>
                    <FormLabel sx={{ fontSize: '0.8125rem' }}>
                      Should this stay in the notification tab?
                    </FormLabel>
                    <RadioGroup row value={keepInTab} onChange={e => setKeepInTab(e.target.value)}>
                      <FormControlLabel value='yes' control={<Radio size='small' />} label='Yes' />
                      <FormControlLabel value='no' control={<Radio size='small' />} label='No' />
                    </RadioGroup>
                  </FormControl>

                  {keepInTab === 'yes' ? (
                    <Box sx={{ mt: 3, maxWidth: 460 }}>
                      <TextField
                        select
                        fullWidth
                        size='small'
                        label='When they tap it, open'
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                      >
                        {(options.destinations || []).map(d => (
                          <MenuItem key={d.key} value={d.key}>
                            {d.label}
                            {d.works_today ? '' : '  (needs an app update)'}
                          </MenuItem>
                        ))}
                      </TextField>
                      {chosen ? (
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                          {chosen.hint}
                        </Typography>
                      ) : null}
                      {chosen && !chosen.works_today ? (
                        <Alert severity='warning' sx={{ mt: 2 }}>
                          Phones running the current app build do not know this destination yet and will
                          open at the home screen instead. It starts working once the app update is
                          released.
                        </Alert>
                      ) : null}
                    </Box>
                  ) : (
                    <Alert severity='info' sx={{ mt: 2, maxWidth: 560 }}>
                      It will show on the phone once and then be gone — there will be nothing in the
                      notification tab to come back to. Tapping it opens the app at the home screen.
                    </Alert>
                  )}
                </CardContent>

                <Divider sx={{ m: '0 !important' }} />

                {/* ── 4. preview and send ─────────────────────────────── */}
                <CardContent>
                  <Grid2 container spacing={4} alignItems='center'>
                    <Grid2 size={{ xs: 12, md: 7 }}>
                      <Typography variant='subtitle2' sx={{ mb: 2 }}>
                        How it will look
                      </Typography>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: 'customColors.surfaceSunken',
                          display: 'flex',
                          gap: 3,
                          alignItems: 'flex-start'
                        }}
                      >
                        {bannerUrl ? (
                          <Box
                            component='img'
                            src={bannerUrl}
                            alt=''
                            sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }}
                          />
                        ) : null}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant='subtitle2' noWrap>
                            {title || 'Your title'}
                          </Typography>
                          {subHeading ? (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {subHeading}
                            </Typography>
                          ) : null}
                          <Typography variant='body2' color='text.secondary'>
                            {body || 'Your message'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 5 }}>
                      <Stack spacing={2} alignItems='flex-end'>
                        <Typography variant='h6' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {n(willSendTo)} {willSendTo === 1 ? 'person' : 'people'}
                        </Typography>
                        <Button
                          size='large'
                          variant='contained'
                          disabled={!ready}
                          onClick={() => setConfirming(true)}
                          startIcon={
                            sending ? (
                              <CircularProgress size={16} color='inherit' />
                            ) : (
                              <Icon icon='tabler:send' />
                            )
                          }
                        >
                          {sending ? 'Sending…' : 'Send now'}
                        </Button>
                        {!title.trim() ? (
                          <Typography variant='caption' color='text.secondary'>
                            A title is needed before this can be sent.
                          </Typography>
                        ) : null}
                        {title.trim() && willSendTo === 0 ? (
                          <Typography variant='caption' color='text.secondary'>
                            Tick at least one person.
                          </Typography>
                        ) : null}
                      </Stack>
                    </Grid2>
                  </Grid2>
                </CardContent>
              </>
            )}
          </Card>
        </Grid2>
      </Grid2>

      {/*
        The last chance to notice a mistake. It restates the audience in words
        rather than asking "are you sure" — the number is the thing somebody
        needs to read, and it is deliberately not the same number as the one
        on the button when some of those people are signed out.
      */}
      <Dialog open={confirming} onClose={() => setConfirming(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Send this notification?</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            <Typography variant='body2' sx={{ mb: 3 }}>
              It goes to <strong>{n(willSendTo)} people</strong>
              {mode === 'function' && fn ? ` on ${fn.function_name}` : ''}, and will appear right now
              on <strong>{n(summary?.reachable_devices)} phones</strong>.
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              {keepInTab === 'yes'
                ? `It stays in their notification tab, and opens ${chosen?.label?.toLowerCase() || 'the home screen'}.`
                : 'It is not kept in the notification tab — once it is dismissed it is gone.'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              This cannot be undone.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant='contained' onClick={send}>
            Send it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

ComposeNotification.acl = {
  action: 'read',
  subject: 'sendnotification'
}

export default ComposeNotification
