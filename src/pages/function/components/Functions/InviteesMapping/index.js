// ** React Imports
import { useEffect, useMemo, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab'
import {
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete, apiPost, getAccessToken } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageContactsDrawer'
import { baseURL } from 'src/services/pathConst'
import { getListOfEventDetails, getListOfFunctionContacts, syncEventDetailsContacts } from 'src/store/adminMod'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import SerialNumberGenerator from '../../common/SerialNumberGenerator'
import ColumnMultiSelect from 'src/@core/components/custom-table-filter-drop/customFilterDrop'
import { convertBase64Blob } from 'src/utils/blobconverter'
import axios from 'axios'

const InviteesMapping = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [tabValue, setTabValue] = useState('1')

  const [rowSelection, setRowSelection] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25
  })
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [isGloabselect, setIsGlobalselect] = useState(false)

  const handleClose = () => {
    setdOpen(false)
  }

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'event', label: 'Events' },
    { value: 'transport', label: 'Transportation' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'other', label: 'Others' }
  ]

  const { contactsFunctionAll, contactsFunctionCount } = useSelector(state => state.adminMod)
  const { eventDetailsAll, isEventDetailsFetching, functionId } = useSelector(state => state.adminMod)
  const [selectedColumns, setSelectedColumns] = useState([])

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }

    setAddUserOpen(!addUserOpen)
  }

  const [sortModel, setSortModel] = useState([
    {
      field: 'contact_id',
      sort: 'desc'
    }
  ])
  const getAllFunctionConatcts = () => {
    // const queryParams = `function_id=${functionId}&limit=${5000}&offset=${0}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'contact_id'}`
    const queryParams = `function_id=${functionId}&limit=${5000}&offset=${0}&search_string=${searchText}&sortDir=${'asc'}&sortBy=${'u.contact_function_id'}`

    dispatch(getListOfFunctionContacts(queryParams))
    console.log('tabValue----->', tabValue)
    if (tabValue === '1') {
      dispatch(getListOfEventDetails(functionId))
    }
  }

  const getAllEventsById = id => {
    const queryParams = `function_id=${functionId}&limit=${10000}&offset=${0}&search_string=${''}&sortDir=${sortModel.length > 0 ? sortModel[0]?.sort : 'desc'}&sortBy=${sortModel.length > 0 ? 'event_name' : 'event_name'}`
    dispatch(getListOfEventDetails(queryParams))
  }

  useEffect(() => {
    if (tabValue === '1') {
      getAllFunctionConatcts()
    }
  }, [tabValue])

  useEffect(() => {
    getAllFunctionConatcts()
  }, [pagination?.pageIndex, pagination?.pageSize, searchText])

  useEffect(() => {
    if (addUserOpen === false) {
      getAllFunctionConatcts()
    }
  }, [addUserOpen])

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const deleteEvent = async () => {
    try {
      setDelLoading(true)
      const params = {
        contact_id: delId
      }

      let url = `${baseURL}contacts/delete/${delId}`

      const result = await apiDelete(url, params)
      getAllFunctionConatcts()
      toast.success(result?.data?.message)
    } catch (e) {
      toast.error(e)
    } finally {
      setDelLoading(false)
      setdOpen(false)
    }
  }
  const [details, setDetails] = useState([])

  // const generateColumns = () => {
  //   const baseColumns = [
  //     {
  //       size: 100,
  //       accessorKey: 'serialNumber',
  //       header: 'S.No',
  //       enableColumnPinning: true,
  //       Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
  //     },
  //     {
  //       accessorKey: 'name',
  //       enableColumnPinning: true,
  //       size: 200,
  //       header: 'Namess',
  //       Cell: ({ renderedCellValue, row }) =>
  //         `${row?.original?.contact_details?.length > 0 ? row?.original?.contact_details[0]?.name : ''}`
  //     },
  //     {
  //       accessorKey: 'mobile',
  //       size: 200,

  //       enableColumnPinning: true,
  //       header: 'Mobile',
  //       Cell: ({ renderedCellValue, row }) =>
  //         `${row?.original?.contact_details?.length > 0 ? `${row?.original?.contact_details[0]?.country_code}-${row?.original?.contact_details[0]?.mobile} ` : ''}`
  //     }
  //   ]

  //   console.log('eventDetailsAll---->', eventDetailsAll)
  //   // Add columns for all details
  //   if (eventDetailsAll && eventDetailsAll.length > 0) {
  //     const filteredColumns =
  //       selectedType === 'all' ? eventDetailsAll : eventDetailsAll.filter(detail => detail.type === selectedType)
  //     filteredColumns?.forEach(detail => {
  //       baseColumns.push({
  //         accessorKey: detail.oid,
  //         header: detail.title,
  //         size: 200,

  //         Cell: ({ row }) => {
  //           let isChecked = detail?.contact_id?.some(contact => contact.id === row.original.contact_id)
  //           return (
  //             <Checkbox
  //               key={`${row?.original?.contact_id}-${detail?.oid}`}
  //               color={isLoading || isEventDetailsFetching ? 'primary' : 'success'}
  //               disabled={isLoading || isEventDetailsFetching}
  //               onChange={e => {
  //                 const selectedData = {
  //                   rowId: row?.original?.contact_id,
  //                   columnId: detail.oid,
  //                   detailName: detail.title,
  //                   type: detail.type,
  //                   isChecked: e.target.checked
  //                 }
  //                 handleCheckboxChange(selectedData)
  //               }}
  //               defaultChecked={isChecked}
  //             />
  //           )
  //         }
  //       })
  //     })
  //   }

  //   return baseColumns
  // }

  const generateColumns = () => {
    const baseColumns = [
      {
        size: 100,
        accessorKey: 'serialNumber',
        header: 'S.No',
        enableColumnPinning: true,
        Cell: ({ row, table }) => <SerialNumberGenerator row={row} table={table} />
      },
      {
        accessorKey: 'contact_function_id',
        enableColumnPinning: true,
        size: 200,
        header: 'Generated Function number',
        Cell: ({ row }) => `${row?.original?.contact_function_id ? row?.original?.contact_function_id : '-'}`
      },
      {
        accessorKey: 'name',
        enableColumnPinning: true,
        size: 200,
        header: 'Name',
        Cell: ({ row }) =>
          `${row?.original?.contact_details?.length > 0 ? row?.original?.contact_details[0]?.name : ''}`
      },
      {
        accessorKey: 'mobile',
        size: 200,
        enableColumnPinning: true,
        header: 'Mobile',
        Cell: ({ row }) =>
          `${row?.original?.contact_details?.length > 0 ? `${row?.original?.contact_details[0]?.country_code}-${row?.original?.contact_details[0]?.mobile}` : ''}`
      }
    ]

    console.log('eventDetailsAll---->', eventDetailsAll)
    const filteredColumns =
      selectedType === 'all' ? eventDetailsAll : eventDetailsAll.filter(detail => detail.type === selectedType)

    // Dynamically push event/transport/other columns
    const dynamicColumns = []

    filteredColumns.forEach(detail => {
      const contactList = detail?.contact_id || []

      // Get array of contact IDs from both lists
      const selectedIds = contactList.map(c => c.id)
      const allIds = contactsFunctionAll.map(c => c.contact_id)

      // Check if every contact_id from contactsFunctionAll exists in contactList
      const allChecked = allIds.length > 0 ? allIds.every(id => selectedIds.includes(id)) : false

      console.log('contactlist------------>', contactsFunctionAll, contactList)
      // Base checkbox column
      dynamicColumns.push({
        // accessorKey: detail.title,
        accessorKey: detail.oid,
        // header: detail.title,
        header: (
          <Box display='flex' alignItems='center'>
            <Checkbox
              checked={allChecked}
              disabled={isGloabselect}
              // indeterminate={!allChecked && allIds.some(id => selectedIds.includes(id))}
              onChange={e => {
                // Example handler — toggle all select/deselect
                const checked = handelSelectAll(e.target.checked, detail)
                // if (checked) {
                //   // Add all missing contacts
                //   const updated = [
                //     ...contactList,
                //     ...contactsFunctionAll
                //       .filter(c => !selectedIds.includes(c.contact_id))
                //       .map(c => ({ id: c.contact_id, data: 'pending' }))
                //   ]
                //   console.log('Select All:', updated)
                // } else {
                //   // Remove all
                //   const updated = contactList.filter(c => !allIds.includes(c.id))
                //   console.log('Deselect All:', updated)
                // }
              }}
            />
            {detail.title}
          </Box>
        ),
        size: 200,
        Cell: ({ row }) => {
          // const isChecked = detail?.contact_id?.some(contact => contact.id === row.original.contact_id)
          const rowContactId = row.original.contact_id
          const contactList = detail?.contact_id || []
          const isChecked = contactList.some(contact => contact.id === rowContactId)
          console.log('row----->', row.original, contactList, row.original.contact_details[0].name)
          // Log for debugging purposes
          console.log(`🔍 Column: ${detail.title}, Row Contact ID: ${rowContactId}, Is Checked: ${isChecked}`)

          return (
            <Checkbox
              key={`${row?.original?.contact_id}-${detail?.oid}`}
              color={isLoading || isEventDetailsFetching ? 'primary' : 'success'}
              disabled={isLoading || isEventDetailsFetching || isGloabselect}
              value={isChecked}
              checked={isChecked}
              onChange={e => {
                // const selectedData = {
                //   rowId: row?.original?.contact_id,
                //   columnId: detail.oid,
                //   detailName: detail.title,
                //   type: detail.type,
                //   isChecked: e.target.checked
                // }
                // console.log('val---->', selectedData)
                // handleCheckboxChange(selectedData)
                const singleData = {
                  oid: detail.oid,
                  contactId: row?.original?.contact_id,
                  checked: e.target.checked,
                  type:
                    detail.type === 'transport'
                      ? 'transportation'
                      : detail.type === 'other'
                        ? 'otherInfo'
                        : detail.type,
                  search_string: searchText
                }
                handleCheckboxSingle(singleData)
              }}
              defaultChecked={isChecked}
            />
          )
        }
      })

      // If type === 'transport', add input and upload columns next
      // if (detail.type === 'transport') {
      //   dynamicColumns.push(
      //     {
      //       accessorKey: `${detail.oid}_input`,
      //       header: `${detail.title} - Ticket Info`,
      //       size: 200,
      //       Cell: ({ row }) => (
      //         <input
      //           type='text'
      //           placeholder='Enter ticket info'
      //           onChange={e => {
      //             handleTicketInputChange({
      //               oid: detail.oid,
      //               rowId: row.original.contact_id,
      //               value: e.target.value
      //             })
      //           }}
      //           style={{ width: '100%' }}
      //         />
      //       )
      //     },
      //     {
      //       accessorKey: `${detail.oid}_upload`,
      //       header: `${detail.title} - Upload`,
      //       size: 150,
      //       Cell: ({ row }) => (
      //         <Button variant='outlined' component='label' size='small'>
      //           Upload
      //           <input
      //             type='file'
      //             hidden
      //             onChange={e => {
      //               const file = e.target.files[0]
      //               if (file) {
      //                 handleTicketUpload({
      //                   oid: detail.oid,
      //                   rowId: row.original.contact_id,
      //                   file
      //                 })
      //               }
      //             }}
      //           />
      //         </Button>
      //       )
      //     }
      //   )
      // }
    })

    return [...baseColumns, ...dynamicColumns]
  }

  const handleTicketInputChange = async ({ oid, rowId, value }) => {
    console.log('input box---->', oid, rowId, value)
  }

  const handleTicketUpload = async ({ file }) => {
    console.log('input box---->', file, functionId)
    const formData = new FormData()
    formData.append('file', file)
    const imageRes = await apiPost(`${baseURL}mapped-contact/bulk-upload/${functionId}`, formData, true)
    console.log('imageres---->', imageRes)
    if (imageRes.status === 200) {
      // let data = imageRes.data.result
      const params = {
        contacts: imageRes?.data?.result
      }
      // await callBackmappedContact(params)
      const result = await apiPost(`${baseURL}mapped-contact/bulk-add/${functionId}`, params)
      if (result.status == 200) {
        dispatch(syncEventDetailsContacts(imageRes?.data?.result))
        toast.success(imageRes.data.message)
      }
      // generateColumns()
    }
  }

  const handleCheckboxChange = async selectedData => {
    // Create a deep copy of previous details
    const newDetails = JSON.parse(JSON.stringify(details))
    console.log('newDetails----->', newDetails)

    // Determine the detail type key based on the type
    const typeKeyMap = {
      event: 'event_id',
      transport: 'transport_id',
      accommodation: 'accommodation_id',
      other: 'other_info_id'
    }

    const typeContactsKeyMap = {
      event: 'event_contacts_id',
      transport: 'transport_contacts_id',
      accommodation: 'accommodation_contacts_id',
      other: 'other_info_contacts_id'
    }

    const detailIdKey = typeKeyMap[selectedData.type]
    const contactsIdKey = typeContactsKeyMap[selectedData.type]

    // Find if the detail already exists
    const existingDetailIndex = newDetails.findIndex(d => d[detailIdKey] === selectedData.columnId)

    if (selectedData.isChecked) {
      // Adding contact
      if (existingDetailIndex !== -1) {
        // Detail exists, add contact ID if not already present
        if (!newDetails[existingDetailIndex][contactsIdKey].includes(selectedData.rowId)) {
          newDetails[existingDetailIndex] = {
            ...newDetails[existingDetailIndex],
            [contactsIdKey]: [...newDetails[existingDetailIndex][contactsIdKey], selectedData.rowId]
          }
        }
      } else {
        // Detail doesn't exist, create new entry
        newDetails.push({
          [detailIdKey]: selectedData.columnId,
          [contactsIdKey]: [selectedData.rowId]
        })
      }
    } else {
      // Removing contact
      if (existingDetailIndex !== -1) {
        // Filter out the selected contact ID
        newDetails[existingDetailIndex] = {
          ...newDetails[existingDetailIndex],
          [contactsIdKey]: newDetails[existingDetailIndex][contactsIdKey].filter(id => id !== selectedData.rowId)
        }
      }
    }

    // Prepare the data for the API call
    const finalData = newDetails.map(item => {
      let type, oid, contactIds

      if ('event_id' in item) {
        type = 'event'
        oid = item.event_id
        contactIds = item.event_contacts_id
      } else if ('transport_id' in item) {
        type = 'transportation'
        oid = item.transport_id
        contactIds = item.transport_contacts_id
      } else if ('accommodation_id' in item) {
        type = 'accommodation'
        oid = item.accommodation_id
        contactIds = item.accommodation_contacts_id
      } else if ('other_info_id' in item) {
        type = 'other'
        oid = item.other_info_id
        contactIds = item.other_info_contacts_id
      }

      return {
        type,
        oid,
        contact_id: contactIds
      }
    })

    try {
      const params = {
        contacts: finalData
      }
      setIsLoading(true)
      await callBackmappedContact(params)
      // const result = await apiPost(`${baseURL}mapped-contact/bulk-add`, params)
      // getAllFunctionConatcts()
    } catch (error) {
      toast.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  const handelSelectAll = async (val, detail) => {
    setIsGlobalselect(true)
    try {
      console.log('val------>', val, detail)

      let body = {
        type: detail.type === 'transport' ? 'transportation' : detail.type,
        oid: detail.oid,
        checked: val,
        search_string: searchText
      }
      const result = await apiPost(`${baseURL}mapped-contact/bulk-add-all/${functionId}`, body)
      getAllFunctionConatcts()
      return
    } catch (error) {
      console.log('err in callBackmappedContact---->', error)
      toast.error(error)
    } finally {
      setIsGlobalselect(false)
    }
  }

  const handleCheckboxSingle = async singleData => {
    setIsGlobalselect(true)
    try {
      console.log('val singleData------>', singleData)
      const result = await apiPost(`${baseURL}mapped-contact/update-single/${functionId}`, singleData)
      getAllFunctionConatcts()

      // let body = {
      //   type: detail.type === 'transport' ? 'transportation' : detail.type,
      //   oid: detail.oid,
      //   checked: val,
      //   search_string: searchText
      // }

      return
    } catch (error) {
      console.log('err in callBackmappedContact---->', error)
      toast.error(error)
    } finally {
      setIsGlobalselect(false)
    }
  }

  const callBackmappedContact = async params => {
    try {
      const result = await apiPost(`${baseURL}mapped-contact/bulk-add/${functionId}`, params)
      getAllFunctionConatcts()
      return
    } catch (error) {
      console.log('err in callBackmappedContact---->', error)
      toast.error(error)
    }
  }
  // const columns = useMemo(
  //   () => generateColumns(),
  //   [
  //     eventDetailsAll,
  //     selectedType,
  //     // selectedCells, // if checkboxes depend on state
  //     isLoading,
  //     isEventDetailsFetching
  //   ]
  // )

  const exportSeclectedExcelFun = async () => {
    try {
      let url = `${baseURL}invitee-contact/export-excel?function_id=${functionId}`
      console.log('url----->', url)

      const authToken = await getAccessToken()
      const config = {
        headers: {
          authorization: authToken ? `${authToken}` : null
        }
      }

      const result = await axios.post(
        `${baseURL}invitee-contact/export-excel?function_id=${functionId}`,
        {
          columnNames: selectedColumns
        },
        config
      )
      console.log('res----->', result)
      await convertBase64Blob(result.data.data, 'exportedmappedlist.xlsx')
      // alert('hi')
      toast.success('excel file downloaded successfully')
    } catch (e) {
      toast.error(e)
    } finally {
    }
  }

  const table = useMaterialReactTable({
    columns: generateColumns(),
    // columns,
    enableHiding: true,
    data: contactsFunctionAll || [],
    enableRowSelection: false,
    enableSelectAll: false,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['serialNumber', 'contact_function_id', 'name', 'mobile'] }
    },
    enableTopToolbar: false,
    // enableHiding: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: contactsFunctionCount,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    // manualPagination: true,
    state: {
      // pagination,
      // showProgressBars: isGloabselect,
      isLoading: isGloabselect
    },
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'black',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'black !important'
        }
      }
    }),
    muiTableHeadCellProps: ({ column }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: {
        color: 'black',
        backgroundColor: column.getIsPinned() ? 'primary.main' : theme => alpha(theme.palette.secondary.main, 0.3)
      }
    }),
    muiTableBodyCellProps: () => ({
      sx: {
        minHeight: 75
      }
    })
  })

  useEffect(() => {
    if (eventDetailsAll) {
      const initialDetails = eventDetailsAll.map(item => {
        const typeKeyMap = {
          event: 'event_id',
          transport: 'transport_id',
          accommodation: 'accommodation_id',
          other: 'other_info_id'
        }

        const typeContactsKeyMap = {
          event: 'event_contacts_id',
          transport: 'transport_contacts_id',
          accommodation: 'accommodation_contacts_id',
          other: 'other_info_contacts_id'
        }

        const detailIdKey = typeKeyMap[item.type]
        const contactsIdKey = typeContactsKeyMap[item.type]

        return {
          [detailIdKey]: item.oid,
          [contactsIdKey]: item.contact_id?.map(contact => contact.id) || []
        }
      })
      setDetails(initialDetails)
    }
  }, [eventDetailsAll])

  return (
    <Grid2 container spacing={6}>
      <Grid2 size={{ xs: 12 }}>
        <Card
          sx={{
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <Divider sx={{ m: '0 !important' }} />
          <CardContent></CardContent>
          {/* <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'} mt={2}>
            <Grid2 size={{ xs: 12, lg: 5, md: 5, sm: 12 }}>
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
            <Grid2 size={{ xs: 12, lg: 5, md: 5, sm: 12 }} mt={{ xs: 2, md: 0 }}>
              <ColumnMultiSelect table={table} />
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 5, md: 5, sm: 12 }}>
              <Button variant='outlined' component='label' size='small'>
                Upload
                <input
                  type='file'
                  hidden
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      handleTicketUpload({
                        file
                      })
                    }
                  }}
                />
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}></Grid2>
          </Grid2> */}
          <Grid2 container spacing={2} alignItems='center' px={4} mt={2}>
            {/* Search */}
            <Grid2 xs={12} lg={6} md={6}>
              <TextField
                variant='outlined'
                size='small'
                sx={{ mr: 4 }}
                value={tempSearchText}
                fullWidth
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
            {/* Column selector */}
            <Grid2 xs={12} lg={2} md={4}>
              <ColumnMultiSelect table={table} passList={setSelectedColumns} />
            </Grid2>

            {/* Upload button */}
            <Grid2 xs={12} lg={2} md={3} display='flex' justifyContent='flex-end'>
              <Button variant='outlined' component='label' size='small' fullWidth>
                {/* <Button fullWidth variant='contained' color='primary' sx={{ '& svg': { mr: 2 } }}> */}
                Upload
                <input
                  type='file'
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleTicketUpload({ file })
                    }
                  }}
                />
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}>
              <Button
                fullWidth
                onClick={() => {
                  exportSeclectedExcelFun()
                }}
                variant='contained'
                color='primary'
                sx={{ '& svg': { mr: 2 } }}
              >
                export mapped
              </Button>
            </Grid2>
          </Grid2>

          <Box p={4}>
            {false ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
                {' '}
                <CircularProgress />
              </Box>
            ) : eventDetailsAll?.length > 0 ? (
              <MaterialReactTable table={table} />
            ) : (
              eventDetailsAll?.length > 0 &&
              !isEventDetailsFetching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
                  <Typography variant='h6' color='textSecondary'>
                    No Event(s) Found
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Card>
      </Grid2>
      <Box p={4}>
        <AddFileDrawer open={addUserOpen} toggle={toggleAddUserDrawer} id={eid} RowData={entireRow} />
      </Box>
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
    </Grid2>
  )
}

export function NoRowsOverlay() {
  return (
    <Stack height='100%' alignItems='center' justifyContent='center'>
      No Contacts Found
    </Stack>
  )
}
export default InviteesMapping
