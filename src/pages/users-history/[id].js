import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Chip,
  Grid2
} from "@mui/material";
import { useRouter } from "next/router";
import { apiGet } from "src/hooks/axios";
import { baseURL } from "src/services/pathConst";
import ContactsTabs from "./components/FamilContactDisplay";

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
useEffect(()=>{
    if(id){
     fetchuserData()
    }
},[id])
console.log(user,eventsmapped)
  return (
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
      {/* FUNCTIONS */}
      {eventsmapped.map((fn) => (
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
      ))}
    </Box>
  );
};

export default FunctionReportView;

