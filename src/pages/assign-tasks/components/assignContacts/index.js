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
    assignCallersBulkByFunctionId,
    assignCallersByFunctionId,
    assignFunctionContactList,
  assignFunctionFilterByEvent,
  baseURL,
  filterContactPush,
  getnotification,
  getPushTemplates,
  mapTemplatesHrs,
  postCustomMappedUser,
  postCustomSelectedMappedUser,
  updateCustomMappedUser,
  updateCustomMappedUserBulk,
  updateCustomMappedUserBulkSelected
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { getListOfFunctionContacts } from 'src/store/adminMod'
import { DropdownFilterPushContact } from 'src/@core/components/pushfilterdrop/filterpushcontact'

function AssignContacts({RowData}) {
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
  const [dynamicColumn, setDynamicColumn] = useState([])
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
  // Base static columns
  const baseCols = [
    {
      accessorKey: "name",
      header: "Contact Name",
      Cell: ({ row }) => row.original.name || "-"
    },
    {
      accessorKey: "mobile",
      header: "Contact Mobile",
      Cell: ({ row }) => row.original.mobile || "-"
    }
  ];

  if (!dynamicColumn || dynamicColumn.length === 0) return baseCols;

  // -----------------------------
  // MULTIPLE dynamic users
  // -----------------------------
  const dynamicCols = dynamicColumn.map((user) => {

    // For each user, check column header state
    const allChecked = contactsFunctionAll.every(
      (contact) => contact.assignedTo === user.id
    );

    const someChecked = contactsFunctionAll.some(
      (contact) => contact.assignedTo === user.id
    );

    return {
      accessorKey: user.id, // unique per user column
      header: (
        <Box display="flex" alignItems="center">
          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            onChange={(e) =>
              onToggleColumn({
                userId: user.id,
                checked: e.target.checked
              })
            }
          />
          {user.first_name} {user.last_name || ""}
        </Box>
      ),
      Cell: ({ row }) => {
        // contact-level checkbox
        const isChecked = row.original.assignedTo === user.id;

        return (
          <Checkbox
            checked={isChecked}
            onChange={(e) =>
              onToggle({
                userId: user.id,
                checked: e.target.checked,
                contactId: row.original.id
              })
            }
          />
        );
      }
    };
  });

  return [...baseCols, ...dynamicCols];
};



  const handleUpdateMapping = async data => {
    try {
      let body = {
        // msg_id: data.msg_id,
        contactId:data.contactId,
        userId: data.userId,
        checked: data.checked
      }
      console.log('body single toggel', body)
     const res = await apiPatch(`${assignCallersByFunctionId}/${RowData?.id}`, body)
      fetchConatctData()
      toast.success(res.data.message)
    } catch (err) {
      console.error('Failed to update notification flag:', err)
        toast.error(err || 'Update failed')
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

  const handleUpdateMappingColumn = async ({ userId, checked }) => {
    try {
      const contactIds = contactsFunctionAll.map(row => row.id)

      console.log('contactIds------>', {
        userId,
        contactId: contactIds,
        checked,
        search_string: searchText
      })

      const res = await apiPatch(`${assignCallersBulkByFunctionId}/${RowData?.id}`, {
        userId,
        contactId: contactIds,
        checked,
        search_string: searchText
      })

      fetchConatctData()
      toast.success(res.data.message)
    } catch (err) {
      console.error('Failed to update column:', err)
      toast.error(err || 'Update failed')
    }
  }
  const filterContactPushfun = async () => {
    try {
        console.log("functionId=================>",RowData?.id)
      const response = await apiGet(`${assignFunctionFilterByEvent}/${RowData?.id}`)
      console.log('Custom Push Notification Mapping:', response.data)
      setFilterDrop(response.data.data || [])
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }



      const fetchConatctData = async () => {
      //fetch data from the api and set it to the state
    setIsContactFetching(true)

      try {
         const params = {
        page: pagination?.pageIndex + 1,
        size: pagination?.pageSize
      }
        const response = await apiGet(
          `${assignFunctionContactList}?functionId=${RowData?.id}&oid=&page=1&limit=10`
        )
        console.log('Push Notification Templates:', response.data)
        setContactsCount(response?.data?.pagination?.total || 0)
      setContactsFunctionAll(response.data.data || [])
       setDynamicColumn(response.data.dynamiccolumn||[])
      } catch (error) {
        console.error('Error fetching push notification templates:', error)
      }finally{
      setIsContactFetching(false)

      }
    }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }

  useEffect(() => {
    filterContactPushfun()
    fetchConatctData()
    // fetchData()
  }, [])

  useEffect(() => {
    // fetchData()
    fetchConatctData()

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

export default AssignContacts


