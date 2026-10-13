/**
 * One draggable, resizable box on the page.
 *
 * All the arithmetic lives in src/utils/pdfFieldGeometry.js, which is tested;
 * this component only turns mouse events into the pixel deltas that module
 * expects, and paints the result.
 *
 * Pointer events rather than mouse events, so a trackpad, a pen and a touch
 * screen all behave the same, and setPointerCapture means dragging past the
 * edge of the box does not drop the drag.
 */

import { useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { applyDrag, applyResize, toScreen } from 'src/utils/pdfFieldGeometry'

const HANDLES = [
  { id: 'nw', cursor: 'nwse-resize', style: { left: -4, top: -4 } },
  { id: 'n', cursor: 'ns-resize', style: { left: 'calc(50% - 4px)', top: -4 } },
  { id: 'ne', cursor: 'nesw-resize', style: { right: -4, top: -4 } },
  { id: 'e', cursor: 'ew-resize', style: { right: -4, top: 'calc(50% - 4px)' } },
  { id: 'se', cursor: 'nwse-resize', style: { right: -4, bottom: -4 } },
  { id: 's', cursor: 'ns-resize', style: { left: 'calc(50% - 4px)', bottom: -4 } },
  { id: 'sw', cursor: 'nesw-resize', style: { left: -4, bottom: -4 } },
  { id: 'w', cursor: 'ew-resize', style: { left: -4, top: 'calc(50% - 4px)' } },
]

const FieldBox = ({ field, scale, page, selected, onSelect, onChange }) => {
  const rect = toScreen(field, scale)

  // The field as it was when the drag started. Every move is measured from
  // there rather than from the previous frame, so rounding cannot accumulate
  // into drift over a long drag.
  const origin = useRef(null)

  const begin = (event, handle) => {
    event.stopPropagation()
    event.preventDefault()
    onSelect?.()

    origin.current = { field: { ...field }, x: event.clientX, y: event.clientY, handle }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const move = (event) => {
    if (!origin.current) return

    const delta = {
      dxPx: event.clientX - origin.current.x,
      dyPx: event.clientY - origin.current.y,
    }

    const next = origin.current.handle
      ? applyResize(origin.current.field, origin.current.handle, delta, scale, page)
      : applyDrag(origin.current.field, delta, scale, page)

    onChange?.({ ...field, ...next })
  }

  const end = (event) => {
    origin.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <Box
      onPointerDown={(e) => begin(e, null)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      sx={{
        position: 'absolute',
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        border: selected ? '2px solid #B8860B' : '1px dashed rgba(31,27,22,.55)',
        bgcolor: selected ? 'rgba(232,185,35,.16)' : 'rgba(232,185,35,.07)',
        cursor: 'move',
        touchAction: 'none',
        boxSizing: 'border-box',
        userSelect: 'none',
        '&:hover': { borderColor: '#B8860B' },
      }}
    >
      <Typography
        variant='caption'
        sx={{
          position: 'absolute', top: -19, left: -1,
          px: 0.6, borderRadius: '3px 3px 0 0',
          bgcolor: selected ? '#B8860B' : 'rgba(31,27,22,.7)',
          color: '#fff', fontSize: 10, fontWeight: 700,
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}
      >
        {field.label || field.key}
      </Typography>

      {selected && HANDLES.map((h) => (
        <Box
          key={h.id}
          onPointerDown={(e) => begin(e, h.id)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          sx={{
            position: 'absolute', width: 9, height: 9,
            bgcolor: '#fff', border: '2px solid #B8860B', borderRadius: '2px',
            cursor: h.cursor, touchAction: 'none', ...h.style,
          }}
        />
      ))}
    </Box>
  )
}

export default FieldBox
