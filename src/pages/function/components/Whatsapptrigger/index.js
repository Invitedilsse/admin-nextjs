import { Fragment, useState } from 'react'
import ListContacts from './components/listContacts'
import { TabContext, TabPanel } from '@mui/lab'
import { Tab, Tabs } from '@mui/material'
import { Box } from '@mui/system'
import WatriggerTemplateList from './components/customMessageTable'

const FunctionMessageTrigger = ({}) => {
  const [tabValue, setTabValue] = useState(1)
  // const { functionId } = useSelector(state => state.adminMod)

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
            <Tab label='Add Template Value' value={1} />
            <Tab label='List Contacts' value={2} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <WatriggerTemplateList />
        </TabPanel>
        <TabPanel value={2}>
          <ListContacts />
        </TabPanel>
      </TabContext>
    </Fragment>
  )
}

export default FunctionMessageTrigger
