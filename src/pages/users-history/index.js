import { Visibility } from '@mui/icons-material'
import { apiGet } from 'src/hooks/axios'

const { Grid2, Card, CardHeader, Divider, TextField, IconButton, Icon } = require('@mui/material')
const { Box } = require('@mui/system')
const { useMaterialReactTable, MaterialReactTable } = require('material-react-table')
const { useRouter } = require('next/router')
const { useEffect, useState } = require('react')
const { baseURL } = require('src/services/pathConst')

const UsersHistory = ({}) => {
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
  

  const fetchData = async () => {
    //fetch data from the api and set it to the state
    setisdataloading(true)
    try {
      const response = await apiGet(
        `${baseURL}function-reports/user-list-all?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${searchText}`
      )
      console.log('uses List--------->', response.data)
      setUserList(response.data.data || [])
      setTotalCount(response.data.count.count || 0)
    } catch (error) {
      console.error('UserList:------>', error)
    } finally {
      setisdataloading(false)
    }
  }

    const fetchuserData = async (d) => {
        router.push(`/users-history/${d.id}`)
  }

  const handleDebouncedSearch = value => {
    setTempSearchText(value)
  }
  const handleTemplateClick = ()=>{
     console.log("innn")
  }

  useEffect(() => {
    fetchData()
  }, [searchText, pagination?.pageIndex, pagination?.pageSize])

  const generateColumns = ({ onTemplateClick }) => [
    {
      accessorKey: 'name',
      header: 'Name',
      Cell: ({ row }) => row.original.name || '-'
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      Cell: ({ row }) => row.original.mobile || '-' // Event/Trans/Acc/Other title
    },
    {
      accessorKey: 'Action',
      header: 'View In Detail',
      Cell: ({ row }) => (
        <>
          <Visibility onClick={() => onTemplateClick(row.original)} style={{ cursor: 'pointer', marginRight: 8 }} />
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
            <Grid2 size={{ xs: 12, lg: 4, md: 4, sm: 12 }}></Grid2>
          </Grid2>
          <Box p={4} mt={4}>
            <MaterialReactTable table={table} />
          </Box>
        </Card>
      </Grid2>
    </>
  )
}

export default UsersHistory