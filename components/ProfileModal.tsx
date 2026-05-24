'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Avatar } from './UserMenu'

function getSubscriptionInfo() {
  try {
    const paidUntil = parseInt(localStorage.getItem('ft-paid-until') || '0', 10)
    const extra = parseInt(localStorage.getItem('ft-extra') || '0', 10)
    return { paidUntil, extra }
  } catch {
    return { paidUntil: 0, extra: 0 }
  }
}

function getReferralLink(userId: string) {
  const code = userId.slice(0, 8)
  return `https://magicfairytale.ru/?ref=${code}`
}

export function ProfileModal({ user, onClose, onUpdated, onShowPaywall }: {
  user: User
  onClose: () => void
  onUpdated: (name: string) => void
  onShowPaywall?: () => void
}) {
  const name: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const [newName, setNewName] = useState(name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sub, setSub] = useState({ paidUntil: 0, extra: 0 })
  const supabase = createClient()
  const refLink = getReferralLink(user.id)

  useEffect(() => { setSub(getSubscriptionInfo()) }, [])

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

  const isPaid = sub.paidUntil > Date.now()
  const paidDate = isPaid
    ? new Date(sub.paidUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const copyRefLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback для старых браузеров
      const el = document.createElement('textarea')
      el.value = refLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <Avatar user={{ ...user, user_metadata: { ...user.user_metadata, full_name: newName || name } } as User} size={72} />
        </div>

        {/* Name + email */}
        <form onSubmit={save} className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#466252' }}>Имя</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Ваше имя" required className="form-input-night" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#466252' }}>Email</label>
            <input value={user.email || ''} disabled className="form-input-night opacity-50 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={loading || !newName.trim() || newName.trim() === name}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all"
            style={{ background: saved ? '#2d6a4f' : '#0d2b1e' }}>
            {saved ? '✓ Сохранено' : loading ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </form>

        {/* Subscription block */}
        <div className="rounded-2xl p-4" style={{ background: '#f7f3ed', border: '1px solid rgba(13,43,30,0.08)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#466252' }}>
            Подписка
          </p>

          {isPaid ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold italic" style={{ color: '#a46713', fontFamily: 'Literata,Georgia,serif' }}>Premium</span>
                </div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>активна до {paidDate}</p>
              </div>
              <button onClick={() => { onClose(); onShowPaywall?.() }}
                className="text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: '#a46713' }}>
                Продлить
              </button>
            </div>
          ) : sub.extra > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold" style={{ color: '#0d2b1e' }}>
                    {sub.extra} {sub.extra === 1 ? 'сказка' : sub.extra < 5 ? 'сказки' : 'сказок'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#fef3c7', color: '#d97706' }}>бонус</span>
                </div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>осталось</p>
              </div>
              <button onClick={() => { onClose(); onShowPaywall?.() }}
                className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer hover:opacity-90 transition-all"
                style={{ background: '#a46713', color: '#fff' }}>
                ✨ Купить
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: '#0d2b1e' }}>Бесплатный</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>49 ₽/3 сказки · 99 ₽/мес</p>
              </div>
              <button onClick={() => { onClose(); onShowPaywall?.() }}
                className="text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer hover:opacity-90 transition-all"
                style={{ background: '#a46713', color: '#fff' }}>
                ✨ Купить
              </button>
            </div>
          )}
        </div>

        {/* Referral block */}
        <div className="rounded-2xl p-4 mt-3" style={{ background: '#f0f7f3', border: '1px solid rgba(13,43,30,0.08)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#466252' }}>
            Пригласи друга
          </p>
          <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
            Друг оплатит — ты получишь 1 месяц бесплатно
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-xs font-mono truncate"
              style={{ background: '#e8f2ec', color: '#0d2b1e', border: '1px solid rgba(13,43,30,0.1)' }}>
              {refLink}
            </div>
            <button onClick={copyRefLink}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              style={{ background: copied ? '#2d6a4f' : '#0d2b1e', color: '#fff' }}>
              {copied ? '✓' : 'Копировать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
