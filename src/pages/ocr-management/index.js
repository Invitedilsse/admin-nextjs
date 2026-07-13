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
import OcrEventTypesPage from './Components/OcrEventTypesPage'
import OcrKeywordsPage from './Components/OcrKeywordsPage'
import OcrLabPage from './Components/OcrLabPage'
import OcrLeaderboardPage from './Components/OcrLeaderboardPage'
import OcrMainPromptPage from './Components/OcrMainPromptPage'
import OcrNewVenuesPage from './Components/OcrNewVenuesPage'
import OcrQuotaPage from './Components/OcrQuotaPage'
import OcrRawDataPage from './Components/OcrRawDataPage'
import OcrSettingsPage from './Components/OcrSettingsPage'
import OcrTypeMatchesPage from './Components/OcrTypeMatchesPage'
import OcrUsagePage from './Components/OcrUsagePage'

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
      console.log('redirecting to home')
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
                <Tab label='OCR event types' value={1} />
                <Tab label='OCR Key Words' value={2} />

                {/* <Tab label='ocr lab page' value={3} /> */}
                <Tab label='Ocr LeaderBoard' value={4} />
                <Tab label='Ocr main Prompt' value={5} />
                <Tab label='ocr new venue' value={6} />
                <Tab label='ocr quota' value={7} />
                <Tab label='ocr raw data' value={8} />
                <Tab label='ocr setting' value={9} />
                <Tab label='ocr type matches' value={10} />
                <Tab label='ocr usage' value={11} />

              </Tabs>
            </Box>

            <TabPanel value={1}>
              <Fragment>
                <OcrEventTypesPage />
              </Fragment>
            </TabPanel>
            <TabPanel value={2}>
              <Fragment>
                <OcrKeywordsPage />
              </Fragment>
            </TabPanel>
            {/* <TabPanel value={3}>
              <Fragment>
                <OcrLabPage />
              </Fragment>
            </TabPanel> */}

            <TabPanel value={4}>
              <Fragment>
                <OcrLeaderboardPage />
              </Fragment>
            </TabPanel>

            <TabPanel value={5}>
              <Fragment>
                <OcrMainPromptPage />
              </Fragment>
            </TabPanel>

            <TabPanel value={6}>
              <Fragment>
                <OcrNewVenuesPage />
              </Fragment>
            </TabPanel>

            <TabPanel value={7}>
              <Fragment>
                <OcrQuotaPage />
              </Fragment>
            </TabPanel>
            <TabPanel value={8}>
              <Fragment>
                <OcrRawDataPage />
              </Fragment>
            </TabPanel>
            <TabPanel value={9}>
              <Fragment>
                <OcrSettingsPage />
              </Fragment>
            </TabPanel>
            <TabPanel value={10}>
              <Fragment>
                <OcrTypeMatchesPage />
              </Fragment>
            </TabPanel>
            <TabPanel value={11}>
              <Fragment>
                <OcrUsagePage />
              </Fragment>
            </TabPanel>
          </TabContext>
        </Box>
      </Card>
    </Grid2>
  )
}

export default AdminPanel
