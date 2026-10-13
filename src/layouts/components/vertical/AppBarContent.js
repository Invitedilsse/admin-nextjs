// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Navigation, so the header and the sidebar cannot disagree about a page's name
import navigation from 'src/navigation/vertical'

// ** The title rule itself lives on its own, as a pure function, so it can be tested
//    without dragging the user menu and the redux store into a test run.
import { describePage } from 'src/@core/layouts/utils/page-title'

// ** Components
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'

/**
 * The header's contents.
 * -------------------------------------------------------------------------------------
 * The template put a dark-mode toggle on the left and nothing else, so every screen
 * in the portal opened with an unlabelled white bar. A header that does not say where
 * you are is wasted furniture, and on a portal with twenty destinations it is the
 * difference between "an admin tool" and "a product".
 *
 * The name is read out of src/navigation/vertical, which is already the single list
 * of what this portal contains - so a page renamed in the sidebar is renamed here
 * too, and no page component has to be edited to get a title.
 *
 * The dark-mode toggle is gone: the portal ships light only (see themeConfig.mode
 * and the note in settingsContext.js).
 */

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, toggleNavVisibility } = props

  // ** Hooks
  const router = useRouter()

  // ** Defensive on purpose: useRouter() is undefined outside a Next tree (tests,
  //    a storybook, SSR of an error page), and reading .pathname off it would take
  //    the whole header down with it.
  const { title, parent } = describePage((router && router.pathname) || '/', navigation())

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box className='actions-left' sx={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: 2 }}>
        {hidden ? (
          <IconButton color='inherit' sx={{ ml: -2 }} onClick={toggleNavVisibility}>
            <Icon fontSize='1.375rem' icon='tabler:menu-2' />
          </IconButton>
        ) : null}

        <Box sx={{ minWidth: 0 }}>
          {parent ? (
            <Typography
              noWrap
              variant='caption'
              sx={{ display: 'block', color: 'text.disabled', lineHeight: 1.2 }}
            >
              {parent}
            </Typography>
          ) : null}
          <Typography noWrap variant='h5' sx={{ lineHeight: 1.3 }}>
            {title}
          </Typography>
        </Box>
      </Box>

      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
