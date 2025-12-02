// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import { Typography } from '@mui/material'

const Home = () => {
  return (<Grid container spacing={6}>
    <Grid size={{ xs: 12 }}>
      <Card
        sx={{
          boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
        }}>
        <Box sx={{ p: 5, pb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', height: "50vh" }}>
          <Typography variant='h6'>Comming Soon...</Typography>
        </Box>
      </Card>
    </Grid>
  </Grid>)
}
Home.acl = {
  action: 'read',
  subject: 'accatee'
}

export default Home
