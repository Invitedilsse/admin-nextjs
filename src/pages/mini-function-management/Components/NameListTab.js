import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import Icon from 'src/@core/components/icon'
import { apiDelete, apiGet, apiPost } from 'src/hooks/axios'

/**
 * One editable list of names, used for both Occasions and Event names.
 *
 * ! ONE COMPONENT, BECAUSE THE TWO LISTS ARE THE SAME LIST.
 *   They differ in their endpoints and their wording and in nothing else.
 *   Two copies would be two places to fix the next time adding a name
 *   needs to behave differently.
 */
const NameListTab = ({ title, blurb, listUrl, saveUrl, deleteUrl, placeholder }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // id null means the box is adding; an id means it is renaming that row.
  const [draft, setDraft] = useState({ id: null, name: '' })

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const res = await apiGet(
        `${listUrl}?limit=200&offset=0${search ? `&search=${encodeURIComponent(search)}` : ''}`
      )
      const body = res?.data?.detail ?? res?.data?.data ?? []
      setRows(Array.isArray(body) ? body : [])
    } catch (e) {
      toast.error(`Could not load the ${title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }, [listUrl, search, title])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    const name = draft.name.trim()

    if (!name) {
      toast.error('Type a name first')

      return
    }

    try {
      await apiPost(saveUrl, { id: draft.id, name })
      toast.success('Saved')
      setDraft({ id: null, name: '' })
      load()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save it')
    }
  }

  const remove = async id => {
    try {
      await apiDelete(`${deleteUrl}/${id}`)
      toast.success('Removed')
      load()
    } catch (e) {
      toast.error('Could not remove it')
    }
  }

  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>{blurb}</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          size='small'
          label={draft.id ? 'Rename to' : 'Add a name'}
          placeholder={placeholder}
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          sx={{ minWidth: 280 }}
        />
        <Button variant='contained' onClick={save}>
          {draft.id ? 'Save' : 'Create'}
        </Button>
        {draft.id && (
          <Button onClick={() => setDraft({ id: null, name: '' })}>Cancel</Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          size='small'
          label='Search'
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Added by</TableCell>
              <TableCell align='right'>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover selected={draft.id === r.id}>
                <TableCell>{r.name}</TableCell>
                {/* ! WHERE THE NAME CAME FROM, NOT ONLY WHO.
                      A host typing an occasion the dropdown did not have
                      puts it on this list, so the list is no longer only
                      what an admin curated. Without the source line, a
                      word somebody invented is indistinguishable from one
                      the product shipped with. */}
                <TableCell>
                  {r.created_source === 'host' ? (
                    <>
                      {r.created_by_name || 'A host'}
                      <Typography variant='body2' sx={{ color: 'warning.main' }}>
                        Added by a host while creating a function
                      </Typography>
                    </>
                  ) : r.created_source === 'seed' ? (
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                      Shipped with the product
                    </Typography>
                  ) : (
                    <>
                      {r.created_by_name || 'Admin'}
                      <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        Added in this portal
                      </Typography>
                    </>
                  )}
                </TableCell>
                <TableCell align='right'>
                  <IconButton size='small' onClick={() => setDraft({ id: r.id, name: r.name })}>
                    <Icon icon='tabler:pencil' />
                  </IconButton>
                  <IconButton size='small' onClick={() => remove(r.id)}>
                    <Icon icon='tabler:trash' />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>Nothing on this list yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default NameListTab
