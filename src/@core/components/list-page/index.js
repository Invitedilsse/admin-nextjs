/**
 * The list-page kit.
 * -------------------------------------------------------------------------------------
 * 83 of this portal's 221 page files render a material-react-table, 25 a DataGrid and
 * 38 a plain MUI table, and each of them invented its own header row, its own search
 * box placement, its own "nothing here" and its own spinner. The theme can make them
 * all the same COLOUR; only shared components can make them the same SHAPE.
 *
 * These three are deliberately small and unopinionated about data. Adopting them on a
 * page is a few lines, and a page that has not adopted them still looks right - it
 * just keeps its own arrangement.
 *
 *   <PageToolbar
 *     title='Family Documents'
 *     count={totalcount}
 *     search={<TextField ... />}
 *     filters={[{ label: 'Shared', onDelete: clearShared }]}
 *     actions={<Button startIcon={<Icon icon='tabler:download' />}>Export</Button>}
 *   />
 *
 *   {rows.length === 0 && !loading ? <EmptyState title='No documents yet' /> : <Table />}
 *   {loading ? <TableSkeleton columns={6} /> : null}
 */

// ** MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// ** Custom Components
import Icon from 'src/@core/components/icon'

/**
 * A page's own header strip: name on the left, a live count beside it, search and
 * actions on the right, and the applied filters on a second line so they are visible
 * rather than hidden behind a funnel button.
 */
export const PageToolbar = props => {
  const { title, subtitle, count, search, actions, filters = [], onClearFilters } = props
  const applied = filters.filter(Boolean)

  return (
    <Box>
      <Box
        sx={{
          px: 6,
          py: 4,
          gap: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Typography variant='h5' noWrap>
              {title}
            </Typography>
            {/* ** The count is a fact about the list, so it sits with the name and not
                  in a corner. Rendered only once it is a number: a '0' that is really
                  "not loaded yet" is worse than no number. */}
            {Number.isFinite(count) ? (
              <Chip
                size='small'
                variant='outlined'
                label={Number(count).toLocaleString('en-IN')}
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              />
            ) : null}
          </Stack>
          {subtitle ? (
            <Typography variant='body2' sx={{ mt: 0.5, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <Stack
          direction='row'
          spacing={3}
          alignItems='center'
          sx={{ flexWrap: 'wrap', gap: 3, '& > *': { minWidth: 0 } }}
        >
          {search}
          {actions}
        </Stack>
      </Box>

      {applied.length ? (
        <Box
          sx={{
            px: 6,
            pb: 4,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <Typography variant='overline' sx={{ color: 'text.disabled' }}>
            Filtered by
          </Typography>
          {applied.map(f => (
            <Chip
              key={f.label}
              size='small'
              label={f.label}
              onDelete={f.onDelete}
              deleteIcon={<Icon icon='tabler:x' fontSize='0.875rem' />}
            />
          ))}
          {onClearFilters && applied.length > 1 ? (
            <Chip size='small' variant='outlined' label='Clear all' onClick={onClearFilters} />
          ) : null}
        </Box>
      ) : null}

      <Divider sx={{ m: '0 !important' }} />
    </Box>
  )
}

/**
 * What a list shows when it has nothing to show.
 *
 * An empty table with headers and no rows is the most common unfinished-looking state
 * in an admin portal: it is indistinguishable from a failed request. This says which
 * of the two it is, and where to go next.
 */
export const EmptyState = props => {
  const { icon = 'tabler:inbox', title = 'Nothing here yet', description, action, error = false } = props

  return (
    <Box
      sx={{
        px: 6,
        py: 16,
        gap: 3,
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          display: 'flex',
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
          color: error ? 'error.main' : 'text.disabled',
          backgroundColor: error ? 'customColors.surfaceSunken' : 'customColors.surfaceSunken'
        }}
      >
        <Icon icon={error ? 'tabler:alert-circle' : icon} fontSize='1.75rem' />
      </Box>
      <Box>
        <Typography variant='h6'>{title}</Typography>
        {description ? (
          <Typography variant='body2' sx={{ mt: 1, maxWidth: 420, color: 'text.secondary' }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  )
}

/**
 * Rows of the right shape while the request is in flight.
 *
 * A centred spinner collapses the page height and then pushes everything down when
 * the data lands. Skeleton rows hold the layout still, which is the difference
 * between a page that settles and a page that jumps.
 */
export const TableSkeleton = props => {
  const { rows = 8, columns = 5, header = true } = props

  return (
    <Box sx={{ width: '100%' }} role='status' aria-busy='true' aria-label='Loading'>
      {header ? (
        <Box
          sx={{
            px: 6,
            gap: 6,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'customColors.surfaceSunken',
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant='text' width={`${Math.round(100 / columns)}%`} height={10} />
          ))}
        </Box>
      ) : null}
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            px: 6,
            gap: 6,
            display: 'flex',
            alignItems: 'center',
            minHeight: 49,
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              variant='text'
              height={14}
              // ** Varying widths, so it reads as text rather than as a loading bar.
              width={`${Math.round((100 / columns) * (c === 0 ? 0.9 : 0.55 + ((r + c) % 3) * 0.12))}%`}
            />
          ))}
        </Box>
      ))}
    </Box>
  )
}

export default PageToolbar
