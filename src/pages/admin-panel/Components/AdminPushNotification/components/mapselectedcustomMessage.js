import React, { useEffect, useMemo, useState } from 'react'
import {
  Checkbox,
  Button,
  Box,
  CircularProgress,
  CardContent,
  Divider,
  Card,
  TextField,
  IconButton,
  Icon
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  baseURL,
  filterContactPush,
  gestCustomPushAdminAllUsers,
  gestCustomPushAdminAllUsersFun,
  getCustomPushAdminFunctionList,
  getnotification,
  getPushTemplates,
  mapTemplatesHrs,
  postCustomMappedUser,
  postCustomSelectedMappedUser,
  updateCustomMappedUser,
  updateCustomMappedUserAdmin,
  updateCustomMappedUserBulk,
  updateCustomMappedUserBulkSelected,
  updateCustomMappedUserBulkSelectedAdmin
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { getListOfFunctionContacts } from 'src/store/adminMod'
import { DropdownFilterPushContact } from 'src/@core/components/pushfilterdrop/filterpushcontact'

function CustomPushAdminNotificationMappingSelected({}) {
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length
  const dispatch = useDispatch()
  const [tempSearchText, setTempSearchText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterdrop, setFilterDrop] = useState([])
  const [functiondrop, setfunctiondrop] = useState([])

  const [selectedFil, setSelectedFil] = useState('')
  const [selectedFilFun, setSelectedFilFun] = useState('')

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const [isContactsFetching, setIsContactFetching] = useState(false)
  const [contactsCount, setContactsCount] = useState(0)
  //   console.log('contactsFunctionAll----->', contactsFunctionAll)
  //   const generateColumns = ({ onToggle }) => {
  //     const baseCols = [
  //       {
  //         accessorKey: 'contact_name',
  //         header: 'Contact Name',
  //         Cell: ({ row }) => row.original.contact_name || '-'
  //       },
  //       {
  //         accessorKey: 'contact_mobile',
  //         header: 'Contact Mobile',
  //         Cell: ({ row }) => row.original.contact_mobile || '-'
  //       }
  //     ]

  //     // dynamic message columns
  //     const dynamicCols = (contactsFunctionAll?.[0]?.messages || []).map(msg => ({
  //       accessorKey: msg.msg_id, // use msg_id as accessor
  //       header: msg.title, // use title as column header
  //       Cell: ({ row }) => {
  //         const currentMsg = row.original.messages.find(m => m.msg_id === msg.msg_id)
  //         return (
  //           <Checkbox
  //             checked={currentMsg?.checked || false}
  //             onChange={e =>
  //               onToggle({
  //                 msg_id: msg.msg_id,
  //                 contact_id: row.original.contact_id,
  //                 checked: e.target.checked
  //               })
  //             }
  //           />
  //         )
  //       }
  //     }))

  //     return [...baseCols, ...dynamicCols]
  //   }
  const generateColumns = ({ onToggle, onToggleColumn }) => {
    // static column for contact name
    const baseCols = [
      {
        accessorKey: 'contact_name',
        header: 'Contact Name',
        Cell: ({ row }) => row.original.contact_name || '-'
      },
      {
        accessorKey: 'contact_mobile',
        header: 'Contact Mobile',
        Cell: ({ row }) => row.original.contact_mobile || '-'
      }
    ]

    // dynamic message columns
    const dynamicCols = (contactsFunctionAll?.[0]?.messages || []).map(msg => {
      // find how many contacts already checked
      const allChecked = contactsFunctionAll.every(row => row.messages.find(m => m.msg_id === msg.msg_id)?.checked)

      return {
        accessorKey: msg.msg_id,
        header: (
          <Box display='flex' alignItems='center'>
            <Checkbox
              checked={allChecked}
              // indeterminate={
              //   !allChecked && contactsFunctionAll.some(row => row.messages.find(m => m.msg_id === msg.msg_id)?.checked)
              // }
              onChange={e =>
                onToggleColumn({
                  msg_id: msg.msg_id,
                  checked: e.target.checked
                })
              }
            />
            {msg.title}
          </Box>
        ),
        Cell: ({ row }) => {
          const currentMsg = row.original.messages.find(m => m.msg_id === msg.msg_id)
          return (
            <Checkbox
              checked={currentMsg?.checked || false}
              onChange={e =>
                onToggle({
                  msg_id: msg.msg_id,
                  contact_id: row.original.contact_id,
                  checked: e.target.checked
                })
              }
            />
          )
        }
      }
    })

    return [...baseCols, ...dynamicCols]
  }

  const handleUpdateMapping = async data => {
    try {
      let body = {
        // msg_id: data.msg_id,
        contact_id: data.contact_id,
        checked: data.checked,
        functionId: selectedFilFun
      }
      console.log('body', body)
      await apiPatch(`${updateCustomMappedUserAdmin}/${data.msg_id}`, body)
      fetchData()
      toast.success('Updated successfully')
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }

  const handleUpdateMappingColumn = async ({ msg_id, checked }) => {
    try {
      const contactIds = contactsFunctionAll.map(row => row.contact_id)

      console.log('contactIds------>', {
        msg_id,
        contact_ids: contactIds,
        checked,
        selectedFilFun,
        oid: selectedFil,
        search_string: searchText
      })

      await apiPatch(`${updateCustomMappedUserBulkSelectedAdmin}/${msg_id}`, {
        contact_ids: contactIds,
        checked,
        functionId: selectedFilFun,
        oid: selectedFil,
        search_string: searchText
      })

      fetchData()
      toast.success('Column updated successfully')
    } catch (err) {
      console.error('Failed to update column:', err)
      toast.error('Column update failed')
    }
  }

  const getFunctionList = async () => {
    try {
      // alert('in')
      console.log(
        'getCustomPushAdminFunctionList============>',
        getCustomPushAdminFunctionList,
        gestCustomPushAdminAllUsers
      )
      const response = await apiGet(`${getCustomPushAdminFunctionList}`)
      console.log('Custom Push Notification Mapping:', response.data)
      setfunctiondrop(response.data.data || [])
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const filterContactPushfun = async () => {
    try {
      const response = await apiGet(`${filterContactPush}/${selectedFilFun}`)
      console.log('Custom Push Notification Mapping:', response.data)
      setFilterDrop(response.data.data || [])
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const fetchData = async () => {
    setIsContactFetching(true)
    try {
      const params = {
        page: pagination?.pageIndex + 1,
        size: pagination?.pageSize
      }
      const response = await apiGet(
        `${gestCustomPushAdminAllUsersFun}/${selectedFilFun}?search_string=${searchText}&oid=${selectedFil}&page=${params.page}&limit=${params.size}`
      )
      console.log('Custom Push Notification Mapping:', response.data)
      //   console.log('Custom Push Notification Mapping response2:', response2.data)
      setContactsCount(response?.data?.pagination?.total || 0)
      setContactsFunctionAll(response.data.data || [])
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    } finally {
      setIsContactFetching(false)
    }
  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  useEffect(() => {
    getFunctionList()
    // fetchData()
  }, [])

  useEffect(() => {
    if (selectedFilFun) {
      filterContactPushfun()
      fetchData()
    }
  }, [selectedFilFun])

  useEffect(() => {
    fetchData()
  }, [pagination?.pageIndex, pagination?.pageSize, searchText, selectedFil])
  const columns = useMemo(
    () =>
      generateColumns({
        onToggle: handleUpdateMapping,
        onToggleColumn: handleUpdateMappingColumn
      }),
    [contactsFunctionAll]
  )

  const table = useMaterialReactTable({
    columns,
    data: contactsFunctionAll,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    // layoutMode: 'grid-no-grow',
    layoutMode: 'grid', // <-- instead of 'grid-no-grow'
    muiTableContainerProps: {
      sx: { minWidth: '100%' } // forces full-width
    },
    muiTableHeadCellProps: {
      sx: { whiteSpace: 'nowrap' } // prevents header wrapping
    },
    muiTableBodyCellProps: {
      sx: { whiteSpace: 'nowrap' } // cells expand with content
    },
    initialState: {
      columnPinning: { left: ['contact_name', 'contact_mobile'] }
    },
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: contactsCount,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    onPaginationChange: setPagination,
    manualPagination: true,
    state: {
      pagination,
      showProgressBars: isContactsFetching,
      isLoading: isContactsFetching
    }
  })
  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 xs={12}>
          <Card
            sx={{
              width: '100%',
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
            }}
          >
            <Divider sx={{ m: '0 !important' }} />
            <CardContent>
              {/* 🔹 Search + Dropdown row */}
              <Grid2 container spacing={2} alignItems='center'>
                <Grid2 xs={12} md={6} lg={6}>
                  <TextField
                    variant='outlined'
                    size='small'
                    sx={{ mr: 2 }}
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
                <Grid2 xs={12} md={6} lg={6}>
                  <DropdownFilterPushContact templates={functiondrop} passval={setSelectedFilFun} />
                </Grid2>

                <Grid2 xs={12} md={6} lg={6}>
                  <DropdownFilterPushContact templates={filterdrop} passval={setSelectedFil} />
                </Grid2>
              </Grid2>
            </CardContent>

            <Box p={4} sx={{ width: '100%' }}>
              <MaterialReactTable table={table} />
            </Box>
          </Card>
        </Grid2>
      </Grid2>
    </>
  )
}

export default CustomPushAdminNotificationMappingSelected
