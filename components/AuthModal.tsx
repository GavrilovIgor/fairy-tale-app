'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const signInWithGoogle = async () => {
    setLoading('google')
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError('Ошибка входа через Google'); setLoading(null) }
  }

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading('email')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(null)
    if (error) setError('Не удалось отправить письмо')
    else setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,31,20,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: '#fffdf8', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>

        {/* Header */}
        <div className="text-center mb-7">
          <p className="italic font-bold text-xl mb-1"
            style={{ fontFamily: 'Literata,Georgia,serif', color: '#0d2b1e' }}>
            Волшебная Сказка
          </p>
          <p className="text-sm" style={{ color: '#727973' }}>
            Войдите чтобы сохранять сказки на всех устройствах
          </p>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-4">✉️</p>
            <p className="font-bold text-lg mb-2" style={{ color: '#0d2b1e' }}>Проверьте почту</p>
            <p className="text-sm leading-relaxed" style={{ color: '#727973' }}>
              Мы отправили ссылку для входа на<br/>
              <span className="font-semibold" style={{ color: '#0d2b1e' }}>{email}</span>
            </p>
          </div>
        ) : (
          <>
            {/* Google */}
            <button onClick={signInWithGoogle} disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all cursor-pointer hover:bg-gray-50 disabled:opacity-50 mb-5"
              style={{ borderColor: '#e0e0e0', color: '#1c1c1c' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.017 17.64 11.71 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading === 'google' ? 'Загрузка...' : 'Войти через Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200"/>
              <span className="text-xs" style={{ color: '#727973' }}>или по email</span>
              <div className="flex-1 h-px bg-gray-200"/>
            </div>

            {/* Email */}
            <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
              <input value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                type="email" placeholder="ваш@email.com" required
                className="form-input-night"/>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={!!loading || !email.trim()}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ background: '#0d2b1e' }}>
                {loading === 'email' ? 'Отправляем...' : 'Выслать ссылку для входа'}
              </button>
            </form>
          </>
        )}

        <button onClick={onClose}
          className="w-full text-center text-xs mt-5 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: '#b0b8b0' }}>
          Продолжить без входа
        </button>
      </div>
    </div>
  )
}
