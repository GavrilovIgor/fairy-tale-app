'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface VoiceCharacter {
  id: string
  openaiVoice: string
  emoji: string
  name: string
  ages: string
  hint?: string  // m1: added optional hint field
}

interface AudioPlayerProps {
  storyText: string          // Full concatenated story text
  voice: VoiceCharacter
  // m2: optional i18n labels with Russian defaults
  labels?: {
    loading?: string
    idle?: string
    replay?: string
    error?: string
  }
}

type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

export function AudioPlayer({ storyText, voice, labels }: AudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle')
  const [progress, setProgress] = useState(0)          // 0–1
  const [duration, setDuration] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobUrl = useRef<string | null>(null)
  const loadingRef = useRef(false)  // C2: in-flight guard

  // m2: labels with fallback defaults
  const loadingLabel = labels?.loading ?? 'Готовим озвучку...'
  const idleLabel = labels?.idle ?? 'Нажми ▶ чтобы слушать'
  const replayLabel = labels?.replay ?? 'Нажми ▶ чтобы повторить'

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current)
    }
  }, [])

  // C1+C2: loadAudio returns boolean success; guarded against concurrent calls
  const loadAudio = useCallback(async (): Promise<boolean> => {
    if (audioBlobUrl.current) return true   // Already loaded

    if (loadingRef.current) return false    // C2: in-flight guard
    loadingRef.current = true

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: storyText, voice: voice.openaiVoice }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Ошибка озвучки' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioBlobUrl.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      audio.addEventListener('timeupdate', () => {
        if (audio.duration > 0) setProgress(audio.currentTime / audio.duration)
      })
      audio.addEventListener('ended', () => {
        setState('paused')
        setProgress(0)
        audio.currentTime = 0
      })
      audio.addEventListener('error', () => {
        setState('error')
        setErrorMsg('Ошибка воспроизведения')
      })

      // I2: removed audio.load() — new Audio(url) already starts loading;
      // calling load() again after attaching canplaythrough can reset the element
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', () => reject(new Error('Audio load failed')), { once: true })
      })

      setState('ready')
      return true
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка озвучки')
      return false
    } finally {
      loadingRef.current = false
    }
  }, [storyText, voice.openaiVoice])

  // C1: handlePlay uses boolean return from loadAudio — no stale closure on state
  const handlePlay = async () => {
    if (state === 'idle' || state === 'error') {
      const ok = await loadAudio()
      if (ok && audioRef.current) {
        await audioRef.current.play().catch(() => {})
        setState('playing')
      }
      return
    }
    if (state === 'loading') return
    if (!audioRef.current) return

    if (state === 'ready' || state === 'paused') {
      await audioRef.current.play().catch(() => {})
      setState('playing')
    } else if (state === 'playing') {
      audioRef.current.pause()
      setState('paused')
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setProgress(ratio)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // I1: derive currentTime from progress state (consistent with timeupdate events)
  const currentTime = progress * duration
  const isLoading = state === 'loading'
  const isPlaying = state === 'playing'
  const hasError = state === 'error'
  const showProgress = state === 'ready' || state === 'playing' || state === 'paused'

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 print:hidden"
      style={{
        background: 'rgba(13, 43, 30, 0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-[680px] mx-auto px-4 py-3">
        {/* Progress bar */}
        {showProgress && (
          <div
            className="w-full h-1 rounded-full mb-3 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%`, background: '#a46713' }}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Character avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}
          >
            {voice.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: '#d4a85a' }}>
              {voice.name}
            </div>
            {hasError ? (
              <div className="text-xs" style={{ color: '#ef4444' }}>{errorMsg}</div>
            ) : showProgress ? (
              // I3: show replay hint when ended (paused + progress=0)
              progress === 0 && state === 'paused' ? (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{replayLabel}</div>
              ) : (
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )
            ) : (
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {isLoading ? loadingLabel : idleLabel}
              </div>
            )}
          </div>

          {/* Play/Pause button */}
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer disabled:opacity-50"
            style={{ background: isLoading ? 'rgba(255,255,255,0.1)' : '#a46713' }}
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
          >
            {isLoading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            ) : isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
