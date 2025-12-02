import React, { useEffect, useState } from 'react'
import {
  Checkbox,
  Button,
  Box,
  CircularProgress,
  CardContent,
  Divider,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Icon
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Delete, Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  deleteRoleList,
  getFilterListWA,
  getFunctionReportsCount,
  getListOfMappedContactTrigger,
  getnotification,
  rsvpCountList
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { LoadingButton } from '@mui/lab'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import { handleIsViewinDetail, handleIsViewRsvpinDetail } from 'src/store/adminMod'
import DetailByStatusTabs from './DetailByStatusTabs'
import RsvpDetailsByStatusTab from './RsvpDetailsByStatusTab'

function CountListRSVPReport({}) {
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId, isViewRsvpInDetail } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [isdataloading, setisdataloading] = useState(false)
  const dispatch = useDispatch()
  const [type, setType] = useState('')
  const [oid, setOid] = useState('')
  const generateColumns = ({}) => [
    {
      accessorKey: 'title',
      header: 'Title',
      Cell: ({ row }) => {
        // const date = new Date(row.original.mapped_access)
        return `${row.original.title || '-'}`
      }
    },
    {
      accessorKey: 'type',
      header: 'Event Type',
      Cell: ({ row }) => row.original.type || '-'
    },
    {
      accessorKey: 'invited',
      header: 'Invited Count',
      Cell: ({ row }) => `${row.original.invited || '0'}`
    },
    {
      accessorKey: 'attending_member',
      header: 'Attending member',
      Cell: ({ row }) => `${row.original.attending_member || '0'}`
    },
    {
      accessorKey: 'attendees',
      header: 'Attendees Count',
      Cell: ({ row }) => `${row.original.attendees || '0'}`
    },
    {
      accessorKey: 'not_attending',
      header: 'not attending Count',
      Cell: ({ row }) => `${row.original.not_attending || '0'}`
    },
    {
      accessorKey: 'not_yet_decided',
      header: 'not yet decided count',
      Cell: ({ row }) => `${row.original.not_yet_decided || '0'}`
    },
    // {
    //   accessorKey: 'total_count',
    //   header: 'Total Count',
    //   Cell: ({ row }) => row.original.total_count || '0'
    // },
    {
      accessorKey: 'action',
      header: 'View In Detail',
      Cell: ({ row }) => (
        // <Button variant='contained'  onClick={() => onTemplateClick(row.original)}>
        <Button variant='contained' onClick={() => showDetailedReports(row.original)}>
          View Detail
        </Button>
      )
      // </Button>
    }
  ]

  const handleTemplateClick = rowData => {
    setSelectedRow(rowData)
    setTemplateDrawerOpen(true)
  }

  const showDetailedReports = rowdata => {
    console.log('rowdata=====>', rowdata)
    let incomingtype = rowdata.type
    setType(incomingtype)
    setOid(rowdata.oid)
    dispatch(handleIsViewRsvpinDetail({ isViewDetail: true }))
  }

  const table = useMaterialReactTable({
    columns: generateColumns({ onTemplateClick: handleTemplateClick }),
    data: contactsFunctionAll,
    manualPagination: true,
    // rowCount: totalcount,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    enableTopToolbar: false
  })

  const fetchData = async () => {
    try {
      setisdataloading(true)
      const response = await apiGet(`${rsvpCountList}?functionId=${functionId}`)
      console.log('fetching role list:', response.data)
      let d = response.data.data || []
      console.log('d------>', d)

      setContactsFunctionAll(d || [])
    } catch (error) {
      console.error('Error fetching role list:', error)
    } finally {
      setisdataloading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  console.log('isViewInDetail------>', isViewRsvpInDetail)
  return (
    <>
      {!isViewRsvpInDetail ? (
        <>
          <Grid2 container spacing={6}>
            <Grid2 xs={12}>
              <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
                <Divider sx={{ m: '0 !important' }} />
                <CardContent />
                <Box p={4} sx={{ width: '100%' }}>
                  <MaterialReactTable
                    table={table}
                    muiTableContainerProps={{ sx: { width: '100%' } }}
                    muiTableBodyCellProps={{ sx: { whiteSpace: 'nowrap' } }}
                  />
                </Box>
              </Card>
            </Grid2>
          </Grid2>
        </>
      ) : (
        <>
          <RsvpDetailsByStatusTab type={type} oid={oid} />
        </>
      )}
    </>
  )
}

export default CountListRSVPReport
