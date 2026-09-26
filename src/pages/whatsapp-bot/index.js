/**
 * WhatsApp Bot Management.
 *
 * Built as TABS from the start, because more are coming. Each tab is its own
 * component under ./Components, fed by its own endpoint, holding its own state
 * and mounted only while selected — so a hidden tab never fetches, and adding a
 * tab means one <Tab> plus one <TabPanel> and nothing that already works is
 * touched.
 *
 *   Users & Chats     every number that has messaged the bot; a row opens the
 *                     full transcript and what the bot created in that chat
 *   Scheduled Events  everything the bot created, with its live state
 *
 * Reads /api/whatsapp-bot. Nothing on this screen writes.
 *
 * The conversation drawer lives HERE rather than inside each tab, so both tabs
 * open the same one and closing it does not remount whichever table is behind
 * it.
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Box, Card, Grid2, Tab, Tabs, Typography } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

import BotUsersPage from './Components/BotUsersPage'
import BotEventsPage from './Components/BotEventsPage'
import ConversationDrawer from './Components/ConversationDrawer'

const WhatsappBotManagement = () => {
  const { userData } = useSelector(state => state.auth)
  const router = useRouter()

  const [tabValue, setTabValue] = useState(1)
  const [openPhone, setOpenPhone] = useState(null)

  useEffect(() => {
    if (userData?.role !== 'super-admin' && userData?.role !== 'main') {
      console.log('redirecting to home')
      router.push('/home')
    }
  }, [userData])

  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <Grid2 size={{ xs: 12 }}>
      <Card elevation={0}>
        <Box sx={{ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px' }}>
          <Box sx={{ p: theme => theme.spacing(4, 4, 0) }}>
            <Typography variant='h5' fontWeight={600}>
              WhatsApp Bot Management
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Every conversation the bot has had, and everything it put on a calendar.
            </Typography>
          </Box>

          <TabContext value={tabValue}>
            <Tabs
              value={tabValue}
              onChange={handleChangeTabValue}
              variant='scrollable'
              scrollButtons='auto'
              sx={{ px: 4, borderBottom: theme => `1px solid ${theme.palette.divider}` }}
            >
              <Tab value={1} label='Users & Chats' sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab value={2} label='Scheduled Events' sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>

            <TabPanel value={1} sx={{ p: 4 }}>
              <BotUsersPage onOpenConversation={setOpenPhone} />
            </TabPanel>

            <TabPanel value={2} sx={{ p: 4 }}>
              <BotEventsPage onOpenConversation={setOpenPhone} />
            </TabPanel>
          </TabContext>
        </Box>
      </Card>

      <ConversationDrawer open={!!openPhone} phone={openPhone} toggle={() => setOpenPhone(null)} />
    </Grid2>
  )
}

WhatsappBotManagement.acl = {
  action: 'read',
  subject: 'whatsappbot'
}

export default WhatsappBotManagement
