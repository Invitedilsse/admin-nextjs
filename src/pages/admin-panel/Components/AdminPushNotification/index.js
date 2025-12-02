import { TabContext, TabPanel } from '@mui/lab'
import { Tab, Tabs } from '@mui/material'
import { Fragment, useState } from 'react'
import { useSelector } from 'react-redux'
import { Box } from '@mui/system'
import CustomPushNotificationAdmin from './components/customMessageTable'
import CustomPushNotificationAdminAllUsers from './components/mapcustomMessages'
import CustomPushAdminNotificationMappingSelected from './components/mapselectedcustomMessage'
// import CustomPushNotification from './components/customMessageTable'
// import CustomPushNotificationMapping from './components/mapcustomMessages'
// import CustomPushNotificationMappingSelected from './components/mapselectedcustomMessage'

const AdminPushNotificationsCustom = ({}) => {
  const [tabValue, setTabValue] = useState(1)
  const { functionId } = useSelector(state => state.adminMod)

  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }
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
            <Tab label='Add Custom Notification All Users' value={1} />
            <Tab label='Custom Notification All Users' value={2} />
            <Tab label='Add Custom Notification Function Users' value={4} />
            <Tab label='Custom Notification Invited Contacts' value={3} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <CustomPushNotificationAdmin page={'allusers'} />
        </TabPanel>
        <TabPanel value={2}>
          <CustomPushNotificationAdminAllUsers />
        </TabPanel>
        <TabPanel value={3}>
          <CustomPushAdminNotificationMappingSelected />
        </TabPanel>
        <TabPanel value={4}>
          <CustomPushNotificationAdmin page={'functionusers'} />
        </TabPanel>
      </TabContext>
    </Fragment>
  )
}

export default AdminPushNotificationsCustom
