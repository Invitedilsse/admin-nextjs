// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Custom Icon Import
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Styled Components
const MenuHeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(3.5),
  transition: 'padding .25s ease-in-out',
  minHeight: theme.mixins.toolbar.minHeight,
  borderBottom: `1px solid ${theme.palette.divider}`
}))

// ** 15px/600, not h4/700. The product name is a label on the chrome; at h4 it
//    was the largest type on most screens and wrapped inside a 268px column.
const HeaderTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: '0.9375rem',
  lineHeight: 1.33,
  letterSpacing: '-0.011em',
  whiteSpace: 'nowrap',
  transition: 'opacity .25s ease-in-out, margin .25s ease-in-out'
})

const LinkStyled = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none'
})

const VerticalNavHeader = props => {
  // ** Props
  const {
    hidden,
    navHover,
    settings,
    saveSettings,
    collapsedNavWidth,
    toggleNavVisibility,
    navigationBorderWidth,
    menuLockedIcon: userMenuLockedIcon,
    navMenuBranding: userNavMenuBranding,
    menuUnlockedIcon: userMenuUnlockedIcon
  } = props

  // ** Hooks & Vars
  const theme = useTheme()
  const { navCollapsed } = settings
  const menuCollapsedStyles = navCollapsed && !navHover ? { opacity: 0 } : { opacity: 1 }

  const menuHeaderPaddingLeft = () => {
    if (navCollapsed && !navHover) {
      if (userNavMenuBranding) {
        return 0
      } else {
        return (collapsedNavWidth - navigationBorderWidth - 34) / 8
      }
    } else {
      return 6
    }
  }
  const MenuLockedIcon = () => userMenuLockedIcon || <Icon icon='tabler:layout-sidebar-left-collapse' />
  const MenuUnlockedIcon = () => userMenuUnlockedIcon || <Icon icon='tabler:layout-sidebar-left-expand' />

  return (
    <MenuHeaderWrapper className='nav-header' sx={{ pl: menuHeaderPaddingLeft() }}>
      {userNavMenuBranding ? (
        userNavMenuBranding(props)
      ) : (
        <LinkStyled href='/'>
          <img height={34} width={34} alt='Invite Dilsse' src='/images/invite-dilsse-mark.png' />

          <HeaderTitle
            variant='h6'
            sx={{ ...menuCollapsedStyles, ...(navCollapsed && !navHover ? {} : { ml: 2.5 }) }}
          >
            {themeConfig.templateName}
          </HeaderTitle>
        </LinkStyled>
      )}

      {hidden ? (
        <IconButton
          disableRipple
          disableFocusRipple
          onClick={toggleNavVisibility}
          sx={{ p: 0, color: 'text.secondary', backgroundColor: 'transparent !important' }}
        >
          <Icon icon='tabler:x' fontSize='1.25rem' />
        </IconButton>
      ) : userMenuLockedIcon === null && userMenuUnlockedIcon === null ? null : (
        <Tooltip title={navCollapsed ? 'Expand menu' : 'Collapse menu'} placement='right'>
          <IconButton
            aria-label={navCollapsed ? 'Expand menu' : 'Collapse menu'}
            onClick={() => saveSettings({ ...settings, navCollapsed: !navCollapsed })}
            sx={{
              p: 1.5,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              '& svg': {
                fontSize: '1.25rem',
                ...menuCollapsedStyles,
                transition: 'opacity .25s ease-in-out'
              }
            }}
          >
            {navCollapsed ? MenuUnlockedIcon() : MenuLockedIcon()}
          </IconButton>
        </Tooltip>
      )}
    </MenuHeaderWrapper>
  )
}

export default VerticalNavHeader
