import React, { useEffect, useState } from 'react'
import {
  Button,
  Box,
  CardContent,
  Divider,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CardHeader,
  TextField,
  IconButton,
  Icon,
  Avatar,
  Chip
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Add } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { LoadingButton } from '@mui/lab'
import WebsiteRedirectFormDialog from './WebsiteRedirectFormDialog'

function ListWebsiteRedirect({ page }) {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [rows, setRows] = useState([])
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const toggleFormDialog = () => {
    setFormOpen(!formOpen)
  }

  const handleAddClick = () => {
    setSelectedRow(null)
    setFormOpen(true)
  }

  const handleEditClick = rowData => {
    setSelectedRow(rowData)
    setFormOpen(true)
  }

  const toggleDialog = id => {
    setdelId(id)
    setdOpen(true)
  }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

  const handleDeleteData = async () => {
    setDelLoading(true)
    try {
      // Adjust this path to match your actual delete route.
      await apiDelete(`${baseURL}ad/delete-webredirect/${delId}`)
      fetchData()
      toast.success('Deleted successfully')
    } catch (err) {
      console.error('Failed to delete website redirect:', err)
      toast.error('Delete failed')
    } finally {
      setDelLoading(false)
      setdOpen(false)
      setdelId('')
    }
  }

  const formatDate = value => {
    if (!value) return '-'
    const d = new Date(value)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }

  const generateColumns = ({ onEditClick, onDeleteClick }) => [
    {
      accessorKey: 'logo',
      header: 'Logo',
      Cell: ({ row }) => (
        <Avatar
          src={row.original.logo?.url || 'NA'}
          variant='rounded'
          sx={{ width: 40, height: 40 }}
        />
      )
    },
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) => row.original.name || '-'
    },
    {
      accessorKey: 'linkname_1',
      header: 'Platform',
      Cell: ({ row }) => row.original.linkname_1 || '-'
    },
    {
      accessorKey: 'link_1',
      header: 'Link',
      Cell: ({ row }) =>
        row.original.link_1 ? (
          <a href={row.original.link_1} target='_blank' rel='noreferrer'>
            {row.original.link_1}
          </a>
        ) : (
          '-'
        )
    },
    {
      accessorKey: 'active_from',
      header: 'Active From',
      Cell: ({ row }) => formatDate(row.original.active_from)
    },
    {
      accessorKey: 'active_till',
      header: 'Active Till',
      Cell: ({ row }) => formatDate(row.original.active_till)
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      Cell: ({ row }) => (
        <Chip
          size='small'
          label={row.original.is_active ? 'Active' : 'Inactive'}
          color={row.original.is_active ? 'success' : 'default'}
        />
      )
    },
    {
      accessorKey: 'Action',
      header: 'Actions',
      Cell: ({ row }) => (
        <>
          <Edit sx={{ cursor: 'pointer', mr: 3 }} onClick={() => onEditClick(row.original)} />
          <DeleteOutline color='error' sx={{ cursor: 'pointer' }} onClick={() => onDeleteClick(row.original.id)} />
        </>
      )
    }
  ]

  const table = useMaterialReactTable({
    columns: generateColumns({
      onEditClick: handleEditClick,
      onDeleteClick: toggleDialog
    }),
    data: rows,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: totalcount,
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    manualPagination: true,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false
  })

  // Adjust this path to match your actual list route (wired to listWesiteRedirect on the backend).
  const fetchData = async () => {
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${baseURL}ad/getall-redirectlink?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}`
      )
      setRows(response.data.data || [])
      setTotalCount(response.data.count || 0)
    } catch (error) {
      console.error('Error fetching website redirects:', error)
    } finally {
      setisdataloading(false)
    }
  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, pagination?.pageIndex, pagination?.pageSize])

  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
            }}
          >
            <CardHeader title='Website Redirects' />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent></CardContent>
            <Grid2 container spacing={2} px={4} display='flex' justifyContent='space-between' alignItems='center'>
              <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
                <TextField
                  variant='outlined'
                  size='small'
                  value={tempSearchText}
                  fullWidth
                  sx={{ mr: 4 }}
                  placeholder='Search Website Redirects'
                  onChange={e => handleDebouncedSearch(e.target.value)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault()
                      setSearchText(tempSearchText)
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <IconButton onClick={() => setSearchText(tempSearchText)}>
                          <Icon icon='fluent:search-20-regular' width={20} height={20} />
                        </IconButton>
                      )
                    }
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }} display='flex' justifyContent='flex-end'>
                <Button variant='contained' startIcon={<Add />} onClick={handleAddClick}>
                  Add Website Redirect
                </Button>
              </Grid2>
            </Grid2>
            <Box p={4} mt={4}>
              <MaterialReactTable table={table} />
            </Box>
          </Card>
        </Grid2>
      </Grid2>

      <WebsiteRedirectFormDialog
        open={formOpen}
        toggle={toggleFormDialog}
        id={selectedRow?.id}
        RowData={selectedRow}
        getAll={fetchData}
      />

      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {`Are you sure you want to delete this website redirect?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton loading={delLoading} variant='contained' onClick={handleDeleteData} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ListWebsiteRedirect