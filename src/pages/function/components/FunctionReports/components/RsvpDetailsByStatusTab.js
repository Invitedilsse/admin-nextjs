import { TabContext, TabPanel } from '@mui/lab'
import { Button, Card, CardContent, Divider, Grid2, Icon, IconButton, Tab, Tabs, TextField } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/system'
import {
  getListOfFunctionReport,
  getListOfRsvpReport,
  handleIsViewinDetail,
  handleIsViewRsvpinDetail
} from 'src/store/adminMod'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import DataMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDropInput'
import { getAccessToken } from 'src/hooks/axios'
import axios from 'axios'
import { getFunctionReportList, rsvpReportList } from 'src/services/pathConst'
import { convertBase64Blob } from 'src/utils/blobconverter'

const RsvpDetailsByStatusTab = ({ type, oid }) => {
  const [tabValue, setTabValue] = useState(1)
  const { functionId, isDataLoading, rsvpReportDetailByStatus, isViewRsvpInDetail } = useSelector(
    state => state.adminMod
  )
  const [apistatus, setApiStatus] = useState('yes')
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
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  //   const []

  const handleChangeTabValue = (event, newValue, status) => {
    setTabValue(newValue)
    setApiStatus(status)
  }

  const exportFunctionReportContact = async () => {
    try {
      const queryParams = `functionId=${functionId}&type=${type}&listtype=${apistatus}&search=${searchText}&oid=${oid}&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&excel=true`

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.get(`${rsvpReportList}?${queryParams}`, config)
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, result.data.fileName)
    } catch (err) {
      console.log('err inexcel report===>', err)
    }
  }
  const fetchContactList = () => {
    const queryParams = `functionId=${functionId}&type=${type}&listtype=${apistatus}&search=${searchText}&oid=${oid}&page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&excel=false`
    dispatch(getListOfRsvpReport(queryParams))
  }

  const handelDisplayDtats = () => {
    console.log('rsvpReportDetailByStatus----->', rsvpReportDetailByStatus)
    setContactsFunctionAll(rsvpReportDetailByStatus?.[0]?.details ?? [])
    setDisplayDetails(rsvpReportDetailByStatus?.[0])
  }

  useEffect(() => {
    handelDisplayDtats()
  }, [rsvpReportDetailByStatus])

  useEffect(() => {
    fetchContactList()
  }, [tabValue, searchText, pagination?.pageIndex, pagination?.pageSize])

  //   useEffect(() => {
  //     if (selectedColumns && selectedColumns.key !== oid) {
  //       console.log('innn', selectedColumns, selectedColumns.key)
  //       setOid(selectedColumns.key)
  //     }
  //   }, [selectedColumns])
  console.log('value chnagedxxx?', rsvpReportDetailByStatus, contactsFunctionAll, type)

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
      },
      {
        accessorKey: 'reason',
        header: 'RSVP Status',
        Cell: ({ row }) => {
          console.log(row.original.reason)
          return row.original.reason === 'Yes' ? 'yes' : row.original.reason === 'No' ? 'No' : 'Yet to Decide'
        }
      },
      {
        accessorKey: 'people',
        header: 'RSVP Count',
        Cell: ({ row }) => {
          //   console.log(row.original.no_of_people_addend)
          return row.original.people ? row.original.people : '0'
        }
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
    dispatch(handleIsViewRsvpinDetail({ isViewDetail: false }))
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
                1: 'yes',
                2: 'no',
                3: 'yet'
              }
              handleChangeTabValue(e, v, statusMap[v])
            }}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Attending' value={1} />
            <Tab label='Not Attending' value={2} />
            <Tab label='Yet To Decide' value={3} />
          </Tabs>
        </Box>
        <TabPanel value={tabValue}>
          <h1>{displayDetails?.title}</h1>
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

                  <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
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
                {/* {type.includes('notification-') && (
                  <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
                    <DataMultiSelect
                      data={filterList}
                      passList={setSelectedColumns}
                      isMulti={false}
                      preSelected={selectedColumns}
                    />
                  </Grid2>
                )} */}
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

export default RsvpDetailsByStatusTab
