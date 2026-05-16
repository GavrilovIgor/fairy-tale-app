'use client'

import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const avatarUrl = user.user_metadata?.avatar_url
  const name: string = user.user_metadata?.full_name || user.user_metadata?.name || user.email || ''
  const initial = name.charAt(0).toUpperCase()

  // Deterministic color from email
  const colors = ['#2d6a4f','#1d4e89','#6b3fa0','#c05621','#2b6cb0','#276749']
  const colorIdx = name.charCodeAt(0) % colors.length
  const bg = colors[colorIdx]

  if (avatarUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
    )
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg,
      border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.4, fontWeight: 700 }}>
      {initial}
    </div>
  )
}

export function UserMenu({
  user, onSignOut, onEditProfile
}: {
  user: User; onSignOut: () => void; onEditProfile: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const name: string = user.user_metadata?.full_name || user.user_metadata?.name
    || user.email?.split('@')[0] || 'Профиль'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        <Avatar user={user} size={32} />
        <span className="text-white/90 text-sm font-medium hidden md:block">{name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
          style={{ background: '#fffdf8', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', top: '100%' }}>
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-3">
              <Avatar user={user} size={36} />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#0d2b1e' }}>{name}</p>
                <p className="text-xs truncate" style={{ color: '#9ca3af' }}>{user.email}</p>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="py-1">
            <button onClick={() => { setOpen(false); onEditProfile() }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ color: '#374151' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
              Редактировать профиль
            </button>
            <button onClick={() => { setOpen(false); onSignOut() }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ color: '#374151' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { Avatar }
