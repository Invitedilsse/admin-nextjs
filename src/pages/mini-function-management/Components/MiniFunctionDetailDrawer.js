import React, { useEffect, useState } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import { apiGet } from 'src/hooks/axios'
import { miniFunctionAdminDetailUrl } from 'src/services/pathConst'
import { whenText } from './bands'

const Row = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
    <Typography sx={{ minWidth: 150, color: 'text.secondary' }}>{label}</Typography>
    <Typography sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
  </Box>
)

const Section = ({ title, children }) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant='h6' sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Box>
)

const MiniFunctionDetailDrawer = ({ open, onClose, functionId }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!open || !functionId) return

    // Cleared first, or the previous function's events sit on screen while
    // this one loads and read as this one's.
    setData(null)
    setLoading(true)

    apiGet(`${miniFunctionAdminDetailUrl}/${functionId}`)
      .then(res => setData(res?.data?.detail || res?.data?.data || null))
      .catch(() => toast.error('Could not load this mini function'))
      .finally(() => setLoading(false))
  }, [open, functionId])

  const events = data?.events || []
  const guests = data?.guests || []
  const signatures = data?.signatures || []
  const files = data?.files || []

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: false }}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 5 }}>
        <Typography variant='h5'>{data?.function_name || 'Mini function'}</Typography>
        <IconButton onClick={onClose}>
          <Icon icon='tabler:x' />
        </IconButton>
      </Box>
      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      ) : !data ? (
        <Box sx={{ p: 6 }}>
          <Typography color='text.secondary'>Nothing to show.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 5, overflowY: 'auto' }}>
          <Section title='Function'>
            <Row label='Occasion' value={data.occasion_name} />
            <Row label='Status' value={data.status} />
            <Row label='Published' value={data.published_at ? String(data.published_at).slice(0, 19).replace('T', ' ') : 'Not yet'} />
            <Row label='Description' value={data.description} />
            <Row label='Master invite files' value={files.length} />
          </Section>

          <Section title='Host'>
            <Row label='Account' value={data.host?.name} />
            <Row label='Account mobile' value={[data.host?.country_code, data.host?.mobile].filter(Boolean).join(' ')} />
            <Row label='Name on invitation' value={data.host_name} />
            <Row label='Number on invitation' value={[data.country_code, data.host_number].filter(Boolean).join(' ')} />
            <Row label='Address' value={data.host_address} />
          </Section>

          <Section title={`Events (${events.length})`}>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>When</TableCell>
                    <TableCell>Venue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{e.event_name}</TableCell>
                      <TableCell>{whenText(e.event_date, e.start_time, e.time_slot)}</TableCell>
                      <TableCell>{[e.venue_name, e.location_name].filter(Boolean).join(' - ')}</TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>No events.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Section title={`Guests (${guests.length})`}>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size='small' stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>No.</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Invited to</TableCell>
                    <TableCell>Sent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guests.map(g => (
                    <TableRow key={g.id}>
                      <TableCell>{g.guest_number || '-'}</TableCell>
                      <TableCell>{g.name}</TableCell>
                      <TableCell>{[g.country_code, g.mobile].filter(Boolean).join(' ')}</TableCell>
                      <TableCell>
                        {(g.events || []).length === 0 ? (
                          // Worth marking: this guest is on the list and
                          // would receive nothing on a dispatch.
                          <Chip size='small' color='warning' label='nothing' />
                        ) : (
                          (g.events || []).join(', ')
                        )}
                      </TableCell>
                      <TableCell>
                        {g.dispatched_at ? (
                          <Chip size='small' color='success' label='yes' />
                        ) : (
                          <Chip size='small' label='waiting' />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {guests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>No guests.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          {signatures.length > 0 && (
            <Section title='Shared with other functions'>
              <Typography sx={{ mb: 2, color: 'text.secondary' }}>
                These are at the same place, on the same date, in the same part of the day.
              </Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Venue</TableCell>
                      <TableCell>The other functions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {signatures.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{String(s.event_date).slice(0, 10)}</TableCell>
                        <TableCell>{s.anchor_venue_name}</TableCell>
                        <TableCell>
                          {(s.other_functions || []).length === 0 ? (
                            // The count says more than one function is on
                            // this event but none is named: the other one
                            // has since been deleted.
                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                              {Number(s.function_count) > 1
                                ? `${s.function_count} functions, none still active`
                                : 'Only this one'}
                            </Typography>
                          ) : (
                            (s.other_functions || []).map(o => (
                              <Box key={o.id} sx={{ mb: 1 }}>
                                <Typography sx={{ fontWeight: 500 }}>
                                  {o.function_name || 'Untitled'}
                                </Typography>
                                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                  {o.host_name || 'Unknown host'}
                                  {o.status ? ` - ${o.status}` : ''}
                                </Typography>
                              </Box>
                            ))
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>
          )}
        </Box>
      )}
    </Drawer>
  )
}

export default MiniFunctionDetailDrawer
