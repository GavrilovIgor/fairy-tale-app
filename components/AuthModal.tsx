'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ''

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const telegramRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Telegram Login Widget
  useEffect(() => {
    if (!BOT_USERNAME || !telegramRef.current) return
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram/callback`)
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-userpic', 'false')
    telegramRef.current.appendChild(script)
  }, [])

  const signInWithGoogle = async () => {
    setLoading('google'); setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError('Ошибка входа через Google'); setLoading(null) }
  }

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading('email'); setError('')
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
            {/* Социальные кнопки */}
            <div className="flex flex-col gap-3 mb-5">

              {/* Google */}
              <SocialButton onClick={signInWithGoogle} disabled={!!loading} loading={loading === 'google'} label="Войти через Google">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.017 17.64 11.71 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              </SocialButton>

              {/* Яндекс */}
              <SocialButton href="/api/auth/yandex" disabled={!!loading} label="Войти через Яндекс">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
                  <path d="M13.32 6.4H12.2c-1.64 0-2.5.82-2.5 2.16 0 1.52.68 2.24 2.08 3.18l1.16.78-3.32 5.08H7.5l3.08-4.72c-1.78-1.26-2.78-2.46-2.78-4.24C7.8 6.18 9.36 5 12.18 5H15v13.6h-1.68V6.4z" fill="white"/>
                </svg>
              </SocialButton>

              {/* VK */}
              <SocialButton href="/api/auth/vk" disabled={!!loading} label="Войти через VK">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="#0077FF"/>
                  <path d="M12.773 17c-4.77 0-7.49-3.27-7.6-8.71h2.38c.08 3.99 1.84 5.68 3.23 6.03V8.29h2.24v3.44c1.37-.15 2.81-1.72 3.3-3.44h2.2c-.37 2.12-1.93 3.69-3.04 4.34 1.11.52 2.88 1.9 3.56 4.37h-2.43c-.53-1.64-1.85-2.9-3.59-3.06V17h-.25z" fill="white"/>
                </svg>
              </SocialButton>

              {/* Telegram */}
              {BOT_USERNAME ? (
                <div className="flex items-center justify-center rounded-xl border-2 overflow-hidden"
                  style={{ borderColor: '#e0e0e0', minHeight: '48px' }}>
                  <div ref={telegramRef} />
                </div>
              ) : null}
            </div>

            {/* Разделитель */}
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

// ── Вспомогательный компонент кнопки ──────────────────────────────────────────

function SocialButton({
  children, label, onClick, href, disabled, loading,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
}) {
  const cls = "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm border-2 transition-all cursor-pointer hover:bg-gray-50 disabled:opacity-50"
  const style = { borderColor: '#e0e0e0', color: '#1c1c1c' }

  if (href) {
    return (
      <a href={href}
        className={cls}
        style={style}
        aria-disabled={disabled}>
        {children}
        {label}
      </a>
    )
  }

  return (
    <button onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
      {loading ? 'Загрузка...' : label}
    </button>
  )
}
