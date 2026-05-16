'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Avatar } from './UserMenu'

export function ProfileModal({ user, onClose, onUpdated }: {
  user: User; onClose: () => void; onUpdated: (name: string) => void
}) {
  const name: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const [newName, setNewName] = useState(name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setLoading(true)
    await supabase.auth.updateUser({ data: { full_name: trimmed } })
    setLoading(false)
    setSaved(true)
    onUpdated(trimmed)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,31,20,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: '#fffdf8', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>

        <div className="flex items-center justify-between mb-6">
          <p className="font-bold text-lg" style={{ fontFamily: 'Literata,Georgia,serif', color: '#0d2b1e' }}>
            Профиль
          </p>
          <button onClick={onClose} className="cursor-pointer hover:opacity-60 transition-opacity"
            style={{ color: '#9ca3af' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          <div style={{ position: 'relative' }}>
            <Avatar user={{ ...user, user_metadata: { ...user.user_metadata, full_name: newName || name } } as User} size={72} />
          </div>
        </div>

        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#466252' }}>
              Имя
            </label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Ваше имя" required className="form-input-night" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#466252' }}>
              Email
            </label>
            <input value={user.email || ''} disabled
              className="form-input-night opacity-50 cursor-not-allowed" />
          </div>

          <button type="submit" disabled={loading || !newName.trim() || newName.trim() === name}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all mt-2"
            style={{ background: saved ? '#2d6a4f' : '#0d2b1e' }}>
            {saved ? '✓ Сохранено' : loading ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  )
}
