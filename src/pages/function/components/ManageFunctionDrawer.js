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
import BasicInfo from './Functions/BasicInfo/BasicInfo'
import SpecialInvitee from './Functions/SplInvite'
import HelpLine from './Functions/HelpLine'
import Firms from './Functions/firms'
import NotificationsDispatch from './Functions/notificationDispatch'
import Events from './Events/EventDetails'
import Transportation from './Transportation/TransportationDetails'
import Accommodation from './Accommodation/AccommodationDetails'
import OtherInfo from './OtherInfo/OtherInfoDetails'

import CustomMediaFunction from './Functions/CustomMedia'
import InviteesDataBase from './InviteesDatabase.js'
import AdditionalInfo from './AdditionalInfo/index'

import InviteesMapping from './Functions/InviteesMapping'
import PushNotification from './pushNotifications'
import PushNotificationsCustom from './PushnotificationsCustom'
import FunctionRoles from './FunctionRoles'
import FunctionMessageTrigger from './Whatsapptrigger'
import FunctionReports from './FunctionReports'
import SocialLink from './Functions/SocialLinks'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const SideBarOccasion = props => {
  // ** Props
  const { open = false, toggle, id, RowData, getAll } = props

  // ** Hooks
  const classes = useStyles()
  const { functionId } = useSelector(state => state.adminMod)
  const [isSplAccordian, setSplAccordian] = useState(false)
  const [isFirmAccordian, setFirmAccordian] = useState(false)
  const [isHelplineAccordian, setHelplineAccordian] = useState(false)
  const [isNotificationAccordian, setNotificationAccordian] = useState(false)
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
            <Tab label='Dashboard' value={7} disabled={!functionId} />
            <Tab label='Functions' value={1} />
            <Tab label='Events' value={2} disabled={!functionId} />
            <Tab label='Transportation' value={3} disabled={!functionId} />
            <Tab label='Accommodation' value={4} disabled={!functionId} />
            <Tab label='Pre Invite' value={5} disabled={!functionId} /> {/* other information new name*/}
            <Tab label='Select Guests' value={6} disabled={!functionId} />
            <Tab label='Map Guests' value={8} disabled={!functionId} />
            <Tab label='Additional Info' value={9} disabled={!functionId} />
            <Tab label='Push Notification' value={10} disabled={!functionId} />
            <Tab label='Custom Push Notification' value={11} disabled={!functionId} />
            <Tab label='Manage Function Roles' value={12} disabled={!functionId} />
            <Tab label='Trigger Whatsapp message' value={13} disabled={!functionId} />
            <Tab label='Function Report' value={14} disabled={!functionId} />
          </Tabs>
        </Box>
        <TabPanel value={7}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '25vh' }}>
            Coming soon...
          </Box>
        </TabPanel>
        <TabPanel value={1}>
          <BasicInfo getAll={getAll} id={id} RowData={RowData} tabValue={tabValue} toggle={handleClose} />
          {functionId && (
            <Fragment>
              <Accordion onChange={e => setSplAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Special Invitees
                </AccordionSummary>
                <AccordionDetails>
                  <SpecialInvitee getAll={getAll} id={id} isOpen={isSplAccordian} />
                </AccordionDetails>
              </Accordion>

              <Accordion onChange={e => setFirmAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Firms
                </AccordionSummary>
                <AccordionDetails>
                  <Firms getAll={getAll} id={id} isOpen={isFirmAccordian} />
                </AccordionDetails>
              </Accordion>
              <Accordion onChange={e => setHelplineAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Helpline Details
                </AccordionSummary>
                <AccordionDetails>
                  <HelpLine getAll={getAll} id={id} isOpen={isHelplineAccordian} />
                </AccordionDetails>
              </Accordion>

              <Accordion onChange={e => setNotificationAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Reminder
                </AccordionSummary>
                <AccordionDetails>
                  <NotificationsDispatch getAll={getAll} id={id} isOpen={isNotificationAccordian} />
                </AccordionDetails>
              </Accordion>

              <Accordion onChange={e => setNotificationAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Custom Media
                </AccordionSummary>
                <AccordionDetails>
                  <CustomMediaFunction getAll={getAll} id={id} isOpen={isNotificationAccordian} />
                </AccordionDetails>
              </Accordion>

              <Accordion onChange={e => setNotificationAccordian(prevState => !prevState)}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  Social Link
                </AccordionSummary>
                <AccordionDetails>
                  <SocialLink getAll={getAll} id={id} isOpen={isNotificationAccordian} />
                </AccordionDetails>
              </Accordion>
            </Fragment>
          )}
        </TabPanel>
        <TabPanel value={2}>
          <Fragment>
            <Events getAll={getAll} id={id} RowData={RowData} />
          </Fragment>
        </TabPanel>
        <TabPanel value={3}>
          {' '}
          <Transportation getAll={getAll} id={id} RowData={RowData} />
        </TabPanel>
        <TabPanel value={4}>
          <Accommodation getAll={getAll} id={id} RowData={RowData} />
        </TabPanel>
        <TabPanel value={5}>
          <OtherInfo getAll={getAll} id={id} RowData={RowData} />
        </TabPanel>
        <TabPanel value={6}>
          <InviteesDataBase />
        </TabPanel>
        <TabPanel value={8}>
          <InviteesMapping />
        </TabPanel>
        <TabPanel value={9}>
          <AdditionalInfo />
        </TabPanel>
        <TabPanel value={10}>
          <PushNotification id={id} />
        </TabPanel>
        <TabPanel value={11}>
          <PushNotificationsCustom />
        </TabPanel>
        <TabPanel value={12}>
          <FunctionRoles />
        </TabPanel>
        <TabPanel value={13}>
          <FunctionMessageTrigger />
        </TabPanel>
        <TabPanel value={14}>
          <FunctionReports />
        </TabPanel>
      </TabContext>
    </Box>
  )
}

export default SideBarOccasion
