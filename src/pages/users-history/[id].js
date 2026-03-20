import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Chip,
  Grid2,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import { useRouter } from "next/router";
import { apiGet } from "src/hooks/axios";
import { baseURL } from "src/services/pathConst";
import ContactsTabs from "./components/FamilContactDisplay";
import { TabContext, TabPanel } from '@mui/lab'

const FunctionReportView = ({ }) => {
      const router = useRouter()
  const { id } = router.query
    console.log("id rt------>",id)
  const [user,setUser]=useState({});
  const [eventsmapped,seteventsmapped] = useState([])
  const [familyContact,setfamilyContact] = useState({})

  const[isdataloading,setisdataloading]=useState(false)
   const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 10
    })
    const [tabValue, setTabValue] = useState(1)
    const [offlineData,setofflineData] = useState([])
  const [loadingoff, setLoadingoff] = useState(true);
    const handleChangeTabValue = (event, newValue) => {
      setTabValue(newValue)
      if(newValue === 2){
         fetchuserOfflineData()
      }
    }
     
       const fetchuserData = async () => {
        //fetch data from the api and set it to the state
        setisdataloading(true)
        try {
          const response = await apiGet(
            `${baseURL}function-reports/user-detail?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${'searchText'}&userId=${id}`
          )
          console.log('uses List--------->', response.data)
          setUser(response.data.data.userDetail?.[0] || {})
          seteventsmapped(response.data.data.mappedEvents || [])
          setfamilyContact(response.data.data.familyList || {})
        } catch (error) {
          console.error('UserList:------>', error)
        } finally {
          setisdataloading(false)
        }
      }
    
      const fetchuserOfflineData = async () => {
        //fetch data from the api and set it to the state
        setLoadingoff(true)
        try {
          // ?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${'searchText'}&userId=${id}
          const response = await apiGet(
            `${baseURL}function-reports/offline-event-detail/${id}`
          )
          console.log('uses offline List--------->', response.data)
          setofflineData(response.data.offline||[])
          // setUser(response.data.data.userDetail?.[0] || {})
          // seteventsmapped(response.data.data.mappedEvents || [])
          // setfamilyContact(response.data.data.familyList || {})
        } catch (error) {
          console.error('User offline List:------>', error)
        } finally {
          setLoadingoff(false)
        }
      }
