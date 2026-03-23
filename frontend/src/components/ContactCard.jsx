import { useState } from 'react'
import { Pencil, Trash2, Sparkles, Loader2, Linkedin, Globe, Mail, Phone, ExternalLink } from 'lucide-react'

const SOURCE_COLORS = {
  LinkedIn: 'bg-blue-100 text-blue-700',
  Email: 'bg-purple-100 text-purple-700',
  Phone: 'bg-green-100 text-green-700',
  WhatsApp: 'bg-emerald-100 text-emerald-700',
  Instagram: 'bg-pink-100 text-pink-700',
}

const TYPE_COLORS = {
  Leak: 'bg-cyan-100 text-cyan-700',
  Faucet: 'bg-teal-100 text-teal-700',
  Cold: 'bg-gray-100 text-gray-600',
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-blue-500',
]

function getAvatarColor(name) {
  let hash = 0
  for (const c of (name || '?')) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash)]
}

const PIPELINE = [
  { key: 'first_contact_date', label: '1st Contact', isDate: true },
  { key: 'bump1', label: 'Bump 1' },
  { key: 'bump2', label: 'Bump 2' },
  { key: 'bump3', label: 'Last Shot' },
  { key: 'response', label: 'Response' },
  { key: 'loom_sent', label: 'Loom' },
  { key: 'sales_call', label: 'Sales Call' },
]

function PipelineBar({ contact }) {
  const steps = PIPELINE.map(s => ({
    ...s,
    done: s.isDate ? !!contact[s.key] : !!contact[s.key],
  }))
  const doneCount = steps.filter(s => s.done).length

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-500">Pipeline</span>
        <span className="text-xs text-gray-400">{doneCount}/{steps.length}</span>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            <div
              className={`w-full h-1.5 rounded-full transition-colors ${step.done ? 'bg-indigo-500' : 'bg-gray-200'}`}
              title={step.label}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-1 gap-1">
        {steps.map(step => (
          <div key={step.key} className="flex-1 text-center">
            <div className={`w-2.5 h-2.5 rounded-full mx-auto border-2 transition-colors ${step.done ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'}`} />
          </div>
        ))}
      </div>
      <div className="flex mt-0.5 gap-1">
        {steps.map(step => (
          <div key={step.key} className="flex-1 text-center">
            <span className={`text-[9px] leading-tight ${step.done ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ContactCard({ contact, onEdit, onDelete, onEnrich, enriching }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = (contact.name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  const avatarColor = getAvatarColor(contact.name)
  const hasLinkedIn = !!contact.linkedin_url
  const hasWebsite = !!contact.website
  const isEmail = contact.email_or_phone?.includes('@')
  const revenueNum = parseFloat(contact.revenue) || 0

  const enrichedDate = contact.enriched_at
    ? new Date(contact.enriched_at).toLocaleDateString()
    : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {contact.linkedin_photo ? (
              <img
                src={contact.linkedin_photo}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor} ${contact.linkedin_photo ? 'hidden' : 'flex'}`}
            >
              {initials}
            </div>
          </div>

          {/* Name & info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">{contact.name || 'Unnamed'}</h3>
            {contact.linkedin_headline && (
              <p className="text-sm text-gray-500 leading-tight mt-0.5 line-clamp-1">{contact.linkedin_headline}</p>
            )}
            {(contact.linkedin_company || contact.industry) && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {[contact.linkedin_company, contact.industry].filter(Boolean).join(' · ')}
              </p>
            )}
            {contact.linkedin_location && (
              <p className="text-xs text-gray-400 mt-0.5">📍 {contact.linkedin_location}</p>
            )}
          </div>

          {/* Actions menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
            >
              <span className="text-lg leading-none">⋯</span>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => { onEdit(contact); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => { onEnrich(contact.id); setMenuOpen(false) }}
                  disabled={enriching}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {enriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {enriching ? 'Enriching...' : 'Enrich'}
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { onDelete(contact.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact links */}
        <div className="flex flex-wrap gap-2 mt-3">
          {hasLinkedIn && (
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {hasWebsite && (
            <a
              href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {contact.website_title || contact.website.replace(/^https?:\/\//, '').split('/')[0]}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {contact.email_or_phone && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {isEmail ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {contact.email_or_phone}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline bar */}
      <div className="px-4 py-3 border-t border-gray-50">
        <PipelineBar contact={contact} />
      </div>

      {/* Notes preview */}
      {contact.notes && (
        <div className="px-4 py-2.5 border-t border-gray-50">
          <p className="text-xs text-gray-500 line-clamp-2 italic">"{contact.notes}"</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {contact.source && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[contact.source] || 'bg-gray-100 text-gray-600'}`}>
              {contact.source}
            </span>
          )}
          {contact.type && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type] || 'bg-gray-100 text-gray-600'}`}>
              {contact.type}
            </span>
          )}
          {enrichedDate && (
            <span className="text-xs text-gray-300">✓ {enrichedDate}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {revenueNum > 0 && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ${revenueNum.toLocaleString()}
            </span>
          )}
          {enriching && (
            <span className="text-xs text-indigo-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Enriching...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
