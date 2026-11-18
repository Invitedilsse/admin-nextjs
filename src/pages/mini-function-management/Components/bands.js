// The four bands the server derives from a start time, and the formatters
// that go with them.
//
// ! ONE COPY, BECAUSE TWO WOULD DISAGREE.
//   The list page and the detail drawer both have to turn a time_slot into
//   something readable. The bands moved once already (2pm-6pm became
//   3pm-6pm) and a second hard-coded map is the one that does not get
//   changed with them.
//
// Mirrors fn_mini_time_slot in IDS_backend/api/miniFunction/index.js.
export const BAND = {
  7: '7am - 10am',
  10: '10am - 3pm',
  15: '3pm - 6pm',
  18: '6pm - 7am'
}

export const bandLabel = slot => BAND[slot] || null

/** '11:00:00' -> '11:00'. Null when there is no time recorded. */
export const clock = startTime => {
  if (!startTime) return null

  return String(startTime).slice(0, 5)
}

/**
 * What one row's time should read as.
 *
 * An event saved before start_time existed has only a band, and saying
 * "10am - 3pm" there is honest where inventing "10:00" would not be.
 */
export const timeText = (startTime, slot) => clock(startTime) || bandLabel(slot) || '-'

/** 'd  hh:mm' for a date plus a time, falling back to the band. */
export const whenText = (date, startTime, slot) => {
  if (!date) return '-'

  return `${String(date).slice(0, 10)}  ${timeText(startTime, slot)}`
}
