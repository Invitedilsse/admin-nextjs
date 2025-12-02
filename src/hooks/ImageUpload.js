import CloseIcon from '@mui/icons-material/Close'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import 'cropperjs/dist/cropper.css'
import React, { useEffect, useState } from 'react'
import Cropper from 'react-cropper'
// import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(0)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
})
const BootstrapDialogTitle = props => {
  const { children, onClose, ...other } = props

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 4,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  )
}

const messageConetent = {
  logo: {
    deletemessage: 'Are you sure, You want to delete?',
    title: 'Delete'
  },
  familyLogo: {
    deletemessage: 'Are you sure, You want to delete?',
    title: 'Delete'
  },
  cover: {
    deletemessage: 'Are you sure, You want to delete?',
    title: 'Delete'
  }
}
function ImageUpload({
  isOpen,
  handleClose,
  aspectRatio,
  type,
  title,
  isPreview,
  selectedImage,
  handleUpload,
  showSnack
}) {
  // const { t } = useTranslation();
  const [image, setImage] = useState()
  const [cropper, setCropper] = useState()
  const [openConfirm, setConfirm] = React.useState(false)

  useEffect(() => {
    setImage(selectedImage)
  }, [selectedImage])
  const handleAction = isDelete => {
    setConfirm(false)
    if (isDelete) {
      handleUpload(type, '', true)
    }
  }
  const onChange = e => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    if (files[0].size < 50 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result)
        e.target.value = null
      }
      reader.readAsDataURL(files[0])
    } else {
      toast.error('File size should be below 5MB. ')
    }
  }

  const applyPhoto = () => {
    if (typeof cropper !== 'undefined') {
      cropper.getCroppedCanvas().toBlob(
        blob => {
          handleUpload(type, blob)
        },
        'image/jpeg',
        0.8
      )
    }
  }

  return (
    <BootstrapDialog
      fullWidth={true}
      maxWidth={'sm'}
      onClose={handleClose}
      aria-labelledby='customized-dialog-title'
      open={isOpen}
    >
      <BootstrapDialogTitle
        id='customized-dialog-title'
        onClose={handleClose}
        sx={{ backgroundColor: 'primary.main', color: 'white', py: 3 }}
      >
        {title}
      </BootstrapDialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box
          noValidate
          component='form'
          sx={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            margin: '0',
            m: 'auto',
            p: 0
          }}
        >
          <Box sx={{ width: '100%' }}>
            {isPreview && (
              <div className='preview_holder'>
                <img src={selectedImage} alt='selectedImage' className={`preview ${type}`} />
              </div>
            )}
            {!isPreview && (
              <Box>
                <Cropper
                  className='cropper-design'
                  zoomTo={0}
                  aspectRatio={aspectRatio}
                  preview='.img-preview'
                  src={image}
                  viewMode={1}
                  minCropBoxHeight={10}
                  minCropBoxWidth={10}
                  background={false}
                  responsive={true}
                  autoCropArea={1}
                  checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
                  onInitialized={instance => {
                    setCropper(instance)
                  }}
                  guides={true}
                />
              </Box>
            )}
          </Box>
          <Dialog maxWidth='xs' open={openConfirm} aria-labelledby='responsive-dialog-title'>
            <DialogTitle id='responsive-dialog-title'>{messageConetent?.[type]?.title}</DialogTitle>
            <DialogContent>
              <DialogContentText>{messageConetent?.[type]?.deletemessage}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleAction(false)}>{'Cancel'}</Button>
              <Button color='error' onClick={() => handleAction(true)}>
                {'Yes'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </DialogContent>
      <DialogActions sx={{ mb: 4 }}>
        <Grid container spacing={4} display={'flex'} justifyContent='center'>
          {!isPreview && (
            <Grid size={{ xs: 12, md: 12 }} display='flex' justifyContent='center'>
              <FormHelperText sx={{ fontSize: '1rem' }}>{'Use Mouse wheel or Trackpad to Zoom'}</FormHelperText>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              sx={{ mx: 1 }}
              onClick={() => {
                // openConfirmBox();
                handleClose()
              }}
              variant='outlined'
              color='error'
              fullWidth
            >
              {'Close'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button
              component='label'
              role={undefined}
              variant='outlined'
              tabIndex={-1}
              fullWidth
              // startIcon={<CloudUploadIcon />}
            >
              Re-select
              <VisuallyHiddenInput type='file' accept='.jpg,.png,.jpeg,.webpp' onChange={onChange} multiple={false} />
            </Button>
          </Grid>
          {!isPreview && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Button sx={{ mx: 1 }} variant='contained' onClick={applyPhoto} fullWidth>
                {'Apply'}
              </Button>
            </Grid>
          )}
        </Grid>
      </DialogActions>
    </BootstrapDialog>
  )
}

export default ImageUpload