useEffect(()=>{
    if(id){
     fetchuserData()
    }
},[id])
console.log(user,eventsmapped)
  return (
    <>
       {isdataloading ? (
  <Box display="flex" justifyContent="center" mt={5}>
    <CircularProgress />
  </Box>
) :(
    <Box sx={{ p: 2 }}>

      {/* USER DETAILS */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600}>
            User Details
          </Typography>

          <Stack direction="row" spacing={4} mt={2}>
            <Typography>
              <strong>Name:</strong> {user?.name}
            </Typography>

            <Typography>
              <strong>Mobile:</strong> {user?.country_code} {user?.mobile}
            </Typography>

            <Typography>
              <strong>Role:</strong> {user?.role}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
 <Card sx={{ mb: 3 }}>
        <CardContent>
      <ContactsTabs data={familyContact}/>

        </CardContent>
</Card>

      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTabValue}
            variant='scrollable'
            scrollButtons='auto'
          >
            <Tab label='Online Function List' value={1} />
            <Tab label='Offline Function List' value={2} />
          </Tabs>
        </Box>
        <TabPanel value={1}>
          <Card sx={{ mb: 3 }}>
   <CardContent>
      {/* FUNCTIONS */}
      {eventsmapped.length > 0 ? eventsmapped.map((fn) => (
        <Card key={fn.id} sx={{ mb: 4 }}>
          <CardContent>

            {/* FUNCTION HEADER */}
            <Typography variant="h6" fontWeight={600}>
              {fn.function_name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Host: {fn.host_name}
            </Typography>

            <Typography variant="body2">
              Description: {fn.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* EVENTS */}
            {fn.events?.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={600}>
                  Events
                </Typography>

                <Grid2 container spacing={2} mt={1}>
                  {fn.events.map((ev) => (
                    <Grid2 item xs={12} md={6} key={ev.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography fontWeight={600}>
                            {ev.event_name}
                          </Typography>

                          <Typography variant="body2">
                            📍 {ev.venue_name}
                          </Typography>

                          <Typography variant="body2">
                            📅 {new Date(ev.date_time).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid2>
                  ))}
                </Grid2>

                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* TRANSPORTATION */}
            {fn.transportation?.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={600}>
                  Transportation
                </Typography>

                <Grid2 container spacing={2} mt={1}>
                  {fn.transportation.map((tr) => (
                    <Grid2 item xs={12} md={6} key={tr.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography fontWeight={600}>
                            {tr.title}
                          </Typography>

                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip label={tr.mode_of_travel} size="small" />
                            <Chip label={tr.transport_name} size="small" />
                          </Stack>

                          <Typography variant="body2" mt={1}>
                            📍 {tr.venue_name}
                          </Typography>

                          <Typography variant="body2">
                            📅 {new Date(tr.date_time).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid2>
                  ))}
                </Grid2>

                <Divider sx={{ my: 2 }} />
              </>
            )}

             {fn.accommodation?.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={600}>
                  Accommodation
                </Typography>

                <Grid2 container spacing={2} mt={1}>
                  {fn.accommodation.map((tr) => (
                    <Grid2 item xs={12} md={6} key={tr.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography fontWeight={600}>
                            {tr.title}
                          </Typography>

                          <Stack direction="row" spacing={1} mt={1}>
                            Room Key:<Chip label={tr.room_key} size="small" />
                          </Stack>

                          <Typography variant="body2" mt={1}>
                            📍 {tr.venue_name}
                          </Typography>

                          <Typography variant="body2">
                            📅 Check In: {new Date(tr.check_in_date_time).toLocaleString()}
                          </Typography>
                           <Typography variant="body2">
                            📅 Check Out: {new Date(tr.check_out_date_time).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid2>
                  ))}
                </Grid2>

                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* OTHER INFO */}
            {fn.otherinfo?.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={600}>
                 Pre Invite
                </Typography>

                <Stack spacing={2} mt={1}>
                  {fn.otherinfo.map((info) => (
                    <Card key={info.id} variant="outlined">
                      <CardContent>
                        <Typography fontWeight={600}>
                          {info.info_name}
                        </Typography>

                        <Typography variant="body2">
                          Dispatch Time:{" "}
                          {new Date(info.dispatch_date_time).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      )):(
        <>
         <Typography>
              <strong>No Data Found</strong>
            </Typography>
        </>
      )}
      </CardContent>
          </Card>
        </TabPanel>
        <TabPanel value={2}>
          <Card sx={{ mb: 3 }}>
  <CardContent>
    {loadingoff ? (
  <Box display="flex" justifyContent="center" mt={5}>
    <CircularProgress />
  </Box>
) : (
  offlineData?.length > 0 ? offlineData.map((item, index) => (
      <Card key={index} sx={{ mb: 4 }}>
        <CardContent>

          {/* HOST DETAILS */}
          {item.offline_host && (
            <>
              <Typography variant="h6" fontWeight={600}>
                Host Details
              </Typography>

              <Typography variant="body2">
                Name: {item.offline_host.name}
              </Typography>

              <Typography variant="body2">
                Mobile: {item.offline_host.mobile}
              </Typography>

              <Typography variant="body2">
                Address: {item.offline_host.address}
              </Typography>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* FUNCTION DETAILS */}
          {item.offline_function && (
            <>
              <Typography variant="h6" fontWeight={600}>
                {item.offline_function.occasion_name || "Function"}
              </Typography>

              <Typography variant="body2">
                Type: {item.offline_function.type}
              </Typography>

              <Typography variant="body2">
                Hashtag: {item.offline_function.hastag}
              </Typography>

              <Typography variant="body2">
                Notes: {item.offline_function.notes}
              </Typography>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* EVENT DETAILS */}
          {item.event_details?.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight={600}>
                Events
              </Typography>

              <Grid2 container spacing={2} mt={1}>
                {item.event_details.map((ev) => (
                  <Grid2 item xs={12} md={6} key={ev.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography fontWeight={600}>
                          {ev.title}
                        </Typography>

                        <Typography variant="body2">
                          📍 {ev.venu || ev.location_name}
                        </Typography>

                        <Typography variant="body2">
                          📅 {new Date(ev.date).toLocaleDateString()} {" "}
                          ⏰ {ev.time}
                        </Typography>

                        {ev.notes && (
                          <Typography variant="body2">
                            Notes: {ev.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid2>
                ))}
              </Grid2>

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* SHARE LIST */}
          {/* {item.shared_details?.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight={600}>
                Shared With
              </Typography>

              <Grid2 container spacing={2} mt={1}>
                {item.shared_details.map((user) => (
                  <Grid2 item xs={12} md={6} key={user.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography fontWeight={600}>
                          {user.name}
                        </Typography>

                        <Typography variant="body2">
                          📞 {user.country_code} {user.mobile}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                ))}
              </Grid2>
            </>
          )} */}

        </CardContent>
      </Card>
    )) : (
      <Typography>
        <strong>No Data Found</strong>
      </Typography>
    )
)}

  </CardContent>
</Card>
        </TabPanel>
        </TabContext>
    </Box>
)}
    </>
  );
};

export default FunctionReportView;

