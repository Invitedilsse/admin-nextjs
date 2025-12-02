// ** React Imports
import { useEffect, useState } from 'react'
// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

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
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import 'react-datepicker/dist/react-datepicker.css'
import { apiDelete, apiPost } from 'src/hooks/axios'
import AddFileDrawer from './components/ManageContactsDrawer'
import { baseURL } from 'src/services/pathConst'
import {
  getListOfEventDetails,
  getListOfFunctionGroupsInternal,
} from 'src/store/adminMod'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

const InviteesMappingGroupInternal = () => {
  // ** Hooks
  const dispatch = useDispatch()
  const [tabValue, setTabValue] = useState('1')
  const [rowSelection, setRowSelection] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [eid, setEid] = useState('')
  const [entireRow, setEntireRow] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const handleClose = () => {
    setdOpen(false)
  }

  const { groupsInterFunctionAll, groupsInterFunctionCount } = useSelector(
    state => state.adminMod
  )
  const {
    eventDetailsAll,
    isEventDetailsFetching,
    functionId
  } = useSelector(state => state.adminMod)

  const toggleAddUserDrawer = () => {
    if (addUserOpen) {
      setEid('')
    }
    setAddUserOpen(!addUserOpen)
  }

  const getAllFunctionConatcts = () => {
    const queryParams = `function_id=${functionId}&limit=${2500}&offset=${0}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'title'}`
    dispatch(getListOfFunctionGroupsInternal(queryParams))
    dispatch(getListOfEventDetails(functionId))
  }

  useEffect(() => {
    getAllFunctionConatcts()
  }, [tabValue])

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

  const generateColumns = () => {
    const baseColumns = [
      {
        accessorKey: 'title',
        enableColumnPinning: true,
        size: 200,
        header: 'Name'
      },
      {
        accessorKey: 'description',
        enableColumnPinning: true,
        size: 200,
        header: 'Description'
      }
    ]
    // Add columns for all details
    if (eventDetailsAll && eventDetailsAll.length > 0) {
      eventDetailsAll?.forEach(detail => {
        baseColumns.push({
          accessorKey: detail.title,
          header: detail.title,
          size: 200,

          Cell: ({ row }) => {
            let isChecked = detail?.internal_user_group_id?.some(contact => contact.id === row.original.id)
            return (
              <Checkbox
                key={`${row?.original?.id}-${detail?.oid}`}
                color={isLoading || isEventDetailsFetching ? 'primary' : 'success'}
                disabled={isLoading || isEventDetailsFetching}
                onChange={e => {
                  const selectedData = {
                    rowId: row?.original?.id,
                    columnId: detail.oid,
                    detailName: detail.title,
                    type: detail.type,
                    isChecked: e.target.checked
                  }
                  handleCheckboxChange(selectedData)
                }}
                defaultChecked={isChecked}
              />
            )
          }
        })
      })
    }

    return baseColumns
  }

  const handleCheckboxChange = async selectedData => {
    // Create a deep copy of previous details
    const newDetails = JSON.parse(JSON.stringify(details))

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

    console.log(newDetails)

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
        user_group_id: contactIds
      }
    })
    try {
      const params = {
        contacts: finalData
      }
      setIsLoading(true)
      const result = await apiPost(`${baseURL}mapped-internal-group/bulk-add`, params)
      getAllFunctionConatcts()
    } catch (error) {
      toast.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  const table = useMaterialReactTable({
    columns: generateColumns(),
    data: groupsInterFunctionAll || [],
    enableRowSelection: false,
    enableSelectAll: false,

    onRowSelectionChange: setRowSelection,
    state: { rowSelection, isLoading: isEventDetailsFetching },
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['title', 'description'] }
    },
    enableTopToolbar: false,
    enableHiding: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: groupsInterFunctionCount,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
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
          [contactsIdKey]: item.internal_user_group_id?.map(contact => contact.id) || []
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
            boxShadow: 'none'
          }}
        >
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'} mt={2}>
            <Grid2 size={{ xs: 12, lg: 5, md: 5, sm: 12 }}>
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Functional Group'
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
            <Grid2 size={{ xs: 12, lg: 5, md: 5, sm: 12 }}>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 2, md: 2, sm: 12 }}></Grid2>
          </Grid2>
          <Box p={4}>
            {isEventDetailsFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
                {' '}
                <CircularProgress />
              </Box>
            ) : eventDetailsAll?.length > 0 ? (
              <MaterialReactTable table={table} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
                <Typography variant='h6' color='textSecondary'>
                  No Event(s) Found
                </Typography>
              </Box>
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
      No Group Found
    </Stack>
  )
}
export default InviteesMappingGroupInternal
