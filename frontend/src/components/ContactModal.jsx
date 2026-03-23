import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'

const SOURCE_OPTIONS = ['', 'Phone', 'WhatsApp', 'Email', 'LinkedIn', 'Instagram']
const TYPE_OPTIONS = ['', 'Leak', 'Faucet', 'Cold']

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      {...rest}
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white pr-8"
      >
        {options.map(o => (
          <option key={o} value={o}>{o || '— None —'}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

const EMPTY = {
  source: '', type: '', name: '', industry: '', linkedin_url: '', website: '',
  email_or_phone: '', first_contact_date: '', bump1: 0, bump2: 0, bump3: 0,
  response: 0, loom_sent: 0, sales_call: 0, notes: '', answer: '', revenue: 0,
}

export default function ContactModal({ contact, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (contact) setForm({ ...EMPTY, ...contact })
    else setForm({ ...EMPTY })
  }, [contact])

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))
  const setBool = (key) => (val) => setForm(f => ({ ...f, [key]: val ? 1 : 0 }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('Name is required')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-500">
          <h2 className="text-white font-bold text-lg">
            {contact ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <Input value={form.name} onChange={set('name')} placeholder="First Last" />
              </Field>
              <Field label="Industry">
                <Input value={form.industry} onChange={set('industry')} placeholder="SaaS, E-commerce..." />
              </Field>
              <Field label="Source">
                <Select value={form.source} onChange={set('source')} options={SOURCE_OPTIONS} />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={set('type')} options={TYPE_OPTIONS} />
              </Field>
            </div>
          </div>

          {/* Section: Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="LinkedIn Profile URL">
                <Input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={set('website')} placeholder="https://example.com" />
              </Field>
              <Field label="Email or Phone">
                <Input value={form.email_or_phone} onChange={set('email_or_phone')} placeholder="email@example.com or +34 600 000 000" />
              </Field>
            </div>
          </div>

          {/* Section: Pipeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pipeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Contact Date">
                <Input value={form.first_contact_date} onChange={set('first_contact_date')} type="date" />
              </Field>
              <div className="flex items-end pb-1">
                <Toggle checked={!!form.bump1} onChange={setBool('bump1')} label="1 Gentle Bump" />
              </div>
              <Toggle checked={!!form.bump2} onChange={setBool('bump2')} label="2 Value Nudge" />
              <Toggle checked={!!form.bump3} onChange={setBool('bump3')} label="4–5 Last Shot" />
              <Toggle checked={!!form.response} onChange={setBool('response')} label="Response received" />
              <Toggle checked={!!form.loom_sent} onChange={setBool('loom_sent')} label="Loom sent" />
              <Toggle checked={!!form.sales_call} onChange={setBool('sales_call')} label="Sales call done" />
            </div>
          </div>

          {/* Section: Notes & Revenue */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes & Revenue</h3>
            <div className="space-y-4">
              <Field label="Notes / Message Sent">
                <textarea
                  value={form.notes}
                  onChange={e => set('notes')(e.target.value)}
                  placeholder="What message did you send? Any context..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                />
              </Field>
              <Field label="Their Answer / Response">
                <textarea
                  value={form.answer}
                  onChange={e => set('answer')(e.target.value)}
                  placeholder="What did they say?"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                />
              </Field>
              <Field label="Revenue ($)">
                <Input
                  type="number"
                  value={form.revenue}
                  onChange={set('revenue')}
                  placeholder="0"
                  min="0"
                  step="any"
                />
              </Field>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {saving ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
