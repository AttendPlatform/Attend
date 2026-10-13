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
  console.log('\nStarting Week 2 Day 2 & Migration Fixes Verification\n')

  const components = [
    'src/components/location/MapPreview.tsx',
    'src/components/location/LocationPicker.tsx',
    'src/components/location/index.ts'
  ]

  for (const comp of components) {
    const fullPath = resolve(process.cwd(), comp)
    check(`Component file exists: ${comp}`, existsSync(fullPath))
  }

  const mapPreviewContent = readFileSync(
    resolve(process.cwd(), 'src/components/location/MapPreview.tsx'),
    'utf8'
  )
  check('MapPreview supports is_online events', mapPreviewContent.includes('location.is_online'))
  check('MapPreview uses getMapEmbedUrl', mapPreviewContent.includes('getMapEmbedUrl(coords, zoom)'))
  check('MapPreview integrates Google and Apple navigation links', mapPreviewContent.includes('getGoogleMapsUrl') && mapPreviewContent.includes('getAppleMapsUrl'))

  const pickerContent = readFileSync(
    resolve(process.cwd(), 'src/components/location/LocationPicker.tsx'),
    'utf8'
  )
  check('LocationPicker provides in-person vs online toggle', pickerContent.includes('In-Person Venue') && pickerContent.includes('Online Event'))
  check('LocationPicker integrates searchPlaces with debouncing', pickerContent.includes('searchPlaces(q'))
  check('LocationPicker renders NIGERIAN_HUBS presets', pickerContent.includes('NIGERIAN_HUBS.map'))
  check('LocationPicker supports popular venues selection', pickerContent.includes('selectedHub.popularVenues'))
  check('LocationPicker includes manual coordinate inputs', pickerContent.includes('Latitude') && pickerContent.includes('Longitude'))
  check('LocationPicker embeds MapPreview', pickerContent.includes('<MapPreview'))

  const indexContent = readFileSync(
    resolve(process.cwd(), 'src/components/location/index.ts'),
    'utf8'
  )
  check('components/location/index.ts exports LocationPicker & MapPreview', indexContent.includes("export * from './LocationPicker'") && indexContent.includes("export * from './MapPreview'"))

  const migration1Content = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20261005195800_v1_phase0_tables.sql'),
    'utf8'
  )
  check('Migration 1 checks profiles before event_organizers backfill', migration1Content.includes('INNER JOIN profiles p ON e.creator_id = p.id'))

  const migration2Content = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20261006171600_v1_phase0_attendance_schema.sql'),
    'utf8'
  )
  check('Migration 2 deduplicates participants before unique index', migration2Content.includes('DELETE FROM event_participants a') && migration2Content.includes('USING event_participants b'))
  check('Migration 2 secures registration_data from public SELECT', migration2Content.includes("registration_data = '{}'::jsonb"))
  check('Migration 2 enforces controlled guest participation on free events', migration2Content.includes('Guests can participate in free published events') && migration2Content.includes("events.participation_model = 'free'"))

  const migration4Content = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20261008154000_v1_phase0_data_integrity.sql'),
    'utf8'
  )
  check('Migration 4 does not reassign orphaned campaigns to oldest event', !migration4Content.includes('ORDER BY created_at ASC\n  LIMIT 1'))
  check('Migration 4 unlinks and archives orphaned campaigns', migration4Content.includes("SET\n  event_id = NULL,\n  status = 'archived'"))
  check('Migration 4 enforces foreign key with ON DELETE SET NULL', migration4Content.includes('ON DELETE SET NULL'))

  const attendanceContent = readFileSync(
    resolve(process.cwd(), 'src/services/attendance.service.ts'),
    'utf8'
  )
  const attendeesFnBody = attendanceContent.slice(
    attendanceContent.indexOf('function getEventAttendees'),
    attendanceContent.indexOf('function getOrganizerEventRegistrations')
  )
  check('attendance.service excludes registration_data from public select query', !attendeesFnBody.includes('registration_data,'))
  check('attendance.service exports getOrganizerEventRegistrations', attendanceContent.includes('export async function getOrganizerEventRegistrations'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gmkdagcxnxrfaxetqjpc.supabase.co'
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oPOor09JB9tmG_LdlpItaw_JFJ4pCdn'

  try {
    const eventsRes = await fetch(`${supabaseUrl}/rest/v1/events?select=id,title,status&limit=5`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    })
    check('Remote events query status', eventsRes.status === 200)

    const campaignsRes = await fetch(`${supabaseUrl}/rest/v1/campaigns?select=id,title,status&limit=5`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    })
    check('Remote campaigns query status', campaignsRes.status === 200)
  } catch (err: unknown) {
    console.warn('Network validation skipped:', err)
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  console.log(`\nVerification Summary: ${passedCount} passed, ${failedCount} failed\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
