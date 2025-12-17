// ** React Imports
import React, { Fragment, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSelector } from 'react-redux'

import { TabContext, TabPanel } from '@mui/lab'
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Tab, Tabs, Typography } from '@mui/material'

import { makeStyles } from '@mui/styles'
import { reportFunctionListByUser } from 'src/services/pathConst'
import { apiGet } from 'src/hooks/axios'
import FunctionList from './functionList'
import FunctionDetailsById from './functionDetailsById'
// import AssignContacts from './assignContacts'
// import WaCallertriggerTemplateList from './createMessageTemplate'
// import ListAssignedCallers from './viewReports'


const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const FunctionDetailsDrawer = props => {
  // ** Props
  const { open = false, toggle, id, RowData, getAll } = props

  // ** Hooks
  const classes = useStyles()
//   const [isSplAccordian, setSplAccordian] = useState(false)
//   const [isFirmAccordian, setFirmAccordian] = useState(false)
//   const [isHelplineAccordian, setHelplineAccordian] = useState(false)
//   const [isNotificationAccordian, setNotificationAccordian] = useState(false)
  // ** Hooks

  const [tabValue, setTabValue] = useState(1)
  const [totalcount, setTotalCount] = useState(0)
  const [userDetails, setuserDetails] = useState({})
  const [functionRowData, setFunctionRowData] = useState(null)
  const [functionDetails, setfunctionDetails] = useState(null)



  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }
  const handleClose = () => {
    toggle()
  }
 const handleCloseFunctionDetails = () => {
    setFunctionRowData(null)
  }


  const DetailRow = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
};
  return (
    <>
       {functionRowData === null?(
        <Box
      className={classes.root}
      sx={{
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
      }}
    >
      <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
        <Header>
          <Typography variant='h5'>{' '}</Typography>
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

        <Box sx={{ px: 4, pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DetailRow label="Name" value={userDetails?.name ?? '-'} />
          <DetailRow label="Last Name" value={userDetails?.last_name ?? '-'} />
          <DetailRow label="Mobile" value={userDetails?.mobile ?? '-'} />
          <DetailRow label="Online Functions" value={userDetails?.total_online_function ?? '-'} />
          <DetailRow label="Offline Functions" value={userDetails?.total_offline_function ?? '-'}/>
          <DetailRow label="Total Functions" value={Number(userDetails?.total_offline_function??0) + Number(userDetails?.total_online_function??0) ?? '-'}/>

        </Box>
      </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>

      <FunctionList RowData={RowData} totalCount={totalcount} setuserDetails={setuserDetails} setFunctionRowData={setFunctionRowData}/>
    </Box>
    </Box>
  ):(
    <Box
     className={classes.root}
      sx={{
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
      }}
      >
      <Box sx={{ p: theme => theme.spacing(0, 4, 4) }}>
        <Header>
          <Typography variant='h5'>{' '}</Typography>
          {/* <IconButton
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
          </IconButton> */}
        </Header>
      </Box>
      <Box sx={{ px: 4, pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DetailRow label="Name" value={userDetails?.name ?? '-'} />
          <DetailRow label="Last Name" value={userDetails?.last_name ?? '-'} />
          <DetailRow label="Mobile" value={userDetails?.mobile ?? '-'} />
          <DetailRow label="Function Name" value={functionDetails?.function_name ?? '-'} />

        </Box>
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
            <Tab label='Function List' value={1} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <Fragment>
              <FunctionDetailsById RowData={functionRowData} setfunctionDetails={setfunctionDetails}  handleCloseFunctionDetails={handleCloseFunctionDetails}/>
          </Fragment>
        </TabPanel>
      </TabContext>
    </Box>
  )}
    </>
 
  )
}

export default FunctionDetailsDrawer
