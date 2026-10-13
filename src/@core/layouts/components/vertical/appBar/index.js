// ** MUI Imports
import { styled } from '@mui/material/styles'
import MuiAppBar from '@mui/material/AppBar'
import MuiToolbar from '@mui/material/Toolbar'

/**
 * The page header.
 * -------------------------------------------------------------------------------------
 * The template floated this as a rounded white card with a 16px gap above it and a
 * blur gradient behind, so the header slid under the content as you scrolled. Two
 * problems: the gap meant the page had no fixed top edge to align to, and a blurred
 * gradient over a near-white page is a compositing layer that shows nothing.
 *
 * It is a flush bar now - full width, one hairline along the bottom, square - which
 * is what every portal you would call high end does, because it gives the sidebar
 * divider and the header divider a single corner to meet at.
 */
const AppBar = styled(MuiAppBar)(({ theme }) => ({
  transition: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: theme.mixins.toolbar.minHeight
}))

const Toolbar = styled(MuiToolbar)(({ theme }) => ({
  width: '100%',
  borderRadius: 0,
  [theme.breakpoints.up('sm')]: { padding: `${theme.spacing(0, 6)} !important` },
  [theme.breakpoints.down('sm')]: { padding: `${theme.spacing(0, 4)} !important` }
}))

const LayoutAppBar = props => {
  // ** Props
  const { settings, appBarProps, appBarContent: userAppBarContent } = props

  // ** Vars
  const { appBar, contentWidth } = settings

  if (appBar === 'hidden') {
    return null
  }
  let userAppBarStyle = {}
  if (appBarProps && appBarProps.sx) {
    userAppBarStyle = appBarProps.sx
  }
  const userAppBarProps = Object.assign({}, appBarProps)
  delete userAppBarProps.sx

  return (
    <AppBar
      elevation={0}
      color='default'
      className='layout-navbar'
      sx={{ ...userAppBarStyle }}
      position={appBar === 'fixed' ? 'sticky' : 'static'}
      {...userAppBarProps}
    >
      <Toolbar
        className='navbar-content-container'
        sx={{
          minHeight: theme => `${theme.mixins.toolbar.minHeight}px !important`,
          ...(contentWidth === 'boxed' && {
            '@media (min-width:1440px)': { maxWidth: theme => `calc(1440px - ${theme.spacing(6 * 2)})` }
          })
        }}
      >
        {(userAppBarContent && userAppBarContent(props)) || null}
      </Toolbar>
    </AppBar>
  )
}

export default LayoutAppBar
