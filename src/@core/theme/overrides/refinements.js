/**
 * Component refinements for the Invite Dilsse admin portal.
 * -------------------------------------------------------------------------------------
 * WHY THIS FILE EXISTS, AND WHY IT IS LAST
 *
 * Everything else in this folder is the stock template's component styling. Rather
 * than rewrite twenty template files - each of which carries variants the app
 * actually uses (the `tonal` button, the `light` chip skins) and would be easy to
 * break - this one file states only the DELTAS, and overrides/index.js deep-merges
 * it over the rest. That means:
 *
 *   - every visual decision for the portal is in one place you can read top to
 *     bottom, instead of spread across twenty files;
 *   - reverting the whole redesign is deleting two lines in overrides/index.js;
 *   - a template update does not silently undo the design.
 *
 * It is a deep merge, not Object.assign, so a key stated here replaces only that
 * key. Anything not mentioned keeps its template value.
 *
 * THE RULES THIS FILE FOLLOWS
 *
 *   1. Depth comes from a hairline border first and a shadow second. Never both
 *      loudly: a card gets a 1px border and shadows[7], which is almost nothing.
 *   2. One focus treatment everywhere: a 3px ring in palette.customColors.focusRing.
 *      Keyboard users get the same affordance on a button, an input and a table row.
 *   3. Data is text.primary. Headers, labels and units are text.secondary. The
 *      template put table bodies in text.secondary, which greyed out the only thing
 *      on the page anyone came to read.
 *   4. Controls sit on a 4px grid of heights: 32 / 38 / 44. Mixed control heights in
 *      one toolbar is the most common reason a page looks thrown together.
 *   5. No colour is written as a hex here. It comes from the palette, so there is
 *      exactly one place to change the brand.
 */

