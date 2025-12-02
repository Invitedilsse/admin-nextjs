// ** React Imports
import { forwardRef, useCallback, useContext, useEffect, useState } from 'react'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import { DataGrid } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
import CustomTextField from 'src/@core/components/mui/text-field'
// ** Utils Import

// ** Actions Imports

// ** Third Party Components
// ** Custom Table Components Imports
import { LoadingButton } from '@mui/lab'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Tooltip,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import moment from 'moment'
import { useRouter } from 'next/router'
import 'react-datepicker/dist/react-datepicker.css'
// import useNotification from "src/hooks/useNotification";
// import { getEventsList } from "src/store/apps/superadmin/events";
// import { getCategoryList, getFileList } from 'src/store/apps/user/memberlist'
import { apiDelete } from 'src/hooks/axios'

import AddFileDrawer from './components/ManageFunctionDrawer'
// import SideBarShareJob from './components/ShareJob'
import { toggleSnackBar } from 'src/store/auth'
import { baseURL } from 'src/services/pathConst'
import Select from 'src/@core/theme/overrides/select'
import { getListOfCategories } from 'src/store/adminMod'
import { ca } from 'date-fns/locale'

const userStatusObj = {
  active: 'success',
  hired: 'info',
  disabled: 'error'
}
const formatDate = date => {
  if (date) {
    return moment(date).format('DD-MM-YYYY hh:mm a')
  } else {
    return ''
  }
}
const FileHandle = () => {
  // ** Hooks
  const ability = useContext(AbilityContext)
  const theme = useTheme()
  const dispatch = useDispatch()
  // const [sendNotification] = useNotification();
  const leftSidebarWidth = 300
  const addEventSidebarWidth = 500
  const { direction } = theme
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const popperPlacement = direction === 'ltr' ? 'bottom-start' : 'bottom-end'
  const [id, setId] = useState('')
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [role, setRole] = useState('')
  const [plan, setPlan] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [eventStatus, setEventStatus] = useState('')

  const [addUserOpen, setAddUserOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })
  const [searchText, setSearchText] = useState('')
  const router = useRouter()
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClickOpen = () => {
    setdOpen(true)
  }

  const handleClose = () => {
    setdOpen(false)
  }

  console.log(paginationModel)

  const listColumns = [
    {
      flex: 0.1,
      minWidth: 130,
      sortable: true,
      field: 'category_name',
      headerName: 'Category Name'
    },
    {
      flex: 0.13,
      minWidth: 180,

      sortable: true,
      field: 'category_description',
      headerName: 'Description'
    },

    {
      flex: 0.1,
      minWidth: 90,
      sortable: false,
      // field: "Action",
      headerName: 'Action',
      renderCell: ({ row }) => {
        return (
          <>
            <Tooltip title='Edit Category'>
              <IconButton
                onClick={() => {
                  // setId(row.id);
                  setEid(row?._id)
                  setEntireRow(row)
                  toggleAddUserDrawer()
                }}
                color='primary'
                sx={{ fontSize: '18px' }}
              >
                {' '}
                <Icon icon='tabler:pencil' color='primary' />
              </IconButton>
            </Tooltip>

            {
              <Tooltip title='Delete Category'>
                <IconButton
                  onClick={() => {
                    // setId(row.id);
                    setdelId(row._id)
                    setdOpen(true)
                    // deleteEvent(row._id);
                    // setEid(row?._id);
                    // setEntireRow(row);
                    // toggleAddUserDrawer();
                  }}
                  color='error'
                  sx={{ fontSize: '18px' }}
                >
                  {' '}
                  <Icon icon='ic:outline-delete' color='error' />
                </IconButton>
              </Tooltip>
            }
          </>
        )
      }
    }
  ]

  const {
    pageCount,

    isCategoryFetching,
    allCategory,
    cateCount
  } = useSelector(state => state.adminMod)
  // console.log("ddd", recruiterJobList);
  console.log(allCategory, cateCount)
  const handleFilter = useCallback(val => {
    setValue(val)
  }, [])

  const handleRoleChange = useCallback(e => {
    setRole(e.target.value)
  }, [])

  const handlePlanChange = useCallback(e => {
    setPlan(e.target.value)
  }, [])

  const handleStatusChange = useCallback(e => {
    setStatus(e.target.value)
  }, [])
  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setId('')
      setEid('')

      //
    }

    setAddUserOpen(!addUserOpen)
  }
  const toggleShareDrawer = () => {
    if (shareOpen) {
      setId('')
    }
    setShareOpen(!shareOpen)
  }

  const handleOnChangeRange = dates => {
    const [start, end] = dates
    setStartDateRange(start)
    setEndDateRange(end)
  }
  const CustomInput = forwardRef((props, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')
    const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null
    const value = `${startDate}${endDate !== null ? endDate : ''}`

    return <CustomTextField inputRef={ref} label={props.label || ''} {...props} value={value} />
  })
  const [rowCountState, setRowCountState] = useState(cateCount?.count || 0)
  console.log(cateCount)

  const [sortModel, setSortModel] = useState([
    {
      field: 'userId',
      sort: 'desc'
    }
  ])
  const getAllCategory = () => {
    const params2 = {
      page: paginationModel?.page + 1,
      size: paginationModel?.pageSize
    }
    const params = {
      page: paginationModel?.page,
      size: paginationModel?.pageSize
    }
    console.log(params)
    const params4 = {
      sortDir: 'desc',
      limit: '100',
      offset: '0',
      search_string: '',
      sortBy: 'name'
    }

    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel?.sort}&sortBy=${sortModel?.field}`
    dispatch(getListOfCategories(queryParams))
    // dispatch(getEventsList(params));
  }
  const searchFile = () => {
    setPaginationModel({
      page: 0,
      pageSize: 50
    })
    const params = {
      page: paginationModel?.page,
      size: paginationModel?.pageSize
    }
    const queryParams = `limit=${params?.size}&offset=${params?.page}&search_string=${searchText}&sortDir=${sortModel?.sort}&sortBy=${sortModel?.field}`
    // dispatch(getFileList(queryParams))
  }
  useEffect(() => {
    getAllCategory()
  }, [])

  useEffect(() => {
    console.log('ca')
    getAllCategory()
  }, [paginationModel?.page, paginationModel?.pageSize, rowCountState])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllCategory()
    }
  }, [addUserOpen])

  useEffect(() => {
    setRowCountState(prevRowCountState => (cateCount?.total !== undefined ? cateCount?.total : prevRowCountState))
  }, [cateCount?.total, setRowCountState])

  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        category_id: delId
      }

      let url = `${baseURL}category/delete`

      const result = await apiDelete(url, params)
      // toggle();
      console.log(result?.data?.data)
      getAllCategory()
      dispatch(
        toggleSnackBar({
          isOpen: true,
          type: 'success',
          message: result?.data?.data?.message
        })
      )
    } catch (e) {
      dispatch(
        toggleSnackBar({
          isOpen: true,
          type: 'error',
          message: e
        })
      )
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
  return (
    <Grid container spacing={6}>
      {/* {!addUserOpen && ( */}
      <Grid item xs={12}>
        <Card
          sx={{
            background: 'white',
           boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <CardHeader
            title='Manage Category'
            sx={{
              '& .MuiTypography-root ': {
                // color: "black",
              }
            }}
          />
          <Divider sx={{ m: '0 !important' }} />

          <CardContent></CardContent>

          <Grid container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid item xs={12} lg={6} md={6} sm={12}>
              <CustomTextField
                value={searchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Category'
                onChange={e => setSearchText(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} lg={4} md={4} sm={12}>
              {/* <FormControl
                  fullWidth
                  size='small'

                  // sx={{ my: 2, }}
                >
                  <InputLabel id='demo-simple-select-labelw ' size='small' fullWidth>
                    Event Status
                  </InputLabel>
                  <Select
                    labelId='demo-simple-select-labelw'
                    id='demo-simple-select'
                    fullWidth
                    value={eventStatus}
                    label='Events Status'
                    size='small'
                    onChange={e => setEventStatus(e?.target.value)}
                  >
                    <MenuItem value={'past'}>Past Events</MenuItem>
                    <MenuItem value={'live'}>Live Events</MenuItem>
                    <MenuItem value={'upcoming'}>Upcoming Events</MenuItem>
                  </Select>
                </FormControl> */}
            </Grid>
            <Grid item xs={12} lg={2} md={2} sm={12}>
              <Button
                fullWidth
                onClick={() => {
                  setEid('')
                  setEntireRow([])
                  setId('')
                  setEntireRow([])
                  toggleAddUserDrawer()
                }}
                variant='contained'
                color='primary'
                sx={{ '& svg': { mr: 2 } }}
              >
                {/* <Icon fontSize='1.125rem' icon='tabler:plus' /> */}
                Add Category
              </Button>
            </Grid>
          </Grid>
          <Box p={4}>
            <DataGrid
              sx={{
                '& .MuiDataGrid-row': {
                  cursor: 'pointer'
                },

                '& .MuiDataGrid-columnHeaders ': {
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  '& .MuiButtonBase-root.MuiIconButton-root ': {
                    color: '#fff'
                  },
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px'
                },
                '& .MuiDataGrid-columnHeaders.MuiDataGrid-withBorderColor': {
                  borderColor: `${theme.palette.primary.main}`
                },

                '& .MuiDataGrid-columnSeparator ': {
                  color: '#fff'
                },
                '& .MuiDataGrid-cell , .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: '#000'
                },
                '& .MuiTablePagination-selectLabel': {
                  color: 'rgb(0,0,0)'
                },
                '& .MuiTablePagination-actions': {
                  color: 'rgb(0,0,0)',
                  '& .Mui-disabled': {
                    color: 'rgb(0,0,0, .5)'
                  }
                },
                '& .MuiButtonBase-root .MuiMenuItem-root.MuiTablePagination-menuItem , .MuiTablePagination-root': {
                  color: 'rgb(0,0,0)'
                },
                '& .MuiDataGrid-virtualScroller': {
                  // border: `1px solid ${theme.palette.primary.main}`,
                  border: `.25px solid grey`
                }
              }}
              autoHeight
              rowHeight={62}
              rows={allCategory}
              columns={listColumns}
              loading={isCategoryFetching}
              onRowClick={it => console.log(it)}
              // {...recruiterJobList}
              // initialState={{
              //   // ...data.initialState,
              //   pagination: { paginationModel: { pageSize: 5 } },
              // }}
              onSortModelChange={newSortModel => {
                setSortModel(newSortModel)
              }}
              getRowId={row => row._id}
              // autoPageSize
              rowCount={rowCountState}
              paginationMode='server'
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
            />
          </Box>
        </Card>
      </Grid>

      <Box p={4}>
        <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
      </Box>
      {/* </Drawer> */}
      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ?`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton loading={delLoading} varient='contained' onClick={deleteEvent} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}
FileHandle.acl = {
  action: 'read',
  subject: 'accatee'
}

export default FileHandle
