import { useState, useRef } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import type { WaMessageTemplate } from '../../types/wa.types'

const TYPE_LABELS: Record<string, string> = {
  tagihan_detail:  'Detail Tagihan',
  reminder:        'Reminder',
  rekap_tunggakan: 'Rekap Tunggakan',
  pengumuman:      'Pengumuman',
}

interface Props {
  templates: WaMessageTemplate[]
  loading: boolean
  saving: string | null
  onSave: (type: string, body: string) => void
}

export function WaTemplateEditor({ templates, loading, saving, onSave }: Props) {
  const [activeType, setActiveType] = useState<string>('tagihan_detail')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const template = templates.find(t => t.type === activeType)
  const body = drafts[activeType] ?? template?.body ?? ''
  const isDirty = template ? body !== template.body : false

  const setBody = (v: string) => setDrafts(prev => ({ ...prev, [activeType]: v }))

  const missingRequired = template?.placeholders
    .filter(p => p.required && !body.includes(`{{${p.key}}}`))
    .map(p => p.key) ?? []

  const insertPlaceholder = (key: string) => {
    const el = textareaRef.current
    const token = `{{${key}}}`
    if (!el) { setBody(body + token); return }
    const s = el.selectionStart
    const e = el.selectionEnd
    setBody(body.slice(0, s) + token + body.slice(e))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(s + token.length, s + token.length)
    }, 0)
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-400 text-sm animate-pulse">Memuat template...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {templates.map(t => (
          <button
            key={t.type}
            onClick={() => setActiveType(t.type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              activeType === t.type
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            {TYPE_LABELS[t.type] ?? t.type}
            {drafts[t.type] !== undefined && drafts[t.type] !== t.body && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      {template && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={16}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Tulis template pesan..."
            />
            {missingRequired.length > 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Placeholder wajib hilang:{' '}
                  {missingRequired.map(k => (
                    <code key={k} className="bg-red-100 px-1 rounded mx-0.5 font-mono text-xs">{`{{${k}}}`}</code>
                  ))}
                </span>
              </div>
            )}
            {template.updated_by && (
              <p className="text-xs text-gray-400">
                Terakhir diedit oleh: <span className="font-medium">{template.updated_by}</span>
              </p>
            )}
            <button
              onClick={() => onSave(activeType, body)}
              disabled={!!saving || !isDirty || missingRequired.length > 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving === activeType ? 'Menyimpan...' : 'Simpan Template'}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Placeholder Tersedia</p>
            <p className="text-xs text-gray-400">Klik untuk menyisipkan ke posisi kursor</p>
            <div className="space-y-1.5">
              {template.placeholders.map(p => (
                <button
                  key={p.key}
                  onClick={() => insertPlaceholder(p.key)}
                  className="w-full text-left group flex items-start gap-2 border border-gray-200 hover:border-green-400 rounded-lg p-2 text-sm transition-colors bg-white"
                >
                  <code className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded text-xs shrink-0 font-mono group-hover:bg-green-100 whitespace-nowrap">
                    {`{{${p.key}}}`}
                  </code>
                  <div className="min-w-0">
                    <span className="text-gray-700 text-xs">{p.desc}</span>
                    {p.required && <span className="text-red-500 text-xs ml-1">*wajib</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
