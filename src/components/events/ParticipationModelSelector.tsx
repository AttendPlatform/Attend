'use client'

import React from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Ticket,
  ExternalLink,
  DollarSign,
  HelpCircle,
  Users
} from 'lucide-react'

export type ParticipationModelType = 'free' | 'registration' | 'paid' | 'external'

interface ParticipationModelSelectorProps {
  model: ParticipationModelType
  config: Record<string, any>
  onChangeModel: (model: ParticipationModelType) => void
  onChangeConfig: (config: Record<string, any>) => void
}

interface ModelOption {
  type: ParticipationModelType
  title: string
  subtitle: string
  badge: string
  icon: React.ComponentType<{ className?: string }>
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    type: 'free',
    title: 'Free (Direct Attend)',
    subtitle: 'Attendees RSVP instantly with a single click. Ideal for open community meetups.',
    badge: 'Standard Free',
    icon: CheckCircle2
  },
  {
    type: 'registration',
    title: 'Free with Registration',
    subtitle: 'Attendees complete a registration form with required questions before confirmation.',
    badge: 'Requires Details',
    icon: ClipboardList
  },
  {
    type: 'paid',
    title: 'Paid Event / Tickets',
    subtitle: 'Sell admission tickets with pricing tiers, currency selection, and capacity caps.',
    badge: 'Direct Tickets',
    icon: Ticket
  },
  {
    type: 'external',
    title: 'External Ticketing',
    subtitle: 'Forward attendees directly to an external ticketing platform (Tix, Eventbrite, Luma).',
    badge: 'External Provider',
    icon: ExternalLink
  }
]

export function ParticipationModelSelector({
  model,
  config,
  onChangeModel,
  onChangeConfig
}: ParticipationModelSelectorProps) {
  const updateConfigField = (field: string, value: any) => {
    onChangeConfig({
      ...config,
      [field]: value
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-neutral-900 mb-1">
          Event Participation Model
        </label>
        <p className="text-xs text-neutral-500 mb-3">
          Choose how attendees sign up, register, or access tickets for this event.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODEL_OPTIONS.map((opt) => {
            const isSelected = model === opt.type
            const Icon = opt.icon
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onChangeModel(opt.type)}
                className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-600/20 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex w-full items-center justify-between mb-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-violet-600 text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isSelected
                        ? 'bg-violet-200/70 text-violet-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>

                <p className="text-sm font-semibold text-neutral-900">{opt.title}</p>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                  {opt.subtitle}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {model === 'registration' && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3 transition-all">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Registration Requirements
            </h4>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(config.require_phone)}
                onChange={(e) => updateConfigField('require_phone', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span>Require attendee phone number</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(config.require_organization)}
                onChange={(e) => updateConfigField('require_organization', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span>Require company or organization name</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(config.require_job_title)}
                onChange={(e) => updateConfigField('require_job_title', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span>Require job title or role</span>
            </label>
          </div>

          <div className="pt-2 border-t border-neutral-200/60">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Custom Question (Optional)
            </label>
            <div className="relative">
              <HelpCircle className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="e.g. Dietary requirements, T-shirt size, or experience level"
                value={config.custom_question || ''}
                onChange={(e) => updateConfigField('custom_question', e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
              />
            </div>
          </div>
        </div>
      )}

      {model === 'paid' && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3 transition-all">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-violet-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Ticket Pricing & Capacity
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Currency
              </label>
              <select
                value={config.currency || 'NGN'}
                onChange={(e) => updateConfigField('currency', e.target.value)}
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Ticket Price
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="5000"
                  value={config.ticket_price || ''}
                  onChange={(e) => updateConfigField('ticket_price', e.target.value ? parseFloat(e.target.value) : '')}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Total Capacity (Optional)
              </label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={config.ticket_capacity || ''}
                  onChange={(e) => updateConfigField('ticket_capacity', e.target.value ? parseInt(e.target.value, 10) : '')}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {model === 'external' && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3 transition-all">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-violet-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              External Ticketing Provider
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Ticket Purchase Link
            </label>
            <input
              type="url"
              placeholder="https://tix.africa/event/... or https://eventbrite.com/..."
              value={config.external_ticket_url || ''}
              onChange={(e) => updateConfigField('external_ticket_url', e.target.value)}
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Attendees clicking Get Tickets on your event page will be redirected here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
