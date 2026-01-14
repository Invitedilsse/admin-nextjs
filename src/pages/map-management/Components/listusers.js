

import React, { useEffect, useRef, useState } from 'react'
import {
  Checkbox,
  Button,
  Box,
  CircularProgress,
  CardContent,
  Divider,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  TextField
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'

// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import {
  baseURL,
  deleteCustomPushTemplates,
  deleteCustomPushTemplatesAllUsers,
  deleteCustomPushTemplatesFunUsers,
  deletemapListUrl,
  getCustomPushAdminTemplates,
  getCustomPushAdminTemplatesFun,
  getCustomPushTemplates,
  getnotification,
  getPushTemplates,
  mapListUrl,
  mapTemplatesHrs,
  postCustomPushAdminTemplatesFun,
  userListUrl
} from 'src/services/pathConst'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
import AddUserListDrawerAdmin from '../../user-management/Components/addUsersDrawer'
import AddMapTemplateDrawer from './addUsersDrawer'

import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import { useFormik } from 'formik'
import * as yup from 'yup'

const key = process.env.KEY
const libraries = ['places']

function ListMap({ page }) {
    let libRef = useRef(libraries)
  const originRef = useRef()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key,
    libraries: libRef.current
  })
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const { functionId } = useSelector(state => state.adminMod)
  const [contactsFunctionAll, setContactsFunctionAll] = useState([])
  const [contactsFunctionCount, setcontactsFunctionCount] = useState([])

  // const contactsFunctionCount = contactsFunctionAll.length
  const [dopen, setdOpen] = useState(false)
  const [delId, setdelId] = useState('')
  const [delLoading, setDelLoading] = useState(false)

  const { userData } = useSelector(state => state.auth)

  const [groupDropDrown, setgroupDropDrown] = useState([])

  console.log("userData.role------->",userData.role)






  const generateColumns = ({ onToggleTime, onTemplateClick, onDeleteData,handleRestriction }) => [
    {
      accessorKey: 'location_title',
      header: 'Location Title',
      Cell: ({ row }) =>   row.original.location_title // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'group_type',
      header: 'Group Type',
      Cell: ({ row }) => row.original.group_type || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'keywords',
      header: 'keywords',
      Cell: ({ row }) => row.original.keywords.map((d)=>d.key+', ') || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'lat',
      header: 'Latitude',
      Cell: ({ row }) => row.original.lat || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'long',
      header: 'longitude',
      Cell: ({ row }) => row.original.long || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'action',
      Cell: ({ row }) => (
        <>
          {/* <Button variant='contained' onClick={() => onTemplateClick(row.original)}> */}
         {userData.role === 'super-admin'|| userData.role === 'main'  ?  <Edit onClick={() => onTemplateClick(row.original)}/>:null}
         {/* {userData.role === 'super-admin' ? null : } */}
          {userData.role === 'super-admin'|| userData.role === 'main'  ? <DeleteOutline color='error' sx={{ cursor: 'pointer' }} onClick={() => onDeleteData(row.original.id)} />:null}
          {/* </Button> */}
        </>
      )
    }
  ]

  const handleToggleTime = async (id, field, value) => {
    try {
      let body = {
        id: id,
        // [field]: value,
        type: field,
        boolval: value
      }
      console.log('body', body, field, value)
      await apiPatch(mapTemplatesHrs, body)
      fetchData()
      toast.success('Updated successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    }
  }

  const handleManualClick = rowData => {
    // alert('Manual Clicked')
    setSelectedRow(rowData)
    setManualDrawerOpen(true) // opens drawer for push_notification_targets
  }

  const handleTemplateClick = rowData => {
    // alert('true')
    setSelectedRow(rowData)
    setTemplateDrawerOpen(true) // opens drawer for push_notification_templates
  }

  const handleDeleteData = async id => {
    setDelLoading(true)
    try {
      console.log('body')
      await apiDelete( deletemapListUrl + `/${delId}`)
      fetchData()
      toast.success('Deleted successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      setDelLoading(false)
      setdOpen(false)
      setdelId('')
    }
  }

  const toggleDialog = id => {
    setdelId(id)
    setdOpen(true)
  }

  const handleRestriction = async (id, field, value) => {
    // setDelLoading(true)
    try {
      console.log('body',id, field, value)
      await apiGet(`${baseURL}admin/restrict-user?userId=${id}&restrict=${value}`)
      fetchData()
      toast.success('Restricte successfully')
      // refresh list here if needed
    } catch (err) {
      console.error('Failed to update notification flag:', err)
      toast.error('Update failed')
    } finally {
      // setDelLoading(false)
    }
  }

  const table = useMaterialReactTable({
    columns: generateColumns({
      onToggleTime: handleToggleTime,
      // onManualClick: handleManualClick,
      onTemplateClick: handleTemplateClick,
      onDeleteData: toggleDialog,
      handleRestriction:handleRestriction
    }),
    data: contactsFunctionAll,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['title'] }
    },
    enableTopToolbar: false,
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
    enableColumnActions: false
  })

  const triggerNotification = async () => {
    try {
      const response = await apiGet(`${getnotification}`)
      // console.log('Push Notification Templates:', response.data)
    } catch (err) {
      console.log('eeeeerrrr--->', err)
    }
  }

  //need a getApi function to fetch the data from the api
  const fetchData = async () => {
    //fetch data from the api and set it to the state
    try {
      const response = await apiGet(
        `${mapListUrl}?search=&page=1&limit=200`
      )
      console.log('Push Notification Templates:', response.data,response.data.data.groupDrop)
      setContactsFunctionAll(response.data.data.data || [])
      setcontactsFunctionCount(response.data.data.data.total ||0)
      setgroupDropDrown(response.data.data.groupDrop||[])
      // setData(response.data) // assuming response.data contains the array of templates
    } catch (error) {
      console.error('Error fetching push notification templates:', error)
    }
  }

  const handleClose = () => {
    setdOpen(false)
    setdelId('')
  }

  useEffect(() => {
    fetchData()
  }, [])

    const handleOrigin = () => {
    if (!originRef.current?.value) {
      return
    }
    formik.setFieldValue('venueName', originRef.current.value)
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: originRef.current.value }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          const address = results[0].formatted_address
          const newLocation = results[0].geometry.location
          const location = {
            lat: newLocation.lat(),
            lng: newLocation.lng()
          }
          console.log('location', location)
          console.log('address', address)
          originRef.current.value = address
          formik.setFieldValue('locationMap', address)
          formik.setFieldValue('lat', `${location?.lat}`)
          formik.setFieldValue('lng', `${location?.lng}`)
        }
      }
    })
  }
   const formik = useFormik({
      initialValues: {
        title: '',
        venueName: '',
        locationMap: '',
        notes: '',
        lat: '',
        lng: '',
  
      },
      validationSchema: yup.object({
        title: yup
          .string('Title is required')
          .trim()
          .required('Title is required')
      }),
      onSubmit: async values => {
        try {
          setIsLoading(true)
          let params = {
            function_id: functionId,
            title: values.title,
            venue_name: values.venueName,
            location_map: values.locationMap,
            notes: values.notes,
            check_in_date_time: values.checkInDateTime,
            check_out_date_time: values.checkOutDateTime,
            room_key: values.roomKeyType,
            dispatch_date_time: values.dispatchDateTime,
            lat: values.lat,
            long: values.lng
          }
        } catch (e) {
          toast.error(e)
        } finally {
          setIsLoading(false)
        }
      }
    })

  if (!isLoaded) 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
    else
  return (
    <>
      <Grid2 container spacing={6}>
        <Grid2 xs={12}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
            <Divider sx={{ m: '0 !important' }} />
            <CardContent />

            <Grid2 container spacing={2} px={4} justifyContent='flex-end'>
              <Grid2 xs={12} md={6} lg={6}>
                <Button variant='contained' onClick={handleTemplateClick}>
                  Create Map
                </Button>
              </Grid2>
            </Grid2>

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

      {/* Template Drawer */}
      {/* <AddUserListDrawerAdmin
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
        page={page}
      /> */}
        {/* <Grid2 size={{ xs: 12, lg: 6, xl: 6, md: 12, sm: 12 }}>
                            <Autocomplete>
                              <TextField
                                sx={{ my: 2 }}
                                label={'Venue Name'}
                                // disabled={!isEdit}
                                required
                                inputRef={originRef}
                                onBlur={handleOrigin}
                                fullWidth
                                name='venueName'
                                error={formik.touched.venueName && Boolean(formik.errors.venueName)}
                                value={formik.values.venueName
                                  .trimStart()
                                  .replace(/\s\s+/g, '')
                                  .replace(/\p{Emoji_Presentation}/gu, '')}
                                onChange={e => formik.handleChange(e)}
                                helperText={formik.touched.venueName && formik.errors.venueName && formik.errors.venueName}
                              />
                            </Autocomplete>
                          </Grid2> */}
      <AddMapTemplateDrawer
        open={templateDrawerOpen}
        toggle={() => setTemplateDrawerOpen(false)}
        id={selectedRow?.id || ''}
        RowData={selectedRow}
        fetchTable={fetchData}
        page={page}
        dropValue={groupDropDrown}
        setDropValue={setgroupDropDrown}
      /> 
      <Dialog
        open={dopen}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{`Are you sure, you want to delete ? ${delId}`}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button varient='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton loading={delLoading} varient='contained' onClick={handleDeleteData} sx={{ color: 'red' }}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ListMap
