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
  getnotification
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { LoadingButton } from '@mui/lab'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import { handleIsViewinDetail } from 'src/store/adminMod'
import DetailByStatusTabs from './DetailByStatusTabs'

function CountListInviteReport({}) {
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId, isViewInDetail } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [isdataloading, setisdataloading] = useState(false)
  const dispatch = useDispatch()
  const [type, setType] = useState('')
  const generateColumns = ({}) => [
    {
      accessorKey: 'title',
      header: 'Event Type',
      Cell: ({ row }) => row.original.title || '-'
    },
    {
      accessorKey: 'not_sent_count',
      header: 'Not Sent',
      Cell: ({ row }) => {
        // const date = new Date(row.original.mapped_access)
        return `${row.original.not_sent_count || '0'}/${row.original.total_count}`
      }
    },
    {
      accessorKey: 'sent_count',
      header: 'Sent Count',
      Cell: ({ row }) => `${row.original.sent_count || '0'}/${row.original.total_count}`
    },
    {
      accessorKey: 'not_received_count',
      header: 'Not Received Count',
      Cell: ({ row }) => `${row.original.not_received_count || '0'}/${row.original.total_count}`
    },
    {
      accessorKey: 'received_count',
      header: 'Received Count',
      Cell: ({ row }) => `${row.original.received_count || '0'}/${row.original.total_count}`
    },
    {
      accessorKey: 'seen_count',
      header: 'Seen Count',
      Cell: ({ row }) => `${row.original.seen_count || '0'}/${row.original.total_count}`
    },
    {
      accessorKey: 'not_seen_count',
      header: 'Not Seen Count',
      Cell: ({ row }) => `${row.original.not_seen_count || '0'}/${row.original.total_count}`
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
    let incomingtype =
      rowdata.report_type === 'master_invite'
        ? 'function'
        : rowdata.report_type === 'pre_invite'
          ? 'otherinfo'
          : rowdata.report_type.includes('notification-') && rowdata.report_type
    setType(incomingtype)
    dispatch(handleIsViewinDetail({ isViewDetail: true }))
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
      const response = await apiGet(`${getFunctionReportsCount}?functionId=${functionId}`)
      console.log('fetching role list:', response.data)
      let d = response.data.data[0].reports || []
      console.log('d------>', d)
      const transformedData = []

      d.forEach(e => {
        if (e.report_type !== 'event_reminders') {
          transformedData.push({
            ...e,
            title: e.report_type === 'master_invite' ? 'Master Invitation' : 'Pre Invitation'
          })
        } else {
          transformedData.push(
            ...e.reports.map(d => ({
              ...d,
              report_type: d.type,
              title:
                d.type === 'notification-event'
                  ? 'Event Reminders'
                  : d.type === 'notification-transportation'
                    ? 'Transportation Reminders'
                    : 'Accommodation Reminders'
            }))
          )
        }
      })
      console.log('transformedData------>', transformedData)

      setContactsFunctionAll(transformedData || [])
    } catch (error) {
      console.error('Error fetching role list:', error)
    } finally {
      setisdataloading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  console.log('isViewInDetail------>', isViewInDetail)
  return (
    <>
      {!isViewInDetail ? (
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
          <DetailByStatusTabs type={type} />
        </>
      )}
    </>
  )
}

export default CountListInviteReport
