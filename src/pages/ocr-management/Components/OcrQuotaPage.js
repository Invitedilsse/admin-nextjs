import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

import { apiGet, apiPut } from 'src/hooks/axios'
import { ocrUserQuotaListUrl, ocrUserQuotaUrl } from 'src/services/pathConst'
import { Card, Grid2 } from '@mui/material'
import { HexColorPicker } from 'react-colorful'

const OcrQuotaPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [addCount, setAddCount] = useState('0')
  const [customPlanName, setCustomPlanName] = useState('')
  const [saving, setSaving] = useState(false)
  const [customBackgroundColor,setCustomBackgroundColor] = useState('#FF9F43')
  // useEffect(() => {
  //   if (userData?.userrole_type !== 'super-admin') router.push('/home')
  // }, [userData])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiGet(ocrUserQuotaListUrl)
      setUsers(res.data || [])
    } catch (e) {
      console.error('Failed to fetch quota list:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openDialog = (user) => {
    setSelectedUser(user)
    setCustomPlanName(user.custom_plan)
    setCustomBackgroundColor(user.custom_color)
    setAddCount('0')
    setDialogOpen(true)
  }

  const handleAddAttempts = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      await apiPut(ocrUserQuotaUrl(selectedUser.id), { addAttempts: parseInt(addCount),custom_plan:customPlanName,custom_color:customBackgroundColor })
      setDialogOpen(false)
      fetchData()
    } catch (e) {
      console.error('Failed to update quota:', e)
      alert('Failed to update. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'User',
      Cell: ({ row }) => (
        <Box>
          <Typography variant='body2' fontWeight={600}>
            {[row.original.name, row.original.last_name].filter(Boolean).join(' ') || '-'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {row.original.mobile || row.original.email || ''}
          </Typography>
        </Box>
      )
    },
    {
      accessorKey: 'attempts_used',
      header: 'Usage',
      Cell: ({ row }) => {
        const used = row.original.attempts_used
        const allowed = row.original.attempts_allowed
        const pct = allowed > 0 ? used / allowed : 1
        const exceeded = used >= allowed
        return (
          <Box minWidth={120}>
            <Box display='flex' justifyContent='space-between' mb={0.5}>
              <Typography variant='caption' color={exceeded ? 'error' : 'text.primary'}>
                {used} / {allowed} used
              </Typography>
              {exceeded && <Chip label='LOCKED' size='small' color='error' sx={{ height: 18, fontSize: 10 }} />}
              {!exceeded && allowed - used <= 1 && (
                <Chip label='LOW' size='small' color='warning' sx={{ height: 18, fontSize: 10 }} />
              )}
            </Box>
            <LinearProgress
              variant='determinate'
              value={Math.min(pct * 100, 100)}
              color={exceeded ? 'error' : pct >= 0.8 ? 'warning' : 'primary'}
              sx={{ borderRadius: 4, height: 6 }}
            />
          </Box>
        )
      }
    },
    {
      accessorKey: 'attempts_allowed',
      header: 'Allowed',
      Cell: ({ row }) => row.original.attempts_allowed
    },
     {
      accessorKey: 'custom_plan',
      header: 'Custom Plan Name',
      Cell: ({ row }) => row.original.custom_plan
    },
    {
      accessorKey: 'quota_updated_at',
      header: 'Last Updated',
      Cell: ({ row }) =>
        row.original.quota_updated_at
          ? new Date(row.original.quota_updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : 'Never used'
    },
    {
      accessorKey: 'registered_at',
      header: 'Registered',
      Cell: ({ row }) =>
        row.original.registered_at
          ? new Date(row.original.registered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '-'
    },
    {
      id: 'actions',
      header: 'Actions',
      Cell: ({ row }) => (
        <Button
          size='small'
          variant='outlined'
          color='primary'
          onClick={() => openDialog(row.original)}
          sx={{ textTransform: 'none' }}
        >
          + Add Scans
        </Button>
      )
    }
  ]

  const table = useMaterialReactTable({
    columns,
    data: users,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    layoutMode: 'grid-no-grow',
    enableTopToolbar: true,
    renderTopToolbarCustomActions: () => (
      <Box display='flex' alignItems='center' gap={2} p={1}>
        <Typography variant='h6'>OCR Scan Quota</Typography>
        <Chip label={`${users.length} users`} size='small' />
        <Chip
          label={`${users.filter(u => u.attempts_used >= u.attempts_allowed).length} locked`}
          size='small'
          color='error'
        />
      </Box>
    ),
    state: { isLoading: loading, showProgressBars: loading }
  })

  return (
    <>
      <Box sx={{ p: 3 }}>
        <MaterialReactTable table={table} />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Add Scans for {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' mb={2}>
            Current: {selectedUser?.attempts_used} used / {selectedUser?.attempts_allowed} allowed
          </Typography>
          <TextField
            label='Scans to Add'
            type='number'
            value={addCount}
            onChange={e => setAddCount(e.target.value)}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
            size='small'
          />
           <TextField
            label='Custom Plan Name'
            type='text'
            value={customPlanName}
            onChange={e => setCustomPlanName(e.target.value)}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
            size='small'
            className='m-2'
          />
           <Grid2  size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card variant='outlined' sx={{ borderRadius: 3, overflow: 'hidden' }}>
                              <Box sx={{ height: 70, background: customBackgroundColor, borderBottom: '1px solid #eee' }} />
                              <Box sx={{ p: 2 }}>
                                <Typography variant='subtitle2' sx={{ mb: 2 }}>Select Background color</Typography>
                                <HexColorPicker
                                  color={customBackgroundColor}
                                  onChange={color => setCustomBackgroundColor(color)}
                                  style={{ width: '100%', height: 140 }}
                                />
                                <TextField
                                  fullWidth size='small' sx={{ mt: 2 }}
                                  value={customBackgroundColor}
                                  onChange={e => setCustomBackgroundColor(e.target.value)}
                                />
                              </Box>
                            </Card>
                          </Grid2>
          <Typography variant='caption' color='text.secondary' mt={1} display='block'>
            New total allowed: {(selectedUser?.attempts_allowed || 0) + parseInt(addCount || 0)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleAddAttempts} disabled={saving}>
            {saving ? 'Saving...' : 'Add Scans'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default OcrQuotaPage
