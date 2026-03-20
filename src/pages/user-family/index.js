import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

import {
  Grid2,
  Card,
  CardHeader,
  Divider,
  TextField,
  IconButton,
  Icon,
  Button,
  Popover
} from '@mui/material';

import { Box } from '@mui/system';
import { Visibility } from '@mui/icons-material';

import { useMaterialReactTable, MaterialReactTable } from 'material-react-table';

import { DateRange } from 'react-date-range';
import { format } from 'date-fns';

import { apiGet } from 'src/hooks/axios';
import { baseURL } from 'src/services/pathConst';

const UsersFamily = ({}) => {
  const [searchText, setSearchText] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')
  const [totalcount, setTotalCount] = useState(0)
  const [isdataloading, setisdataloading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [userList, setUserList] = useState([])
const router = useRouter()
const [anchorEl, setAnchorEl] = useState(null);
const searchParams = useSearchParams();
const [startdate,setStartDate] = useState(searchParams.get("sd")??'')
const [endDate,setEndDate] = useState(searchParams.get("ed")??'');
const [selectionRange, setSelectionRange] = useState({
    // startDate:startdate !==''? startdate : new Date(),
    // endDate: endDate !==''? endDate : new Date(),
    startDate:startdate !==''? startdate : '',
    endDate: endDate !==''? endDate : '',
    key: "selection"
  });


console.log("startdate----->",startdate,"endDate----->",endDate)

  const fetchData = async () => {
    //fetch data from the api and set it to the state
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${baseURL}function-reports/user-family-list?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}&sd=${startdate}&ed=${endDate}`
      )
      console.log('uses List--------->', response.data)
      setUserList(response.data.data || [])
      setTotalCount(response.data.count.total || 0)
    } catch (error) {
      console.error('UserList:------>', error)
    } finally {
      setisdataloading(false)
    }
  }

    const fetchuserData = async (d,type) => {
      if(type === 'm')
        router.push(`/users-history/${d.id}`)
      else
        router.push(`/users-history/${d.creator_id}`)

  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const handleTemplateClick = ()=>{
     console.log("innn")
  }

  useEffect(() => {
    fetchData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize,startdate,endDate])

  const generateColumns = ({ onTemplateClick }) => [
    {
      accessorKey: 'member name',
      header: 'Member Name',
      Cell: ({ row }) => row.original.member_name || '-'
    },
    {
      accessorKey: 'member mobile',
      header: 'Member Mobile',
      Cell: ({ row }) => row.original.member_mobile || '-' // Event/Trans/Acc/Other title
    },
     {
      accessorKey: 'creator name',
      header: 'Creator Name',
      Cell: ({ row }) => row.original.creator_name || '-'
    },
    {
      accessorKey: 'creator mobile',
      header: 'Creator Mobile',
      Cell: ({ row }) => row.original.creator_mobile || '-' // Event/Trans/Acc/Other title
    },
     {
      accessorKey: 'created At',
      header: 'Created At',
      Cell: ({ row }) => row.original.created_at || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'View Member In Detail',
      Cell: ({ row }) => (
        <>
          <Visibility onClick={() => onTemplateClick(row.original,'m')} style={{ cursor: 'pointer', marginRight: 8 }} />
        </>
      )
    },
     {
      accessorKey: 'Action',
      header: 'View Creator In Detail',
      Cell: ({ row }) => (
        <>
          <Visibility onClick={() => onTemplateClick(row.original,'c')} style={{ cursor: 'pointer', marginRight: 8 }} />
        </>
      )
    }
  ]

  const table = useMaterialReactTable({
    columns: generateColumns({
      onTemplateClick: fetchuserData
    }),
    data: userList,
    enableRowSelection: false,
    enableSelectAll: false,
    enableColumnFilter: false,
    enableColumnPinning: true,
    layoutMode: 'grid-no-grow',
    initialState: {
      columnPinning: { left: ['title'] }
    },
    enableTopToolbar: false,
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true
    },
    enablePinning: false,
    rowCount: totalcount,
    state: { pagination, isLoading: isdataloading },
    onPaginationChange: setPagination,
    manualPagination: true,
    enableColumnDragging: false,
    enableColumnOrdering: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableColumnActions: false
  })

    const handleDateChange = ranges => {
    const { startDate:sdate, endDate:edate } = ranges.selection;

    setSelectionRange({
      startDate:sdate,
      endDate:edate,
      key: "selection"
    });
    setStartDate(format(sdate, "yyyy-MM-dd"))
    setEndDate(format(edate, "yyyy-MM-dd"))
  }
  return (
    <>
      <Grid2 container spacing={6}>
        <Card
          sx={{
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 3px 0px'
          }}
        >
          <CardHeader
            title='Users List'
            sx={{
              '& .MuiTypography-root ': {}
            }}
          />
          <Divider sx={{ m: '0 !important' }} />
          <Grid2 container spacing={2} px={4} display={'flex'} justifyContent={'end'}>
            <Grid2 size={{ xs: 12, lg: 6, md: 6, sm: 12 }}>
              <TextField
                variant='outlined'
                size='small'
                value={tempSearchText}
                fullWidth
                sx={{ mr: 4 }}
                placeholder='Search Contacts'
                onChange={e => handleDebouncedSearch(e.target.value)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter') {
                    ev.preventDefault()
                    setSearchText(tempSearchText)
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton onClick={() => setSearchText(tempSearchText)}>
                        <Icon icon='fluent:search-20-regular' width={20} height={20} />
                      </IconButton>
                    )
                  }
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }}>
                       {/* DATE RANGE BUTTON */}
              <Button
                // variant={filType === "custom"?"contained":"outlined"}
                variant={"contained"}
                onClick={e => {
                  // setFiltype("custom")
                  setAnchorEl(e.currentTarget)
                }}
              >
              {selectionRange.startDate ? format(selectionRange.startDate, "dd MMM yyyy") : 'Start Date'} -{" "}
              {selectionRange.endDate   ? format(selectionRange.endDate,   "dd MMM yyyy") : 'End Date'}
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
            </Grid2>
             <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }}>
                       {/* DATE RANGE BUTTON */}
              <Button
                // variant={filType === "custom"?"contained":"outlined"}
                variant={"contained"}
                onClick={e => {
                  // setFiltype("custom")
                  setStartDate('')
                  setEndDate('')
                  setSelectionRange({
                    startDate:'',
                    endDate:'',
                    key:'selection'
                  })
                }}
              >
                clear filter
              </Button>
            </Grid2>
          </Grid2>
          <Box p={4} mt={4}>
            <MaterialReactTable table={table} />
          </Box>
        </Card>
      </Grid2>
    </>
  )
}

export default UsersFamily