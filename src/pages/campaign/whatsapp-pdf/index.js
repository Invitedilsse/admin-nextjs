/**
 * Personalised WhatsApp invites, start to finish.
 *
 * One screen, four steps, in the order you actually do them:
 *
 *   1  Template     upload the invitation, put boxes on it
 *   2  Extraction   upload the guest list, generate everybody's PDF
 *   3  Send         upload the sheet that came out of step 2 and send it
 *   4  Sent         what happened to each message
 *
 * They were three separate menu items before, which made a sequence look like
 * three unrelated tools — and left nowhere to put step 4. A stepper says what
 * the order is without anyone having to be told.
 *
 * ── Why the steps are not locked ─────────────────────────────────────────
 *
 * Any tab can be opened at any time. A real week is not one pass through four
 * steps: a template is adjusted after a batch has run, a second guest list
 * arrives on Thursday, and somebody asks on Friday whether Ramesh got his
 * invitation. Forcing the sequence would serve the diagram, not the work.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box, Card, CardContent, Step, StepButton, Stepper, Typography, useMediaQuery,
  Tab, Tabs,
} from '@mui/material'

import TemplatesPanel from './components/TemplatesPanel'
import BatchesPanel from './components/BatchesPanel'
import SendPanel from './components/SendPanel'
import SentCampaigns from './components/SentCampaigns'

const STEPS = [
  {
    label: 'PDF Template',
    caption: 'Upload the invitation and place the fields',
    Panel: TemplatesPanel,
  },
  {
    label: 'PDF Extraction',
    caption: 'Upload the guest list, generate everybody’s file',
    Panel: BatchesPanel,
  },
  {
    label: 'Send Campaign',
    caption: 'Upload that sheet and send it on WhatsApp',
    Panel: SendPanel,
  },
  {
    label: 'Sent & Status',
    caption: 'Who received it, who read it, who did not',
    Panel: SentCampaigns,
  },
]

const WhatsappPdfHub = () => {
  const router = useRouter()
  const narrow = useMediaQuery(theme => theme.breakpoints.down('md'))
  const [step, setStep] = useState(0)

  // ?tab= keeps a bookmark and a browser Back button honest, and is how the two
  // detail screens come back to the step they were opened from.
  useEffect(() => {
    if (!router.isReady) return
    const asked = Number(router.query.tab)
    if (Number.isInteger(asked) && asked >= 0 && asked < STEPS.length) setStep(asked)
  }, [router.isReady, router.query.tab])

  const go = (next) => {
    setStep(next)
    // replace, not push: stepping between tabs should not fill the Back button
    // with four entries of the same screen.
    router.replace(
      { pathname: '/campaign/whatsapp-pdf', query: { tab: next } },
      undefined,
      { shallow: true }
    )
  }

  const { Panel, caption } = STEPS[step]

  return (
    <Box>
      <Typography variant='h6' fontWeight={700}>WhatsApp invites</Typography>
      <Typography variant='caption' color='text.secondary'>
        A personalised PDF for every guest, sent on WhatsApp, and what became of each message.
      </Typography>

      <Card variant='outlined' sx={{ mt: 3, mb: 3 }}>
        <CardContent sx={{ py: narrow ? 0 : 2.5, px: narrow ? 0 : 3 }}>
          {narrow ? (
            // A horizontal stepper does not survive a phone; tabs do.
            <Tabs value={step} onChange={(e, v) => go(v)} variant='scrollable' scrollButtons='auto'>
              {STEPS.map((s, i) => <Tab key={s.label} label={`${i + 1}. ${s.label}`} />)}
            </Tabs>
          ) : (
            <Stepper nonLinear activeStep={step} alternativeLabel>
              {STEPS.map((s, i) => (
                <Step key={s.label} completed={false}>
                  <StepButton onClick={() => go(i)}>
                    <Typography variant='body2' fontWeight={i === step ? 700 : 500}>
                      {s.label}
                    </Typography>
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          )}
        </CardContent>
      </Card>

      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Step {step + 1} of {STEPS.length} — {caption}
      </Typography>

      <Panel />
    </Box>
  )
}

export default WhatsappPdfHub
