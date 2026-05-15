'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
      }
    }
  }
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const DAILY_DATE_KEY  = 'fairy-tale-daily-date'
const DAILY_COUNT_KEY = 'fairy-tale-daily-count'
const EXTRA_KEY       = 'fairy-tale-extra-stories'
const PAID_KEY        = 'fairy-tale-paid-until'

const getTodayStr = () => new Date().toLocaleDateString('en-CA')

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
function getExtra(): number {
  try { return parseInt(localStorage.getItem(EXTRA_KEY) || '0', 10) } catch { return 0 }
}
function setExtra(n: number) {
  try { localStorage.setItem(EXTRA_KEY, String(Math.max(0, n))) } catch { /* */ }
}
function getPaidUntil(): number {
  try { return parseInt(localStorage.getItem(PAID_KEY) || '0', 10) } catch { return 0 }
}
function setPaidUntil(ms: number) {
  try { localStorage.setItem(PAID_KEY, String(ms)) } catch { /* */ }
}
function isPremium() { return getPaidUntil() > Date.now() }
function canGenerate() { return isPremium() || getDailyUsage() < 1 || getExtra() > 0 }

// ── Types ─────────────────────────────────────────────────────────────────────

interface Scene { text: string; imagePrompt: string }
interface Story {
  title: string; scenes: Scene[]
  discussion?: string[]; anchor?: { title: string; description: string }
}
interface SavedStory { id: string; savedAt: string; childName: string; story: Story }
type SituationType = 'fear' | 'emotion' | 'adaptation' | 'behavior' | 'preparation' | 'fun'
interface FormData {
  childName: string; age: string; hero: string
  situation: string; situationType: SituationType; favorites: string; lesson: string
}

// ── Situation config ───────────────────────────────────────────────────────────

const SIT_TYPES: { id: SituationType; emoji: string; label: string; hint: string }[] = [
  { id: 'fear',        emoji: '😨', label: 'Страх',          hint: 'боится темноты, собак, врача, одиночества...' },
  { id: 'emotion',     emoji: '😤', label: 'Эмоции',         hint: 'злится и кричит, ревнует, обижается...' },
  { id: 'adaptation',  emoji: '🏠', label: 'Новое',          hint: 'новый садик, переезд, новая школа...' },
  { id: 'preparation', emoji: '🗓️', label: 'Событие',        hint: 'завтра к врачу, стрижка, первый раз в бассейн...' },
  { id: 'behavior',    emoji: '🤝', label: 'Поведение',      hint: 'не делится, говорит плохие слова...' },
  { id: 'fun',         emoji: '✨', label: 'Просто сказка',  hint: 'весёлое приключение без конкретной проблемы' },
]

// ── Random data ────────────────────────────────────────────────────────────────

const R_NAMES   = ['Маша','Саша','Дима','Аня','Ваня','Катя','Соня','Миша','Даша','Лёша']
const R_AGES    = ['3-4 года','5-6 лет','7-8 лет','9-10 лет']
const R_HEROES  = ['котёнок Пушок','дракончик Огонёк','щенок Бобик','лисёнок Рыжик','медвежонок Топтыжка','зайчонок Ушастик','ёжик Колючка','совёнок Мудрик']
const R_SITS: { situation: string; situationType: SituationType }[] = [
  { situation: 'боится темноты', situationType: 'fear' },
  { situation: 'боится идти к врачу', situationType: 'fear' },
  { situation: 'не хочет идти в новый садик', situationType: 'adaptation' },
  { situation: 'злится и кричит когда не получает своё', situationType: 'emotion' },
  { situation: 'ревнует к младшему братику', situationType: 'emotion' },
  { situation: 'завтра первый раз к стоматологу', situationType: 'preparation' },
]
const R_FAVS = ['динозавры и космос','мороженое и рисование','машинки и конструктор','принцессы и единороги','кошки и пазлы']
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ── Storage ────────────────────────────────────────────────────────────────────

const STORE_KEY = 'fairy-tale-saved-stories'
const loadSaved = (): SavedStory[] => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch { return [] } }
const saveTos   = (s: SavedStory[]) => localStorage.setItem(STORE_KEY, JSON.stringify(s))
const imageUrl  = (p: string, i: number) => `/api/image?prompt=${encodeURIComponent(p.trim().slice(0,120))}&seed=${i*137+42}`

// ── SVG Illustration ───────────────────────────────────────────────────────────

