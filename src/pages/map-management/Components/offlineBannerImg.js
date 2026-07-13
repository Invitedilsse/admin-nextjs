import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { useMaterialReactTable, MaterialReactTable } from 'material-react-table'
import { toast } from 'react-hot-toast'

import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CloseIcon from '@mui/icons-material/Close'

import { apiGet, apiPost, apiDelete } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'

const BANNER_LIST_URL = `${baseURL}map-management/get-offline-page-banner`
const BANNER_CREATE_URL = `${baseURL}map-management/create-offline-page-banner`
const BANNER_DELETE_URL = `${baseURL}map-management/delete-offline-page-banner`
const UPLOAD_URL = `${baseURL}admin/upload-doc`

const OfflinePageBannersPage = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalcount, setTotalcount] = useState(0)

//   useEffect(() => {
//     if (userData?.userrole_type !== 'super-admin') router.push('/home')
//   }, [userData])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet(BANNER_LIST_URL)
      console.log("banner res------------->",res)
      setBanners(res.data.data || [])
      setTotalcount(res.data?.data?.length || 0)
    } catch (e) {
      setError('Failed to load banners: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [pagination.pageIndex, pagination.pageSize])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // reset input so same file can be re-uploaded if needed
    fileInputRef.current.value = ''

    try {
      setUploading(true)
      setError('')

      // Step 1 — upload to storage
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await apiPost(UPLOAD_URL, formData, true)
      const { key, url, file_name } = uploadRes?.data?.detail || {}

      if (!url || !key || !file_name) {
        throw new Error('Upload response missing expected fields')
      }

      // Step 2 — save to DB
      await apiPost(BANNER_CREATE_URL, {
        file: { key, url, file_name }
      })

      toast.success('Banner added successfully')
      await load()
    } catch (e) {
      setError('Upload failed: ' + (e?.message || JSON.stringify(e)))
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      await apiDelete(`${BANNER_DELETE_URL}/${deleteId}`)
      toast.success('Banner removed')
      setDeleteId(null)
      await load()
    } catch (e) {
      setError('Delete failed: ' + (e?.message || JSON.stringify(e)))
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      accessorKey: 'file',
      header: 'Preview',
      size: 100,
      Cell: ({ row }) => {
        const url = row.original?.file?.url
        return url ? (
          <Box
            component='img'
            src={url}
            alt='banner'
            sx={{
              width: 72,
              height: 48,
              objectFit: 'cover',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer'
            }}
            onClick={() => setPreviewUrl(url)}
          />
        ) : '—'
      }
    },
    {
      accessorFn: row => row.file?.file_name || '—',
      header: 'File name',
      size: 260,
    },
    {
      accessorFn: row => row.created_at
        ? new Date(row.created_at).toLocaleString()
        : '—',
      header: 'Uploaded at',
      size: 200,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      Cell: ({ row }) => (
        <Box display='flex' gap={0.5}>
          <Tooltip title='Preview'>
            <IconButton
              size='small'
              onClick={() => setPreviewUrl(row.original?.file?.url)}
              disabled={!row.original?.file?.url}
            >
              <VisibilityIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton
              size='small'
              color='error'
              onClick={() => setDeleteId(row.original.id)}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  const table = useMaterialReactTable({
    columns,
    data: banners,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: false,
    layoutMode: 'grid-no-grow',
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: totalcount,
    state: { pagination, isLoading: loading },
    onPaginationChange: setPagination,
    manualPagination: true,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false
  })

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={0.5}>Offline Page Banners</Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Manage banner images shown on the offline event landing page. Each uploaded image is saved and listed below.
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Upload */}
      <Box display='flex' alignItems='center' gap={2} mb={3}>
        <input
          type='file'
          accept='image/*'
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <Button
          variant='contained'
          startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : <UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          sx={{ background: '#F5A742', '&:hover': { background: '#e0962e' }, whiteSpace: 'nowrap' }}
        >
          {uploading ? 'Uploading...' : 'Upload banner'}
        </Button>
        <Typography variant='caption' color='text.secondary'>
          Accepted: JPG, PNG, WebP
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <MaterialReactTable table={table} />

      {/* Preview dialog */}
      <Dialog
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        maxWidth='md'
        fullWidth
      >
        <DialogContent sx={{ p: 1, position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewUrl(null)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'background.paper' }}
            size='small'
          >
            <CloseIcon fontSize='small' />
          </IconButton>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='preview'
              sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)} maxWidth='xs' fullWidth>
        <DialogContent>
          <Typography fontWeight={600} mb={1}>Remove this banner?</Typography>
          <Typography variant='body2' color='text.secondary' mb={3}>
            This will permanently delete the banner from the page.
          </Typography>
          <Box display='flex' justifyContent='flex-end' gap={1}>
            <Button variant='outlined' onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Removing...' : 'Remove'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default OfflinePageBannersPage