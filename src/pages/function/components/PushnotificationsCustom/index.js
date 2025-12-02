import { TabContext, TabPanel } from '@mui/lab'
import { Tab, Tabs } from '@mui/material'
import { Fragment, useState } from 'react'
import { useSelector } from 'react-redux'
import PushNotification from '../pushNotifications'
import { Box } from '@mui/system'
import AddCustomMessageDrawer from './components/addCustomMessageDrawer'
import CustomPushNotification from './components/customMessageTable'
import CustomPushNotificationMapping from './components/mapcustomMessages'
import CustomPushNotificationMappingSelected from './components/mapselectedcustomMessage'

const PushNotificationsCustom = ({}) => {
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
            <Tab label='Add Custom Notification' value={1} />
            <Tab label='Map Custom Notification All' value={2} />
            <Tab label='Map Invited Contacts' value={3} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <CustomPushNotification />
        </TabPanel>
        <TabPanel value={2}>
          <CustomPushNotificationMapping />
        </TabPanel>
        <TabPanel value={3}>
          <CustomPushNotificationMappingSelected />
        </TabPanel>
      </TabContext>
    </Fragment>
  )
}

export default PushNotificationsCustom
