// ** React Imports
import { Fragment, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
// ** Third Party Imports
import { EditorState } from 'draft-js'

// ** Component Import
// ** Third Party Imports
import * as yup from 'yup'
// ** Icon Imports

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Actions Imports
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Grid2,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import { toggleSnackBar } from 'src/store/auth'
import toast from 'react-hot-toast'
import { countryList } from 'src/@core/utils/country-list'
import { useDropzone } from 'react-dropzone'
import { DataGrid } from '@mui/x-data-grid'
import { Cell } from 'recharts'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { getListOfContacts, getListOfContactsNP } from 'src/store/adminMod'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { de } from 'date-fns/locale'
const icon = <CheckBoxOutlineBlankIcon fontSize='small' />
const checkedIcon = <CheckBoxIcon fontSize='small' />
const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
  // background: '#f8f8f8'
}))

// ** ValidationSchema
const validationSchema = yup.object({
  description: yup
    .string()
    .trim()
    .required('Description is required')
    .min(3, 'Minimum 3 character required')
    .max(500, 'Maximum 500 character only allowed'),
  name: yup
    .string('Group Name is required')
    .trim()
    .required('Group Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})

const StyledSelect = styled(Select)(({ theme }) => ({
  boxShadow: 'none !important',
  minWidth: '3.5rem !important',
  width: '6rem !important',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-select': {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    minWidth: '90px'
    // width: '100%',
  }
}))
const SideBarGiftType = props => {
  // ** Props
  const { open, toggle, id, RowData, toggleAddUserDrawer, contactData } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const theme = useTheme()
  const { direction } = theme
  // const { isContactsFetching, allContacts, contactsCount } = useSelector(state => state.adminMod)
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingExcel, setIsLoadingExcel] = useState(false)
  const [inviteFile, setInviteFile] = useState([])
  const [groupId, setGroupId] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [rowSelectionUpdate, setRowSelectionUpdate] = useState({})
  const [selectedContacts, setSelectedContacts] = useState([])
  const [isAdd, setIsAdd] = useState(false)
  const [sortModel, setSortModel] = useState([
    {
      field: 'name',
      sort: 'desc'
    }
  ])
  const {
    isContactsFetchingNP,
    allContactsNP,
    contactsCountNP,
    isContactsFetching,
    allContacts,
    contactsCount,
    eventId
  } = useSelector(state => state.adminMod)

  const handleIsAddClose = () => {
    setIsAdd(false)
  }
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      contacts: [],
      contact_id: []
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          title: values.name,
          description: values.description
          // country_code: values.code,
          // mobile: values.mobile
        }

        const result =
          groupId === ''
            ? await apiPost(`${baseURL}user-group/add`, params)
            : await apiPut(`${baseURL}user-group/update/${RowData.id}`, {
                title: values.name,
                description: values.description
                // mobile: values.mobile
              })
        console.log(result)
        if (result?.data?.data?.id) {
          setGroupId(result?.data?.data?.id)
        }
        // toggle()
        // setTimeout(() => {
        //   formik.resetForm()
        //   setIsLoading(false)
        // }, 500)
        toast.success(result?.data?.message)
        // dispatch(
        //   toggleSnackBar({
        //     isOpen: true,
        //     type: 'success',
        //     message: result?.data?.message
        //   })
        // )
      } catch (e) {
        toast.error(e)
        // dispatch(
        //   toggleSnackBar({
        //     isOpen: true,
        //     type: 'error',
        //     message: e
        //   })
        // )
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const getCategory = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('name', data?.title)
        formik.setFieldValue('description', data?.description)
        formik.setFieldValue('contacts', data?.contact_details)
        formik.setFieldValue('contact_id', data?.contact_id)
        setGroupId(data?.id)
      } else {
        setGroupId('')
      }
    } catch (e) {
      // sendNotification({
      //   message: e,
      //   variant: 'error'
      // })
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getCategory()
    } else {
      formik.resetForm()
      setGroupId('')
    }
  }, [id, userData])

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDropRejected: fileRejections => {
      toast.error('Please select a valid file')
    },
    onError: error => {
      toast.error(error.message)
    },
    onDrop: async acceptedFiles => {
      console.log(acceptedFiles)
      try {
        setIsLoadingExcel(true)
        const formData = new FormData()
        formData.append('file', acceptedFiles[0])
        // formData.append('file', values.imagePreview)
        const imageRes = await apiPost(`${baseURL}contacts/file-upload`, formData, true)
        toast.success(imageRes?.data?.message)
        toggle()
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoadingExcel(false)
      }
      //  setInviteFile(acceptedFiles)
      //  formik.setFieldValue('fileImagePreview', acceptedFiles[0])
    }
  })

  const listColumnsGroup = [
    {
      flex: 0.005,
      // minWidth: 120,
      // width: 200,
      sortable: true,
      field: 'name',
      headerName: 'Name',
      renderCell: params => (
        <List sx={{ width: '100%', bgcolor: 'background.paper', py: 0 }}>
          <ListItem alignItems='flex-start' sx={{ px: 1 }}>
            {/* <ListItemAvatar>
              <Avatar alt={params.row.name} src="/static/images/avatar/1.jpg" />
            </ListItemAvatar> */}
            <ListItemText
              primary={params.row.name}
              secondary={
                <Fragment>
                  <Typography component='span' variant='body2' sx={{ color: 'text.primary', display: 'inline' }}>
                    {params.row.mobile}
                  </Typography>
                </Fragment>
              }
            />
          </ListItem>
        </List>
      )
    },

    {
      // flex: 0.1,
      // minWidth: 120,
      // width: 120,
      field: 'action',
      sortable: false,
      headerName: 'Action',
      renderCell: ({ row }) => {
        return (
          <>
            {
              <Tooltip title='Remove'>
                <IconButton
                  onClick={() => {
                    // setId(row.id);
                    setdelId(row.id)
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
                  <Icon icon='mdi:remove' color='error' />
                </IconButton>
              </Tooltip>
            }
          </>
        )
      }
    }
  ]
  const [openfirm, setOpenFrim] = useState(false)
  const [optionsFirm, setOptionsFirm] = useState([])
  const [loadingFirm, setLoadingFirm] = useState(false)

  useEffect(() => {
    if (allContacts?.length > 0) {
      // const firms = allContacts.map(firm => {
      //   return {
      //     id: firm.id,
      //     name: firm.name,
      //     country_code: firm.name,
      //     mobile: firm.mobile
      //   }
      // })
      setOptionsFirm(allContacts)
    }
  }, [allContacts])
  const getAllContactsNP = () => {
    const queryParams = `search_string=${searchText}&sortDir=${sortModel.length > 0 ? sortModel[0]?.sort : 'desc'}&sortBy=${sortModel.length > 0 ? sortModel[0]?.field : 'name'}`
    dispatch(getListOfContactsNP(queryParams))
  }
  useEffect(() => {
    getAllContactsNP()
  }, [open])
  useEffect(() => {
    getAllContactsNP()
  }, [searchText, sortModel, open, contactData])
  const handleOpenFirm = () => {
    setOpenFrim(true)
    ;(async () => {
      setLoadingFirm(true)
      // await sleep(1e3); // For demo purposes.
      setLoadingFirm(false)
      const queryParams = `search_string=${searchText}&sortDir=${'desc'}&sortBy=${'title'}`
      dispatch(getListOfContactsNP(queryParams))
      // setOptionsFirm([...topFilms]);
    })()
  }

  const handleCloseFirm = () => {
    setOpenFrim(false)
    setOptionsFirm([])
  }
  const columns = [
    {
      size: 200,
      accessorKey: 'name',
      header: 'Name'
      //   Cell: ({ renderedCellValue, row }) =>   <List sx={{ width: '100%', py: 0 }}>
      //   <ListItem alignItems="flex-start" sx={{ px: 1 }}>
      //     {/* <ListItemAvatar>
      //       <Avatar alt={params.row.name} src="/static/images/avatar/1.jpg" />
      //     </ListItemAvatar> */}
      //     <ListItemText
      //       primary={row?.original?.name}
      //       secondary={
      //         <Fragment>
      //           <Typography
      //             component="span"
      //             variant="body2"
      //             sx={{ color: 'text.primary', display: 'inline' }}
      //           >
      //             {row?.original?.mobile}
      //           </Typography>

      //         </Fragment>
      //       }
      //     />
      //   </ListItem>
      // </List>
    },
    {
      size: 120,
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ renderedCellValue, row }) => `${row?.original?.country_code} - ${row?.original?.mobile}`
    }

    // {
    //   accessorKey: 'city',
    //   header: 'Actions',
    //   size: 50,
    //   enableSorting: false,
    //   Cell: ({ renderedCellValue, row }) =>
    //   {
    //   console.log(row)
    //   console.log(renderedCellValue)

    //     return (  <>
    //       <IconButton
    //               onClick={() => {
    //                 // setId(row.id);
    //                 setdelId(row.id)
    //                 setdOpen(true)
    //                 // deleteEvent(row._id);
    //                 // setEid(row?._id);
    //                 // setEntireRow(row);
    //                 // toggleAddUserDrawer();
    //               }}
    //               color='error'
    //               sx={{ fontSize: '18px' }}
    //             >
    //               {' '}
    //               <Icon icon='mdi:remove' color='error' />
    //             </IconButton>
    //   </>)}
    // },
  ]

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
    // debounce(getAllSpecialInvitee(), 2000)
  }
  const table = useMaterialReactTable({
    columns,
    data: formik.values?.contacts || [],
    getRowId: row => {
      console.log(row.id)
    }, //give each row a more useful id

    onRowSelectionChange: setRowSelectionUpdate, //connect internal row selection state to your own
    state: { rowSelection: rowSelectionUpdate },
    enableRowSelection: true,
    enableSelectAll: true,
    muiSelectCheckboxProps: {
      color: 'primary'
    },
    // enableRowPinning: true,
    // enableStickyHeader: true,
    // rowPinningDisplayMode: 'select-sticky',
    enableColumnFilter: false,
    enableTopToolbar: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    //  muiLinearProgressProps: ({ isTopToolbar }) => ({
    //   color: 'warning',
    //   sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
    //   value: fetchProgress, //show precise real progress value if you so desire
    // }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'white',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'white !important'
        }
        //         '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
        //   color: 'red !important',
        // }
      }
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: {
        color: 'white',
        backgroundColor: 'primary.main'

        // '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
        //   color: 'blue !important',
        // }
      }
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),

    //  renderTopToolbarCustomActions: ({ table }) => ( <Button
    //   // fullWidth
    //   onClick={() => {
    //     setEid('')
    //     setEntireRow([])
    //     setId('')
    //     setEntireRow([])
    //     toggleAddUserDrawer()
    //   }}
    //   variant='contained'
    //   color='primary'
    //   sx={{ '& svg': { mr: 2 } }}
    // >
    //   Add Firm
    // </Button>),
    //  enableColumnActions: false,
    //  enableRowOrdering: false,
    // enableGlobalFilter: false,
    // enableRowSelection: true,
    // initialState: { showColumnFilters: true , pagination: { pageSize: 10, pageIndex: 0 }},
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined',
      rowsPerPageOptions: [10, 20],
      showFirstButton: true,
      showLastButton: true
    },
    paginationDisplayMode: 'default',

    manualPagination: true,
    // rowCount: eventsCount,
    enableRowOrdering: false,
    enableSorting: true,
    // onPaginationChange: setPagination, //hoist pagination state to your state when it changes internally
    // state: { pagination ,
    // showProgressBars: isEventssFetching,
    isLoading: isLoading
    //   columnFilters:[],
    //   globalFilter:''
    //   // sorting

    // },
    // muiRowDragHandleProps: ({ table }) => ({
    //   onDragEnd: () => {
    //     const { draggingRow, hoveredRow } = table.getState();
    //     if (hoveredRow && draggingRow) {
    //       console.log(draggingRow, hoveredRow)
    //       var d = allEvents;

    //       // data.splice(
    //       //   (hoveredRow).index,
    //       //   0,
    //       //   data.splice(draggingRow.index, 1)[0],
    //       // );
    //       // console.log(...data)
    //       // setData([...data]);
    //     }
    //   },
    // }),
  })

  const table2 = useMaterialReactTable({
    columns,
    data: allContactsNP,
    enableRowSelection: true,
    enableSelectAll: true,
    muiSelectCheckboxProps: {
      color: 'primary'
    },
    getRowId: row => {
      console.log(row.id)
    }, //give each row a more useful id

    onRowSelectionChange: setRowSelection, //connect internal row selection state to your own
    state: { rowSelection },

    // enableRowPinning: true,
    // enableStickyHeader: true,
    // rowPinningDisplayMode: 'select-sticky',
    enableColumnFilter: false,
    enableTopToolbar: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    //  muiLinearProgressProps: ({ isTopToolbar }) => ({
    //   color: 'warning',
    //   sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
    //   value: fetchProgress, //show precise real progress value if you so desire
    // }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'white',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'white !important'
        }
        //         '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
        //   color: 'red !important',
        // }
      }
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: {
        color: 'white',
        backgroundColor: 'primary.main'

        // '& .MuiButtonBase-root .MuiTableSortLabel-root .Mui-active .MuiTableSortLabel-root .MuiTableSortLabel-icon':{
        //   color: 'blue !important',
        // }
      }
      // sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      // value: fetchProgress, //show precise real progress value if you so desire
    }),

    //  renderTopToolbarCustomActions: ({ table }) => ( <Button
    //   // fullWidth
    //   onClick={() => {
    //     setEid('')
    //     setEntireRow([])
    //     setId('')
    //     setEntireRow([])
    //     toggleAddUserDrawer()
    //   }}
    //   variant='contained'
    //   color='primary'
    //   sx={{ '& svg': { mr: 2 } }}
    // >
    //   Add Firm
    // </Button>),
    //  enableColumnActions: false,
    //  enableRowOrdering: false,
    // enableGlobalFilter: false,
    // enableRowSelection: true,
    // initialState: { showColumnFilters: true , pagination: { pageSize: 10, pageIndex: 0 }},
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined',
      rowsPerPageOptions: [10, 20],
      showFirstButton: true,
      showLastButton: true
    },
    paginationDisplayMode: 'default',

    manualPagination: true,
    // rowCount: eventsCount,
    enableRowOrdering: false,
    enableSorting: true,
    // onPaginationChange: setPagination, //hoist pagination state to your state when it changes internally
    // state: { pagination ,
    // showProgressBars: isEventssFetching,
    isLoading: isContactsFetchingNP
    //   columnFilters:[],
    //   globalFilter:''
    //   // sorting

    // },
    // muiRowDragHandleProps: ({ table }) => ({
    //   onDragEnd: () => {
    //     const { draggingRow, hoveredRow } = table.getState();
    //     if (hoveredRow && draggingRow) {
    //       console.log(draggingRow, hoveredRow)
    //       var d = allEvents;

    //       // data.splice(
    //       //   (hoveredRow).index,
    //       //   0,
    //       //   data.splice(draggingRow.index, 1)[0],
    //       // );
    //       // console.log(...data)
    //       // setData([...data]);
    //     }
    //   },
    // }),
  })

  useEffect(() => {
    // console.log('----',{ rowSelection }); //read your managed row selection state
    // console.info(table2.getSelectedRowModel().rows);
    // // console.info(table.getState().rowSelection); //alternate way to get the row selection state
    var temp = []
    for (let i = 0; i < table2.getSelectedRowModel().rows.length; i++) {
      temp.push(table2.getSelectedRowModel()?.rows[i].original?.id)
    }
    // setEntireRow(temp)

    setSelectedContacts(temp)
  }, [rowSelection])
  useEffect(() => {
    // console.log('----',{ rowSelection }); //read your managed row selection state
    // console.info(table2.getSelectedRowModel().rows);
    // // console.info(table.getState().rowSelection); //alternate way to get the row selection state
    var temp = []
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original?.id)
    const filteredContacts = formik.values.contact_id.filter(id => !selectedIds.includes(id))
    setSelectedContacts(filteredContacts)
  }, [rowSelectionUpdate])

  const addGroups = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact')
      return
    }
    try {
      const data =
        contactData?.detail?.length > 0 && contactData?.detail[0]?.contact_id.length > 0
          ? contactData?.detail[0]?.contact_id
          : []

      const params = {
        // title:formik.values.name,
        //       description:formik.values.description,
        event_id: [eventId],
        contact_id: [...data, ...selectedContacts]
      }
      console.log(params)
      setIsLoading(true)
      const result = await apiPost(`${baseURL}event-user/add`, params)
      console.log(result)
      formik.setFieldValue('contacts', result?.data?.data?.contact_details)
      formik.setFieldValue('contacts_id', result?.data?.data?.contacts_id)
      toast.success(result?.data?.message)
      handleClose()
      setIsAdd(false)
      setSelectedContacts([])
      setRowSelectionUpdate({})
      setRowSelection({})
    } catch (err) {
      console.log(err)
      toast.error(err?.message)
    } finally {
      setIsLoading(false)
    }
  }
  // const removeGroup = async () => {
  //   console.log(selectedContacts)
  //   // return
  //   // if(selectedContacts.length === 0){
  //   //   toast.error('Please select at least one contact')
  //   //   return
  //   // }
  //   try{

  //     setIsLoading(true)
  //     const result = await apiPut(`${baseURL}user-group/update/${groupId}`, {
  //       // group_id: groupId,
  //       title:formik.values.name,
  //       description:formik.values.description,
  //       contact_id: selectedContacts,
  //       event_id: eventId
  //     })
  //     console.log(result)
  //     formik.setFieldValue('contacts', result?.data?.data?.contact_details)
  //     formik.setFieldValue('contacts_id', result?.data?.data?.contacts_id)
  //     toast.success(result?.data?.message)
  //     setIsAdd(false)
  //     setSelectedContacts([])
  //     setRowSelectionUpdate({})
  //     setRowSelection({})
  //   }catch(err){
  //     console.log(err)
  //     toast.error(err?.response?.data?.message)
  //   }finally{
  //     setIsLoading(false)
  //   }
  // }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      className={classes.root}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
      }}
    >
      <Box className={classes.root}>
        <Box sx={{ px: 5, py: 2 }}>
          <Header>
            <Typography variant='h5'>{'Add from Contacts'}</Typography>
            <IconButton
              size='small'
              onClick={handleClose}
              sx={{
                p: '0.438rem',
                borderRadius: 1,
                color: 'text.primary',
                backgroundColor: 'action.selected',
                '&:hover': {
                  backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
                }
              }}
            >
              <Icon icon='tabler:x' fontSize='1.125rem' />
            </IconButton>
            {/* <CardHeader
            sx={{
              py: 0
            }}
            title={id !== '' ? 'Edit a Category' : 'Create a Category'}
          /> */}
          </Header>
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Box className={classes.root}>
            <Box px={4} mx={4}>
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

              <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                <Button variant='outlined' color='primary' onClick={() => addGroups()} sx={{ mb: 4, mt: 3 }}>
                  Add
                </Button>
              </Box>

              <MaterialReactTable table={table2} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarGiftType
