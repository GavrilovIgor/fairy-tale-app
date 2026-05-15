'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        switchInlineQuery?: (query: string, chatTypes?: string[]) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
      }
    }
  }
}

const DAILY_DATE_KEY = 'fairy-tale-daily-date'
const DAILY_COUNT_KEY = 'fairy-tale-daily-count'
const EXTRA_STORIES_KEY = 'fairy-tale-extra-stories'
const PAID_UNTIL_KEY = 'fairy-tale-paid-until'

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}
function getDailyUsage(): number {
  try {
    if (localStorage.getItem(DAILY_DATE_KEY) !== getTodayStr()) {
      localStorage.setItem(DAILY_DATE_KEY, getTodayStr())
      localStorage.setItem(DAILY_COUNT_KEY, '0')
      return 0
    }
    return parseInt(localStorage.getItem(DAILY_COUNT_KEY) || '0', 10)
  } catch { return 0 }
}
function incrementDailyUsage() {
  try { localStorage.setItem(DAILY_COUNT_KEY, String(getDailyUsage() + 1)) } catch { /* */ }
}
function getExtraStories(): number {
  try { return parseInt(localStorage.getItem(EXTRA_STORIES_KEY) || '0', 10) } catch { return 0 }
}
function setExtraStoriesCount(n: number) {
  try { localStorage.setItem(EXTRA_STORIES_KEY, String(Math.max(0, n))) } catch { /* */ }
}
function getPaidUntil(): number {
  try { return parseInt(localStorage.getItem(PAID_UNTIL_KEY) || '0', 10) } catch { return 0 }
}
function setPaidUntil(ms: number) {
  try { localStorage.setItem(PAID_UNTIL_KEY, String(ms)) } catch { /* */ }
}
function isPremium(): boolean {
  return getPaidUntil() > Date.now()
}
function canGenerate(): boolean {
  return isPremium() || getDailyUsage() < 1 || getExtraStories() > 0
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Scene {
  text: string
  imagePrompt: string
}

interface Story {
  title: string
  scenes: Scene[]
  discussion?: string[]
  anchor?: { title: string; description: string }
}

interface SavedStory {
  id: string
  savedAt: string
  childName: string
  story: Story
}

type SituationType = 'fear' | 'emotion' | 'adaptation' | 'behavior' | 'preparation' | 'fun'

interface FormData {
  childName: string
  age: string
  hero: string
  situation: string
  situationType: SituationType
  favorites: string
  lesson: string
}

// ─── Situation types config ───────────────────────────────────────────────────

const SITUATION_TYPES: { id: SituationType; emoji: string; label: string; placeholder: string }[] = [
  { id: 'fear',        emoji: '😨', label: 'Страх',           placeholder: 'боится темноты, собак, врача, остаться одному...' },
  { id: 'emotion',     emoji: '😤', label: 'Эмоции',          placeholder: 'злится и кричит, ревнует к братику, обижается...' },
  { id: 'adaptation',  emoji: '🏠', label: 'Новое',           placeholder: 'идёт в новый садик, переехали, новая школа...' },
  { id: 'preparation', emoji: '🗓️', label: 'Событие',         placeholder: 'завтра к врачу, стрижка, первый раз в бассейн...' },
  { id: 'behavior',    emoji: '🤝', label: 'Поведение',       placeholder: 'не хочет делиться, говорит плохие слова, не слушается...' },
  { id: 'fun',         emoji: '✨', label: 'Просто сказка',   placeholder: 'интересное приключение без конкретной проблемы' },
]

// ─── Random data ──────────────────────────────────────────────────────────────

const R_NAMES  = ['Маша', 'Саша', 'Дима', 'Аня', 'Ваня', 'Катя', 'Петя', 'Оля', 'Соня', 'Миша', 'Даша', 'Лёша']
const R_AGES   = ['3-4 года', '5-6 лет', '7-8 лет', '9-10 лет']
const R_HEROES = ['котёнок Пушок', 'дракончик Огонёк', 'щенок Бобик', 'лисёнок Рыжик', 'медвежонок Топтыжка', 'зайчонок Ушастик', 'черепашка Тихоня', 'ёжик Колючка', 'совёнок Мудрик', 'бельчонок Рыжик']
const R_SITUATIONS: { situation: string; situationType: SituationType }[] = [
  { situation: 'боится темноты', situationType: 'fear' },
  { situation: 'боится идти к врачу', situationType: 'fear' },
  { situation: 'не хочет идти в садик', situationType: 'adaptation' },
  { situation: 'злится и кричит когда не получает своё', situationType: 'emotion' },
  { situation: 'не хочет делиться игрушками', situationType: 'behavior' },
  { situation: 'ревнует к младшему братику', situationType: 'emotion' },
  { situation: 'боится остаться одному', situationType: 'fear' },
  { situation: 'завтра первый раз к стоматологу', situationType: 'preparation' },
]
const R_FAVS   = ['динозавры и космос', 'мороженое и рисование', 'машинки и конструктор', 'принцессы и единороги', 'кошки и пазлы', 'роботы и лего', 'музыка и танцы']
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fairy-tale-saved-stories'

function loadSaved(): SavedStory[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveTos(stories: SavedStory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
}

// ─── Image utils ──────────────────────────────────────────────────────────────

function imageUrl(prompt: string, index: number): string {
  const base = prompt.trim().slice(0, 120)
  return `/api/image?prompt=${encodeURIComponent(base)}&seed=${index * 137 + 42}`
}

// ─── Decorative SVG elements ──────────────────────────────────────────────────

function Stars() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden viewBox="0 0 400 200">
      {[[40,30],[90,15],[160,40],[230,20],[310,35],[370,18],[60,90],[140,75],[200,95],[290,80],[350,70],[30,150],[110,160],[190,140],[270,155],[360,145]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r={i%3===0?2:1.2} fill="#C4B5FD" opacity={0.4+((i*7)%3)*0.2} />
      ))}
    </svg>
  )
}

