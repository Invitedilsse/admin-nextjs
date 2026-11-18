import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/hooks/axios'
import {
  miniFunctionAdminListUrl,
  miniFunctionBlockedTermUrl,
  miniFunctionBlockedTermsUrl,
  miniFunctionMatchesUrl,
  miniFunctionOccasionsUrl,
  miniFunctionOccasionUrl,
  miniFunctionEventNamesUrl,
  miniFunctionEventNameUrl,
  miniFunctionOverrideUrl,
  miniFunctionOverridesUrl,
  miniFunctionSettingUrl,
  miniFunctionSettingsUrl
} from 'src/services/pathConst'
import MiniFunctionDetailDrawer from './Components/MiniFunctionDetailDrawer'
import { bandLabel, timeText } from './Components/bands'
import NameListTab from './Components/NameListTab'

// The server answers as { message, detail } on some routes and
// { message, data } on others. One reader, so a route that uses the other
// shape does not silently render an empty table.
const payload = res => res?.data?.detail ?? res?.data?.data ?? null

const rowsOf = res => {
  const body = payload(res)

  return Array.isArray(body) ? body : []
}

const totalOf = (res, fallback) =>
  typeof res?.data?.total === 'number' ? res.data.total : fallback

// Only the caps belong on this screen. The other settings are the
// duplicate matcher's, which has its own review queue.
const CAP_KEYS = ['mini_max_guests', 'mini_max_events', 'mini_quota_enforced']

