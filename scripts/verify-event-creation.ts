import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface CheckResult {
  name: string
  passed: boolean
  details?: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details })
  const symbol = condition ? 'PASS' : 'FAIL'
  console.log(`[${symbol}] ${name}${details ? ` (${details})` : ''}`)
}

async function runVerification() {
  console.log('\nStarting Week 2 Day 3: Event Creation Flow Verification\n')

  const files = [
    'src/services/events.service.ts',
    'src/components/events/ParticipationModelSelector.tsx',
    'src/components/events/index.ts',
    'src/app/create/page.tsx'
  ]

  for (const file of files) {
    const fullPath = resolve(process.cwd(), file)
    check(`Target file exists: ${file}`, existsSync(fullPath))
  }

  const eventsServiceContent = readFileSync(
    resolve(process.cwd(), 'src/services/events.service.ts'),
    'utf8'
  )
  check('events.service exports CreateEventInput interface', eventsServiceContent.includes('export interface CreateEventInput'))
  check('events.service exports createEvent function', eventsServiceContent.includes('export async function createEvent'))
  check('createEvent supports participation_model', eventsServiceContent.includes('participation_model: input.participation_model'))
  check('createEvent supports allow_participant_campaigns', eventsServiceContent.includes('allow_participant_campaigns: input.allow_participant_campaigns'))
  check('createEvent backfills owner into event_organizers', eventsServiceContent.includes('event_organizers') && eventsServiceContent.includes('role: "owner"'))
  check('createEvent records creation notification', eventsServiceContent.includes('from("notifications").insert'))

  const selectorContent = readFileSync(
    resolve(process.cwd(), 'src/components/events/ParticipationModelSelector.tsx'),
    'utf8'
  )
  check('ParticipationModelSelector exports component', selectorContent.includes('export function ParticipationModelSelector'))
  check('ParticipationModelSelector supports free direct attend', selectorContent.includes("type: 'free'"))
  check('ParticipationModelSelector supports registration model', selectorContent.includes("type: 'registration'"))
  check('ParticipationModelSelector supports paid tickets', selectorContent.includes("type: 'paid'"))
  check('ParticipationModelSelector supports external provider', selectorContent.includes("type: 'external'"))
  check('ParticipationModelSelector configures ticket price and currency', selectorContent.includes('ticket_price') && selectorContent.includes('currency'))
  check('ParticipationModelSelector configures external ticket link', selectorContent.includes('external_ticket_url'))

  const createPageContent = readFileSync(
    resolve(process.cwd(), 'src/app/create/page.tsx'),
    'utf8'
  )
  check('Create page imports LocationPicker', createPageContent.includes("import { LocationPicker } from \"@/components/location/LocationPicker\""))
  check('Create page imports ParticipationModelSelector', createPageContent.includes("import {\n  ParticipationModelSelector"))
  check('Create page calls createEvent domain service', createPageContent.includes("createEvent("))
  check('Create page renders LocationPicker component', createPageContent.includes("<LocationPicker"))
  check('Create page renders ParticipationModelSelector component', createPageContent.includes("<ParticipationModelSelector"))
  check('Create page provides campaign permissions toggle', createPageContent.includes("allowParticipantCampaigns") && createPageContent.includes("Allow participant campaigns"))
  check('Create page provides draft vs publish selector', createPageContent.includes("Publish Immediately") && createPageContent.includes("Save as Draft"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gmkdagcxnxrfaxetqjpc.supabase.co'
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oPOor09JB9tmG_LdlpItaw_JFJ4pCdn'

  try {
    const categoriesRes = await fetch(`${supabaseUrl}/rest/v1/event_categories?select=id,name,slug&limit=5`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    })
    check('Remote event categories query status', categoriesRes.status === 200)
  } catch (err: unknown) {
    console.warn('Network validation skipped:', err)
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  console.log(`\nEvent Creation Verification Summary: ${passedCount} passed, ${failedCount} failed\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
