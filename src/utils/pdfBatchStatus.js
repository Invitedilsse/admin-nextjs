/**
 * How a batch's state is shown, in one place.
 *
 * Kept out of the page files so the detail screen does not have to import from
 * the list screen — a page importing another page drags that page's whole
 * component into the bundle for the sake of two objects.
 */

export const STATUS_COLOUR = {
  queued: 'default',
  processing: 'info',
  completed: 'success',
  completed_with_errors: 'warning',
  failed: 'error',
}

export const STATUS_LABEL = {
  queued: 'Queued',
  processing: 'Generating',
  completed: 'Done',
  completed_with_errors: 'Done, with failures',
  failed: 'Failed',
}
