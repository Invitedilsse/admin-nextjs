import { TabContext, TabPanel } from '@mui/lab'
import { Button, Card, CardContent, Divider, Grid2, Icon, IconButton, Tab, Tabs, TextField } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/system'
import { getListOfFunctionReport, handleIsViewinDetail } from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import { getAccessToken } from 'src/hooks/axios'
import axios from 'axios'
import { getFunctionReportList } from 'src/services/pathConst'
import { convertBase64Blob } from 'src/utils/blobconverter'

const DetailByStatusTabs = ({ type }) => {
  const [tabValue, setTabValue] = useState(1)
  const { functionId, isViewInDetail, functionReportDetailByStatus, isDataLoading } = useSelector(
    state => state.adminMod
  )
  const [apistatus, setApiStatus] = useState('sent')
  const [oid, setOid] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const dispatch = useDispatch()
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [displayDetails, setDisplayDetails] = useState({})
  const [filterList, setFilterList] = useState([])
  const [selectedColumns, setSelectedColumns] = useState([])
  const [isFirstTimeOid, setIsFirsttimeOid] = useState(false)
  //   const []
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const handleChangeTabValue = (event, newValue, status) => {
    setTabValue(newValue)
    setApiStatus(status)
  }

  const exportFunctionReportContact = async () => {
    try {
      const queryParams = `functionId=${functionId}&type=${type}&status=${apistatus}&search=${searchText}&oid=${oid}&excel=true&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.get(`${getFunctionReportList}?${queryParams}`, config)
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, result.data.fileName)
    } catch (err) {
      console.log('err inexcel report===>', err)
    }
  }
  const fetchContactList = () => {
    const queryParams = `functionId=${functionId}&type=${type}&status=${apistatus}&search=${searchText}&oid=${oid}&excel=false&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`
    dispatch(getListOfFunctionReport(queryParams))
  }
  const handelDisplayDtats = () => {
    console.log('functionReportDetailByStatus----->', functionReportDetailByStatus)
    setContactsFunctionAll(functionReportDetailByStatus.contacts ?? [])
    setDisplayDetails({ function: functionReportDetailByStatus.function, report: functionReportDetailByStatus.report })
    let d = functionReportDetailByStatus?.counts || []
    let fildata =
      d?.length > 0 && type.includes('notification-')
        ? d.map(l => {
            return { value: l.item_title + '-' + l.status_count, key: l.item_id }
          })
        : []
    console.log('d---------->', d)
    if (type.includes('notification-') && d?.length > 0 && isFirstTimeOid === false) {
      setOid(d[0].item_id)
      setSelectedColumns([{ value: d[0].item_title + '-' + d[0].status_count, key: d[0].item_id }])
      setIsFirsttimeOid(true)
    }
    setFilterList(fildata)
  }

  useEffect(() => {
    handelDisplayDtats()
  }, [functionReportDetailByStatus])
  useEffect(() => {
    if (isFirstTimeOid === false) {
      fetchContactList()
    }
  }, [tabValue, searchText, pagination?.pageIndex, pagination?.pageSize])
  useEffect(() => {
    if (isFirstTimeOid === true) {
      fetchContactList()
    }
  }, [oid, searchText, pagination?.pageIndex, pagination?.pageSize])

  //   useEffect(() => {
  //     if (selectedColumns && selectedColumns.key !== oid) {
  //       console.log('innn', selectedColumns, selectedColumns.key)
  //       setOid(selectedColumns.key)
  //     }
  //   }, [selectedColumns])
  console.log(
    'value chnagedxxx?',
    isViewInDetail,
    contactsFunctionAll,
    functionReportDetailByStatus,
    selectedColumns,
    filterList,
    type
  )

  const generateColumns = () => {
    const baseCols = [
      {
        accessorKey: 'contact_function_id',
        header: 'Function Id',
        Cell: ({ row }) => row.original.contact_function_id || '-'
      },
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ row }) => row.original.name || '-'
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile Number',
        Cell: ({ row }) => row.original.mobile || '-'
      }
    ]

    if (apistatus === 'sent') {
      baseCols.push({
        accessorKey: 'is_sent',
        header: 'Is Sent',
        Cell: ({ row }) => {
          console.log(row.original.is_sent)
          return row.original.is_sent ? 'yes' : 'No'
        }
      })
    }

    if (apistatus === 'seen' || apistatus === 'not-seen') {
      baseCols.push({
        accessorKey: 'is_seen',
        header: 'Is Seen',
        Cell: ({ row }) => {
          //   console.log(row.original.is_seen)
          return row.original.is_seen ? 'yes' : 'No'
        }
      })
    }
    if (apistatus === 'received' || apistatus === 'not-received') {
      baseCols.push({
        accessorKey: 'delivery_status',
        header: 'Received',
        Cell: ({ row }) => {
          //   console.log(row.original.delivery_status)
          return row.original.delivery_status ? 'yes' : 'No'
        }
      })
    }
    if (apistatus === 'yes' && type.includes('notification-')) {
      baseCols.push({
        accessorKey: 'no_of_people_addend',
        header: 'RSVP Count',
        Cell: ({ row }) => {
          //   console.log(row.original.no_of_people_addend)
          return row.original.no_of_people_addend ? row.original.no_of_people_addend : '0'
        }
      })
    }
    if (apistatus === 'no' && type.includes('notification-')) {
      baseCols.push({
        accessorKey: 'no_of_people_addend',
        header: 'Received',
        Cell: ({ row }) => {
          //   console.log(row.original.delivery_status)
          return row.original.reason
        }
      })
    }
    if (apistatus === 'yet' && type.includes('notification-')) {
      baseCols.push({
        accessorKey: 'no_of_people_addend',
        header: 'Yet To Decide',
        Cell: ({ row }) => {
          //   console.log(row.original.delivery_status)
          return row.original.no_of_people_addend ? 'yes' : 'No'
        }
      })
    }
    return baseCols
  }

  const table = useMaterialReactTable({
    columns: generateColumns(),
    data: contactsFunctionAll,
    manualPagination: true,
    rowCount: displayDetails?.report?.[0]?.filtered_count || 10, // ✅ backend total count
    state: { pagination, isLoading: isDataLoading },
    onPaginationChange: setPagination,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    enableTopToolbar: false,
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [5, 10, 20, 25],
      showFirstButton: true,
      showLastButton: true
    }
  })

  const handleTemplateClick = () => {
    dispatch(handleIsViewinDetail({ isViewDetail: false }))
  }
  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  return (
    // 'sent', '', 'not-received','seen','not-seen',"yes","no","yet"
    <Fragment>
      <TabContext value={tabValue} variant='scrollable' scrollButtons='auto'>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {/* <Tabs
            value={tabValue}
            onChange={(e, v) => handleChangeTabValue(e, v)}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Sent' value={1} onClick={e => handleChangeTabValue(e, 1, 'sent')} />
            <Tab label='Seen' value={2} onClick={e => handleChangeTabValue(e, 2, 'seen')} />
            <Tab label='Not Seen' value={3} onClick={e => handleChangeTabValue(e, 3, 'not-seen')} />
            <Tab label='Received' value={4} onClick={e => handleChangeTabValue(e, 4, 'received')} />
            <Tab label='Not Received' value={5} onClick={e => handleChangeTabValue(e, 5, 'not-received')} />
            {type.includes('notification-') && (
              <>
                <Tab label='Attending' value={6} onClick={e => handleChangeTabValue(e, 6, 'yes')} />
                <Tab label='Not Attending' value={7} onClick={e => handleChangeTabValue(e, 7, 'no')} />
                <Tab label='Yet To Decide' value={8} onClick={e => handleChangeTabValue(e, 8, 'yet')} />
              </>
            )}
          </Tabs> */}
          <Tabs
            value={tabValue}
            onChange={(e, v) => {
              const statusMap = {
                1: 'sent',
                2: 'seen',
                3: 'not-seen',
                4: 'received',
                5: 'not-received',
                6: 'yes',
                7: 'no',
                8: 'yet'
              }
              handleChangeTabValue(e, v, statusMap[v])
            }}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Sent' value={1} />
            <Tab label='Seen' value={2} />
            <Tab label='Not Seen' value={3} />
            <Tab label='Received' value={4} />
            <Tab label='Not Received' value={5} />
            {type.includes('notification-') && <Tab label='Attending' value={6} />}
            {type.includes('notification-') && <Tab label='Not Attending' value={7} />}
            {type.includes('notification-') && <Tab label='Yet To Decide' value={8} />}
          </Tabs>
        </Box>
        <TabPanel value={tabValue}>
          <h1>{apistatus} Tabs</h1>
          <Grid2 container spacing={6}>
            <Grid2 xs={12}>
              <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
                <Divider sx={{ m: '0 !important' }} />
                <CardContent />
                <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
                  <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
                    <TextField
                      variant='outlined'
                      size='small'
                      value={tempSearchText}
                      fullWidth
                      sx={{ mr: 4 }}
                      placeholder='Search Contacts'
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
                  {type.includes('notification-') && (
                    <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                      <DataMultiSelect
                        data={filterList}
                        passList={setSelectedColumns}
                        isMulti={false}
                        preSelected={selectedColumns}
                      />
                    </Grid2>
                  )}
                  <Grid2 xs={12} md={6} lg={6}>
                    <Button
                      //   fullWidth
                      onClick={() => {
                        exportFunctionReportContact()
                      }}
                      variant='contained'
                      color='primary'
                      sx={{ '& svg': { mr: 2 } }}
                    >
                      export contact Report list
                    </Button>
                  </Grid2>
                  <Grid2 xs={12} md={6} lg={6}>
                    <Button variant='contained' onClick={handleTemplateClick}>
                      Close
                    </Button>
                  </Grid2>
                </Grid2>

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
        </TabPanel>
      </TabContext>
    </Fragment>
  )
}

export default DetailByStatusTabs
