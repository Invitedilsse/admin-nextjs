import React, { useEffect, useState } from 'react'
import { Button, Box, CardContent, Divider, Card } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiGet } from 'src/hooks/axios'
import { notificationCountList } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
// import AddCustomMessageDrawer from './addCustomMessageDrawer'
import { handleIsViewNotifiinDetail } from 'src/store/adminMod'
import NotifiDetailsByStatusTab from './notifiDetailsByStatusTab'

function CountLisNotificationReport({}) {
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId, isViewNotfiInDetail } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [isdataloading, setisdataloading] = useState(false)
  const dispatch = useDispatch()
  const [type, setType] = useState('')
  const [oid, setOid] = useState('')
  const generateColumns = ({}) => [
    {
      accessorKey: 'eventname',
      header: 'Title',
      Cell: ({ row }) => {
        // const date = new Date(row.original.mapped_access)
        return `${row.original.eventname || '-'}`
      }
    },
    {
      accessorKey: 'msg',
      header: 'Message',
      Cell: ({ row }) => row.original.msg || '-'
    },
    {
      accessorKey: 'msgtype',
      header: 'Message Type',
      Cell: ({ row }) => row.original.msgtype || '-'
    },
    {
      accessorKey: 'seen_count',
      header: 'Seen Count',
      Cell: ({ row }) => `${row.original.seen_count || '0'}/${row.original.total_notifications}`
    },
    {
      accessorKey: 'unseen_count',
      header: 'Unseen Count',
      Cell: ({ row }) => `${row.original.unseen_count || '0'}/${row.original.total_notifications}`
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
    let incomingtype = rowdata.msgtype
    setType(incomingtype)
    setOid(rowdata.oid)
    dispatch(handleIsViewNotifiinDetail({ isViewDetail: true }))
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
      const response = await apiGet(`${notificationCountList}?functionId=${functionId}`)
      console.log('fetching role list:', response.data)
      let d = (response.data.data.counts || []).map(item => (item.msgtype !== 'TOTAL' ? item : null)).filter(Boolean)
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

  console.log('isViewInDetail------>', isViewNotfiInDetail)
  return (
    <>
      {!isViewNotfiInDetail ? (
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
          <NotifiDetailsByStatusTab type={type} poid={oid} />
        </>
      )}
    </>
  )
}

export default CountLisNotificationReport
