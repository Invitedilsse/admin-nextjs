// // ** MUI Imports
// import Box from '@mui/material/Box'
// import Card from '@mui/material/Card'
// import Grid from '@mui/material/Grid2'
// import { Typography } from '@mui/material'

// const Home = () => {
//   return (<Grid container spacing={6}>
//     <Grid size={{ xs: 12 }}>
//       <Card
//         sx={{
//           boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
//         }}>
//         <Box sx={{ p: 5, pb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', height: "50vh" }}>
//           <Typography variant='h6'>Comming Soon...</Typography>
//         </Box>
//       </Card>
//     </Grid>
//   </Grid>)
// }


// export default Home

import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Card, CardContent, Typography, Popover } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import { apiGet } from "src/hooks/axios";

// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";
import { baseURL } from "src/services/pathConst";
import { useRouter } from "next/router";

const Home = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const[filType,setFiltype] = useState("today")
  const[dateRange,setDateRange] = useState({
    startdate:'',
    endDate:''
  })
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection"
  });
      const router = useRouter()

  const fetchDashboard = async (start_date, end_date) => {
    try {
      const params = `start_date=${start_date}&end_date=${end_date}`;
      // const res = await apiGet(`/dashboard-details?${params}`);
      const res = await apiGet(`${baseURL}function-reports/dashboard-report?${params}`);
      setDashboardData(res?.data || {});
      setAnchorEl(null)
    } catch (err) {
      console.error("Dashboard API Error:", err);
    }
  };

  const applyQuickFilter = type => {
    const today = new Date();
    let start = new Date();
    setFiltype(type)
    if (type === "today") start = new Date();
    if (type === "7d") start.setDate(today.getDate() - 7);
    if (type === "30d") start.setDate(today.getDate() - 30);

    setSelectionRange({
      startDate: start,
      endDate: today,
      key: "selection"
    });
    setDateRange({
      startdate:format(start, "yyyy-MM-dd"),
      endDate:format(today, "yyyy-MM-dd")
    })
    fetchDashboard(format(start, "yyyy-MM-dd"), format(today, "yyyy-MM-dd"));
  };

  const handleDateChange = ranges => {
    const { startDate, endDate } = ranges.selection;

    setSelectionRange({
      startDate,
      endDate,
      key: "selection"
    });
  setDateRange({
        startdate:format(startDate, "yyyy-MM-dd"),
        endDate:format(endDate, "yyyy-MM-dd")
      })
    fetchDashboard(format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));
  };

  useEffect(() => {
    applyQuickFilter("today");
  }, []);

  const cards = [
    {
      title: "Functions",
      value: dashboardData?.function_count || 0,
      color: "#4caf50",
      route: '/admin-function-reports'
    },
    {
      title: "Offline Functions",
      value: dashboardData?.offline_function_count || 0,
      color: "#ff9800",
      route: '/admin-function-reports'

    },
    {
      title: "Users",
      value: dashboardData?.user_count || 0,
      color: "#2196f3",
      // route: `/users-history?startdate=${dateRange.startdate}&endDate=${dateRange.endDate}`
      route: `/users-history`

    },
    {
      title: "Family Connections",
      value: dashboardData?.familyconnection_count || 0,
      color: "#9c27b0",
      route: '/user-family'

    }
  ];

  return (
    <Box>

      {/* FILTER SECTION */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        spacing={2}
      >

        {/* QUICK FILTER BUTTONS */}
        <Stack direction="row" spacing={1}>
          
          <Button variant={filType === "today"?"contained":"outlined"} onClick={() => applyQuickFilter("today")}>
            Today
          </Button>

          <Button variant={filType === "7d"?"contained":"outlined"}  onClick={() => applyQuickFilter("7d")}>
            Last 7 Days
          </Button>

          <Button variant={filType === "30d"?"contained":"outlined"}  onClick={() => applyQuickFilter("30d")}>
            Last 30 Days
          </Button>
        </Stack>

        {/* DATE RANGE BUTTON */}
        <Button
          variant={filType === "custom"?"contained":"outlined"}
          onClick={e => {
            setFiltype("custom")
            setAnchorEl(e.currentTarget)
          }}
        >
          {format(selectionRange.startDate, "dd MMM yyyy")} -{" "}
          {format(selectionRange.endDate, "dd MMM yyyy")}
        </Button>

        {/* DATE RANGE PICKER */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
        >
          <DateRange
            ranges={[selectionRange]}
            onChange={handleDateChange}
            moveRangeOnFirstSelection={false}
          />
        </Popover>
      </Stack>

      {/* DASHBOARD CARDS */}
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0px 4px 12px rgba(0,0,0,0.1)"
              }}
              // onClick={()=>router.push(`${card.route}?startdate=${dateRange.startdate}&endDate=${dateRange.endDate}`)}
              // onClick={()=>router.push(card.route)}
              onClick={()=>{router.push({
                    pathname: card.route,
                    query:card.title.toLocaleLowerCase().includes("functions")?{
                      sd: dateRange.startdate,
                      ed: dateRange.endDate,
                      type: card.title.toLocaleLowerCase() === 'functions' ? 'online':'offline'
                    }: {
                      sd: dateRange.startdate,
                      ed: dateRange.endDate,
                    }
                  })}}

            >
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {card.title}
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={600}
                  sx={{ color: card.color }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
}

Home.acl = {
  action: 'read',
  subject: 'accatee'
}
export default Home;
