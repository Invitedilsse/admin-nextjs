import { Checkbox, ListItemText, MenuItem, Select, FormControl, InputLabel, OutlinedInput } from '@mui/material'
import { useEffect } from 'react'

function ColumnMultiSelect({ table, passList }) {
  const allColumns = table.getAllLeafColumns()

  console.log(`all columns-------->`, allColumns)
  // Only include hideable columns
  const hideableColumns = allColumns.filter(col => col.getCanHide())

  // Track which are visible
  const visibleIds = hideableColumns.filter(col => col.getIsVisible()).map(col => col.id)

  const handleChange = event => {
    const selected = event.target.value

    hideableColumns.forEach(col => {
      col.toggleVisibility(selected.includes(col.id))
    })

    const selectedCols = hideableColumns
      .filter(col => selected.includes(col.id))
      .filter(col => col.columnDef.header !== 'S.No' && col.columnDef.header !== 'Action')
      .map(col => col.columnDef.header)
    //   .map(col => ({
    //     // id: col.id,
    //     // name: col.columnDef.header
    //   }))
    passList(selectedCols)
    console.log('Currently visible columns:', selectedCols)
  }

  useEffect(() => {
    passList(
      hideableColumns
        .filter(col => col.getIsVisible())
        .filter(col => col.columnDef.header !== 'S.No' && col.columnDef.header !== 'Action')
        .map(col => col.columnDef.header)
    )
  }, [])

  console.log('hideableColumns', hideableColumns)

  return (
    <FormControl size='small' sx={{ maxWidth: 200 }}>
      {/* <p>Column Filter</p> */}
      <InputLabel id='demo-multiple-checkbox-label'>Column Filter</InputLabel>

      <Select
        multiple
        labelId='demo-multiple-checkbox-label'
        id='demo-multiple-checkbox'
        value={visibleIds}
        onChange={handleChange}
        input={<OutlinedInput label='Column Filter' />}
        renderValue={selected =>
          selected.map(id => hideableColumns.find(col => col.id === id)?.columnDef.header).join(', ')
        }
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 250, // control dropdown height
              overflowY: 'auto'
            }
          }
        }}
      >
        {hideableColumns.map(col => (
          <MenuItem key={col.id} value={col.id}>
            <Checkbox checked={col.getIsVisible()} />
            <ListItemText primary={col.columnDef.header} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default ColumnMultiSelect
