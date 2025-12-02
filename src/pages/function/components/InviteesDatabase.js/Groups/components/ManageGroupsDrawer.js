// ** React Imports
import { useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// ** Custom Component Import
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { alpha, Button, Drawer, Grid2, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { getListOfGroups } from 'src/store/adminMod'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

// ** ValidationSchema
const validationSchema = yup.object({
  description: yup.string().trim().required('Description is required').min(3, 'Minimum 3 character required').max(500, 'Maximum 500 character only allowed'),
  name: yup
    .string('Group Name is required')
    .trim()
    .required('Group Name is required')
    .min(3, 'Minimum 3 character required')
    .max(70, 'Maximum 70 character only allowed')
})

const ManageGroupsDrawer = props => {
  // ** Props
  const { open, toggle, id, RowData } = props

  // ** Hooks
  const dispatch = useDispatch()
  const classes = useStyles()
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const { userData } = useSelector(state => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [groupId, setGroupId] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [rowSelectionUpdate, setRowSelectionUpdate] = useState({})
  const [selectedContacts, setSelectedContacts] = useState([])

  const { isGroupdFetching, allGroups = [], functionId, groupsFunctionAll } = useSelector(state => state.adminMod)

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      contacts: [],
      user_group_id: []
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true)
        let params = {
          function_id: functionId,
        }
        const result =
          groupId === ''
            ? await apiPost(`${baseURL}invitee-contact/bulk-add`, params)
            : await apiPut(`${baseURL}user-group/update/${RowData.id}`, {
              title: values.name,
              description: values.description,
            })
        console.log(result)
        if (result?.data?.data?.id) {
          setGroupId(result?.data?.data?.id)
        }
        toast.success(result?.data?.message)
      } catch (e) {
        toast.error(e)
      } finally {
        setIsLoading(false)
      }
    }
  })
  const handleClose = () => {
    toggle()
  }

  const getGroupData = async () => {
    try {
      const data = RowData
      if (data && id !== '') {
        formik.setFieldValue('name', data?.title)
        formik.setFieldValue('description', data?.description)
        formik.setFieldValue('contacts', data?.contact_details)
        formik.setFieldValue('user_group_id', data?.user_group_id)
        setGroupId(data?.id)
      } else {
        setGroupId('')
      }
    } catch (e) {
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getGroupData()
    } else {
      formik.resetForm()
      setGroupId('')
    }
  }, [id, userData])

  const getallGroups = () => {
    const queryParams = `limit=${20000}&offset=${0}&search_string=${searchText}&sortDir=${'desc'}&sortBy=${'title'}`

    dispatch(getListOfGroups(queryParams))
  }

  useEffect(() => {
    getallGroups()
  }, [searchText, open])

  const columns = [
    {
      accessorKey: 'title',
      header: 'Name'
    },
    {
      accessorKey: 'description',
      header: 'Description'
    },
    {
      accessorKey: 'count',
      header: 'Total Contacts',
      Cell: ({ row }) => `${row?.original?.contact_id?.length || 0}`
    },
  ];

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const table = useMaterialReactTable({
    columns,
    data: formik.values?.contacts || [],

    onRowSelectionChange: setRowSelectionUpdate, //connect internal row selection state to your own
    state: { rowSelection: rowSelectionUpdate },
    enableRowSelection: true,
    enableSelectAll: true,
    muiSelectCheckboxProps: {
      color: 'primary',
    },
    enableColumnFilter: false,
    enableTopToolbar: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'white',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'white !important',
        }
      }
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: {
        color: 'white',
        backgroundColor: 'primary.main',
      }
    }),
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined',
      rowsPerPageOptions: [10, 20],
      showFirstButton: true,
      showLastButton: true,
    },
    paginationDisplayMode: 'default',
    manualPagination: true,
    enableRowOrdering: false,
    enableSorting: true,
    isLoading: isLoading,
  });

  const preSelectedIds = useMemo(() => {
    return groupsFunctionAll?.map(_ => _.user_group_id) || [];
  }, [groupsFunctionAll]);

  useEffect(() => {
    const initialRowSelection = {};
    (allGroups || [])?.forEach((contact, index) => {
      if (preSelectedIds.includes(contact.id)) {
        initialRowSelection[index] = true;
      }
    });
    setRowSelection(initialRowSelection);
  }, [allGroups, preSelectedIds]);

  const handleRowSelectionChange = (event, row) => {

    const data = event()

    const isNoData = Object.keys(data || {}).length === 0;
    const isAlreadyMappedData = preSelectedIds?.length > 0;
    if (isNoData && isAlreadyMappedData) {
      const initialRowSelection = {};
      allGroups.forEach((contact, index) => {
        if (preSelectedIds.includes(contact.id)) {
          initialRowSelection[index] = true;
        }
      });
      setRowSelection(initialRowSelection);
    } else {
      setRowSelection(event);
    }
  };

  const getCheckboxProps = (row) => ({
    disabled: preSelectedIds.includes(row.original.id),
  });


  const table2 = useMaterialReactTable({
    columns,
    data: allGroups,
    enableRowSelection: true,
    enableSelectAll: true,
    muiSelectCheckboxProps: ({ row }) => getCheckboxProps(row),
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      rowSelection,
    },

    enableColumnFilter: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false,
    enableTopToolbar: false,

    muiLinearProgressProps: ({ isTopToolbar }) => ({
      color: 'primary',
      sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      value: isGroupdFetching //show precise real progress value if you so desire
    }),
    muiTableHeadRowProps: ({ isTopToolbar }) => ({
      sx: {
        color: 'black',
        '& .MuiButtonBase-root.Mui-active svg': {
          color: 'black !important'
        }
      }
    }),
    muiTableHeadCellProps: ({ isTopToolbar }) => ({
      color: 'primary',
      backgroundColor: 'primary',
      sx: { color: 'black', backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.3) },
    }),
    muiPaginationProps: {
      color: 'primary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined',
      rowsPerPageOptions: [10, 20],
      showFirstButton: true,
      showLastButton: true,
    },
    paginationDisplayMode: 'default',
    manualPagination: false,
    rowCount: allGroups?.length > 0 ? allGroups.length : 0,
    enableRowOrdering: false,
    enableSorting: true,
    isLoading: isGroupdFetching,
  });

  useEffect(() => {
    var temp = [];
    for (let i = 0; i < table2.getSelectedRowModel().rows.length; i++) {
      temp.push(table2.getSelectedRowModel()?.rows[i].original?.id)
    }
    setSelectedContacts(temp)
  }, [rowSelection]);

  useEffect(() => {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original?.id);
    const filteredContacts = formik.values.user_group_id.filter(id => !selectedIds.includes(id));
    setSelectedContacts(filteredContacts)
  }, [rowSelectionUpdate]);

  const addContacts = async () => {
    const newValues = selectedContacts.filter(contactId => {
      return !preSelectedIds.includes(contactId)
    });
    if (newValues.length === 0) {
      toast.error('Please select at least one contact')
      return
    }
    try {

      setIsLoading(true)
      const result = await apiPost(`${baseURL}invitee-group/bulk-add`, {
        function_id: functionId,
        user_group_id: [...formik.values.user_group_id, ...newValues]
      })
      toast.success(result?.data?.message)
      toggle()
      setSelectedContacts([])
      setRowSelectionUpdate({})

    } catch (err) {
      console.log(err)
      toast.error(err?.response?.data?.message)
    } finally {
      setIsLoading(false)
    }
  }
  const removeContacts = async () => {
    try {

      setIsLoading(true)
      const result = await apiPut(`${baseURL}user-group/update/${groupId}`, {
        title: formik.values.name,
        description: formik.values.description,
        user_group_id: selectedContacts,
        function_id: functionId,
      })
      formik.setFieldValue('contacts', result?.data?.data?.contact_details)
      formik.setFieldValue('contacts_id', result?.data?.data?.contacts_id)
      toast.success(result?.data?.message)
      setSelectedContacts([])
      setRowSelectionUpdate({})
      setRowSelection({})
    } catch (err) {
      console.log(err)
      toast.error(err?.response?.data?.message)
    } finally {
      setIsLoading(false)
    }
  }


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
        <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
          <Header>
            <Typography variant='h5'>{'All Groups'}</Typography>
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
          </Header>
          <Box p={4} mx={4}>
            <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }} >
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Groups'
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
                  },
                }}
              />
            </Grid2>
            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
              <Button variant='outlined' color='primary' disabled={isLoading} onClick={() => addContacts()} sx={{ mb: 4, mt: 3 }}>
                Add
              </Button>
            </Box>
            <MaterialReactTable table={table2} />
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default ManageGroupsDrawer
