import React, { Fragment, useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Grid,
  Chip,
  Grid2
} from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'

const ContactsTabs = ({ data }) => {
  const [tabValue, setTabValue] = useState(1)

  const handleChangeTabValue = (event, newValue) => {
    setTabValue(newValue)
  }

  const renderCards = (contacts,type) => {
    if (!contacts?.length) {
      return <Typography>No contacts found</Typography>
    }

    return (
      <Grid2 container spacing={2}>
        {contacts.map(contact => (
          <Grid2 item xs={12} md={6} lg={4} key={contact.id}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack direction='row' spacing={2} alignItems='center'>
                  <Avatar
                    src={contact.file || ''}
                    sx={{ width: 48, height: 48 }}
                  >
                    {contact.name?.[0]}
                  </Avatar>

                  <Box>
                    <Typography fontWeight={600}>
                      {contact.name}
                    </Typography>

                    <Typography variant='body2' color='text.secondary'>
                      {contact.country_code} {contact.mobile}
                    </Typography>

                    <Typography variant='body2'>
                      Relation: {contact.relation}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant='body2' mt={2}>
                       {type === 'addedme' ? 'Shared By Them' : 'Shared By Me'}
                </Typography>
                <Stack direction='row' spacing={1} mt={2} flexWrap='wrap'>
                    <Chip size='small' label='Share Invite' color={contact.share_invite ? 'success':'secondary'} />
                    <Chip size='small' label='Share Offline Invite' color={contact.share_offinvite ? 'success':'secondary'} />
                    <Chip size='small' label='Verified' color={contact.isverified ? 'success':'secondary'} />
                </Stack>
                {
                    type === 'mutual'&&(
                        <>
                        <Typography variant='body2' mt={2}>
                        Shared By Them
                        </Typography>
                        <Stack direction='row' spacing={1} mt={2} flexWrap='wrap'>
                    <Chip size='small' label='Share Invite' color={contact.share_invite_bythem ? 'success':'secondary'} />
                    <Chip size='small' label='Share Offline Invite' color={contact.share_offinvite_bythem ? 'success':'secondary'} />
                    <Chip size='small' label='Verified' color={'success'} />
                </Stack>
                        </>
                    )
                }
  {
                    type === 'addedme' && (
                        <>
                        <Typography variant='caption' display='block' mt={2}>
                             Added By: {contact?.added_by} 
                        </Typography> 
                        <Typography variant='caption' display='block' mt={2}>
                             Mobile: {contact?.adder_countrycode} {contact?.adder_mobile}
                        </Typography> 
                        </>
                    )
                }
                <Typography variant='caption' display='block' mt={2}>
                  Created: {new Date(contact.created_at).toLocaleString()}
                </Typography>
              
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    )
  }

  return (
    <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTabValue}
          variant='scrollable'
          scrollButtons='auto'
        >
          <Tab label='Added By Me' value={1} />
          <Tab label='Added Me' value={2} />
          <Tab label='Mutual' value={3} />
        </Tabs>
      </Box>

      <TabPanel value={1}>
        {renderCards(data?.addedByMe,"self")}
      </TabPanel>

      <TabPanel value={2}>
        {renderCards(data?.addedMe,"addedme")}
      </TabPanel>

      <TabPanel value={3}>
        {renderCards(data?.mutual,"mutual")}
      </TabPanel>
    </TabContext>
  )
}

export default ContactsTabs