function MagicBookIllustration() {
  return (
    <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      {/* Glow behind book */}
      <ellipse cx="160" cy="220" rx="100" ry="30" fill="rgba(251,191,36,0.2)" />

      {/* Book shadow */}
      <ellipse cx="160" cy="225" rx="80" ry="18" fill="rgba(76,29,149,0.2)" />

      {/* Book back cover */}
      <rect x="70" y="100" width="130" height="110" rx="8" fill="#4C1D95" />

      {/* Book spine */}
      <rect x="64" y="98" width="16" height="114" rx="4" fill="#3B1FA3" />

      {/* Book front cover */}
      <rect x="76" y="94" width="130" height="110" rx="8" fill="#7C3AED" />
      <rect x="76" y="94" width="130" height="110" rx="8" fill="url(#bookGrad)" />

      {/* Book pages (right side) */}
      <rect x="200" y="98" width="8" height="102" rx="2" fill="#EDE9FE" opacity="0.8" />

      {/* Stars on cover */}
      <circle cx="120" cy="135" r="3" fill="#FBBF24" />
      <circle cx="150" cy="120" r="2" fill="#FDE68A" />
      <circle cx="175" cy="140" r="2.5" fill="#FBBF24" />
      <circle cx="135" cy="160" r="2" fill="#FDE68A" />
      <circle cx="165" cy="158" r="1.5" fill="#FDE68A" />

      {/* Moon on cover */}
      <path d="M148 145 A18 18 0 1 0 148 145.1 A12 12 0 1 1 148 145Z" fill="#FBBF24" opacity="0" />
      <circle cx="155" cy="145" r="16" fill="#FBBF24" opacity="0.9" />
      <circle cx="163" cy="139" r="11" fill="#7C3AED" />

      {/* Wand */}
      <rect x="210" y="75" width="4" height="60" rx="2" fill="#FBBF24" transform="rotate(25 212 105)" />
      <polygon points="212,70 207,82 217,82" fill="#FDE68A" transform="rotate(25 212 70)" />

      {/* Floating sparkles */}
      <g className="twinkle" style={{transformOrigin:'85px 75px', animationDelay:'0s'}}>
        <path d="M85 65 L87 73 L95 75 L87 77 L85 85 L83 77 L75 75 L83 73Z" fill="#FBBF24" />
      </g>
      <g className="twinkle" style={{transformOrigin:'240px 120px', animationDelay:'0.8s'}}>
        <path d="M240 113 L241.5 119 L248 120 L241.5 121 L240 127 L238.5 121 L232 120 L238.5 119Z" fill="#F9A8D4" />
      </g>
      <g className="twinkle" style={{transformOrigin:'100px 190px', animationDelay:'1.5s'}}>
        <path d="M100 185 L101.5 190 L107 191 L101.5 192 L100 197 L98.5 192 L93 191 L98.5 190Z" fill="#93C5FD" />
      </g>
      <g className="twinkle" style={{transformOrigin:'230px 175px', animationDelay:'0.4s'}}>
        <path d="M230 170 L231.2 175 L236 176 L231.2 177 L230 182 L228.8 177 L224 176 L228.8 175Z" fill="#FBBF24" />
      </g>
      <g className="twinkle" style={{transformOrigin:'55px 140px', animationDelay:'2s'}}>
        <path d="M55 136 L56 140 L60 141 L56 142 L55 146 L54 142 L50 141 L54 140Z" fill="#A5F3FC" />
      </g>

      <defs>
        <linearGradient id="bookGrad" x1="76" y1="94" x2="206" y2="204" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Shimmer / Fallback for images ──────────────────────────────────────────────

const FALLBACK_SCENES = [
  { bg: ['#FEF3C7','#FDE68A','#FCA5A5'], emoji: '🌅' },
  { bg: ['#EDE9FE','#C4B5FD','#818CF8'], emoji: '✨' },
  { bg: ['#D1FAE5','#6EE7B7','#34D399'], emoji: '🌿' },
]

function StoryImage({ prompt, index }: { prompt: string; index: number }) {
  const [phase, setPhase] = useState<'loading'|'done'|'fallback'>('loading')
  const [blobSrc, setBlobSrc] = useState<string|null>(null)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const load = useCallback(async (attempt = 0) => {
    if (!mounted.current) return
    setPhase('loading'); setBlobSrc(null)
    try {
      const url = attempt > 0 ? `${imageUrl(prompt,index)}&t=${Date.now()}` : imageUrl(prompt,index)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status}`)
      const blob = await res.blob()
      if (!mounted.current) return
      setBlobSrc(URL.createObjectURL(blob)); setPhase('done')
    } catch {
      if (!mounted.current) return
      if (attempt < 3) setTimeout(() => load(attempt+1), 5000*(attempt+1))
      else setPhase('fallback')
    }
  }, [prompt, index])

  useEffect(() => { const t = setTimeout(() => load(0), index*600); return () => clearTimeout(t) }, [prompt, index, load])
  useEffect(() => () => { if (blobSrc) URL.revokeObjectURL(blobSrc) }, [blobSrc])

  const scene = FALLBACK_SCENES[index % FALLBACK_SCENES.length]
  return (
    <div className="relative w-full aspect-[3/2] rounded-3xl overflow-hidden shadow-xl print:shadow-none">
      {phase === 'loading' && (
        <div className="absolute inset-0 watercolor-shimmer flex flex-col items-center justify-center gap-3">
          <div className="text-4xl animate-pulse">🎨</div>
          <span className="text-xs text-violet-400 font-semibold">Иллюстрация создаётся...</span>
        </div>
      )}
      {phase === 'fallback' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{background:`linear-gradient(135deg,${scene.bg[0]},${scene.bg[1]},${scene.bg[2]})`}}>
          <span className="text-5xl">{scene.emoji}</span>
          <button onClick={() => load(0)}
            className="text-xs bg-white/80 hover:bg-white text-violet-700 px-4 py-1.5 rounded-full shadow cursor-pointer transition-colors">
            Повторить загрузку
          </button>
        </div>
      )}
      {phase === 'done' && blobSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={blobSrc} alt={`Иллюстрация ${index+1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity='1' }}
        />
      )}
    </div>
  )
}

