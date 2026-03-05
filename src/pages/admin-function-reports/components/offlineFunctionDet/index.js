import React, { useEffect, useState } from 'react'
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
  CardHeader,
  TextField,
  IconButton,
  Icon as MUIicon,
  Typography,
  Chip
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { DeleteOutline, Edit, Send, Visibility } from '@mui/icons-material'
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table'
// api hook
import { apiDelete, apiGet, apiPatch, apiPut } from 'src/hooks/axios'
import { reportOffFunInfoID } from 'src/services/pathConst'
// import AddCustomMessageDrawerAdmin from './addCustomMessageDrawer.js'
import { set } from 'nprogress'
import { LoadingButton } from '@mui/lab'
import { makeStyles } from '@mui/styles'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { Stack } from '@mui/system'
import { SharedWithTable } from './sharedwithTable'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

function OfflineFunctionDetailsById({ page, RowData, setfunctionDetails, handleCloseFunctionDetails }) {
  const [offlineFunDetails, setOfflineFunDetails] = useState({})
  const [offlineHostDetails, setOfflineHostDetails] = useState({})
  const [offlineEventDetails, setOfflineEventDetails] = useState([])
  const [offlineSahredDetails, setOfflineSahredDetails] = useState([])
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [openDialog, setOpenDialog] = React.useState(false)

  const handleNext = () => {
    if (activeIndex < offlineEventDetails.length - 1) {
      setActiveIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1)
    }
  }

  const handlePreview = file => {
    setSelectedFile(file)
    setPreviewOpen(true)
  }

  const handleClose = () => {
    setPreviewOpen(false)
    setSelectedFile(null)
  }

  const fetchOfflineFunctionById = async () => {
    try {
      const params = `userId=${RowData.user_id}&functionId=${RowData.functionid}`
      const response = await apiGet(`${reportOffFunInfoID}?${params}`)
      console.log('response=====>reportOffFunInfoID', response)
      if (response.status === 200) {
        // console.log("offlineHostDetails=====>",response.data.offline_host)

        setOfflineFunDetails(response.data.data.offline_function || {})
        setOfflineHostDetails(response.data.data.offline_host || {})
        setOfflineEventDetails(response.data.data.event_details || [])
        setOfflineSahredDetails(response.data.data.shared_details || [])
      }
    } catch (err) {
      console.log('err---->', err)
    }
  }
  console.log('offlineHostDetails=====>', offlineHostDetails)

  useEffect(() => {
    if (RowData.user_id && RowData.functionid) {
      fetchOfflineFunctionById()
    }
  }, [RowData])

  const EventFullView = ({ event }) => {
    const reminders = event?.reminder_notifications

    return (
      <Stack spacing={2}>
        <Typography>
          📍 {event?.venu}
          {/* {event.location_name} */}
        </Typography>
        <Typography>
          📅{' '}
          {new Date(event?.date).toLocaleDateString('en-GB', {
            timeZone: 'UTC'
          })}{' '}
          | 🕘 {formatTime12Hr(event?.time)}
        </Typography>

        {/* Reminder Chips */}
        <Stack direction='row' spacing={1}>
          {reminders?.send_24hr && <Chip label='24 Hr' />}
          {reminders?.send_12hr && <Chip label='12 Hr' />}
          {reminders?.send_8hr && <Chip label='8 Hr' />}
          {reminders?.send_4hr && <Chip label='4 Hr' />}
        </Stack>

        {/* Reminder Messages */}
        {reminders?.messages?.length > 0 && (
          <>
            <Divider />
            <Stack spacing={1}>
              {reminders.messages.map(msg => (
                <Box key={msg.id} sx={{ p: 1, borderRadius: 1, bgcolor: '#f7f7f7' }}>
                  <Typography fontWeight={500}>{msg.title}</Typography>
                  <Typography variant='caption'>{msg.body}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {/* Event Files */}
        <EventFilePreview files={event?.event_details_file} />
      </Stack>
    )
  }

  const formatTime12Hr = time => {
    if (!time) return '-'

    let [h, m] = time.split(':')
    h = Number(h)

    const suffix = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12

    return `${h.toString().padStart(2, '0')}:${m} ${suffix}`
  }

  const EventFilePreview = ({ files = [] }) => {
    const [preview, setPreview] = React.useState(null)

    if (!files.length) return null

    return (
      <>
        <Divider />
        <Typography variant='subtitle2'>Event Files</Typography>

        <Stack direction='row' spacing={2} flexWrap='wrap'>
          {files.map(file => (
            <Box
              key={file.id}
              sx={{
                width: 90,
                height: 90,
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid #ddd'
              }}
              onClick={() => setPreview(file)}
            >
              <img src={file.url} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Stack>

        <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth='md'>
          <DialogContent sx={{ p: 1 }}>
            <img src={preview?.url} style={{ width: '100%', borderRadius: 8 }} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {/* {JSON.stringify(RowData, null, 2)} */}
      <div className='close-btn' style={{ display: 'flex', justifyContent: 'flex-end', margin:'1rem' }}>
        <IconButton
        size='small'
        onClick={handleCloseFunctionDetails}
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
      </div>
      
      <Grid2 container spacing={6}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
              borderRadius: 2
            }}
          >
            {/* Header */}
            <CardHeader
              title='Host Details'
              sx={{
                borderBottom: '1px solid #eee',
                '& .MuiTypography-root': {
                  fontWeight: 600
                }
              }}
            />
            {/* {offlineEventDetails} */}
            {/* Content */}
            <CardContent>
              <Stack spacing={2} mt={2}>
                <Stack direction='row' spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Host Name:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {offlineHostDetails?.name || '-'}
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Mobile:
                  </Typography>
                  <Typography variant='body1'>{offlineHostDetails?.mobile || '-'}</Typography>
                </Stack>

                <Divider />

                <Stack spacing={0.5}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Address
                  </Typography>
                  <Typography variant='body2'>
                    {offlineHostDetails?.address} {offlineHostDetails?.city && `, ${offlineHostDetails?.city}`}
                    {offlineHostDetails?.pincode && ` - ${offlineHostDetails?.pincode}`}
                  </Typography>
                </Stack>

                {offlineHostDetails?.notes && (
                  <>
                    <Divider />
                    <Stack spacing={0.5}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Notes
                      </Typography>
                      <Typography variant='body2'>{offlineHostDetails?.notes}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={6} mt={2}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
              borderRadius: 2
            }}
          >
            {/* Header */}
            <CardHeader
              title='Function Details'
              sx={{
                borderBottom: '1px solid #eee',
                '& .MuiTypography-root': {
                  fontWeight: 600
                }
              }}
            />

            {/* Content */}
            <CardContent>
              <Stack spacing={2} mt={2}>
                <Stack direction='row' spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Function Name:
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {offlineFunDetails?.function_name || '-'}
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Occasion Name:
                  </Typography>
                  <Typography variant='body1'>{offlineFunDetails?.occasion_name || '-'}</Typography>
                </Stack>

                {offlineFunDetails?.occasion_file?.length > 0 && (
                  <>
                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Occasion Files
                      </Typography>

                      <Stack direction='row' spacing={2} flexWrap='wrap'>
                        {offlineFunDetails.occasion_file.map(file => (
                          <Box
                            key={file.id}
                            sx={{
                              width: 90,
                              height: 90,
                              borderRadius: 2,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '1px solid #e0e0e0',
                              '&:hover': {
                                opacity: 0.8
                              }
                            }}
                            onClick={() => handlePreview(file)}
                          >
                            <img
                              src={file.url}
                              alt={file.file_name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </>
                )}

                {offlineFunDetails?.notes && (
                  <>
                    <Divider />
                    <Stack spacing={0.5}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Notes
                      </Typography>
                      <Typography variant='body2'>{offlineFunDetails?.notes}</Typography>
                    </Stack>
                  </>
                )}
                {offlineFunDetails?.hastag && (
                  <>
                    <Divider />
                    <Stack spacing={0.5}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Hashtag
                      </Typography>
                      <Typography variant='body2'>{offlineFunDetails?.hastag}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      <Dialog open={previewOpen} onClose={handleClose} maxWidth='md'>
        <DialogContent sx={{ p: 1 }}>
          {selectedFile && (
            <img
              src={selectedFile.url}
              alt={selectedFile.file_name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* <Stack direction="row" alignItems="center" spacing={2}>
    <IconButton onClick={handlePrev} disabled={activeIndex === 0}>
      ◀
    </IconButton>

    <Card sx={{ minWidth: 320 }}>
      <CardContent>
        <Typography variant="h6">
          {offlineEventDetails[activeIndex]?.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          📍 {offlineEventDetails[activeIndex]?.location_name}
        </Typography>

        <Typography variant="body2">
          📅 {new Date(offlineEventDetails[activeIndex]?.date).toLocaleDateString()} | 🕘 {offlineEventDetails[activeIndex]?.time}
        </Typography>

        <Button
          size="small"
          sx={{ mt: 1 }}
          onClick={() => setOpenDialog(true)}
        >
          View Full Event
        </Button>
      </CardContent>
    </Card>

    <IconButton
      onClick={handleNext}
      disabled={activeIndex === offlineEventDetails.length - 1}
    >
      ▶
    </IconButton>
  </Stack> */}
      <Grid2 container spacing={6} mt={2}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
              borderRadius: 2
            }}
          >
            {/* Header */}
            <CardHeader
              title='Function Event Details'
              sx={{
                borderBottom: '1px solid #eee',
                '& .MuiTypography-root': {
                  fontWeight: 600
                }
              }}
            />

            <Stack direction='row' justifyContent='space-between' mb={2} mt={2}>
              <IconButton onClick={handlePrev} disabled={activeIndex === 0}>
                ◀
              </IconButton>

              <Typography variant='h6'>{offlineEventDetails[activeIndex]?.title}</Typography>

              <IconButton onClick={handleNext} disabled={activeIndex === offlineEventDetails?.length - 1}>
                ▶
              </IconButton>
            </Stack>
            <CardContent>
              <EventFullView event={offlineEventDetails[activeIndex]} />
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
      <Grid2 container spacing={6} mt={2}>
        <Grid2 size={{ xs: 12 }}>
          <Card
            sx={{
              boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
              borderRadius: 2
            }}
          >
            {/* Header */}
            <CardHeader
              title=' Function Shared With'
              sx={{
                borderBottom: '1px solid #eee',
                '& .MuiTypography-root': {
                  fontWeight: 600
                }
              }}
            />
            <CardContent>
              <Stack spacing={1} mt={2}>
                {/* <Typography variant="subtitle2" color="text.secondary">
    Function Shared With
  </Typography> */}

                <SharedWithTable rows={offlineSahredDetails} />
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </>
  )
}

export default OfflineFunctionDetailsById

/////////////////////////////////////////EventCard back up/////////////////////////////////////////////////

// const EventCard = ({ event }) => {
//   const reminders = event.reminder_notifications

//   return (
//     <Card
//       sx={{
//         minWidth: 320,
//         maxWidth: 320,
//         scrollSnapAlign: 'start',
//         borderRadius: 2,
//         boxShadow: 'rgba(0,0,0,0.15) 0px 4px 12px'
//       }}
//     >
//       <CardContent>
//         {/* Title */}
//         <Typography variant="h6" fontWeight={600}>
//           {event.title}
//         </Typography>

//         <Typography variant="body2" color="text.secondary">
//           📍 {event.location_name}
//         </Typography>

//         <Typography variant="body2" mt={0.5}>
//           📅 {new Date(event.date).toLocaleDateString()} | 🕘 {event.time}
//         </Typography>

//         <Divider sx={{ my: 1.5 }} />

//         {/* Reminder Chips */}
//         <Stack direction="row" spacing={1} flexWrap="wrap">
//           {reminders?.send_24hr && <Chip label="24 Hr" size="small" />}
//           {reminders?.send_12hr && <Chip label="12 Hr" size="small" />}
//           {reminders?.send_8hr && <Chip label="8 Hr" size="small" />}
//           {reminders?.send_4hr && <Chip label="4 Hr" size="small" />}
//         </Stack>

//         {/* Messages */}
//         {reminders?.messages?.length > 0 && (
//           <>
//             <Divider sx={{ my: 1.5 }} />
//             <Stack spacing={1}>
//               {reminders.messages.map(msg => (
//                 <Box
//                   key={msg.id}
//                   sx={{
//                     p: 1,
//                     borderRadius: 1,
//                     backgroundColor: '#f9f9f9'
//                   }}
//                 >
//                   <Typography variant="subtitle2">
//                     {msg.title}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {msg.body}
//                   </Typography>
//                 </Box>
//               ))}
//             </Stack>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   )
// }
