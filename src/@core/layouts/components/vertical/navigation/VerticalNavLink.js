// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'

// ** Configs Import
import themeConfig from 'src/configs/themeConfig'

// ** Custom Components Imports
import UserIcon from 'src/layouts/components/UserIcon'
import Translations from 'src/layouts/components/Translations'
import CanViewNavLink from 'src/layouts/components/acl/CanViewNavLink'

// ** Util Imports
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import { handleURLQueries } from 'src/@core/layouts/utils'

// ** Styled Components
const MenuNavLink = styled(ListItemButton)(({ theme }) => ({
  width: '100%',
  marginLeft: theme.spacing(3),
  marginRight: theme.spacing(3),
  borderRadius: 8,
  transition: 'background-color .15s ease-in-out, color .15s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    '& .MuiTypography-root, & svg': { color: `${theme.palette.text.primary} !important` }
  },
  // ** The active item is a tonal panel, not a filled block.
  //
  // The template painted it with the brand colour at full strength. On a
  // twenty-item sidebar that is a large saturated rectangle shouting next to the
  // content you are meant to be reading, and it forces white text, which breaks
  // the moment the brand colour changes. A 50-step tint of the same blue with the
  // label in primary.main and a heavier weight says "you are here" just as
  // clearly, stays legible, and needs no contrast exception.
  '&.active': {
    '&, &:hover': {
      backgroundColor: theme.palette.customColors.brand[50]
    },
    '&.Mui-focusVisible': {
      backgroundColor: theme.palette.customColors.brand[100]
    },
    // ** primary.dark, not primary.main. 14px at 600 is not WCAG "large text", so
    //    the label needs 4.5:1 and primary.main on brand.50 measures only 4.03:1.
    //    primary.dark on the same tint measures 5.03:1 and is visually the same blue.
    '& .MuiTypography-root': {
      fontWeight: 600,
      color: `${theme.palette.primary.dark} !important`
    },
    '& svg': {
      color: `${theme.palette.primary.dark} !important`
    }
  }
}))

const MenuItemTextMetaWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  transition: 'opacity .25s ease-in-out',
  ...(themeConfig.menuTextTruncate && { overflow: 'hidden' })
}))

const VerticalNavLink = ({
  item,
  parent,
  navHover,
  settings,
  navVisible,
  isSubToSub,
  collapsedNavWidth,
  toggleNavVisibility,
  navigationBorderWidth
}) => {
  // ** Hooks
  const router = useRouter()

  // ** Vars
  const { navCollapsed } = settings
  const icon = parent && !item.icon ? themeConfig.navSubItemIcon : item.icon

  const isNavLinkActive = () => {
    if (router.pathname === item.path || handleURLQueries(router, item.path)) {
      return true
    } else {
      return false
    }
  }

  return (
    <CanViewNavLink navLink={item}>
      <ListItem
        disablePadding
        className='nav-link'
        disabled={item.disabled || false}
        sx={{ mt: 1, px: '0 !important' }}
      >
        <MenuNavLink
          component={Link}
          {...(item.disabled && { tabIndex: -1 })}
          className={isNavLinkActive() ? 'active' : ''}
          href={item.path === undefined ? '/' : `${item.path}`}
          {...(item.openInNewTab ? { target: '_blank' } : null)}
          onClick={e => {
            if (item.path === undefined) {
              e.preventDefault()
              e.stopPropagation()
            }
            if (navVisible) {
              toggleNavVisibility()
            }
          }}
          sx={{
            py: 2,
            ...(item.disabled ? { pointerEvents: 'none' } : { cursor: 'pointer' }),
            px: navCollapsed && !navHover ? (collapsedNavWidth - navigationBorderWidth - 22 - 28) / 8 : 4,
            '& .MuiTypography-root': {
              fontWeight: 500,
              color: 'text.secondary',
              fontSize: theme => theme.typography.body1.fontSize
            },
            '& svg': {
              color: 'text.secondary'
            }
          }}
        >
          <ListItemIcon
            sx={{
              transition: 'margin .25s ease-in-out',
              ...(navCollapsed && !navHover ? { mr: 0 } : { mr: 2 }),
              ...(parent ? { ml: 1.5, mr: 3.5 } : {}),
              '& svg': {
                fontSize: '0.625rem',
                ...(!parent ? { fontSize: '1.375rem' } : {}),
                ...(parent && item.icon ? { fontSize: '1.25rem' } : {})
              }
            }}
          >
            <UserIcon icon={icon} />
          </ListItemIcon>

          <MenuItemTextMetaWrapper
            sx={{
              ...(isSubToSub ? { ml: 2 } : {}),
              ...(navCollapsed && !navHover ? { opacity: 0 } : { opacity: 1 })
            }}
          >
            <Typography
              {...((themeConfig.menuTextTruncate || (!themeConfig.menuTextTruncate && navCollapsed && !navHover)) && {
                noWrap: true
              })}
            >
              <Translations text={item.title} />
            </Typography>
            {item.badgeContent ? (
              <Chip
                size='small'
                label={item.badgeContent}
                color={item.badgeColor || 'primary'}
                sx={{ height: 22, minWidth: 22, '& .MuiChip-label': { px: 1.5, textTransform: 'capitalize' } }}
              />
            ) : null}
          </MenuItemTextMetaWrapper>
        </MenuNavLink>
      </ListItem>
    </CanViewNavLink>
  )
}

export default VerticalNavLink