// ── Story view ─────────────────────────────────────────────────────────────────

function StoryView({ story, onBack, onSave, alreadySaved, storyRef, onDownloadPDF, pdfLoading, pdfError, onShare, shareStatus }: {
  story: Story; onBack: () => void; onSave: () => void; alreadySaved: boolean
  storyRef: React.RefObject<HTMLDivElement|null>; onDownloadPDF: () => void
  pdfLoading: boolean; pdfError: string; onShare: () => void; shareStatus: 'idle'|'copied'|'copied-tg'
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 pb-20 print:px-0">
      <div ref={storyRef}>
        <div className="text-center mb-12 print:mb-6">
          <h2 className="text-3xl md:text-4xl font-black print:text-black leading-tight" style={{color:'#3B1FA3'}}>
            {story.title}
          </h2>
        </div>
        <div className="space-y-14 print:space-y-8">
          {story.scenes.map((scene, i) => (
            <div key={i} className="flex flex-col gap-6">
              <StoryImage prompt={scene.imagePrompt} index={i} />
              <p className="text-gray-700 leading-loose text-lg print:text-base" style={{fontWeight:600}}>
                {scene.text}
              </p>
            </div>
          ))}
        </div>

        {story.discussion && story.discussion.length > 0 && (
          <div className="mt-14 print:mt-10">
            <div className="rounded-2xl px-6 py-4 mb-6 text-center"
              style={{background:'linear-gradient(135deg,#4C1D95,#7C3AED)'}}>
              <h3 className="text-white font-black text-lg">💬 Поговорите с ребёнком</h3>
            </div>
            <div className="space-y-3">
              {story.discussion.map((q, i) => (
                <div key={i} className="flex gap-4 items-start rounded-2xl p-4" style={{background:'#F5F0FF'}}>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full text-white text-sm font-black flex items-center justify-center"
                    style={{background:'#7C3AED'}}>{i+1}</span>
                  <p className="text-gray-700 leading-relaxed text-sm pt-0.5">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {story.anchor && (
          <div className="mt-6 rounded-2xl p-5 print:break-inside-avoid"
            style={{background:'#FFFBEB', border:'2px solid #FCD34D'}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🪄</span>
              <h4 className="font-black text-sm" style={{color:'#92400E'}}>{story.anchor.title}</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{story.anchor.description}</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 print:hidden">
        {[
          { label:'← Новая сказка', onClick:onBack, style:{background:'#F5F0FF',color:'#6D28D9'} },
          { label: alreadySaved ? '✓ Сохранено' : '🔖 Сохранить', onClick:onSave, disabled:alreadySaved,
            style: alreadySaved ? {background:'#D1FAE5',color:'#065F46'} : {background:'#FBBF24',color:'#78350F'} },
          { label: shareStatus!=='idle' ? '✓ Скопировано' : '↗ Поделиться', onClick:onShare,
            style: shareStatus!=='idle' ? {background:'#D1FAE5',color:'#065F46'} : {background:'#DBEAFE',color:'#1E40AF'} },
          { label: pdfLoading ? '⏳ Создаём...' : '📄 Скачать PDF', onClick:onDownloadPDF, disabled:pdfLoading,
            style:{background:'#4C1D95',color:'#fff'} },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} disabled={(btn as {disabled?:boolean}).disabled}
            className="h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 hover:brightness-95"
            style={btn.style}>{btn.label}</button>
        ))}
      </div>
      {pdfError && <p className="mt-4 text-center text-sm text-red-500 print:hidden">{pdfError}</p>}
    </main>
  )
}

// ── Paywall ────────────────────────────────────────────────────────────────────

function Paywall({ onPaid }: { onPaid: () => void }) {
  const [loading, setLoading] = useState<string|null>(null)
  const [screen, setScreen] = useState<'choose'|'code'>('choose')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const tgId = typeof window !== 'undefined'
    ? (window as unknown as {Telegram?:{WebApp?:{initDataUnsafe?:{user?:{id?:number}}}}}).Telegram?.WebApp?.initDataUnsafe?.user?.id
    : undefined

  const buyYookassa = async (plan: 'three_stories'|'unlimited_30d') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/yookassa/create', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({plan, telegramId:tgId}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.confirmationUrl
    } catch { setLoading(null); alert('Ошибка создания платежа, попробуйте позже') }
  }

  const redeemCode = async () => {
    if (!code.trim()) return
    setCodeLoading(true); setCodeError('')
    try {
      const res = await fetch('/api/redeem', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:code.trim()}) })
      const data = await res.json()
      if (!res.ok) { setCodeError(data.error||'Неверный код'); return }
      setPaidUntil(Date.now() + 30*24*60*60*1000); onPaid()
    } catch { setCodeError('Ошибка сети') }
    finally { setCodeLoading(false) }
  }

  const overlay = "fixed inset-0 z-50 flex items-center justify-center px-4"
  const overlayBg = { background:'rgba(17,7,50,0.7)', backdropFilter:'blur(8px)' }

  if (screen === 'code') return (
    <div className={overlay} style={overlayBg}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <button onClick={() => setScreen('choose')} className="text-gray-400 text-sm mb-4 cursor-pointer hover:text-gray-600">← Назад</button>
        <div className="text-4xl mb-3 text-center">🔑</div>
        <h3 className="text-xl font-black mb-2 text-center" style={{color:'#3B1FA3'}}>Код активации</h3>
        <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
          placeholder="XXXXXXXX"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-violet-400 mb-3 mt-4" maxLength={8} />
        {codeError && <p className="text-red-500 text-sm text-center mb-3">{codeError}</p>}
        <button onClick={redeemCode} disabled={codeLoading||code.length<6}
          className="w-full rounded-2xl py-3.5 text-white font-black transition-all disabled:opacity-50 cursor-pointer hover:brightness-110"
          style={{background:'linear-gradient(135deg,#4C1D95,#7C3AED)'}}>
          {codeLoading ? '⏳ Проверяем...' : '✅ Активировать'}
        </button>
      </div>
    </div>
  )

  return (
    <div className={overlay} style={overlayBg}>
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full" style={{boxShadow:'0 30px 80px rgba(76,29,149,0.4)'}}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📖</div>
          <h2 className="text-xl font-black" style={{color:'#3B1FA3'}}>Продолжить создавать сказки</h2>
          <p className="text-gray-500 text-sm mt-1">Выберите тариф</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { plan:'three_stories' as const, title:'3 сказки', price:'149 ₽', tag:null },
            { plan:'unlimited_30d' as const, title:'30 дней', price:'349 ₽', tag:'Выгоднее', sub:'∞ Безлимит' },
          ].map(t => (
            <div key={t.plan} className="relative rounded-2xl p-4 text-center" style={t.tag ? {background:'#F5F0FF',border:'2px solid #C4B5FD'} : {background:'#FFFBEB',border:'2px solid #FDE68A'}}>
              {t.tag && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'#7C3AED'}}>{t.tag}</div>}
              <div className="text-sm font-bold mt-1" style={{color: t.tag ? '#6D28D9' : '#B45309'}}>{t.title}</div>
              <div className="text-2xl font-black text-gray-900 my-1">{t.price}</div>
              {t.sub && <div className="text-xs font-bold" style={{color:'#7C3AED'}}>{t.sub}</div>}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(['three_stories','unlimited_30d'] as const).map((plan, i) => (
              <button key={plan} onClick={() => buyYookassa(plan)} disabled={!!loading}
                className="rounded-2xl py-3.5 font-black text-white text-sm flex items-center justify-center cursor-pointer disabled:opacity-60 hover:brightness-110 transition-all"
                style={{background: i===0 ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#7C3AED,#4C1D95)'}}>
                {loading===plan ? '⏳' : `💳 ${i===0?'149':'349'} ₽`}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">СБП · Карта · SberPay · Mir Pay</p>
          <button onClick={() => setScreen('code')} className="w-full text-xs text-gray-400 py-1.5 cursor-pointer hover:text-gray-600 transition-colors">
            Есть код активации →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'reading'>('idle')
  const [story, setStory] = useState<Story|null>(null)
  const [currentChildName, setCurrentChildName] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<SavedStory[]>([])
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [shareStatus, setShareStatus] = useState<'idle'|'copied'|'copied-tg'>('idle')
  const [showPaywall, setShowPaywall] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [extra, setExtraState] = useState(0)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<FormData>({
    childName:'', age:'3-4 года', hero:'', situation:'', situationType:'fear', favorites:'', lesson:''
  })

  useEffect(() => {
    window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand()
    setSaved(loadSaved()); setUsageCount(getDailyUsage()); setExtraState(getExtra())
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id'), plan = params.get('plan')
    if (paymentId && plan) {
      window.history.replaceState({}, '', '/'); setCheckingPayment(true)
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const r = await fetch(`/api/yookassa/check?payment_id=${paymentId}`)
          const data = await r.json()
          if (data.paid) {
            if (data.plan==='unlimited_30d') setPaidUntil(Date.now()+30*24*60*60*1000)
            else setExtra(getExtra()+3)
            setUsageCount(getDailyUsage()); setExtraState(getExtra())
            setCheckingPayment(false); setShowPaywall(false); return
          }
        } catch { /* keep polling */ }
        if (attempts<20) setTimeout(poll,3000)
        else { setCheckingPayment(false); setShowPaywall(true) }
      }
      poll()
    }
  }, [])

  const generate = async (data: FormData) => {
    if (!canGenerate()) { setShowPaywall(true); return }
    setStatus('loading'); setError(''); setAlreadySaved(false)
    try {
      const res = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) { setError(json.error||'Ошибка генерации'); setStatus('idle'); return }
      const ex = getExtra()
      if (ex>0) { setExtra(ex-1); setExtraState(ex-1) }
      else { incrementDailyUsage(); setUsageCount(getDailyUsage()) }
      setStory(json); setCurrentChildName(data.childName); setAlreadySaved(false); setStatus('done')
    } catch { setError('Не удалось подключиться к серверу.'); setStatus('idle') }
  }

  const handleRandom = async () => {
    const r = pick(R_SITS)
    const rf: FormData = { childName:pick(R_NAMES), age:pick(R_AGES), hero:pick(R_HEROES), situation:r.situation, situationType:r.situationType, favorites:pick(R_FAVS), lesson:'' }
    setForm(rf); await generate(rf)
  }

  const handleSave = () => {
    if (!story) return
    const entry: SavedStory = { id:Date.now().toString(), savedAt:new Date().toLocaleDateString('ru-RU'), childName:currentChildName, story }
    const updated = [entry,...saved]; setSaved(updated); saveTos(updated); setAlreadySaved(true)
  }

  const handleShare = async () => {
    if (!story) return
    const text = `${story.title}\n\n${story.scenes.map(s=>s.text).join('\n\n')}`
    const isTg = !!window.Telegram?.WebApp
    if (!isTg && navigator.share) { try { await navigator.share({title:story.title,text}) } catch { /* cancelled */ } }
    else { await navigator.clipboard.writeText(text); setShareStatus(isTg?'copied-tg':'copied'); setTimeout(()=>setShareStatus('idle'),3000) }
  }

  const handleDownloadPDF = async () => {
    if (!story) return
    setPdfLoading(true); setPdfError('')
    try {
      const dataUrls = await Promise.all(story.scenes.map(async (scene,i) => {
        try {
          const res = await fetch(imageUrl(scene.imagePrompt,i)+'&retry=0')
          if (!res.ok) return null
          const blob = await res.blob()
          return new Promise<string>((resolve,reject) => { const r=new FileReader(); r.onload=()=>resolve(r.result as string); r.onerror=reject; r.readAsDataURL(blob) })
        } catch { return null }
      }))
      const images = await Promise.all(dataUrls.map(url => url ? new Promise<HTMLImageElement|null>(resolve => { const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>resolve(null); img.src=url }) : Promise.resolve(null)))
      const SCALE=2, W=794, M=48, CW=W-M*2, LH=22, IMG_H=Math.round(CW*2/3)
      const rrect=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
      const wrap=(ctx:CanvasRenderingContext2D,text:string,maxW:number):string[]=>{const words=text.split(' '),lines:string[]=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=word}else line=test};if(line)lines.push(line);return lines}
      const tmp=document.createElement('canvas');tmp.width=W;tmp.height=1;const tCtx=tmp.getContext('2d')!
      let totalH=M+60;for(let i=0;i<story.scenes.length;i++){totalH+=IMG_H+16;tCtx.font='16px Nunito,sans-serif';totalH+=wrap(tCtx,story.scenes[i].text,CW).length*LH+36}
      if(story.discussion?.length){totalH+=60;for(const q of story.discussion){tCtx.font='14px Nunito,sans-serif';totalH+=Math.max(36,wrap(tCtx,q,CW-44).length*20)+14}}
      if(story.anchor){tCtx.font='13px Nunito,sans-serif';totalH+=wrap(tCtx,story.anchor.description,CW-24).length*20+70}
      totalH+=M
      const canvas=document.createElement('canvas');canvas.width=W*SCALE;canvas.height=totalH*SCALE;const ctx=canvas.getContext('2d')!;ctx.scale(SCALE,SCALE)
      ctx.fillStyle='#FFFDF5';ctx.fillRect(0,0,W,totalH)
      let y=M;ctx.fillStyle='#3B1FA3';ctx.font='bold 26px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(story.title,W/2,y+32);y+=60;ctx.textAlign='left'
      for(let i=0;i<story.scenes.length;i++){
        if(images[i]){ctx.save();rrect(ctx,M,y,CW,IMG_H,12);ctx.clip();ctx.drawImage(images[i]!,M,y,CW,IMG_H);ctx.restore()}else{ctx.fillStyle='#EDE9FE';ctx.fillRect(M,y,CW,IMG_H)}
        y+=IMG_H+16;ctx.fillStyle='#374151';ctx.font='600 16px Nunito,sans-serif';for(const line of wrap(ctx,story.scenes[i].text,CW)){ctx.fillText(line,M,y+15);y+=LH};y+=36
      }
      if(story.discussion?.length){ctx.fillStyle='#4C1D95';rrect(ctx,M,y,CW,42,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 15px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('Поговорите с ребёнком',W/2,y+28);y+=56;ctx.textAlign='left';for(let i=0;i<story.discussion.length;i++){ctx.fillStyle='#7C3AED';ctx.beginPath();ctx.arc(M+14,y+14,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),M+14,y+19);ctx.textAlign='left';ctx.fillStyle='#374151';ctx.font='14px Nunito,sans-serif';const qLines=wrap(ctx,story.discussion[i],CW-44);let qy=y+2;for(const line of qLines){ctx.fillText(line,M+36,qy+14);qy+=20};y+=Math.max(36,qLines.length*20)+14}}
      if(story.anchor){y+=14;ctx.font='13px Nunito,sans-serif';const aLines=wrap(ctx,story.anchor.description,CW-24);const boxH=20+24+aLines.length*20+16;ctx.strokeStyle='#FCD34D';ctx.lineWidth=2;rrect(ctx,M,y,CW,boxH,10);ctx.fillStyle='#FFFBEB';ctx.fill();ctx.stroke();y+=16;ctx.fillStyle='#92400E';ctx.font='bold 13px Nunito,sans-serif';ctx.fillText(`🪄 ${story.anchor.title}`,M+12,y+13);y+=26;ctx.fillStyle='#555';ctx.font='13px Nunito,sans-serif';for(const line of aLines){ctx.fillText(line,M+12,y+13);y+=20}}
      const {jsPDF}=await import('jspdf');const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
      const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),pdfM=10,imgW=pageW-pdfM*2,imgH=(canvas.height*imgW)/canvas.width,usableH=pageH-pdfM*2
      const imgData=canvas.toDataURL('image/jpeg',0.85)
      for(let page=0;page<Math.ceil(imgH/usableH);page++){if(page>0)pdf.addPage();pdf.addImage(imgData,'JPEG',pdfM,pdfM-page*usableH,imgW,imgH)}
      const isTg=!!window.Telegram?.WebApp
      if(isTg){const blob=pdf.output('blob'),url=URL.createObjectURL(blob);const opened=window.open(url,'_blank');if(!opened)pdf.save(`${story.title}.pdf`);setTimeout(()=>URL.revokeObjectURL(url),30000)}
      else pdf.save(`${story.title}.pdf`)
    } catch(err){const msg=err instanceof Error?err.message:String(err);setPdfError(`Ошибка PDF: ${msg.slice(0,120)}`)}
    finally{setPdfLoading(false)}
  }

  const currentSit = SIT_TYPES.find(t => t.id === form.situationType)!
  const showForm = isPremium() || usageCount < 1 || extra > 0

  return (
    <div className="min-h-screen print:bg-white" style={{background:'#FFFDF5'}}>

      {/* Payment checking overlay */}
      {checkingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(17,7,50,0.7)',backdropFilter:'blur(8px)'}}>
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center" style={{boxShadow:'0 30px 80px rgba(76,29,149,0.4)'}}>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h2 className="text-xl font-black mb-2" style={{color:'#3B1FA3'}}>Проверяем оплату...</h2>
            <p className="text-gray-500 text-sm">СБП-платёж подтверждается банком</p>
          </div>
        </div>
      )}

      {!checkingPayment && showPaywall && (
        <Paywall onPaid={() => { setShowPaywall(false); setUsageCount(getDailyUsage()); setExtraState(getExtra()) }} />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      {(status === 'idle' || status === 'loading') && (
        <section className="relative overflow-hidden print:hidden" style={{background:'linear-gradient(135deg,#2D1167 0%,#4C1D95 40%,#6D28D9 100%)'}}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large glowing orbs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20" style={{background:'radial-gradient(circle,#FBBF24,transparent)'}} />
            <div className="absolute -bottom-10 -left-20 w-60 h-60 rounded-full opacity-15" style={{background:'radial-gradient(circle,#A78BFA,transparent)'}} />
            {/* Star dots */}
            {[[15,20],[30,60],[70,15],[85,45],[90,80],[10,75],[50,5],[60,90],[40,50],[80,25]].map(([x,y],i) => (
              <div key={i} className="absolute rounded-full twinkle" style={{left:`${x}%`,top:`${y}%`,width:i%3===0?4:2,height:i%3===0?4:2,background:'white',opacity:0.4,animationDelay:`${i*0.3}s`}} />
            ))}
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row items-center gap-10">
            {/* Left: text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-bold"
                style={{background:'rgba(251,191,36,0.15)',color:'#FBBF24',border:'1px solid rgba(251,191,36,0.3)'}}>
                ✨ Персональная сказка за 1 минуту
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                Волшебная<br />
                <span className="gradient-text">Сказка</span>
              </h1>
              <p className="text-lg text-violet-200 leading-relaxed mb-8 max-w-md">
                Введите имя ребёнка, его страх или ситуацию — ИИ создаст уникальную сказку с иллюстрациями специально для него
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                {[['📖','Уникальный сюжет'],['🎨','AI-иллюстрации'],['⚡','За 1 минуту'],['💛','Бесплатно попробовать']].map(([icon,label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-violet-200 text-sm font-semibold">{label}</span>
                  </div>
                ))}
              </div>

              {/* Status pill */}
              <div className="mt-6 flex justify-center md:justify-start">
                {isPremium() ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{background:'rgba(251,191,36,0.2)',color:'#FBBF24'}}>
                    ⭐ Премиум активен
                  </span>
                ) : usageCount < 1 || extra > 0 ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{background:'rgba(255,255,255,0.15)',color:'#E9D5FF'}}>
                    {extra > 0 ? `Куплено сказок: ${extra}` : '3 сказки бесплатно'}
                  </span>
                ) : (
                  <button onClick={() => setShowPaywall(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold cursor-pointer hover:brightness-110 transition-all"
                    style={{background:'#FBBF24',color:'#78350F'}}>
                    🔒 Открыть доступ →
                  </button>
                )}
              </div>
            </div>

            {/* Right: illustration */}
            <div className="flex-shrink-0 w-64 md:w-80 float-slow">
              <MagicBookIllustration />
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
            <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 md:h-16" fill="#FFFDF5">
              <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"/>
            </svg>
          </div>
        </section>
      )}

      {/* ── PAYWALL SCREEN ───────────────────────────────────── */}
      {status === 'idle' && !showForm && (
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-black mb-3" style={{color:'#3B1FA3'}}>Бесплатные сказки закончились</h2>
            <p className="text-gray-500 mb-8">Разблокируйте доступ — создавайте сказки для любой ситуации</p>
            <button onClick={() => setShowPaywall(true)}
              className="w-full rounded-2xl py-4 text-white font-black text-lg cursor-pointer hover:brightness-110 transition-all glow-purple"
              style={{background:'linear-gradient(135deg,#4C1D95,#7C3AED)'}}>
              ✨ Разблокировать сказки
            </button>
            <p className="text-xs text-gray-400 mt-4">От 149 ₽ · СБП · Карта · SberPay</p>
          </div>
        </main>
      )}

      {/* ── FORM ─────────────────────────────────────────────── */}
      {status === 'idle' && showForm && (
        <main className="relative max-w-2xl mx-auto px-4 py-10 pb-20">
          {/* Subtle background decoration */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full opacity-30" style={{background:'radial-gradient(circle,#EDE9FE,transparent)'}} />
            <div className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full opacity-20" style={{background:'radial-gradient(circle,#FDE8D8,transparent)'}} />
          </div>

          {/* Quick start */}
          <div className="mb-6 rounded-3xl p-6 text-center" style={{background:'linear-gradient(135deg,#F5F0FF,#FFF0E8)',border:'2px dashed #C4B5FD'}}>
            <p className="text-sm text-violet-500 font-semibold mb-3">Хочешь попробовать прямо сейчас?</p>
            <button type="button" onClick={handleRandom}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-base cursor-pointer hover:brightness-110 transition-all glow-purple"
              style={{background:'linear-gradient(135deg,#7C3AED,#4C1D95)'}}>
              🎲 Мне повезёт! — создать сказку
            </button>
            <p className="text-xs text-violet-400 mt-2">Нажми — мы заполним всё сами</p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{background:'#E9D5FF'}} />
            <span className="text-sm font-bold" style={{color:'#7C3AED'}}>или заполни сам</span>
            <div className="flex-1 h-px" style={{background:'#E9D5FF'}} />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl p-6 md:p-8" style={{boxShadow:'0 20px 60px rgba(76,29,149,0.12)'}}>
            <form onSubmit={async e => { e.preventDefault(); await generate(form) }} className="space-y-6">

              {/* Name + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest" style={{color:'#6D28D9'}}>
                    Имя ребёнка <span style={{color:'#EF4444'}}>*</span>
                  </label>
                  <input name="childName" value={form.childName} required placeholder="Маша"
                    onChange={e => setForm(f => ({...f,childName:e.target.value}))}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                    style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}} />
                </div>
                <div>
                  <label className="block text-xs font-black mb-2 uppercase tracking-widest" style={{color:'#6D28D9'}}>Возраст</label>
                  <select name="age" value={form.age} onChange={e => setForm(f => ({...f,age:e.target.value}))}
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                    style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}}>
                    {['1-2 года','3-4 года','5-6 лет','7-8 лет','9-10 лет'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Hero */}
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-widest" style={{color:'#6D28D9'}}>
                  Главный герой <span style={{color:'#EF4444'}}>*</span>
                </label>
                <input name="hero" value={form.hero} required placeholder="котёнок Пушок, дракончик Огонёк, щенок Бобик..."
                  onChange={e => setForm(f => ({...f,hero:e.target.value}))}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                  style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}} />
              </div>

              {/* Situation type */}
              <div>
                <label className="block text-xs font-black mb-3 uppercase tracking-widest" style={{color:'#6D28D9'}}>
                  О чём сказка <span style={{color:'#EF4444'}}>*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {SIT_TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setForm(f => ({...f,situationType:t.id,situation:''}))}
                      className="rounded-2xl py-3 px-2 text-center text-xs font-black transition-all cursor-pointer"
                      style={form.situationType === t.id
                        ? {background:'linear-gradient(135deg,#4C1D95,#7C3AED)',color:'#fff',boxShadow:'0 4px 16px rgba(124,58,237,0.4)'}
                        : {background:'#F5F0FF',color:'#6D28D9',border:'2px solid #EDE9FE'}}>
                      <div className="text-lg mb-1">{t.emoji}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input name="situation" value={form.situation} required placeholder={currentSit.hint}
                  onChange={e => setForm(f => ({...f,situation:e.target.value}))}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                  style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}} />
              </div>

              {/* Favorites */}
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-widest" style={{color:'#6D28D9'}}>Любимые вещи</label>
                <input name="favorites" value={form.favorites} placeholder="динозавры, мороженое, космос, рисование..."
                  onChange={e => setForm(f => ({...f,favorites:e.target.value}))}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                  style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}} />
              </div>

              {/* Lesson */}
              <div>
                <label className="block text-xs font-black mb-2 uppercase tracking-widest" style={{color:'#6D28D9'}}>Чему учит сказка</label>
                <input name="lesson" value={form.lesson} placeholder="смелость, дружба, доброта, честность..."
                  onChange={e => setForm(f => ({...f,lesson:e.target.value}))}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 transition-shadow"
                  style={{border:'2px solid #EDE9FE', background:'#FAFAFA'}} />
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{background:'#FEE2E2',color:'#B91C1C'}}>{error}</div>
              )}

              <button type="submit"
                className="w-full text-white rounded-2xl py-4 font-black text-base hover:brightness-110 transition-all cursor-pointer"
                style={{background:'linear-gradient(135deg,#7C3AED,#4C1D95)',boxShadow:'0 8px 30px rgba(124,58,237,0.4)'}}>
                ✨ Создать сказку {form.childName ? `для ${form.childName}` : ''}
              </button>
            </form>
          </div>

          {/* Saved stories */}
          {saved.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black" style={{color:'#3B1FA3'}}>📚 Мои сказки</h2>
                <span className="text-xs px-3 py-1 rounded-full font-bold" style={{background:'#EDE9FE',color:'#6D28D9'}}>{saved.length}</span>
              </div>
              <div className="space-y-2">
                {saved.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    style={{boxShadow:'0 2px 12px rgba(76,29,149,0.08)'}}>
                    <button onClick={() => { setStory(s.story); setCurrentChildName(s.childName); setAlreadySaved(true); setStatus('reading') }} className="flex-1 text-left">
                      <div className="font-black text-gray-800 text-sm">{s.story.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-semibold">{s.childName} · {s.savedAt}</div>
                    </button>
                    <button onClick={() => { const u=saved.filter(x=>x.id!==s.id); setSaved(u); saveTos(u) }}
                      className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xl leading-none">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── LOADING ───────────────────────────────────────────── */}
      {status === 'loading' && (
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl p-16 text-center" style={{boxShadow:'0 20px 60px rgba(76,29,149,0.12)'}}>
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center float-anim"
                style={{background:'linear-gradient(135deg,#EDE9FE,#DDD6FE)'}}>
                <span className="text-5xl">🪄</span>
              </div>
              <div className="absolute -top-2 -right-2 text-2xl twinkle">✨</div>
              <div className="absolute -bottom-2 -left-2 text-xl twinkle" style={{animationDelay:'0.7s'}}>⭐</div>
            </div>
            <h2 className="text-2xl font-black mb-2" style={{color:'#3B1FA3'}}>Создаём сказку...</h2>
            <p className="text-gray-500 text-sm font-semibold">Волшебство занимает около минуты</p>
            <div className="mt-8 flex justify-center gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full animate-pulse"
                  style={{background:'#C4B5FD',animationDelay:`${i*0.2}s`}} />
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── STORY ─────────────────────────────────────────────── */}
      {(status === 'done' || status === 'reading') && story && (
        <StoryView story={story} onBack={() => { setStatus('idle'); setStory(null) }}
          onSave={handleSave} alreadySaved={alreadySaved} storyRef={storyRef}
          onDownloadPDF={handleDownloadPDF} pdfLoading={pdfLoading} pdfError={pdfError}
          onShare={handleShare} shareStatus={shareStatus} />
      )}
    </div>
  )
}
