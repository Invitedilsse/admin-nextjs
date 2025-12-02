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
  getnotification,
  getPushTemplates,
  mapTemplatesHrs,
  postCustomMappedUser,
  postCustomSelectedMappedUser,
  updateCustomMappedUser,
  updateCustomMappedUserBulk
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { getListOfFunctionContacts } from 'src/store/adminMod'
import { DropdownFilterPushContact } from 'src/@core/components/pushfilterdrop/filterpushcontact'

function CustomPushNotificationAdminAllUsers({}) {
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const contactsFunctionCount = contactsFunctionAll.length
  const dispatch = useDispatch()
  const [tempSearchText, setTempSearchText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterdrop, setFilterDrop] = useState([])
  const [selectedFil, setSelectedFil] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const [isContactsFetching, setIsContactFetching] = useState(false)
  const [contactsCount, setContactsCount] = useState(0)
  // const isFirstRender = useRef(true)

  const generateColumns = ({ onToggle, onToggleColumn }) => {
    // static column for contact name
    const baseCols = [
      {
        accessorKey: 'user_name',
        header: 'User Name',
        Cell: ({ row }) => row.original.user_name || '-'
      },
      {
        accessorKey: 'user_mobile',
        header: 'User Mobile',
        Cell: ({ row }) => row.original.user_mobile || '-'
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
              indeterminate={
                !allChecked && contactsFunctionAll.some(row => row.messages.find(m => m.msg_id === msg.msg_id)?.checked)
              }
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
                  user_id: row.original.user_id,
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
        user_id: data.user_id,
        checked: data.checked
      }
      console.log('body', body)
      await apiPatch(`${updateCustomMappedUser}/${data.msg_id}`, body)
      fetchData()
      toast.success('Updated successfully')
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }
  const handleUpdateMappingColumn = async ({ msg_id, checked }) => {
    try {
      const contactIds = contactsFunctionAll.map(row => row.user_id)

      console.log('contactIds------>', {
        msg_id,
        contact_ids: contactIds,
        checked,
        oid: selectedFil,
        search_string: searchText
      })

      await apiPatch(`${updateCustomMappedUserBulk}/${msg_id}`, {
        contact_ids: contactIds,
        checked,
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

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }
  const filterContactPushfun = async () => {
    try {
      const response = await apiGet(`${filterContactPush}/${functionId}`)
      //   const response2 = await apiGet(`${postCustomSelectedMappedUser}/${functionId}`)
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
      console.log('in------->', params.page, pagination?.pageSize)
      const response = await apiGet(
        `${gestCustomPushAdminAllUsers}?search_string=${searchText}&oid=${selectedFil}&page=${params.page}&limit=${params.size}`
      )
      console.log('Custom Push Notification Mapping:', response.data)
      setContactsCount(response?.data?.pagination?.total || 0)
      setContactsFunctionAll(response?.data?.data || [])
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
    filterContactPushfun()
    // fetchData()
  }, [])

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
      columnPinning: { left: ['user_name', 'user_mobile'] }
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

                {/* <Grid2 xs={12} md={6} lg={6}>
                  <DropdownFilterPushContact templates={filterdrop} passval={setSelectedFil} />
                </Grid2> */}
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

export default CustomPushNotificationAdminAllUsers