const Refinements = settings => {
  const { skin } = settings

  // ** Heights, so a button, an input and a select in one row line up exactly.
  const CONTROL_HEIGHT = { small: 32, medium: 38, large: 44 }

  // ** Card and dialog corners are a step rounder than controls. A 12px card
  //    around 8px controls reads as "panel containing things"; all-8 reads flat.
  const RADIUS = { control: 8, card: 12, dialog: 16, pill: 999, tight: 6 }

  return {
    // ---------------------------------------------------------------- foundation
    MuiCssBaseline: {
      styleOverrides: theme => ({
        '*, *::before, *::after': { boxSizing: 'border-box' },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // ** Stops the layout jumping sideways when a dialog opens.
          scrollbarGutter: 'stable'
        },
        body: {
          backgroundColor: theme.palette.background.default,
          // ** Inter's contextual alternates: a proper single-storey 'a' in UI
          //    sizes and a straight-sided '1'. Costs nothing, reads better.
          fontFeatureSettings: '"cv05", "cv11"'
        },
        '::selection': {
          backgroundColor: theme.palette.customColors.brand[100],
          color: theme.palette.customColors.brand[900]
        },
        // ** One scrollbar for the whole portal instead of the OS default.
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
          backgroundColor: theme.palette.customColors.neutral[300]
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.palette.customColors.neutral[400]
        },
        // ** Keyboard focus. :focus-visible, so a mouse click never shows a ring.
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, [tabindex]:focus-visible':
          {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme.palette.customColors.focusRing}`
          }
      })
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: RADIUS.card }
      }
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.palette.divider })
      }
    },

    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({
          // ** The template used a 70% wash, which turns the page black. A dialog
          //    that still shows its context is easier to trust.
          backgroundColor: `rgba(${theme.palette.customColors.mainRgb}, 0.45)`,
          backdropFilter: 'blur(2px)'
        }),
        invisible: { backgroundColor: 'transparent', backdropFilter: 'none' }
      }
    },

    // --------------------------------------------------------------------- cards
    MuiCard: {
      defaultProps: { elevation: 7 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.card,
          border: `1px solid ${theme.palette.customColors.border}`,
          // ** Carried over from the template's own card override, which this
          //    function replaces wholesale. A table or a grid that reaches the
          //    card's edge must not round its corners inside the card's own.
          '& .MuiTableContainer-root, & .MuiDataGrid-root, & .MuiDataGrid-columnHeaders': {
            borderRadius: 0
          },
          ...(skin === 'bordered' && { boxShadow: 'none' })
        })
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: ({ theme }) => ({ padding: theme.spacing(5, 6) }),
        title: ({ theme }) => ({
          fontWeight: 600,
          letterSpacing: '-0.006em',
          fontSize: theme.typography.h6.fontSize,
          lineHeight: theme.typography.h6.lineHeight
        }),
        subheader: ({ theme }) => ({
          marginTop: theme.spacing(1),
          color: theme.palette.text.secondary,
          fontSize: theme.typography.body2.fontSize
        })
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: theme.spacing(5, 6),
          '&:last-of-type': { paddingBottom: theme.spacing(5) }
        })
      }
    },
    MuiCardActions: {
      styleOverrides: {
        root: ({ theme }) => ({ padding: theme.spacing(4, 6) })
      }
    },

    // ------------------------------------------------------------------- buttons
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: RADIUS.control,
          fontWeight: 600,
          letterSpacing: 0,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'none',
          minHeight: CONTROL_HEIGHT[ownerState.size || 'medium'],
          '&:hover, &:active, &.Mui-focusVisible': { boxShadow: 'none' },
          '&.Mui-focusVisible': {
            boxShadow: `0 0 0 3px ${theme.palette.customColors.focusRing}`
          },
          // ** The template scaled the button down 2% on press. It reads as a
          //    wobble on a dense screen; a colour change is enough feedback.
          '&:not(.Mui-disabled):active': { transform: 'none' }
        }),
        contained: ({ theme }) => ({
          boxShadow: 'none',
          padding: theme.spacing(2, 5),
          '&:hover': { boxShadow: 'none' }
        }),
        outlined: ({ theme, ownerState }) => ({
          padding: theme.spacing(1.75, 4.75),
          borderWidth: 1,
          ...((!ownerState.color || ownerState.color === 'inherit' || ownerState.color === 'secondary') && {
            color: theme.palette.text.primary,
            borderColor: theme.palette.customColors.borderStrong,
            '&:hover': {
              borderColor: theme.palette.customColors.neutral[400],
              backgroundColor: theme.palette.action.hover
            }
          })
        }),
        text: ({ theme }) => ({ padding: theme.spacing(2, 3) }),
        sizeSmall: ({ theme }) => ({
          fontSize: '0.8125rem',
          borderRadius: RADIUS.tight,
          padding: theme.spacing(1.25, 3.5)
        }),
        sizeLarge: ({ theme }) => ({
          fontSize: '0.9375rem',
          padding: theme.spacing(2.75, 6)
        })
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.control,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.action.hover
          }
        }),
        sizeSmall: { padding: 6 }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.control,
          borderColor: theme.palette.customColors.border,
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.customColors.brand[50],
            '&:hover': { backgroundColor: theme.palette.customColors.brand[100] }
          }
        })
      }
    },
    MuiFab: {
      styleOverrides: {
        root: ({ theme }) => ({ boxShadow: theme.shadows[8] })
      }
    },

    // -------------------------------------------------------------------- inputs
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: RADIUS.control,
          backgroundColor: theme.palette.background.paper,
          '&:not(.MuiInputBase-sizeSmall)': { borderRadius: RADIUS.control },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.customColors.border,
            transition: 'border-color .15s ease-in-out'
          },
          '&:hover:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.customColors.borderStrong
          },
          '&.Mui-focused': {
            // ** A ring, not a thicker border: the field does not change size on
            //    focus, so nothing around it moves.
            boxShadow: `0 0 0 3px ${theme.palette.customColors.focusRing}`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
              borderColor: theme.palette.primary.main
            }
          },
          '&.Mui-error.Mui-focused': {
            boxShadow: `0 0 0 3px ${theme.palette.error.light}33`
          },
          '&.Mui-disabled': {
            backgroundColor: theme.palette.customColors.surfaceSunken,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.customColors.border
            }
          },
          ...(ownerState.multiline !== true && {
            '& .MuiOutlinedInput-input': { height: 'auto' }
          })
        }),
        input: ({ theme }) => ({
          fontSize: theme.typography.body1.fontSize,
          padding: '9px 14px',
          '&::placeholder': { color: theme.palette.text.disabled, opacity: 1 }
        }),
        inputSizeSmall: { padding: '6px 12px' }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: theme.typography.body1.fontSize,
          color: theme.palette.text.secondary,
          '&.Mui-focused': { color: theme.palette.primary.main }
        })
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginLeft: 2,
          marginTop: theme.spacing(1),
          fontSize: theme.typography.caption.fontSize
        })
      }
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: ({ theme }) => ({
          fontSize: theme.typography.body1.fontSize,
          color: theme.palette.text.primary
        })
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: RADIUS.card,
          boxShadow: theme.shadows[9],
          border: `1px solid ${theme.palette.customColors.border}`
        }),
        option: ({ theme }) => ({
          borderRadius: RADIUS.tight,
          margin: theme.spacing(0, 1),
          fontSize: theme.typography.body1.fontSize,
          '&[aria-selected="true"]': {
            color: theme.palette.primary.main,
            backgroundColor: `${theme.palette.customColors.brand[50]} !important`
          }
        }),
        inputRoot: { paddingTop: 4, paddingBottom: 4 }
      }
    },

    // --------------------------------------------------------- menus and popovers
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: RADIUS.card,
          boxShadow: theme.shadows[9],
          border: `1px solid ${theme.palette.customColors.border}`
        }),
        list: ({ theme }) => ({ padding: theme.spacing(1.5) })
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 36,
          borderRadius: RADIUS.tight,
          padding: theme.spacing(1.5, 3),
          fontSize: theme.typography.body1.fontSize,
          color: theme.palette.text.primary,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.customColors.brand[50],
            '&:hover': { backgroundColor: theme.palette.customColors.brand[100] }
          }
        })
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: RADIUS.card,
          boxShadow: theme.shadows[9],
          border: `1px solid ${theme.palette.customColors.border}`
        })
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: RADIUS.control }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: ({ theme }) => ({ color: theme.palette.text.secondary })
      }
    },

    // -------------------------------------------------------------------- tables
    MuiTableContainer: {
      styleOverrides: {
        root: { boxShadow: 'none', backgroundImage: 'none' }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.customColors.surfaceSunken,
          '& .MuiTableCell-head': {
            // ** 11px / 600 / uppercase / tracked. A column header is a label,
            //    not data, and should not compete with the row it describes.
            height: 44,
            fontWeight: 600,
            fontSize: '0.6875rem',
            lineHeight: 1.46,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: theme.palette.text.secondary,
            borderBottom: `1px solid ${theme.palette.divider}`
          }
        })
      }
    },
    MuiTableBody: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiTableCell-body': {
            letterSpacing: 0,
            // ** The data itself, in the strongest text colour on the page.
            color: theme.palette.text.primary,
            fontSize: theme.typography.body1.fontSize,
            '&:not(.MuiTableCell-sizeSmall):not(.MuiTableCell-paddingCheckbox):not(.MuiTableCell-paddingNone)': {
              paddingTop: theme.spacing(3),
              paddingBottom: theme.spacing(3)
            }
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.customColors.surfaceSunken
          },
          '& .MuiTableRow-root:last-of-type .MuiTableCell-body': { borderBottom: 0 }
        })
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`
        })
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`,
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.text.secondary
          }
        })
      }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          color: theme.palette.text.primary,
          '--DataGrid-rowBorderColor': theme.palette.divider,
          fontSize: theme.typography.body1.fontSize,
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: theme.palette.customColors.surfaceSunken
          },
          '& .MuiDataGrid-overlay': { backgroundColor: 'transparent' }
        }),
        columnHeaders: ({ theme }) => ({
          borderRadius: 0,
          backgroundColor: theme.palette.customColors.surfaceSunken,
          borderBottom: `1px solid ${theme.palette.divider}`
        }),
        columnHeader: ({ theme }) => ({
          backgroundColor: theme.palette.customColors.surfaceSunken,
          '&:focus, &:focus-within': { outline: 'none' }
        }),
        columnHeaderTitle: ({ theme }) => ({
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: theme.palette.text.secondary
        }),
        footerContainer: ({ theme }) => ({
          borderTop: `1px solid ${theme.palette.divider}`
        })
      }
    },

    // ---------------------------------------------------------------------- tabs
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 44,
          '&:not(.MuiTabs-vertical)': {
            borderBottom: `1px solid ${theme.palette.divider}`
          }
        }),
        indicator: ({ theme }) => ({
          height: 2,
          borderRadius: '2px 2px 0 0',
          backgroundColor: theme.palette.primary.main
        })
      }
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 44,
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: 0,
          fontSize: theme.typography.body1.fontSize,
          color: theme.palette.text.secondary,
          padding: theme.spacing(2.5, 4),
          '&:hover': { color: theme.palette.text.primary },
          '&.Mui-selected': { fontWeight: 600, color: theme.palette.primary.main }
        })
      }
    },

    // --------------------------------------------------------------------- chips
    MuiChip: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          fontWeight: 600,
          letterSpacing: 0,
          borderRadius: RADIUS.tight,
          fontSize: theme.typography.caption.fontSize,
          ...(ownerState.size === 'medium' && { height: 28 }),
          ...(ownerState.size === 'small' && { height: 24 }),
          '&.MuiChip-rounded': { borderRadius: RADIUS.tight }
        }),
        label: ({ theme }) => ({
          paddingLeft: theme.spacing(2.5),
          paddingRight: theme.spacing(2.5)
        }),
        outlined: ({ theme }) => ({
          '&.MuiChip-colorDefault': {
            color: theme.palette.text.secondary,
            borderColor: theme.palette.customColors.border
          }
        })
      }
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 600, fontSize: '0.6875rem' }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          fontSize: theme.typography.body2.fontSize
        }),
        rounded: { borderRadius: RADIUS.control }
      }
    },

    // ------------------------------------------------------------------- overlays
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: RADIUS.dialog,
          boxShadow: theme.shadows[20],
          backgroundImage: 'none',
          ...(skin === 'bordered' && {
            border: `1px solid ${theme.palette.customColors.border}`
          })
        })
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          letterSpacing: '-0.011em',
          fontSize: theme.typography.h5.fontSize,
          padding: theme.spacing(5, 6, 2)
        })
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({ padding: theme.spacing(2, 6) })
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: ({ theme }) => ({ padding: theme.spacing(4, 6, 5), gap: theme.spacing(2) })
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          fontWeight: 500,
          borderRadius: RADIUS.tight,
          padding: theme.spacing(1.5, 2.5),
          fontSize: theme.typography.caption.fontSize,
          backgroundColor: theme.palette.customColors.neutral[800]
        }),
        arrow: ({ theme }) => ({ color: theme.palette.customColors.neutral[800] })
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.control,
          fontSize: theme.typography.body1.fontSize,
          padding: theme.spacing(2.5, 4)
        }),
        standard: { fontWeight: 500 }
      }
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.control,
          boxShadow: theme.shadows[12]
        })
      }
    },

    // ------------------------------------------------------------- odds and ends
    MuiPaginationItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 500,
          minWidth: 32,
          height: 32,
          borderRadius: RADIUS.tight,
          fontSize: theme.typography.body2.fontSize
        }),
        outlined: ({ theme }) => ({ borderColor: theme.palette.customColors.border })
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.palette.customColors.trackBg
        }),
        bar: { borderRadius: 999 }
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: RADIUS.tight,
          backgroundColor: theme.palette.customColors.neutral[200]
        })
      }
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: theme.typography.body2.fontSize,
          color: theme.palette.text.secondary
        }),
        separator: ({ theme }) => ({
          marginLeft: theme.spacing(1.5),
          marginRight: theme.spacing(1.5),
          color: theme.palette.text.disabled
        })
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.customColors.border}`,
          '&:before': { display: 'none' },
          '&.Mui-expanded': { boxShadow: theme.shadows[7] }
        })
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' }
      }
    }
  }
}

export default Refinements
