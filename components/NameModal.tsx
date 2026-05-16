'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NameModal({ email, onDone }: { email: string; onDone: (name: string) => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    await supabase.auth.updateUser({ data: { full_name: trimmed } })
    setLoading(false)
    onDone(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,31,20,0.88)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: '#fffdf8', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
        <div className="text-center mb-6">
          <p className="text-3xl mb-3">✨</p>
          <p className="font-bold text-xl mb-1"
            style={{ fontFamily: 'Literata,Georgia,serif', color: '#0d2b1e' }}>
            Добро пожаловать!
          </p>
          <p className="text-sm" style={{ color: '#727973' }}>
            Как вас зовут? Это отобразится в вашем профиле.
          </p>
        </div>
        <form onSubmit={save} className="flex flex-col gap-3">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Ваше имя" autoFocus required
            className="form-input-night" />
          <button type="submit" disabled={loading || !name.trim()}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 transition-all"
            style={{ background: '#0d2b1e' }}>
            {loading ? 'Сохраняем...' : 'Продолжить →'}
          </button>
        </form>
        <p className="text-center text-xs mt-4 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: '#b0b8b0' }} onClick={() => onDone(email.split('@')[0])}>
          Пропустить
        </p>
      </div>
    </div>
  )
}