const MiniFunctionManagement = () => {
  const [tab, setTab] = useState('functions')

  // ── the list ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [functions, setFunctions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState(null)

  // ── caps ──────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState([])
  const [edits, setEdits] = useState({})
  const [overrides, setOverrides] = useState([])
  // One field in the form, two names on the wire: a user override is
  // addressed by mobile number, a function override still by its id.
  const [newOverride, setNewOverride] = useState({
    scope: 'user',
    who: '',
    max_guests: '',
    max_events: '',
    reason: ''
  })

  // ── the same real-world event, entered twice ──────────────────────────
  const [matches, setMatches] = useState([])
  const [matchSearch, setMatchSearch] = useState('')

  // ── red flags ─────────────────────────────────────────────────────────
  const [terms, setTerms] = useState([])
  const [newTerm, setNewTerm] = useState({ term: '', note: '' })

  const loadFunctions = useCallback(async () => {
    setLoading(true)

    try {
      const query = [
        `limit=${limit}`,
        `offset=${page * limit}`,
        search ? `search=${encodeURIComponent(search)}` : '',
        status ? `status=${status}` : ''
      ]
        .filter(Boolean)
        .join('&')

      const res = await apiGet(`${miniFunctionAdminListUrl}?${query}`)
      const rows = rowsOf(res)

      setFunctions(rows)
      setTotal(totalOf(res, rows.length))
    } catch (e) {
      toast.error('Could not load mini functions')
    } finally {
      setLoading(false)
    }
  }, [limit, page, search, status])

  const loadCaps = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        apiGet(miniFunctionSettingsUrl),
        apiGet(`${miniFunctionOverridesUrl}?limit=100&offset=0`)
      ])

      setSettings(rowsOf(s))
      setOverrides(rowsOf(o))
      // Any half-typed edit belongs to the values just replaced.
      setEdits({})
    } catch (e) {
      toast.error('Could not load the caps')
    }
  }, [])

  const loadMatches = useCallback(async () => {
    setLoading(true)

    try {
      const query = [
        'limit=50',
        'offset=0',
        matchSearch ? `search=${encodeURIComponent(matchSearch)}` : ''
      ]
        .filter(Boolean)
        .join('&')

      setMatches(rowsOf(await apiGet(`${miniFunctionMatchesUrl}?${query}`)))
    } catch (e) {
      toast.error('Could not load the matches')
    } finally {
      setLoading(false)
    }
  }, [matchSearch])

  const loadTerms = useCallback(async () => {
    try {
      const res = await apiGet(`${miniFunctionBlockedTermsUrl}?limit=200&offset=0`)
      setTerms(rowsOf(res))
    } catch (e) {
      toast.error('Could not load the red-flag list')
    }
  }, [])

  useEffect(() => {
    if (tab === 'functions') loadFunctions()
  }, [tab, loadFunctions])

  useEffect(() => {
    if (tab === 'caps') loadCaps()
  }, [tab, loadCaps])

  useEffect(() => {
    if (tab === 'matches') loadMatches()
  }, [tab, loadMatches])

  useEffect(() => {
    if (tab === 'flags') loadTerms()
  }, [tab, loadTerms])

  const saveSetting = async key => {
    const raw = edits[key]

    if (raw === undefined || raw === '') return

    const setting = settings.find(s => s.key === key)
    const isText = setting && setting.value_int === null

    try {
      await apiPut(miniFunctionSettingUrl, {
        key,
        value_int: isText ? null : Number(raw),
        value_text: isText ? String(raw) : null
      })
      toast.success('Saved')
      loadCaps()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save')
    }
  }

  const saveOverride = async () => {
    const isUser = newOverride.scope === 'user'

    if (!newOverride.who.trim()) {
      toast.error(isUser ? 'Enter the mobile number first' : 'Paste the function id first')

      return
    }

    if (!newOverride.max_guests && !newOverride.max_events) {
      toast.error('Set a guest cap, an event cap, or both')

      return
    }

    try {
      await apiPost(miniFunctionOverrideUrl, {
        scope: newOverride.scope,
        // The server resolves a mobile to the account's id. Sending both
        // keys is refused, so only the one this scope uses goes.
        ...(isUser
          ? { scope_mobile: newOverride.who.trim() }
          : { scope_id: newOverride.who.trim() }),
        max_guests: newOverride.max_guests ? Number(newOverride.max_guests) : null,
        max_events: newOverride.max_events ? Number(newOverride.max_events) : null,
        reason: newOverride.reason || null
      })
      toast.success('Override saved')
      setNewOverride({ scope: 'user', who: '', max_guests: '', max_events: '', reason: '' })
      loadCaps()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save the override')
    }
  }

  const dropOverride = async id => {
    try {
      await apiDelete(`${miniFunctionOverrideUrl}/${id}`)
      toast.success('Override removed')
      loadCaps()
    } catch (e) {
      toast.error('Could not remove it')
    }
  }

  const saveTerm = async () => {
    const term = newTerm.term.trim()

    if (term.length < 2) {
      toast.error('A term needs at least two characters')

      return
    }

    try {
      await apiPost(miniFunctionBlockedTermUrl, { term, note: newTerm.note || null })
      toast.success('Added to the red-flag list')
      setNewTerm({ term: '', note: '' })
      loadTerms()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not add it')
    }
  }

  const dropTerm = async id => {
    try {
      await apiDelete(`${miniFunctionBlockedTermUrl}/${id}`)
      toast.success('Removed')
      loadTerms()
    } catch (e) {
      toast.error('Could not remove it')
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' sx={{ mb: 1 }}>
          Mini Functions
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 4 }}>
          Every mini function in the product, the caps that limit them, and the words hosts may not use.
        </Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 4 }}>
          <Tab value='functions' label='All functions' />
          <Tab value='matches' label='Matching functions' />
          <Tab value='occasions' label='Occasions' />
          <Tab value='eventnames' label='Event names' />
          <Tab value='caps' label='Caps' />
          <Tab value='flags' label='Red-flagged words' />
        </Tabs>

        {tab === 'functions' && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField
                size='small'
                label='Search'
                placeholder='MF number, function, host or mobile'
                value={search}
                onChange={e => {
                  setPage(0)
                  setSearch(e.target.value)
                }}
                sx={{ minWidth: 260 }}
              />
              <TextField
                size='small'
                select
                label='Status'
                value={status}
                onChange={e => {
                  setPage(0)
                  setStatus(e.target.value)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='published'>Published</MenuItem>
              </TextField>
              <Button variant='outlined' onClick={loadFunctions} startIcon={<Icon icon='tabler:refresh' />}>
                Refresh
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Number</TableCell>
                      <TableCell>Function</TableCell>
                      <TableCell>Occasion</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell align='right'>Events</TableCell>
                      <TableCell align='right'>Guests</TableCell>
                      <TableCell align='right'>Sent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Shared</TableCell>
                      <TableCell align='right'>View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {functions.map(f => (
                      <TableRow key={f.id} hover>
                        {/* MF-A-00001 - what a host reads off their phone,
                            and therefore what support is given to search on.
                            The search box matches it too. */}
                        <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                          {f.function_number || '-'}
                        </TableCell>
                        <TableCell>{f.function_name || '-'}</TableCell>
                        <TableCell>{f.occasion_name || '-'}</TableCell>
                        <TableCell>
                          {f.host_user_name || f.host_name || '-'}
                          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            {[f.country_code, f.host_number].filter(Boolean).join(' ')}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>{f.event_count}</TableCell>
                        <TableCell align='right'>{f.guest_count}</TableCell>
                        <TableCell align='right'>{f.dispatched_count}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={f.status}
                            color={f.status === 'published' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {/* Two or more functions on one real-world event. One is
                              just this function, so it is not worth a chip. */}
                          {Number(f.signature_peak) > 1 ? (
                            <Tooltip title='Another host has a function at the same place, date and time of day'>
                              <Chip size='small' color='warning' label={`${f.signature_peak} functions`} />
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Button size='small' onClick={() => setOpenId(f.id)}>
                            View all
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {functions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10}>No mini functions match.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              component='div'
              count={total}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(e, p) => setPage(p)}
              onRowsPerPageChange={e => {
                setLimit(parseInt(e.target.value, 10))
                setPage(0)
              }}
            />
          </Box>
        )}

        {tab === 'matches' && (
          <Box>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              One real-world event with more than one mini function on it: same place, same date, same part of the
              day. The first one entered is marked as the parent and the rest sit under it. Being grouped here is not
              an accusation &mdash; a large venue holds two unrelated bookings in a day.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
              <TextField
                size='small'
                label='Search'
                placeholder='Venue or function name'
                value={matchSearch}
                onChange={e => setMatchSearch(e.target.value)}
                sx={{ minWidth: 280 }}
              />
              <Button variant='outlined' onClick={loadMatches} startIcon={<Icon icon='tabler:refresh' />}>
                Refresh
              </Button>
            </Stack>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : matches.length === 0 ? (
              <Typography color='text.secondary'>
                Nothing is sharing an event. Every mini function is on its own.
              </Typography>
            ) : (
              matches.map(m => (
                <Card variant='outlined' key={m.id} sx={{ mb: 4 }}>
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      sx={{ alignItems: { sm: 'center' }, mb: 3 }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {String(m.event_date).slice(0, 10)}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        {m.anchor_venue_name || 'Venue not named'}
                      </Typography>
                      {/* The band is the grouping key, so it belongs on the
                          group rather than on any one row in it. */}
                      <Chip size='small' variant='outlined' label={bandLabel(m.anchor_time_slot) || 'No band'} />
                      <Chip size='small' color='warning' label={`${m.live_function_count} functions`} />
                    </Stack>

                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Function</TableCell>
                            <TableCell>Starts</TableCell>
                            <TableCell>Host</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align='right'>View</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(m.functions || []).map(f => (
                            <TableRow
                              key={f.id}
                              hover
                              // The parent is only whoever entered it first,
                              // so it is tinted rather than badged as the
                              // correct one.
                              sx={f.is_parent ? { backgroundColor: 'action.hover' } : undefined}
                            >
                              <TableCell>
                                {f.function_name || 'Untitled'}
                                {f.is_parent && (
                                  <Chip size='small' label='parent' sx={{ ml: 2 }} />
                                )}
                              </TableCell>
                              <TableCell>
                                {timeText(f.start_time, f.time_slot)}
                                {/* Two functions can share a group across a
                                    band boundary - 9:50 and 10:10 are 20
                                    minutes apart and in different bands - so
                                    a row whose band is not the group's is
                                    worth pointing at rather than hiding. */}
                                {f.time_slot != null &&
                                  m.anchor_time_slot != null &&
                                  f.time_slot !== m.anchor_time_slot && (
                                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                      {bandLabel(f.time_slot)}
                                    </Typography>
                                  )}
                              </TableCell>
                              <TableCell>
                                {f.host_name || '-'}
                                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                  {f.host_mobile || ''}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size='small'
                                  label={f.status}
                                  color={f.status === 'published' ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell align='right'>
                                <Button size='small' onClick={() => setOpenId(f.id)}>
                                  View all
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {tab === 'occasions' && (
          <NameListTab
            title='Occasions'
            blurb='What a host is offered in the Occasion dropdown when building a mini function. They can still type their own, which is why the red-flag list exists. This is separate from the Offline occasion list: editing here changes mini functions only.'
            placeholder='Housewarming'
            listUrl={miniFunctionOccasionsUrl}
            saveUrl={miniFunctionOccasionUrl}
            deleteUrl={miniFunctionOccasionUrl}
          />
        )}

        {tab === 'eventnames' && (
          <NameListTab
            title='Event names'
            blurb='What a host is offered when naming an event inside a mini function. Typing their own is still allowed and still red-flag checked.'
            placeholder='Mehendi'
            listUrl={miniFunctionEventNamesUrl}
            saveUrl={miniFunctionEventNameUrl}
            deleteUrl={miniFunctionEventNameUrl}
          />
        )}

        {tab === 'caps' && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Defaults
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              What every host gets unless an override below says otherwise.
            </Typography>

            <Grid container spacing={4}>
              {settings
                .filter(s => CAP_KEYS.includes(s.key))
                .map(s => (
                  <Grid size={{ xs: 12, md: 6 }} key={s.key}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography sx={{ fontWeight: 600 }}>{s.key}</Typography>
                        <Typography variant='body2' sx={{ color: 'text.secondary', mb: 3 }}>
                          {s.description}
                        </Typography>
                        <Stack direction='row' spacing={2}>
                          <TextField
                            size='small'
                            // A setting carries either a number or a word
                            // (the quota kill switch is 'on' or 'off'), and
                            // the one that is null is the one it does not use.
                            type={s.value_int === null ? 'text' : 'number'}
                            value={
                              edits[s.key] !== undefined
                                ? edits[s.key]
                                : s.value_int === null
                                ? s.value_text || ''
                                : s.value_int
                            }
                            onChange={e => setEdits({ ...edits, [s.key]: e.target.value })}
                          />
                          <Button variant='contained' onClick={() => saveSetting(s.key)}>
                            Save
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 6 }} />

            <Typography variant='h6' sx={{ mb: 2 }}>
              Overrides
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              A cap for one host or one function. A function override wins over a user override, and a user override
              wins over the default.
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
              <TextField
                size='small'
                select
                label='Scope'
                value={newOverride.scope}
                // Switching scope clears the box: a mobile number is not a
                // function id, and leaving it behind invites saving one as
                // the other.
                onChange={e => setNewOverride({ ...newOverride, scope: e.target.value, who: '' })}
                sx={{ minWidth: 130 }}
              >
                <MenuItem value='user'>User</MenuItem>
                <MenuItem value='function'>Function</MenuItem>
              </TextField>
              <TextField
                size='small'
                label={newOverride.scope === 'user' ? 'User mobile number' : 'Mini function id'}
                placeholder={newOverride.scope === 'user' ? '9710220344' : ''}
                value={newOverride.who}
                onChange={e => setNewOverride({ ...newOverride, who: e.target.value })}
                sx={{ minWidth: 320 }}
              />
              <TextField
                size='small'
                type='number'
                label='Max guests'
                value={newOverride.max_guests}
                onChange={e => setNewOverride({ ...newOverride, max_guests: e.target.value })}
                sx={{ minWidth: 130 }}
              />
              <TextField
                size='small'
                type='number'
                label='Max events'
                value={newOverride.max_events}
                onChange={e => setNewOverride({ ...newOverride, max_events: e.target.value })}
                sx={{ minWidth: 130 }}
              />
              <TextField
                size='small'
                label='Reason'
                value={newOverride.reason}
                onChange={e => setNewOverride({ ...newOverride, reason: e.target.value })}
                sx={{ minWidth: 220 }}
              />
              <Button variant='contained' onClick={saveOverride}>
                Save
              </Button>
            </Stack>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Scope</TableCell>
                    <TableCell>Who or what</TableCell>
                    <TableCell align='right'>Max guests</TableCell>
                    <TableCell align='right'>Max events</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align='right' />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overrides.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>{o.scope}</TableCell>
                      <TableCell>
                        {o.scope_label || o.scope_id}
                        {o.scope_mobile && (
                          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            {o.scope_mobile}
                          </Typography>
                        )}
                        {o.is_expired && <Chip size='small' color='warning' label='expired' sx={{ ml: 2 }} />}
                      </TableCell>
                      <TableCell align='right'>{o.max_guests ?? '-'}</TableCell>
                      <TableCell align='right'>{o.max_events ?? '-'}</TableCell>
                      <TableCell>{o.reason || '-'}</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => dropOverride(o.id)}>
                          <Icon icon='tabler:trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {overrides.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>No overrides. Everyone is on the defaults above.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 'flags' && (
          <Box>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              A host naming a mini function, its occasion or one of its events is refused if the name contains any of
              these words. Matching ignores case and looks anywhere in the name, so <b>wedding</b> also refuses
              &quot;Wedding Reception&quot; and &quot;pre-wedding shoot&quot;. This is separate from the occasion list,
              which is what hosts pick from.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
              <TextField
                size='small'
                label='Word to refuse'
                value={newTerm.term}
                onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
                sx={{ minWidth: 220 }}
              />
              <TextField
                size='small'
                label='Note (admin only)'
                value={newTerm.note}
                onChange={e => setNewTerm({ ...newTerm, note: e.target.value })}
                sx={{ minWidth: 320 }}
              />
              <Button variant='contained' onClick={saveTerm}>
                Add
              </Button>
            </Stack>

            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Word</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell>Added by</TableCell>
                    <TableCell align='right' />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {terms.map(t => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{t.term}</TableCell>
                      <TableCell>{t.note || '-'}</TableCell>
                      <TableCell>{t.created_by_name || '-'}</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => dropTerm(t.id)}>
                          <Icon icon='tabler:trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {terms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>Nothing is refused yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>

      <MiniFunctionDetailDrawer open={Boolean(openId)} functionId={openId} onClose={() => setOpenId(null)} />
    </Card>
  )
}

MiniFunctionManagement.acl = {
  action: 'read',
  subject: 'minifunction'
}

export default MiniFunctionManagement
