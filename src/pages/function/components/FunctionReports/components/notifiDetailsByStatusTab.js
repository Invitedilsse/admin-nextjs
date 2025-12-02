import { TabContext, TabPanel } from '@mui/lab'
import { Button, Card, CardContent, Divider, Grid2, Tab, Tabs, TextField } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/system'
import {
  getListOfFunctionReport,
  getListOfNotificationReport,
  getListOfRsvpReport,
  handleIsViewinDetail,
  handleIsViewNotifiinDetail,
  handleIsViewRsvpinDetail
} from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import { getAccessToken } from 'src/hooks/axios'
import axios from 'axios'
import { getFunctionReportList } from 'src/services/pathConst'
import { convertBase64Blob } from 'src/utils/blobconverter'

const NotifiDetailsByStatusTab = ({ type, poid }) => {
  const [tabValue, setTabValue] = useState(1)
  const { functionId, isDataLoading, notiReportDetailByStatus, isViewNotfiInDetail } = useSelector(
    state => state.adminMod
  )
  const [apistatus, setApiStatus] = useState('seen')
  const [search, setSearch] = useState('')

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
  const [oid, setOid] = useState(poid)
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  //   const []

  const handleChangeTabValue = (event, newValue, status) => {
    setTabValue(newValue)
    setApiStatus(status)
  }

  //   const exportFunctionReportContact = async () => {
  //     try {
  //       const queryParams = `functionId=${functionId}&type=${type}&status=${apistatus}&search=${searchText}&oid=${oid}&excel=true&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`

  //       const authToken = await getAccessToken()
  //       const config = {
  //         headers: {
  //           authorization: authToken ? `${authToken}` : null
  //         }
  //       }

  //       const result = await axios.get(`${getFunctionReportList}?${queryParams}`, config)
  //       console.log('res----->', result)
  //       await convertBase64Blob(result.data.data, result.data.fileName)
  //     } catch (err) {
  //       console.log('err inexcel report===>', err)
  //     }
  //   }
  const fetchContactList = () => {
    console.log('apistatus------>', apistatus)
    const queryParams = `functionId=${functionId}&type=${type}&status=${apistatus}&oid=${oid}`
    dispatch(getListOfNotificationReport(queryParams))
  }

  const handelDisplayDtats = () => {
    console.log('notiReportDetailByStatus----->', notiReportDetailByStatus)
    setContactsFunctionAll(notiReportDetailByStatus.contactlist ?? [])

    let d = (notiReportDetailByStatus?.counts || [])
      .map(item => {
        console.log(item.oid, oid, item.oid === oid)
        // (item.oid === oid ? item : null)
        if (item.oid === oid) {
          return item
        }
      })
      .filter(Boolean)
    console.log('ddd----->', d)
    setDisplayDetails(d)
    // setFilterList()
  }

  useEffect(() => {
    handelDisplayDtats()
  }, [notiReportDetailByStatus])

  useEffect(() => {
    fetchContactList()
  }, [tabValue])

  //   useEffect(() => {
  //     if (selectedColumns && selectedColumns.key !== oid) {
  //       console.log('innn', selectedColumns, selectedColumns.key)
  //       setOid(selectedColumns.key)
  //     }
  //   }, [selectedColumns])
  console.log('value chnagedxxx?---', notiReportDetailByStatus, contactsFunctionAll, type, displayDetails)

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
    return baseCols
  }

  const table = useMaterialReactTable({
    columns: generateColumns(),
    data: contactsFunctionAll,
    manualPagination: true,
    // rowCount: 10, // ✅ backend total count
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
    dispatch(handleIsViewNotifiinDetail({ isViewDetail: false }))
  }
  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  return (
    // 'sent', '', 'not-received','seen','not-seen',"yes","no","yet"
    <Fragment>
      <TabContext value={tabValue} variant='scrollable' scrollButtons='auto'>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => {
              const statusMap = {
                1: 'seen',
                2: 'unseen',
                3: 'sent',
                4: 'unsent'
              }
              handleChangeTabValue(e, v, statusMap[v])
            }}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Seen' value={1} />
            <Tab label='Not Seen' value={2} />
            <Tab label='Sent' value={3} />
            <Tab label='Not Sent' value={4} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue}>
          <h1>{displayDetails?.[0]?.msg ?? '-'}</h1>
          <Grid2 container spacing={6}>
            <Grid2 xs={12}>
              <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
                <Divider sx={{ m: '0 !important' }} />
                <CardContent />
                <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
                  {/* <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
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
                        </Grid2> */}
                  <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}></Grid2>
                  <Grid2 xs={12} md={6} lg={6}>
                    <Button variant='contained' onClick={handleTemplateClick}>
                      Close
                    </Button>
                  </Grid2>
                </Grid2>

                {/* <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                  <DataMultiSelect
                    data={filterList}
                    passList={setSelectedColumns}
                    isMulti={false}
                    preSelected={selectedColumns}
                  />
                </Grid2> */}
                {/* <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
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
                </Grid2> */}
                {/* <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
                
                </Grid2> */}

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

export default NotifiDetailsByStatusTab
