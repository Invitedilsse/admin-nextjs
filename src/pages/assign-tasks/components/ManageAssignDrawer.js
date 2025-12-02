// ** React Imports
import React, { Fragment, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSelector } from 'react-redux'

import { TabContext, TabPanel } from '@mui/lab'
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Tab, Tabs, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import AssignContacts from './assignContacts'
import WaCallertriggerTemplateList from './createMessageTemplate'
import ListAssignedCallers from './viewReports'


const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const AssignContactsDrawer = props => {
  // ** Props
  const { open = false, toggle, id, RowData, getAll } = props

  // ** Hooks
  const classes = useStyles()
  const { functionId } = useSelector(state => state.adminMod)
//   const [isSplAccordian, setSplAccordian] = useState(false)
//   const [isFirmAccordian, setFirmAccordian] = useState(false)
//   const [isHelplineAccordian, setHelplineAccordian] = useState(false)
//   const [isNotificationAccordian, setNotificationAccordian] = useState(false)
  // ** Hooks

  const [tabValue, setTabValue] = useState(1)

  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }
  const handleClose = () => {
    toggle()
  }

  return (
    <Box
      className={classes.root}
      sx={{
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
      }}
    >
      <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
        <Header>
          <Typography variant='h5'>{id !== '' || functionId !== '' ? ' ' : ' '}</Typography>
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

      <TabContext value={tabValue} variant='scrollable' scrollButtons='auto'>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTabValue}
            variant='scrollable'
            scrollButtons='auto'
            aria-label='scrollable auto tabs example'
          >
            <Tab label='Assign contacts' value={1} />
            <Tab label='Create Template' value={2} />
            <Tab label='Assigned Contact Reports' value={3} />

          </Tabs>
        </Box>
        <TabPanel value={1}>
          <Fragment>
            <AssignContacts getAll={getAll} id={id} RowData={RowData} />
          </Fragment>
        </TabPanel>
        <TabPanel value={2}>
          <Fragment>
            <WaCallertriggerTemplateList getAll={getAll} id={id} RowData={RowData} />
          </Fragment>
        </TabPanel>
                <TabPanel value={3}>
          <Fragment>
            <ListAssignedCallers getAll={getAll} id={id} RowData={RowData} />
          </Fragment>
        </TabPanel>

      </TabContext>
    </Box>
  )
}

export default AssignContactsDrawer
