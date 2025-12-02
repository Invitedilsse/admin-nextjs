import React from 'react';
import { Box, Tab } from '@mui/material';
import TransportContacts from './Contacts/components/transportation/TransportContacts';
import AccomodationContacts from './Contacts/components/accomodation/AccomodationContacts';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import EventsContacts from './Contacts/components/events/EventsContacts';

function AdditionalInfo({ getAll, id, RowData }) {
  const [value, setValue] = React.useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <TabContext value={value}  >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example" variant="fullWidth">
              <Tab label="Events" value="1" />
              <Tab label="Transportation" value="2" />
              <Tab label="Accomodation" value="3" />
            </TabList>
          </Box>
          <TabPanel value="1"><EventsContacts getAll={getAll} id={id} RowData={RowData} /></TabPanel>
          <TabPanel value="2"><TransportContacts getAll={getAll} id={id} RowData={RowData} /></TabPanel>
          <TabPanel value="3"><AccomodationContacts getAll={getAll} id={id} RowData={RowData} /></TabPanel>
        </TabContext>
      </Box>
    </Box>
  );
}

export default AdditionalInfo;