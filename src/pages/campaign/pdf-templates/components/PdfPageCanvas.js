/**
 * One page of the template, drawn into a canvas.
 *
 * ── Why pdf.js comes from a URL rather than node_modules ──────────────────
 *
 * pdfjs-dist ships a separate worker file, and wiring that through Next's
 * webpack config is version-sensitive and easy to get subtly wrong — the kind
 * of thing that builds fine and then fails only in production. Loading the
 * prebuilt UMD bundle sidesteps all of it: no dependency, no build config, and
 * the version is pinned below rather than floating with a lockfile.
 *
 * TO SELF-HOST (recommended once this settles, so the screen works without
 * reaching the internet): download pdf.min.js and pdf.worker.min.js of the
 * version below, drop them in admin-nextjs/public/pdfjs/, and set
 *   NEXT_PUBLIC_PDFJS_BASE=/pdfjs
 * Nothing else changes.
 *
 * ── Why the file comes through the API ────────────────────────────────────
 *
 * The template could be fetched straight from its signed S3 link, but a browser
 * fetch to S3 needs a CORS policy on the bucket. The API allows every origin
 * already, so /template/:id/file streams it and no bucket policy has to change.
 */

import { useEffect, useRef, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

const PDFJS_VERSION = '3.11.174'
const PDFJS_BASE =
  process.env.NEXT_PUBLIC_PDFJS_BASE ||
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`

let pdfjsPromise = null

/** Loads the library once per page load, however many canvases ask for it. */
const loadPdfjs = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('not in a browser'))
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
  if (pdfjsPromise) return pdfjsPromise

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${PDFJS_BASE}/pdf.min.js`
    script.async = true
    script.onload = () => {
      if (!window.pdfjsLib) return reject(new Error('pdf.js loaded but did not register'))
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`
      resolve(window.pdfjsLib)
    }
    script.onerror = () => reject(new Error('Could not load the PDF viewer'))
    document.head.appendChild(script)
  })

  return pdfjsPromise
}

/**
 * @param {string} fileUrl    /api/pdf-campaign/template/:id/file
 * @param {string} token      bearer token, sent as a header rather than a query
 *                            parameter so it never lands in a server log
 * @param {number} pageIndex  zero-based
 * @param {number} width      CSS pixels to draw at
 * @param {function} onRendered  ({ widthPx, heightPx, pageWidthPt, pageHeightPt })
 */
const PdfPageCanvas = ({ fileUrl, token, pageIndex = 0, width = 800, onRendered, onError }) => {
  const canvasRef = useRef(null)
  const docRef = useRef(null)
  const taskRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setFailure(null)

      try {
        const pdfjsLib = await loadPdfjs()

        if (!docRef.current || docRef.current.__url !== fileUrl) {
          const task = pdfjsLib.getDocument({
            url: fileUrl,
            httpHeaders: token ? { authorization: token } : undefined,
          })
          const doc = await task.promise
          if (cancelled) return
          doc.__url = fileUrl
          docRef.current = doc
        }

        const page = await docRef.current.getPage(pageIndex + 1)
        if (cancelled) return

        // getViewport at scale 1 is the page's own size in points, which is
        // exactly what the editor needs to convert pixels back to points.
        const unscaled = page.getViewport({ scale: 1 })
        const scale = width / unscaled.width
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        if (!canvas) return

        // Drawn at device resolution and scaled down by CSS, so the preview is
        // sharp on a retina screen — a blurry template is hard to place text on.
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        // Cancel an in-flight render before starting another, or pdf.js throws
        // when the width changes twice quickly (dragging a browser edge).
        if (taskRef.current) {
          try { taskRef.current.cancel() } catch (e) { /* already finished */ }
        }
        taskRef.current = page.render({ canvasContext: ctx, viewport })
        await taskRef.current.promise

        if (cancelled) return

        onRendered?.({
          widthPx: viewport.width,
          heightPx: viewport.height,
          pageWidthPt: unscaled.width,
          pageHeightPt: unscaled.height,
        })
      } catch (err) {
        if (cancelled || err?.name === 'RenderingCancelledException') return
        setFailure(err?.message || 'Could not draw this page')
        onError?.(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, token, pageIndex, width])

  return (
    <Box sx={{ position: 'relative', lineHeight: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 1px 12px rgba(0,0,0,.18)' }} />

      {loading && (
        <Box
          sx={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,.6)',
          }}
        >
          <CircularProgress size={28} />
        </Box>
      )}

      {failure && (
        <Box sx={{ p: 3 }}>
          <Typography color='error' variant='body2'>{failure}</Typography>
          <Typography variant='caption' color='text.secondary'>
            The preview needs pdf.js. If this machine has no internet access, see the
            self-hosting note at the top of PdfPageCanvas.js.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default PdfPageCanvas
