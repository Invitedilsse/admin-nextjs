/**
 * One look for every material-react-table in the portal.
 * -------------------------------------------------------------------------------------
 * 83 page files in src/pages render a material-react-table. MRT builds its own table
 * chrome rather than reading theme.components, so the theme gives those tables the
 * right colours and type but not the right header band, row height, hover or
 * pagination style - each page had been setting (or not setting) those itself.
 *
 * MRT has no global provider, so this is the next best thing: one props object a page
 * spreads in. Adopting it is one line, and the page's own options still win because
 * they are spread after.
 *
 *   import { tableDefaults } from 'src/@core/components/mui/react-table-defaults'
 *
 *   const table = useMaterialReactTable({
 *     ...tableDefaults,
 *     columns,
 *     data: rows,
 *     rowCount: totalcount,
 *     state: { pagination, isLoading },
 *     // ...anything this page needs differently
 *   })
 *
 * ! Everything here is expressed as sx paths into the theme ('text.secondary',
 *   'customColors.surfaceSunken'), never as a hex, so these tables follow the brand
 *   from palette/index.js like the rest of the portal.
 */

export const tableDefaults = {
  // ** The table sits inside the page's own Card, so its paper must not add a second
  //    border, radius and shadow on top of that one.
  muiTablePaperProps: {
    elevation: 0,
    sx: { border: 0, boxShadow: 'none', backgroundImage: 'none', borderRadius: 0 }
  },

  muiTableContainerProps: { sx: { borderRadius: 0 } },

  // ** 11px / 600 / uppercase on the sunken surface: the same column-header treatment
  //    the plain MUI tables get from overrides/refinements.js.
  muiTableHeadCellProps: {
    sx: {
      height: 44,
      fontWeight: 600,
      fontSize: '0.6875rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'text.secondary',
      backgroundColor: 'customColors.surfaceSunken',
      borderBottom: theme => `1px solid ${theme.palette.divider}`,
      '& .Mui-TableHeadCell-Content': { justifyContent: 'space-between' }
    }
  },

  // ** The data, in the strongest text colour and with figures that do not jitter.
  muiTableBodyCellProps: {
    sx: {
      py: 3,
      fontSize: '0.875rem',
      color: 'text.primary',
      fontVariantNumeric: 'tabular-nums',
      borderBottom: theme => `1px solid ${theme.palette.divider}`
    }
  },

  muiTableBodyRowProps: {
    hover: true,
    sx: {
      '&:hover > td': { backgroundColor: 'customColors.surfaceSunken' },
      '&:last-of-type > td': { borderBottom: 0 }
    }
  },

  muiTopToolbarProps: { sx: { boxShadow: 'none', backgroundColor: 'transparent' } },

  muiBottomToolbarProps: {
    sx: {
      boxShadow: 'none',
      minHeight: 56,
      backgroundColor: 'transparent',
      borderTop: theme => `1px solid ${theme.palette.divider}`
    }
  },

  muiPaginationProps: {
    shape: 'rounded',
    color: 'primary',
    variant: 'outlined',
    showFirstButton: true,
    showLastButton: true,
    rowsPerPageOptions: [10, 25, 50, 100]
  },

  // ** Numbered pages rather than "1-10 of 240" with arrows: on a list somebody
  //    scans every day, jumping to a page matters more than saving the space.
  paginationDisplayMode: 'pages',

  muiLinearProgressProps: { sx: { height: 2 } },

  // ** Controls this portal has never used on any screen. Off by default so a page
  //    does not have to remember to switch each one off, and no table grows a
  //    density menu nobody asked for.
  enableColumnActions: false,
  enableColumnDragging: false,
  enableColumnOrdering: false,
  enableDensityToggle: false,
  enableFullScreenToggle: false,
  enableColumnFilter: false,
  layoutMode: 'grid-no-grow'
}

export default tableDefaults
