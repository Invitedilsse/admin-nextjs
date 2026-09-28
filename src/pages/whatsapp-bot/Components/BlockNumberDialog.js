/**
 * Block / unblock one number.
 *
 * Shared by both tabs, so the confirmation, the reason box and the wording are
 * the same wherever the action is taken from.
 *
 * WHY A CONFIRMATION AT ALL — blocking is not destructive, but it is silent:
 * nothing tells the person on the other end, and the only symptom is a bot that
 * stops answering. An admin who blocks the wrong number finds out days later
 * from a complaint. One dialog that states the number and what will happen is
 * worth the extra click.
 *
 * `reason` is optional and strongly encouraged. It is what the next admin reads
 * when they open the list and wonder why a number is on it, and it is stored
 * against both the row and the audit trail.
 */

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import { apiPost } from 'src/hooks/axios'
import { waBotBlockUrl, waBotUnblockUrl } from 'src/services/pathConst'

/**
 * @param {'block'|'unblock'} mode
 * @param {string} phone      the number, in whatever form the row holds it
 * @param {string} name       shown above the number when the account is known
 * @param {function} onDone   called after a successful write, to refetch
 */
const BlockNumberDialog = ({ open, mode, phone, name, onClose, onDone }) => {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const blocking = mode === 'block'

  // Cleared on every open, so a reason typed for one number can never be
  // submitted against the next one.
  useEffect(() => {
    if (open) setReason('')
  }, [open, phone, mode])

  const submit = async () => {
    setSaving(true)
    try {
      const res = await apiPost(blocking ? waBotBlockUrl : waBotUnblockUrl, {
        phone,
        reason: reason || undefined
      })

      toast.success(res?.data?.message || (blocking ? 'Number blocked' : 'Number unblocked'))
      onDone?.()
      onClose?.()
    } catch (err) {
      // The API answers 404 when an unblock names a number that was never on
      // the list, and 403 when the portal role does not allow it. Showing the
      // server's own message beats a generic failure.
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          (blocking ? 'Could not block that number' : 'Could not unblock that number')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!open} onClose={saving ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{blocking ? 'Block this number?' : 'Unblock this number?'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <div>
            {name && (
              <Typography variant='body2' fontWeight={600}>
                {name}
              </Typography>
            )}
            <Typography variant='body2' color='text.secondary'>
              {phone}
            </Typography>
          </div>

          <DialogContentText component='div'>
            {blocking ? (
              <>
                The bot will stop replying to this number — no menus, no
                confirmations and no add-back invitations. Their messages still
                arrive and are still recorded, so you can keep watching what they
                send.
              </>
            ) : (
              <>The bot will start answering this number again from their next message.</>
            )}
          </DialogContentText>

          {blocking && (
            <Alert severity='info' sx={{ py: 0 }}>
              Takes effect on their next message. Nothing needs restarting.
            </Alert>
          )}

          <TextField
            fullWidth
            size='small'
            multiline
            minRows={2}
            label='Reason (optional)'
            placeholder={blocking ? 'e.g. sending 200+ messages a day' : 'e.g. spoke to them, resolved'}
            value={reason}
            onChange={e => setReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button color='secondary' onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color={blocking ? 'error' : 'success'}
          onClick={submit}
          disabled={saving || !phone}
        >
          {saving ? 'Saving…' : blocking ? 'Block' : 'Unblock'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BlockNumberDialog
