import { useState } from 'react'
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'

export const DropdownFilterPushContact = ({ templates, passval }) => {
  const [selectedId, setSelectedId] = useState('')

  const handleChange = event => {
    setSelectedId(event.target.value)
    passval(event.target.value)
  }

  return (
    <FormControl fullWidth>
      <InputLabel id='template-select-label'>Select Template</InputLabel>
      <Select labelId='template-select-label' value={selectedId} onChange={handleChange}>
        {templates?.map(item => (
          <MenuItem key={item.id} value={item.id}>
            {item.name}
          </MenuItem>
        ))}
        <MenuItem key={''} value={''}>
          Clear
        </MenuItem>
      </Select>
    </FormControl>
  )
}