function Clouds() {
  return (
    <svg className="absolute bottom-0 left-0 w-full pointer-events-none" aria-hidden viewBox="0 0 800 80" preserveAspectRatio="none">
      <ellipse cx="120" cy="80" rx="100" ry="40" fill="#EDE9FE" opacity="0.4"/>
      <ellipse cx="400" cy="80" rx="160" ry="50" fill="#FDE8D8" opacity="0.35"/>
      <ellipse cx="680" cy="80" rx="120" ry="45" fill="#EDE9FE" opacity="0.3"/>
    </svg>
  )
}

// ─── Image component ──────────────────────────────────────────────────────────

const FALLBACK_SCENES = [
  { bg: ['#FEF3C7','#FDE68A','#FCA5A5'], emoji: '🌅' },
  { bg: ['#EDE9FE','#C4B5FD','#818CF8'], emoji: '✨' },
  { bg: ['#D1FAE5','#6EE7B7','#34D399'], emoji: '🌿' },
]

function StoryFallback({ index }: { index: number }) {
  const scene = FALLBACK_SCENES[index % FALLBACK_SCENES.length]
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${scene.bg[0]} 0%, ${scene.bg[1]} 50%, ${scene.bg[2]} 100%)` }}
    >
      <span className="text-5xl">{scene.emoji}</span>
    </div>
  )
}

function WatercolorShimmer() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #EDE9FE 50%, #FDE8D8 100%)' }}>
      <div className="text-4xl animate-pulse">🎨</div>
      <span className="text-xs text-violet-400 font-medium tracking-wide">Иллюстрация создаётся...</span>
    </div>
  )
}

function StoryImage({ prompt, index }: { prompt: string; index: number }) {
  const [phase, setPhase] = useState<'loading' | 'done' | 'fallback'>('loading')
  const [blobSrc, setBlobSrc] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async (attempt = 0) => {
    if (!mountedRef.current) return
    setPhase('loading')
    setBlobSrc(null)
    try {
      const base = imageUrl(prompt, index)
      const url = attempt > 0 ? `${base}&t=${Date.now()}` : base
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status}`)
      const blob = await res.blob()
      if (!mountedRef.current) return
      setBlobSrc(URL.createObjectURL(blob))
      setPhase('done')
    } catch {
      if (!mountedRef.current) return
      if (attempt < 3) setTimeout(() => load(attempt + 1), 5000 * (attempt + 1))
      else setPhase('fallback')
    }
  }, [prompt, index])

  useEffect(() => {
    const t = setTimeout(() => load(0), index * 600)
    return () => clearTimeout(t)
  }, [prompt, index, load])

  useEffect(() => {
    return () => { if (blobSrc) URL.revokeObjectURL(blobSrc) }
  }, [blobSrc])

  return (
    <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-md print:shadow-none" style={{ background: '#F5F0FF' }}>
      {phase === 'loading' && <WatercolorShimmer />}
      {phase === 'fallback' && (
        <>
          <StoryFallback index={index} />
          <button
            onClick={() => load(0)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/80 hover:bg-white text-violet-600 text-xs font-medium px-4 py-1.5 rounded-full shadow transition-colors cursor-pointer"
          >
            Повторить загрузку
          </button>
        </>
      )}
      {phase === 'done' && blobSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobSrc}
          alt={`Иллюстрация ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
        />
      )}
    </div>
  )
}

// ─── Story view ───────────────────────────────────────────────────────────────

function StoryView({
  story, onBack, onSave, alreadySaved, storyRef,
  onDownloadPDF, pdfLoading, pdfError, onShare, shareStatus,
}: {
  story: Story; onBack: () => void; onSave: () => void; alreadySaved: boolean
  storyRef: React.RefObject<HTMLDivElement | null>; onDownloadPDF: () => void
  pdfLoading: boolean; pdfError: string; onShare: () => void
  shareStatus: 'idle' | 'copied' | 'copied-tg'
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 pb-16 print:px-0">
      <div ref={storyRef}>
        <div className="text-center mb-10 print:mb-6">
          <h2 className="text-3xl font-bold print:text-black" style={{ color: '#4C1D95' }}>{story.title}</h2>
        </div>

        <div className="space-y-12 print:space-y-8">
          {story.scenes.map((scene, i) => (
            <div key={i} className="flex flex-col gap-5">
              <StoryImage prompt={scene.imagePrompt} index={i} />
              <p className="text-gray-700 leading-relaxed text-lg print:text-base" style={{ fontFamily: 'Georgia, serif' }}>
                {scene.text}
              </p>
            </div>
          ))}
        </div>

        {story.discussion && story.discussion.length > 0 && (
          <div className="mt-14 print:mt-10 print:break-before-page">
            <div className="rounded-2xl px-6 py-4 mb-6 text-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              <h3 className="text-white font-bold text-lg">💬 Поговорите с ребёнком</h3>
            </div>
            <div className="space-y-4">
              {story.discussion.map((q, i) => (
                <div key={i} className="flex gap-4 items-start bg-violet-50 rounded-2xl p-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ background: '#7C3AED' }}>
                    {i + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed text-sm pt-0.5">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {story.anchor && (
          <div className="mt-6 rounded-2xl p-5 print:break-inside-avoid" style={{ background: '#FFFBEB', border: '2px solid #FCD34D' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🪄</span>
              <h4 className="text-amber-700 font-bold text-sm">{story.anchor.title}</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{story.anchor.description}</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 print:hidden">
        <button
          onClick={onBack}
          className="h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={{ background: '#F3EEFF', color: '#6D28D9' }}
        >
          ← Новая сказка
        </button>
        <button
          onClick={onSave}
          disabled={alreadySaved}
          className="h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={alreadySaved ? { background: '#D1FAE5', color: '#065F46' } : { background: '#FCD34D', color: '#78350F' }}
        >
          {alreadySaved ? '✓ Сохранено' : '🔖 Сохранить'}
        </button>
        <button
          onClick={onShare}
          className="h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          style={shareStatus !== 'idle' ? { background: '#D1FAE5', color: '#065F46' } : { background: '#E0F2FE', color: '#0369A1' }}
        >
          {shareStatus !== 'idle' ? '✓ Скопировано' : '↗ Поделиться'}
        </button>
        <button
          onClick={onDownloadPDF}
          disabled={pdfLoading}
          className="h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          style={{ background: '#7C3AED', color: '#fff' }}
        >
          {pdfLoading ? '⏳ Создаём...' : '📄 Скачать PDF'}
        </button>
      </div>
      {pdfError && <p className="mt-4 text-center text-sm text-red-500 print:hidden">{pdfError}</p>}
    </main>
  )
}

// ─── Paywall ──────────────────────────────────────────────────────────────────

function Paywall({ onPaid }: { onPaid: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [screen, setScreen] = useState<'choose' | 'code'>('choose')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const telegramId = typeof window !== 'undefined'
    ? (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } } }).Telegram?.WebApp?.initDataUnsafe?.user?.id
    : undefined

  const buyYookassa = async (plan: 'three_stories' | 'unlimited_30d') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/yookassa/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, telegramId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.confirmationUrl
    } catch {
      setLoading(null)
      alert('Ошибка создания платежа, попробуйте позже')
    }
  }

  const redeemCode = async () => {
    if (!code.trim()) return
    setCodeLoading(true)
    setCodeError('')
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCodeError(data.error || 'Неверный код'); return }
      setPaidUntil(Date.now() + 30 * 24 * 60 * 60 * 1000)
      onPaid()
    } catch { setCodeError('Ошибка сети, попробуйте ещё раз') }
    finally { setCodeLoading(false) }
  }

  if (screen === 'code') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(76,29,149,0.5)' }}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <button onClick={() => setScreen('choose')} className="text-gray-400 text-sm mb-4 cursor-pointer">← Назад</button>
        <div className="text-4xl mb-3 text-center">🔑</div>
        <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#4C1D95' }}>Код активации</h3>
        <p className="text-gray-500 text-sm mb-5 text-center">Введите код, полученный от поддержки</p>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
          placeholder="XXXXXXXX"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-violet-400 mb-3"
          maxLength={8}
        />
        {codeError && <p className="text-red-500 text-sm text-center mb-3">{codeError}</p>}
        <button
          onClick={redeemCode}
          disabled={codeLoading || code.length < 6}
          className="w-full rounded-2xl py-3.5 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          style={{ background: '#7C3AED' }}
        >
          {codeLoading ? '⏳ Проверяем...' : '✅ Активировать'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(76,29,149,0.5)' }}>
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">📖</div>
          <h2 className="text-xl font-bold" style={{ color: '#4C1D95' }}>Продолжить создавать сказки</h2>
          <p className="text-gray-500 text-sm mt-1">Выберите тариф</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="rounded-2xl p-3 text-center" style={{ border: '2px solid #FDE68A', background: '#FFFBEB' }}>
            <div className="text-sm font-bold" style={{ color: '#B45309' }}>3 сказки</div>
            <div className="text-2xl font-bold text-gray-800 my-1">149 ₽</div>
            <div className="text-xs text-gray-400">СБП · Карта</div>
          </div>
          <div className="rounded-2xl p-3 text-center relative" style={{ border: '2px solid #C4B5FD', background: '#F5F3FF' }}>
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#7C3AED' }}>Выгоднее</div>
            <div className="text-sm font-bold" style={{ color: '#6D28D9' }}>30 дней</div>
            <div className="text-2xl font-bold text-gray-800 my-1">349 ₽</div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: '#7C3AED' }}>∞ Безлимит</div>
            <div className="text-xs text-gray-400">СБП · Карта</div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => buyYookassa('three_stories')}
              disabled={!!loading}
              className="rounded-2xl py-3.5 font-semibold text-white text-sm flex items-center justify-center cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #F59E0B, #D97706)' }}
            >
              {loading === 'three_stories' ? '⏳' : '💳 149 ₽'}
            </button>
            <button
              onClick={() => buyYookassa('unlimited_30d')}
              disabled={!!loading}
              className="rounded-2xl py-3.5 font-semibold text-white text-sm flex items-center justify-center cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(to right, #7C3AED, #A855F7)' }}
            >
              {loading === 'unlimited_30d' ? '⏳' : '💳 349 ₽'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">СБП · Карта · SberPay · Mir Pay</p>
          <button onClick={() => setScreen('code')} className="w-full text-xs text-gray-400 py-1.5 cursor-pointer hover:text-gray-600">
            Есть код активации →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'reading'>('idle')
  const [story, setStory] = useState<Story | null>(null)
  const [currentChildName, setCurrentChildName] = useState('')
  const [error, setError] = useState('')
  const [savedStories, setSavedStories] = useState<SavedStory[]>([])
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'copied-tg'>('idle')
  const [showPaywall, setShowPaywall] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [extraStories, setExtraStoriesState] = useState(0)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormData>({
    childName: '',
    age: '3-4 года',
    hero: '',
    situation: '',
    situationType: 'fear',
    favorites: '',
    lesson: '',
  })

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    setSavedStories(loadSaved())
    setUsageCount(getDailyUsage())
    setExtraStoriesState(getExtraStories())

    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id')
    const plan = params.get('plan')
    if (paymentId && plan) {
      window.history.replaceState({}, '', '/')
      setCheckingPayment(true)
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const r = await fetch(`/api/yookassa/check?payment_id=${paymentId}`)
          const data = await r.json()
          if (data.paid) {
            if (data.plan === 'unlimited_30d') setPaidUntil(Date.now() + 30 * 24 * 60 * 60 * 1000)
            else setExtraStoriesCount(getExtraStories() + 3)
            setUsageCount(getDailyUsage())
            setExtraStoriesState(getExtraStories())
            setCheckingPayment(false)
            setShowPaywall(false)
            return
          }
        } catch { /* keep polling */ }
        if (attempts < 20) setTimeout(poll, 3000)
        else { setCheckingPayment(false); setShowPaywall(true) }
      }
      poll()
    }
  }, [])

  const generateStory = async (data: FormData) => {
    if (!canGenerate()) { setShowPaywall(true); return }
    setStatus('loading')
    setError('')
    setAlreadySaved(false)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Ошибка генерации'); setStatus('idle'); return }
      const extra = getExtraStories()
      if (extra > 0) { setExtraStoriesCount(extra - 1); setExtraStoriesState(extra - 1) }
      else { incrementDailyUsage(); setUsageCount(getDailyUsage()) }
      setStory(json)
      setCurrentChildName(data.childName)
      setAlreadySaved(false)
      setStatus('done')
    } catch {
      setError('Не удалось подключиться к серверу.')
      setStatus('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await generateStory(form) }

  const handleRandom = async () => {
    const r = pick(R_SITUATIONS)
    const randomForm: FormData = {
      childName: pick(R_NAMES),
      age: pick(R_AGES),
      hero: pick(R_HEROES),
      situation: r.situation,
      situationType: r.situationType,
      favorites: pick(R_FAVS),
      lesson: '',
    }
    setForm(randomForm)
    await generateStory(randomForm)
  }

  const handleSave = () => {
    if (!story) return
    const entry: SavedStory = { id: Date.now().toString(), savedAt: new Date().toLocaleDateString('ru-RU'), childName: currentChildName, story }
    const updated = [entry, ...savedStories]
    setSavedStories(updated)
    saveTos(updated)
    setAlreadySaved(true)
  }

  const handleDelete = (id: string) => {
    const updated = savedStories.filter(s => s.id !== id)
    setSavedStories(updated)
    saveTos(updated)
  }

  const handleOpenSaved = (saved: SavedStory) => {
    setStory(saved.story)
    setCurrentChildName(saved.childName)
    setAlreadySaved(true)
    setStatus('reading')
  }

  const handleShare = async () => {
    if (!story) return
    const text = `${story.title}\n\n${story.scenes.map(s => s.text).join('\n\n')}`
    const isTelegram = !!window.Telegram?.WebApp
    if (!isTelegram && navigator.share) {
      try { await navigator.share({ title: story.title, text }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      setShareStatus(isTelegram ? 'copied-tg' : 'copied')
      setTimeout(() => setShareStatus('idle'), 3000)
    }
  }

  const handleDownloadPDF = async () => {
    if (!story) return
    setPdfLoading(true)
    setPdfError('')
    try {
      const dataUrls = await Promise.all(story.scenes.map(async (scene, i) => {
        try {
          const res = await fetch(imageUrl(scene.imagePrompt, i) + '&retry=0')
          if (!res.ok) return null
          const blob = await res.blob()
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch { return null }
      }))

      const images = await Promise.all(dataUrls.map(url => {
        if (!url) return Promise.resolve(null)
        return new Promise<HTMLImageElement | null>(resolve => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = url
        })
      }))

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const SCALE = isMobile ? 1.5 : 2
      const W = 794, M = 48, CW = W - M * 2, LH = 22, IMG_H = Math.round(CW * 2 / 3)

      const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
        ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
        ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
        ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y)
        ctx.closePath()
      }
      const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
        const words = text.split(' '), lines: string[] = []
        let line = ''
        for (const word of words) {
          const test = line ? `${line} ${word}` : word
          if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word }
          else line = test
        }
        if (line) lines.push(line)
        return lines
      }

      const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 1
      const tCtx = tmp.getContext('2d')!
      let totalH = M + 56
      for (let i = 0; i < story.scenes.length; i++) {
        totalH += IMG_H + 16
        tCtx.font = '15px Georgia,serif'
        totalH += wrap(tCtx, story.scenes[i].text, CW).length * LH + 36
      }
      if (story.discussion?.length) { totalH += 56; for (const q of story.discussion) { tCtx.font = '14px Arial'; totalH += Math.max(32, wrap(tCtx, q, CW - 44).length * 20) + 14 } }
      if (story.anchor) { tCtx.font = '13px Arial'; totalH += wrap(tCtx, story.anchor.description, CW - 24).length * 20 + 70 }
      totalH += M

      const canvas = document.createElement('canvas')
      canvas.width = W * SCALE; canvas.height = totalH * SCALE
      const ctx = canvas.getContext('2d')!
      ctx.scale(SCALE, SCALE)
      ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, 0, W, totalH)

      let y = M
      ctx.fillStyle = '#4C1D95'; ctx.font = 'bold 24px Georgia,serif'; ctx.textAlign = 'center'
      ctx.fillText(story.title, W/2, y+30); y += 56; ctx.textAlign = 'left'

      for (let i = 0; i < story.scenes.length; i++) {
        if (images[i]) { ctx.save(); rrect(ctx, M, y, CW, IMG_H, 10); ctx.clip(); ctx.drawImage(images[i]!, M, y, CW, IMG_H); ctx.restore() }
        else { ctx.fillStyle = '#EDE9FE'; ctx.fillRect(M, y, CW, IMG_H) }
        y += IMG_H + 16
        ctx.fillStyle = '#374151'; ctx.font = '15px Georgia,serif'
        for (const line of wrap(ctx, story.scenes[i].text, CW)) { ctx.fillText(line, M, y+15); y += LH }
        y += 36
      }

      if (story.discussion?.length) {
        ctx.fillStyle = '#7C3AED'; rrect(ctx, M, y, CW, 40, 10); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center'
        ctx.fillText('Поговорите с ребёнком', W/2, y+26); y += 54; ctx.textAlign = 'left'
        for (let i = 0; i < story.discussion.length; i++) {
          ctx.fillStyle = '#7C3AED'; ctx.beginPath(); ctx.arc(M+14, y+14, 14, 0, Math.PI*2); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'
          ctx.fillText(String(i+1), M+14, y+19); ctx.textAlign = 'left'
          ctx.fillStyle = '#374151'; ctx.font = '14px Arial'
          const qLines = wrap(ctx, story.discussion[i], CW-44); let qy = y+2
          for (const line of qLines) { ctx.fillText(line, M+36, qy+14); qy += 20 }
          y += Math.max(32, qLines.length*20)+14
        }
      }

      if (story.anchor) {
        y += 14; ctx.font = '13px Arial'
        const aLines = wrap(ctx, story.anchor.description, CW-24)
        const boxH = 20+22+aLines.length*20+16
        ctx.strokeStyle = '#FCD34D'; ctx.lineWidth = 2
        rrect(ctx, M, y, CW, boxH, 10); ctx.fillStyle = '#FFFBEB'; ctx.fill(); ctx.stroke()
        y += 14; ctx.fillStyle = '#B45309'; ctx.font = 'bold 13px Arial'
        ctx.fillText(`🪄 ${story.anchor.title}`, M+12, y+13); y += 26
        ctx.fillStyle = '#555'; ctx.font = '13px Arial'
        for (const line of aLines) { ctx.fillText(line, M+12, y+13); y += 20 }
      }

      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight()
      const pdfMargin = 10, imgW = pageW - pdfMargin*2
      const imgH = (canvas.height * imgW) / canvas.width
      const usableH = pageH - pdfMargin*2
      const totalPages = Math.ceil(imgH / usableH)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', pdfMargin, pdfMargin - page*usableH, imgW, imgH)
      }

      const isTelegram = !!window.Telegram?.WebApp
      if (isTelegram) {
        const blob = pdf.output('blob'), url = URL.createObjectURL(blob)
        const opened = window.open(url, '_blank')
        if (!opened) pdf.save(`${story.title}.pdf`)
        setTimeout(() => URL.revokeObjectURL(url), 30000)
      } else {
        pdf.save(`${story.title}.pdf`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setPdfError(`Ошибка PDF: ${msg.slice(0, 120)}`)
    } finally {
      setPdfLoading(false)
    }
  }

  const currentSitType = SITUATION_TYPES.find(t => t.id === form.situationType)!
  const freeTodayLeft = Math.max(0, 1 - usageCount)
  const showForm = isPremium() || usageCount < 1 || extraStories > 0

  return (
    <div className="min-h-screen print:bg-white" style={{ background: 'linear-gradient(160deg, #FFFDF5 0%, #F5F0FF 60%, #FFF0E8 100%)' }}>
      {/* Checking payment overlay */}
      {checkingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(76,29,149,0.5)' }}>
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#4C1D95' }}>Проверяем оплату...</h2>
            <p className="text-gray-500 text-sm">СБП-платёж подтверждается банком, обычно до 30 секунд</p>
          </div>
        </div>
      )}

      {!checkingPayment && showPaywall && (
        <Paywall onPaid={() => { setShowPaywall(false); setUsageCount(getDailyUsage()); setExtraStoriesState(getExtraStories()) }} />
      )}

      {/* Header */}
      <header className="relative text-center pt-12 pb-8 px-4 overflow-hidden print:py-4">
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-4xl">📖</span>
          </div>
          <h1 className="text-4xl font-bold print:text-black" style={{ color: '#4C1D95', fontFamily: 'Georgia, serif' }}>
            Волшебная Сказка
          </h1>
          <p className="mt-2 text-base" style={{ color: '#7C3AED' }}>
            Персональная сказка для вашего ребёнка — за минуту
          </p>

          {status === 'idle' && (
            <div className="mt-3 flex justify-center">
              {isPremium() ? (
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#6D28D9' }}>⭐ Премиум активен</span>
              ) : usageCount < 1 || extraStories > 0 ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  {extraStories > 0 ? `Куплено сказок: ${extraStories}` : `Осталось бесплатно: ${freeTodayLeft}`}
                </span>
              ) : (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="text-xs text-white px-4 py-1.5 rounded-full cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: '#7C3AED' }}
                >
                  🔒 Открыть доступ →
                </button>
              )}
            </div>
          )}
        </div>
        <Stars />
        <Clouds />
      </header>

      {/* Paywall screen (no form access) */}
      {status === 'idle' && !showForm && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#4C1D95' }}>Бесплатные сказки закончились</h2>
            <p className="text-gray-500 mb-8">Разблокируйте доступ, чтобы создавать персональные сказки для вашего ребёнка</p>
            <button
              onClick={() => setShowPaywall(true)}
              className="w-full rounded-2xl py-4 text-white font-bold text-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #7C3AED, #A855F7)' }}
            >
              ✨ Разблокировать сказки
            </button>
            <p className="text-xs text-gray-400 mt-4">От 149 ₽ · СБП · Карта · SberPay</p>
          </div>
        </main>
      )}

      {/* Form */}
      {status === 'idle' && showForm && (
        <main className="max-w-2xl mx-auto px-4 pb-16">

          {/* Features strip */}
          <div className="bg-white/70 backdrop-blur rounded-2xl px-5 py-4 mb-5 grid grid-cols-2 gap-y-2 gap-x-4">
            {([
              ['📖', 'Уникальная сказка за минуту'],
              ['🎨', 'Иллюстрации от ИИ'],
              ['💬', 'Вопросы для разговора с ребёнком'],
              ['📄', 'PDF для скачивания и печати'],
            ] as [string, string][]).map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{icon}</span>
                <span className="text-gray-500 text-xs">{text}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            {/* Quick start button */}
            <button
              type="button"
              onClick={handleRandom}
              className="w-full rounded-2xl py-3.5 font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity mb-2"
              style={{ background: 'linear-gradient(to right, #EDE9FE, #FDE8D8)', color: '#6D28D9' }}
            >
              🎲 Мне повезёт! — создать сказку прямо сейчас
            </button>
            <p className="text-center text-xs text-gray-400 mb-5">Нажми — мы заполним всё сами и создадим сказку</p>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">или заполни сам</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6D28D9' }}>
                    Имя ребёнка <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="childName"
                    value={form.childName}
                    onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
                    required
                    placeholder="Маша"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent text-gray-800 text-sm"
                    style={{ ['--tw-ring-color' as string]: '#C4B5FD' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6D28D9' }}>Возраст</label>
                  <select
                    name="age"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 text-gray-800 text-sm"
                  >
                    <option>1-2 года</option>
                    <option>3-4 года</option>
                    <option>5-6 лет</option>
                    <option>7-8 лет</option>
                    <option>9-10 лет</option>
                  </select>
                </div>
              </div>

              {/* Hero */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6D28D9' }}>
                  Главный герой <span className="text-red-400">*</span>
                </label>
                <input
                  name="hero"
                  value={form.hero}
                  onChange={e => setForm(f => ({ ...f, hero: e.target.value }))}
                  required
                  placeholder="котёнок Пушок, дракончик Огонёк, щенок Бобик..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 text-gray-800 text-sm"
                />
              </div>

              {/* Situation type selector */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#6D28D9' }}>
                  О чём сказка <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {SITUATION_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, situationType: t.id, situation: '' }))}
                      className="rounded-xl py-2 px-1 text-center text-xs font-medium transition-all cursor-pointer"
                      style={form.situationType === t.id
                        ? { background: '#7C3AED', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
                        : { background: '#F5F3FF', color: '#6D28D9', border: '1px solid #EDE9FE' }
                      }
                    >
                      <div className="text-base mb-0.5">{t.emoji}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  name="situation"
                  value={form.situation}
                  onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
                  required
                  placeholder={currentSitType.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 text-gray-800 text-sm"
                />
              </div>

              {/* Favorites */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6D28D9' }}>
                  Любимые вещи и интересы
                </label>
                <input
                  name="favorites"
                  value={form.favorites}
                  onChange={e => setForm(f => ({ ...f, favorites: e.target.value }))}
                  placeholder="динозавры, мороженое, рисование, космос..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 text-gray-800 text-sm"
                />
              </div>

              {/* Lesson */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6D28D9' }}>
                  Чему учит сказка
                </label>
                <input
                  name="lesson"
                  value={form.lesson}
                  onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
                  placeholder="смелость, дружба, доброта, честность..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 text-gray-800 text-sm"
                />
              </div>

              {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{error}</div>}

              <button
                type="submit"
                className="w-full text-white rounded-2xl py-4 font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'linear-gradient(to right, #7C3AED, #A855F7)' }}
              >
                ✨ Создать сказку для {form.childName || 'ребёнка'}
              </button>
            </form>
          </div>

          {/* Saved stories */}
          {savedStories.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold" style={{ color: '#4C1D95', fontFamily: 'Georgia, serif' }}>📚 Мои сказки</h2>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#6D28D9' }}>{savedStories.length}</span>
              </div>
              <div className="space-y-2">
                {savedStories.map(saved => (
                  <div key={saved.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4">
                    <button onClick={() => handleOpenSaved(saved)} className="flex-1 text-left">
                      <div className="font-medium text-gray-800 text-sm">{saved.story.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{saved.childName} · {saved.savedAt}</div>
                    </button>
                    <button
                      onClick={() => handleDelete(saved.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xl leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-lg p-16 text-center">
            <div className="relative inline-block mb-6">
              <div className="text-6xl animate-bounce">🪄</div>
              <div className="absolute -top-1 -right-2 text-2xl animate-spin" style={{ animationDuration: '3s' }}>✨</div>
            </div>
            <h2 className="text-2xl font-semibold" style={{ color: '#4C1D95', fontFamily: 'Georgia, serif' }}>
              Сказка создаётся...
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Волшебство занимает около минуты</p>
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#C4B5FD', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Story */}
      {(status === 'done' || status === 'reading') && story && (
        <StoryView
          story={story}
          onBack={() => { setStatus('idle'); setStory(null) }}
          onSave={handleSave}
          alreadySaved={alreadySaved}
          storyRef={storyRef}
          onDownloadPDF={handleDownloadPDF}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          onShare={handleShare}
          shareStatus={shareStatus}
        />
      )}
    </div>
  )
}
