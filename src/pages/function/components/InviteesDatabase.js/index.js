import React, { useState } from 'react'
import { Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Group from './Groups/Group'
import Contacts from './Contacts/Contacts'
import GroupInternal from './GroupsInternal/GroupInternal'
import SelectdContacts from './SelectedContacts/SelectedConatcts'

function InviteesDataBase({ getAll, id, RowData }) {
  const [addedContact, setAddedContact] = useState(false)

  return (
    <Box>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          Selected Contacts
        </AccordionSummary>
        <AccordionDetails>
          <SelectdContacts
            getAll={getAll}
            id={id}
            RowData={RowData}
            isNewChangesContact={addedContact}
            setisNewChangesContact={setAddedContact}
          />
          {/* <SelectdContacts /> */}
        </AccordionDetails>
      </Accordion>
      {/* contactlist */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          Contacts
        </AccordionSummary>
        <AccordionDetails>
          <Contacts
            getAll={getAll}
            id={id}
            RowData={RowData}
            isNewChangesContact={addedContact}
            setisNewChangesContact={setAddedContact}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          Groups
        </AccordionSummary>
        <AccordionDetails>
          <Group />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          Function's Internal Group
        </AccordionSummary>
        <AccordionDetails>
          <GroupInternal />
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default InviteesDataBase
