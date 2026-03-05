import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material'

export const SharedWithTable = ({ rows = [] }) => {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No shared data available
      </Typography>
    )
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: 220,
        boxShadow: 'none',
        border: '1px solid #eee',
        borderRadius: 2
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>
             Name
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              Country_Code
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              Mobile
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.country_code}</TableCell>
              <TableCell>{row.mobile}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
