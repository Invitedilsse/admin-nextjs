import { Checkbox, ListItemText, MenuItem, Select, FormControl, InputLabel, OutlinedInput } from '@mui/material'
import { useState, useEffect } from 'react'

function DataMultiSelect({ data = [], passList, isMulti = true, preSelected = [],title }) {
  const [selectedKeys, setSelectedKeys] = useState([])

  const handleChange = event => {
    const selected = event.target.value

    // if single select, wrap it in array
    const keys = isMulti ? selected : [selected]
    setSelectedKeys(keys)

    // get full objects of selected items
    const selectedItems = data.filter(item => keys.includes(item.key))
    passList(isMulti ? selectedItems : selectedItems[0] || null)
  }

  // Sync with preSelected
  useEffect(() => {
    if (preSelected.length > 0) {
      setSelectedKeys(preSelected.map(item => item.key))
    }
  }, [preSelected])

  return (
    <FormControl size='small' sx={{ maxWidth: 250 }}>
      <InputLabel id='multi-select-label'>{title? title:'Select Items'}</InputLabel>
      <Select
        multiple={isMulti}
        labelId='multi-select-label'
        id='multi-select'
        value={isMulti ? selectedKeys : selectedKeys[0] || ''}
        onChange={handleChange}
        input={<OutlinedInput label='Select Items' />}
        renderValue={selected =>
          isMulti
            ? selected.map(key => data.find(item => item.key === key)?.value).join(', ')
            : data.find(item => item.key === selected)?.value || ''
        }
        MenuProps={{
          PaperProps: {
            style: { maxHeight: 250, overflowY: 'auto' }
          }
        }}
      >
        {data.map(item => (
          <MenuItem key={item.key} value={item.key}>
            {isMulti && <Checkbox checked={selectedKeys.includes(item.key)} />}
            <ListItemText primary={item.value} secondary={item.type} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default DataMultiSelect
