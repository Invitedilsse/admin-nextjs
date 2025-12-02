// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSnackBar } from 'src/store/auth'

const SnackbarAlert = () => {
  // ** State

  const dispatch = useDispatch()

  const { isOpen, type, message } = useSelector(state => state?.auth?.snackbar)
  // ** Hook & Var
  const { settings } = useSettings()
  const { skin } = settings

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    dispatch(
      toggleSnackBar({
        isOpen: false,
        type: '',
        message: ''
      })
    )
  }

  return (
    <Fragment>
      <Snackbar open={isOpen} onClose={handleClose} autoHideDuration={3000}>
        <Alert
          variant='filled'
          severity={type}
          onClose={handleClose}
          sx={{ width: '100%' }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          elevation={skin === 'bordered' ? 0 : 3}
        >
          {message}
        </Alert>
      </Snackbar>
    </Fragment>
  )
}

export default SnackbarAlert
