import React, { Fragment, useState, useEffect } from 'react'
import Icon from 'src/@core/components/icon'

import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { TabContext, TabPanel } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Grid2,
  IconButton,
  Tab,
  Tabs,
  Typography
} from '@mui/material'

import { makeStyles } from '@mui/styles'
import AdminPushNotificationsCustom from './Components/AdminPushNotification'

const useStyles = makeStyles({
  root: {}
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const AdminPanel = props => {
  // ** Props
  const { open = false, toggle, id, RowData, getAll } = props
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  // ** Hooks
  const classes = useStyles()
  const { functionId } = useSelector(state => state.adminMod)
  // ** Hooks

  const [tabValue, setTabValue] = useState(1)

  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }
  const handleClose = () => {
    toggle()
  }

  useEffect(() => {
    if (userData?.role !== 'super-admin' && userData?.role !== 'main') {
      router.push('/home')
    }
  }, [userData])
  return (
    <Grid2 size={{ xs: 12 }}>
      <Card elevation={0}>
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
                <Tab label='Custom Notification Admin' value={1} />
              </Tabs>
            </Box>

            <TabPanel value={1}>
              <Fragment>
                {/* <Events getAll={getAll} id={id} RowData={RowData} /> */}
                {/* test 1 */}
                <AdminPushNotificationsCustom />
              </Fragment>
            </TabPanel>
          </TabContext>
        </Box>
      </Card>
    </Grid2>
  )
}

export default AdminPanel
