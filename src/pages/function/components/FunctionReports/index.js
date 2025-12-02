import { TabContext, TabPanel } from '@mui/lab'
import { Tab, Tabs } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box } from '@mui/system'
import CountListInviteReport from './components/invitereportsTable'
import { handleIsViewinDetail } from 'src/store/adminMod'
import CountListRSVPReport from './components/rsvpreporttable'
import CountLisNotificationReport from './components/notificationreporttable'

const FunctionReports = ({}) => {
  const [tabValue, setTabValue] = useState(1)
  const { functionId, isViewInDetail } = useSelector(state => state.adminMod)

  const dispatch = useDispatch()
  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }
  console.log('value chnagedxxx?', isViewInDetail)
  useEffect(() => {
    dispatch(handleIsViewinDetail({ isViewDetail: false }))
  }, [])
  return (
    <Fragment>
      <TabContext value={tabValue} variant='scrollable' scrollButtons='auto'>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTabValue}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Invite Report' value={1} />
            <Tab label='RSVP Reports' value={2} />
            <Tab label='Notification Report' value={3} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <CountListInviteReport />
        </TabPanel>
        <TabPanel value={2}>
          <CountListRSVPReport />
        </TabPanel>
        <TabPanel value={3}>
          <CountLisNotificationReport />
        </TabPanel>
      </TabContext>
    </Fragment>
  )
}

export default FunctionReports
