// ** React Imports
import { useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

import { useFormik } from 'formik'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'

import { LoadingButton } from '@mui/lab'
import { Accordion, AccordionDetails, AccordionSummary, alpha, Button, Drawer, Grid2, IconButton, TextField, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { apiPost, apiPut } from 'src/hooks/axios'
import { baseURL } from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
import { getListOfContactsNP } from 'src/store/adminMod'
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

const SideBarGiftType = props => {
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
  const [isAdd, setIsAdd] = useState(false)
  const { functionId, isContactsFetchingNP, allContactsNP } = useSelector(state => state.adminMod)

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
          description: values.description,
          function_id: functionId
        }

        const result =
          groupId === ''
            ? await apiPost(`${baseURL}invitee-internal-group/add`, params)
            : await apiPut(`${baseURL}invitee-internal-group/update/${groupId || RowData?.id}`, {
              title: values.name,
              description: values.description,
              function_id: functionId,
              contact_id: [...formik.values.contact_id, ...selectedContacts]
            })
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

  const getInternalGroup = async () => {
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
      console.log(e)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    if (id !== '') {
      getInternalGroup()
    } else {
      formik.resetForm()
      setGroupId('')
    }
  }, [id, userData])

  const getAllContactsNP = () => {

    const queryParams = `search_string=${searchText}&sortDir=${'desc'}&sortBy=${'name'}`
    dispatch(getListOfContactsNP(queryParams))
  }

  useEffect(() => {
    getAllContactsNP()
  }, [searchText])

  const columns = [
    {
      size: 200,
      accessorKey: 'name',
      header: 'Name',
    }, {
      size: 120,
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ renderedCellValue, row }) => `${row?.original?.country_code} - ${row?.original?.mobile}`

    },
  ];

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const table = useMaterialReactTable({
    columns,
    data: formik.values?.contacts || [],
    getRowId: (row) => { console.log(row.id) }, //give each row a more useful id

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
    muiLinearProgressProps: ({ isTopToolbar }) => ({
      color: 'primary',
      sx: { display: isTopToolbar ? 'block' : 'none' }, //only show top toolbar progress bar
      value: isLoading //show precise real progress value if you so desire
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
    enableRowOrdering: false,
    enableSorting: true,
    isLoading: isLoading,

  });

  const table2 = useMaterialReactTable({
    columns,
    data: allContactsNP,
    enableRowSelection: true,
    enableSelectAll: true,
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
      value: isContactsFetchingNP //show precise real progress value if you so desire
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
      showRowsPerPage: true,
      variant: 'outlined',
      rowsPerPageOptions: [5, 10, 20, 25],
      showFirstButton: true,
      showLastButton: true
    },
    paginationDisplayMode: 'default',
    manualPagination: false,
    rowCount: allContactsNP?.length > 0 ? allContactsNP?.length : 0,
    enableRowOrdering: false,
    onRowSelectionChange: setRowSelection, //connect internal row selection state to your own
    state: { rowSelection },
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
    const filteredContacts = formik.values.contact_id.filter(id => !selectedIds.includes(id));
    setSelectedContacts(filteredContacts)
  }, [rowSelectionUpdate]);

  const addContacts = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact')
      return
    }
    try {
      setIsLoading(true)
      const result = await apiPut(`${baseURL}invitee-internal-group/update/${groupId}`, {
        title: formik.values.name,
        description: formik.values.description,
        function_id: functionId,
        contact_id: [...formik.values.contact_id, ...selectedContacts]
      })
      formik.setFieldValue('contacts', result?.data?.data?.contact_details)
      formik.setFieldValue('contact_id', result?.data?.data?.contact_id)
      toast.success(result?.data?.message)
      setIsAdd(false)
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
  const removeContacts = async () => {
    try {
      setIsLoading(true)
      const result = await apiPut(`${baseURL}invitee-internal-group/update/${groupId}`, {
        // group_id: groupId,
        title: formik.values.name,
        description: formik.values.description,
        contact_id: selectedContacts,
        function_id: functionId,
      })
      formik.setFieldValue('contacts', result?.data?.data?.contact_details)
      formik.setFieldValue('contact_id', result?.data?.data?.contact_id)
      toast.success(result?.data?.message)
      setIsAdd(false)
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
            <Typography variant='h5'>{groupId !== '' ? 'Edit Internal Group' : 'Create a Internal Group'}</Typography>
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
        </Box>
        <Box sx={{ p: theme => theme.spacing(0, 2, 2) }}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, lg: 12, xl: 12, md: 12, sm: 12 }} sx={{ px: 8 }}>
              <TextField
                sx={{ my: 2 }}
                label={'Name '}
                required
                // disabled
                fullWidth
                name='name'
                error={formik.touched.name && Boolean(formik.errors.name)}
                value={formik.values.name
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                onChange={e => formik.handleChange(e)}
                helperText={formik.touched.name && formik.errors.name && formik.errors.name}
              />
              <TextField
                sx={{ my: 2 }}
                label={'Description '}
                required
                multiline
                rows={3}
                // disabled
                fullWidth
                name='description'
                error={formik.touched.description && Boolean(formik.errors.description)}
                value={formik.values.description
                  .trimStart()
                  .replace(/\s\s+/g, '')
                  .replace(/\p{Emoji_Presentation}/gu, '')}
                onChange={e => formik.handleChange(e)}
                helperText={formik.touched.description && formik.errors.description && formik.errors.description}
              />
              <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                <LoadingButton loading={isLoading} variant='outlined' color='primary' onClick={formik.handleSubmit} sx={{ mb: 4, mt: 2 }}>
                  {groupId !== '' ? 'Update' : 'Add '}
                </LoadingButton >
              </Box>
            </Grid2>
          </Grid2>
          {groupId && <Accordion sx={{
            margin: '0.5rem 1.5rem !important', '& .MuiPaper-root.MuiAccordion-root.Mui-expanded': {
              margin: '0.5rem 1.5rem !important'
            }
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              Contacts
            </AccordionSummary>
            <AccordionDetails>
              <Box p={4} mx={4}>
                <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                  <Button variant='contained' color='primary' onClick={() => { setIsAdd(true) }} sx={{ mb: 4, mr: 2 }}>
                    Add
                  </Button>
                  {table.getSelectedRowModel()?.rows?.length > 0 && table.getSelectedRowModel()?.rows[0].original?.id && <Button variant='outlined' color='error' onClick={() => removeContacts()} sx={{ mb: 4 }}>
                    Delete
                  </Button>}
                </Box>
                <MaterialReactTable table={table} />
              </Box>
            </AccordionDetails>
          </Accordion>}
          <Drawer
            open={isAdd}
            anchor='right'
            variant='temporary'
            onClose={handleIsAddClose}
            ModalProps={{ keepMounted: true }}
            className={classes.root}
            sx={{
              '& .MuiDrawer-paper': { width: { xs: '100%', sm: '100%', lg: '40%' } }
            }}
          >
            <Box className={classes.root}>
              <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
                <Header>
                  <Typography variant='h5'>{'Add Contacts'}</Typography>
                  <IconButton
                    size='small'
                    onClick={handleIsAddClose}
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
                        },
                      }}
                    />
                  </Grid2>
                  <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                    <Button variant='outlined' color='primary' onClick={() => addContacts()} sx={{ mb: 4, mt: 3 }}>
                      Add
                    </Button>
                  </Box>
                  <MaterialReactTable table={table2} />
                </Box>
              </Box>
            </Box>
          </Drawer>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SideBarGiftType
