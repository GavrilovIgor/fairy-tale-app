'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface VoiceCharacter {
  id: string
  openaiVoice: string  // kept for interface compat, unused in Web Speech API
  emoji: string
  name: string
  ages: string
  hint?: string
}

interface AudioPlayerProps {
  storyText: string
  voice: VoiceCharacter
  labels?: {
    idle?: string
    replay?: string
    error?: string
    unsupported?: string
  }
}

type PlayerState = 'idle' | 'speaking' | 'paused' | 'done' | 'error'

// Chrome has a bug where speechSynthesis freezes on long texts.
// Periodic pause+resume keeps it alive.
const CHROME_KEEPALIVE_MS = 10_000

function findRussianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const ruVoices = voices.filter(v => v.lang.startsWith('ru'))
  // Prefer on-device (local) voice for better quality
  return ruVoices.find(v => v.localService) ?? ruVoices[0] ?? null
}

export function AudioPlayer({ storyText, voice, labels }: AudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle')
  const [progress, setProgress] = useState(0)   // 0–1, from onboundary
  const [errorMsg, setErrorMsg] = useState('')
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef<PlayerState>('idle')   // mirror for keepalive closure

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = state }, [state])

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const idleLabel = labels?.idle ?? 'Нажми ▶ чтобы слушать'
  const replayLabel = labels?.replay ?? 'Нажми ▶ чтобы повторить'
  const unsupportedLabel = labels?.unsupported ?? 'Браузер не поддерживает озвучку'

  const stopKeepalive = useCallback(() => {
    if (keepAliveRef.current !== null) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  // Cancel speech and clear timers on unmount
  useEffect(() => {
    return () => {
      stopKeepalive()
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [isSupported, stopKeepalive])

  const startSpeaking = useCallback(() => {
    if (!isSupported) {
      setState('error')
      setErrorMsg(unsupportedLabel)
      return
    }

    window.speechSynthesis.cancel()
    stopKeepalive()

    const utterance = new SpeechSynthesisUtterance(storyText)
    utterance.lang = 'ru-RU'
    utterance.rate = 0.88   // slightly slower — easier for kids to follow

    const ruVoice = findRussianVoice()
    if (ruVoice) utterance.voice = ruVoice

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (storyText.length > 0) {
        setProgress(e.charIndex / storyText.length)
      }
    }
    utterance.onend = () => {
      stopKeepalive()
      setState('done')
      setProgress(1)
    }
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // 'interrupted' fires when we call cancel() intentionally — not an error
      if (e.error === 'interrupted') return
      stopKeepalive()
      setState('error')
      setErrorMsg('Ошибка озвучки')
    }

    window.speechSynthesis.speak(utterance)
    setState('speaking')

    // Chrome keep-alive: prevents freeze on long texts
    keepAliveRef.current = setInterval(() => {
      if (stateRef.current === 'speaking' && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, CHROME_KEEPALIVE_MS)
  }, [storyText, isSupported, unsupportedLabel, stopKeepalive])

  const handlePlay = () => {
    if (state === 'idle' || state === 'done' || state === 'error') {
      setProgress(0)
      startSpeaking()
    } else if (state === 'speaking') {
      window.speechSynthesis.pause()
      setState('paused')
    } else if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('speaking')
    }
  }

  const isPlaying = state === 'speaking'
  const hasError = state === 'error'

  let statusText: string
  if (hasError) {
    statusText = errorMsg
  } else if (state === 'done') {
    statusText = replayLabel
  } else if (state === 'idle') {
    statusText = idleLabel
  } else if (state === 'speaking') {
    statusText = 'Читаю сказку...'
  } else {
    statusText = 'Пауза'
  }

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
        {/* Progress bar — visible once speaking has started */}
        {progress > 0 && progress < 1 && (
          <div
            className="w-full h-1 rounded-full mb-3"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%`, background: '#a46713' }}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Character avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.15)',
            }}
          >
            {voice.emoji}
          </div>

          {/* Character name + status */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: '#d4a85a' }}>
              {voice.name}
            </div>
            <div
              className="text-xs truncate"
              style={{ color: hasError ? '#ef4444' : 'rgba(255,255,255,0.40)' }}
            >
              {statusText}
            </div>
          </div>

          {/* Play / Pause button */}
          <button
            onClick={handlePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity cursor-pointer active:opacity-70"
            style={{ background: '#a46713' }}
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
