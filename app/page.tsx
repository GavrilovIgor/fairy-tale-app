'use client'

import { useState, useEffect, useRef } from 'react'

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

const FREE_LIMIT = 3
const USAGE_KEY = 'fairy-tale-usage'
const PAID_UNTIL_KEY = 'fairy-tale-paid-until'

function getUsageCount(): number {
  try { return parseInt(localStorage.getItem(USAGE_KEY) || '0', 10) } catch { return 0 }
}
function incrementUsage() {
  try { localStorage.setItem(USAGE_KEY, String(getUsageCount() + 1)) } catch { /* */ }
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
  return isPremium() || getUsageCount() < FREE_LIMIT
}

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

interface FormData {
  childName: string
  age: string
  hero: string
  fear: string
  favorites: string
  lesson: string
}

const STORAGE_KEY = 'fairy-tale-saved-stories'

const R_NAMES  = ['Маша', 'Саша', 'Дима', 'Аня', 'Ваня', 'Катя', 'Петя', 'Оля', 'Коля', 'Соня', 'Миша', 'Даша', 'Лёша', 'Юля']
const R_AGES   = ['3-4 года', '5-6 лет', '7-8 лет', '9-10 лет']
const R_HEROES = ['котёнок Пушок', 'дракончик Огонёк', 'щенок Бобик', 'лисёнок Рыжик', 'медвежонок Топтыжка', 'зайчонок Ушастик', 'черепашка Тихоня', 'ёжик Колючка', 'совёнок Мудрик', 'бельчонок Рыжик', 'поросёнок Хрюша', 'лягушонок Прыгун']
const R_FEARS  = ['боится темноты', 'боится собак', 'не хочет делиться', 'боится идти к врачу', 'не любит есть овощи', 'боится остаться одному', 'боится громких звуков', 'не хочет ложиться спать', 'боится сделать ошибку', 'не хочет идти в садик', 'боится потеряться', 'не хочет есть новую еду']
const R_FAVS   = ['динозавры и космос', 'мороженое и рисование', 'машинки и конструктор', 'принцессы и единороги', 'футбол и мультики', 'кошки и пазлы', 'роботы и лего', 'рыбки и раскраски', 'музыка и танцы', 'сказки и звёзды']
const R_LESSONS = ['смелость', 'дружба', 'доброта', 'честность', 'терпение', 'щедрость', 'забота о природе', 'уважение к старшим', 'умение просить прощения']

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function loadSaved(): SavedStory[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveTos(stories: SavedStory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
}

function imageUrl(prompt: string, index: number): string {
  const base = prompt.trim().slice(0, 120)
  return `/api/image?prompt=${encodeURIComponent(base)}&seed=${index * 137 + 42}`
}

function StoryImage({ prompt, index }: { prompt: string; index: number }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [active, setActive] = useState(index === 0)

  useEffect(() => {
    if (index > 0) {
      const t = setTimeout(() => setActive(true), 5000)
      return () => clearTimeout(t)
    }
  }, [index])

  const src = `${imageUrl(prompt, index)}&retry=${retry}`

  return (
    <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-orange-50 shadow-lg print:shadow-none">
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl animate-spin">🎨</div>
          <span className="text-xs text-orange-300">Рисуем...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl">🖼️</div>
          <span className="text-xs text-orange-300 mb-1">Не удалось загрузить</span>
          <button
            onClick={() => { setError(false); setLoaded(false); setRetry(r => r + 1) }}
            className="text-xs text-orange-400 underline cursor-pointer"
          >
            Повторить
          </button>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {active && (
        <img
          key={src}
          src={src}
          alt={`Иллюстрация ${index + 1}`}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  )
}

function StoryView({
  story,
  onBack,
  onSave,
  alreadySaved,
  storyRef,
  onDownloadPDF,
  pdfLoading,
  pdfError,
  onShare,
  shareStatus,
}: {
  story: Story
  onBack: () => void
  onSave: () => void
  alreadySaved: boolean
  storyRef: React.RefObject<HTMLDivElement | null>
  onDownloadPDF: () => void
  pdfLoading: boolean
  pdfError: string
  onShare: () => void
  shareStatus: 'idle' | 'copied' | 'copied-tg'
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 pb-16 print:px-0">
      <div ref={storyRef}>
        <div className="text-center mb-12 print:mb-6">
          <h2 className="text-3xl font-bold text-purple-800 print:text-black">{story.title}</h2>
        </div>

        <div className="space-y-12 print:space-y-8">
          {story.scenes.map((scene, i) => (
            <div key={i} className="flex flex-col gap-5">
              <StoryImage prompt={scene.imagePrompt} index={i} />
              <p className="text-gray-700 leading-relaxed text-lg print:text-base">{scene.text}</p>
            </div>
          ))}
        </div>

        {story.discussion && story.discussion.length > 0 && (
          <div className="mt-14 print:mt-10 print:break-before-page">
            <div className="bg-purple-600 rounded-2xl px-6 py-4 mb-6 text-center">
              <h3 className="text-white font-bold text-lg">Поговорите с ребёнком</h3>
            </div>
            <div className="space-y-5">
              {story.discussion.map((q, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed pt-1">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {story.anchor && (
          <div className="mt-8 border-2 border-amber-400 rounded-2xl p-6 bg-amber-50 print:break-inside-avoid">
            <h4 className="text-amber-600 font-bold text-base mb-2">
              Предмет-якорь: {story.anchor.title}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">{story.anchor.description}</p>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 print:hidden">
        <button
          onClick={onBack}
          className="h-12 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5"
        >
          ← Новая сказка
        </button>
        <button
          onClick={onSave}
          disabled={alreadySaved}
          className={`h-12 rounded-xl transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 ${
            alreadySaved
              ? 'bg-green-100 text-green-600'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {alreadySaved ? '✓ Сохранено' : '🔖 Сохранить'}
        </button>
        <button
          onClick={onShare}
          className={`h-12 rounded-xl transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-1.5 ${
            shareStatus !== 'idle'
              ? 'bg-green-100 text-green-600'
              : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}
        >
          {shareStatus !== 'idle' ? '✓ Скопировано' : '↗ Поделиться'}
        </button>
        <button
          onClick={onDownloadPDF}
          disabled={pdfLoading}
          className="h-12 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-60 text-sm font-medium flex items-center justify-center gap-1.5"
        >
          {pdfLoading ? '⏳ Создаём...' : '📄 Скачать PDF'}
        </button>
      </div>
      {pdfError && (
        <p className="mt-4 text-center text-sm text-red-500 print:hidden">{pdfError}</p>
      )}
    </main>
  )
}

function Paywall({ onPaid }: { onPaid: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [screen, setScreen] = useState<'choose' | 'code'>('choose')
  const [payMethod, setPayMethod] = useState<'rub' | 'stars'>('rub')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp

  const telegramId = typeof window !== 'undefined'
    ? window.Telegram?.WebApp && (window as unknown as { Telegram: { WebApp: { initDataUnsafe?: { user?: { id?: number } } } } }).Telegram?.WebApp?.initDataUnsafe?.user?.id
    : undefined

  // Оплата через ЮКассу (СБП + карта + SberPay)
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

  const buyStars = async (plan: 'three_stories' | 'unlimited_30d') => {
    setLoading(plan)
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { invoiceLink } = await res.json()
      window.Telegram!.WebApp.openInvoice(invoiceLink, (status) => {
        if (status === 'paid') {
          if (plan === 'unlimited_30d') setPaidUntil(Date.now() + 30 * 24 * 60 * 60 * 1000)
          else localStorage.setItem(USAGE_KEY, String(Math.max(0, getUsageCount() - 3)))
          onPaid()
        }
        setLoading(null)
      })
    } catch { setLoading(null) }
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

  // Экран: ввод кода (резервный, если что-то пошло не так)
  if (screen === 'code') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <button onClick={() => setScreen('choose')} className="text-gray-400 text-sm mb-4 cursor-pointer">← Назад</button>
        <div className="text-4xl mb-3 text-center">🔑</div>
        <h3 className="text-xl font-bold text-purple-800 mb-2 text-center">Код активации</h3>
        <p className="text-gray-500 text-sm mb-5 text-center">Введите код, полученный от поддержки</p>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
          placeholder="XXXXXXXX"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-purple-400 mb-3"
          maxLength={8}
        />
        {codeError && <p className="text-red-500 text-sm text-center mb-3">{codeError}</p>}
        <button
          onClick={redeemCode}
          disabled={codeLoading || code.length < 6}
          className="w-full rounded-2xl py-3.5 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {codeLoading ? '⏳ Проверяем...' : '✅ Активировать'}
        </button>
      </div>
    </div>
  )

  // Главный экран
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-xl font-bold text-purple-800">Продолжить создавать сказки</h2>
          <p className="text-gray-500 text-sm mt-1">Выберите тариф</p>
        </div>

        {/* Тарифы */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="border-2 border-orange-200 rounded-2xl p-3 text-center">
            <div className="text-sm font-bold text-orange-500">3 сказки</div>
            <div className="text-2xl font-bold text-gray-800 my-1">149 ₽</div>
            <div className="text-xs text-gray-400">СБП · Карта · SberPay</div>
          </div>
          <div className="border-2 border-purple-300 rounded-2xl p-3 text-center bg-purple-50 relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">Выгоднее</div>
            <div className="text-sm font-bold text-purple-600">30 дней</div>
            <div className="text-2xl font-bold text-gray-800 my-1">349 ₽</div>
            <div className="text-xs text-gray-400">Безлимит · СБП · Карта</div>
          </div>
        </div>

        {/* Переключатель способа оплаты — только в Telegram */}
        {isTelegram && (
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
            <button
              onClick={() => setPayMethod('rub')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all cursor-pointer ${payMethod === 'rub' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
            >
              💳 Рублями
            </button>
            <button
              onClick={() => setPayMethod('stars')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all cursor-pointer ${payMethod === 'stars' ? 'bg-white shadow text-amber-500' : 'text-gray-400'}`}
            >
              ⭐ Stars
            </button>
          </div>
        )}

        {/* Кнопки оплаты */}
        <div className="space-y-2.5">
          {(!isTelegram || payMethod === 'rub') && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => buyYookassa('three_stories')}
                  disabled={!!loading}
                  className="rounded-2xl py-3.5 font-semibold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(to right, #2da562, #1a8a4a)' }}
                >
                  {loading === 'three_stories' ? '⏳' : '💳 149 ₽'}
                </button>
                <button
                  onClick={() => buyYookassa('unlimited_30d')}
                  disabled={!!loading}
                  className="rounded-2xl py-3.5 font-semibold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
                >
                  {loading === 'unlimited_30d' ? '⏳' : '💳 349 ₽'}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">СБП · Карта · SberPay · Mir Pay</p>
            </>
          )}

          {isTelegram && payMethod === 'stars' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => buyStars('three_stories')}
                  disabled={!!loading}
                  className="rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }}
                >
                  {loading === 'three_stories' ? '⏳' : '⭐ 49 Stars'}
                </button>
                <button
                  onClick={() => buyStars('unlimited_30d')}
                  disabled={!!loading}
                  className="rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(to right, #f59e0b, #b45309)' }}
                >
                  {loading === 'unlimited_30d' ? '⏳' : '⭐ 249 Stars'}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">3 сказки · 30 дней безлимита</p>
            </>
          )}

          <button
            onClick={() => setScreen('code')}
            className="w-full text-xs text-gray-400 py-1.5 cursor-pointer hover:text-gray-600"
          >
            Есть код активации →
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [checkingPayment, setCheckingPayment] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<FormData>({
    childName: '',
    age: '3-4 года',
    hero: '',
    fear: '',
    favorites: '',
    lesson: '',
  })

  useEffect(() => {
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    setSavedStories(loadSaved())
    const count = getUsageCount()
    setUsageCount(count)

    // Проверить возврат с ЮКассы по payment_id в URL
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id')
    const plan = params.get('plan')
    if (paymentId && plan) {
      window.history.replaceState({}, '', '/')
      setCheckingPayment(true)

      // Поллинг: проверяем каждые 3 сек до 20 попыток (60 сек)
      let attempts = 0
      const poll = async () => {
        attempts++
        try {
          const r = await fetch(`/api/yookassa/check?payment_id=${paymentId}`)
          const data = await r.json()
          if (data.paid) {
            if (data.plan === 'unlimited_30d') {
              setPaidUntil(Date.now() + 30 * 24 * 60 * 60 * 1000)
            } else {
              // 3 сказки — сбросить счётчик так чтобы осталось 3 попытки
              localStorage.setItem(USAGE_KEY, String(Math.max(0, getUsageCount() - 3)))
            }
            setUsageCount(getUsageCount())
            setCheckingPayment(false)
            setShowPaywall(false)
            return
          }
        } catch { /* продолжаем попытки */ }

        if (attempts < 20) {
          setTimeout(poll, 3000)
        } else {
          // Таймаут — показываем инструкцию с кодом активации
          setCheckingPayment(false)
          setShowPaywall(true)
        }
      }
      poll()
      return
    }

    if (count >= FREE_LIMIT && !isPremium()) {
      setShowPaywall(true)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const generateStory = async (data: FormData) => {
    if (!canGenerate()) {
      setShowPaywall(true)
      return
    }
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
      if (!res.ok) {
        setError(json.error || 'Ошибка генерации')
        setStatus('idle')
        return
      }
      incrementUsage()
      setUsageCount(getUsageCount())
      setStory(json)
      setCurrentChildName(data.childName)
      setAlreadySaved(false)
      setStatus('done')
    } catch {
      setError('Не удалось подключиться к серверу.')
      setStatus('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await generateStory(form)
  }

  const handleRandom = async () => {
    const randomForm: FormData = {
      childName: pick(R_NAMES),
      age: pick(R_AGES),
      hero: pick(R_HEROES),
      fear: pick(R_FEARS),
      favorites: pick(R_FAVS),
      lesson: pick(R_LESSONS),
    }
    setForm(randomForm)
    await generateStory(randomForm)
  }

  const handleSave = () => {
    if (!story) return
    const entry: SavedStory = {
      id: Date.now().toString(),
      savedAt: new Date().toLocaleDateString('ru-RU'),
      childName: currentChildName,
      story,
    }
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
      try {
        await navigator.share({ title: story.title, text })
      } catch {
        // user cancelled — do nothing
      }
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
      // 1. Скачиваем картинки как data URL
      const dataUrls = await Promise.all(
        story.scenes.map(async (scene, i) => {
          try {
            // &retry=0 совпадает с URL из StoryImage — берём из браузерного кеша
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
        })
      )

      // 2. Загружаем Image-объекты
      const images = await Promise.all(dataUrls.map(url => {
        if (!url) return Promise.resolve(null)
        return new Promise<HTMLImageElement | null>(resolve => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = url
        })
      }))

      // 3. Рисуем PDF через нативный Canvas (поддерживает кириллицу, без html2canvas)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const SCALE = isMobile ? 1.5 : 2
      const W = 794
      const M = 48
      const CW = W - M * 2
      const LH = 22
      const IMG_H = Math.round(CW * 2 / 3)

      const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
      }

      const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] => {
        const words = text.split(' ')
        const lines: string[] = []
        let line = ''
        for (const word of words) {
          const test = line ? `${line} ${word}` : word
          if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word }
          else line = test
        }
        if (line) lines.push(line)
        return lines
      }

      // Измеряем высоту контента
      const tmp = document.createElement('canvas')
      tmp.width = W; tmp.height = 1
      const tCtx = tmp.getContext('2d')!
      let totalH = M + 56
      for (let i = 0; i < story.scenes.length; i++) {
        totalH += IMG_H + 16
        tCtx.font = '15px Arial'
        totalH += wrap(tCtx, story.scenes[i].text, CW).length * LH + 36
      }
      if (story.discussion?.length) {
        totalH += 56
        for (const q of story.discussion) {
          tCtx.font = '14px Arial'
          totalH += Math.max(32, wrap(tCtx, q, CW - 44).length * 20) + 14
        }
      }
      if (story.anchor) {
        tCtx.font = '13px Arial'
        totalH += wrap(tCtx, story.anchor.description, CW - 24).length * 20 + 70
      }
      totalH += M

      // Создаём canvas нужного размера
      const canvas = document.createElement('canvas')
      canvas.width = W * SCALE
      canvas.height = totalH * SCALE
      const ctx = canvas.getContext('2d')!
      ctx.scale(SCALE, SCALE)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, totalH)

      let y = M

      // Заголовок
      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(story.title, W / 2, y + 30)
      y += 56
      ctx.textAlign = 'left'

      // Сцены
      for (let i = 0; i < story.scenes.length; i++) {
        if (images[i]) {
          ctx.save()
          rrect(ctx, M, y, CW, IMG_H, 10)
          ctx.clip()
          ctx.drawImage(images[i]!, M, y, CW, IMG_H)
          ctx.restore()
        } else {
          ctx.fillStyle = '#f3e8ff'
          ctx.fillRect(M, y, CW, IMG_H)
        }
        y += IMG_H + 16
        ctx.fillStyle = '#333333'
        ctx.font = '15px Arial'
        for (const line of wrap(ctx, story.scenes[i].text, CW)) {
          ctx.fillText(line, M, y + 15); y += LH
        }
        y += 36
      }

      // Вопросы для обсуждения
      if (story.discussion?.length) {
        ctx.fillStyle = '#7c3aed'
        rrect(ctx, M, y, CW, 40, 10); ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 15px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Поговорите с ребёнком', W / 2, y + 26)
        y += 54
        ctx.textAlign = 'left'
        for (let i = 0; i < story.discussion.length; i++) {
          ctx.fillStyle = '#7c3aed'
          ctx.beginPath(); ctx.arc(M + 14, y + 14, 14, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(String(i + 1), M + 14, y + 19)
          ctx.textAlign = 'left'
          ctx.fillStyle = '#333333'
          ctx.font = '14px Arial'
          const qLines = wrap(ctx, story.discussion[i], CW - 44)
          let qy = y + 2
          for (const line of qLines) { ctx.fillText(line, M + 36, qy + 14); qy += 20 }
          y += Math.max(32, qLines.length * 20) + 14
        }
      }

      // Предмет-якорь
      if (story.anchor) {
        y += 14
        ctx.font = '13px Arial'
        const aLines = wrap(ctx, story.anchor.description, CW - 24)
        const boxH = 20 + 22 + aLines.length * 20 + 16
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
        rrect(ctx, M, y, CW, boxH, 10)
        ctx.fillStyle = '#fffbeb'; ctx.fill(); ctx.stroke()
        y += 14
        ctx.fillStyle = '#b45309'; ctx.font = 'bold 13px Arial'
        ctx.fillText(`Предмет-якорь: ${story.anchor.title}`, M + 12, y + 13)
        y += 26
        ctx.fillStyle = '#555'; ctx.font = '13px Arial'
        for (const line of aLines) { ctx.fillText(line, M + 12, y + 13); y += 20 }
      }

      // 4. Экспортируем в PDF
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const pdfMargin = 10
      const imgW = pageW - pdfMargin * 2
      const imgH = (canvas.height * imgW) / canvas.width
      const usableH = pageH - pdfMargin * 2
      const totalPages = Math.ceil(imgH / usableH)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', pdfMargin, pdfMargin - page * usableH, imgW, imgH)
      }

      const isTelegram = !!window.Telegram?.WebApp
      if (isTelegram) {
        const blob = pdf.output('blob')
        const url = URL.createObjectURL(blob)
        const opened = window.open(url, '_blank')
        if (!opened) pdf.save(`${story.title}.pdf`)
        setTimeout(() => URL.revokeObjectURL(url), 30000)
      } else {
        pdf.save(`${story.title}.pdf`)
      }
    } catch (err) {
      console.error('PDF error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setPdfError(`Ошибка PDF: ${msg.slice(0, 120)}`)
    } finally {
      setPdfLoading(false)
    }
  }

  const storiesLeft = isPremium() ? '∞' : Math.max(0, FREE_LIMIT - usageCount)

  return (
    <div className="min-h-screen print:bg-white" style={{ background: 'linear-gradient(160deg, #FFFBF4 0%, #FFF3E3 50%, #FFE9D5 100%)' }}>
      {checkingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h2 className="text-xl font-bold text-purple-800 mb-2">Проверяем оплату...</h2>
            <p className="text-gray-500 text-sm">СБП-платёж подтверждается банком, обычно до 30 секунд</p>
          </div>
        </div>
      )}
      {!checkingPayment && showPaywall && (
        <Paywall onPaid={() => { setShowPaywall(false); setUsageCount(getUsageCount()) }} />
      )}
      <header className="text-center py-10 print:py-4">
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-4xl font-bold text-purple-800 print:text-black">Волшебная Сказка</h1>
        {status === 'idle' && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <p className="text-orange-400">Персональная сказка для вашего ребёнка</p>
            {!isPremium() && usageCount < FREE_LIMIT && (
              <span className="text-xs text-gray-400 bg-white/70 rounded-full px-3 py-1">
                Осталось бесплатных сказок: {storiesLeft}
              </span>
            )}
            {!isPremium() && usageCount >= FREE_LIMIT && (
              <button
                onClick={() => setShowPaywall(true)}
                className="text-xs text-white bg-purple-500 hover:bg-purple-600 rounded-full px-4 py-1.5 cursor-pointer transition-colors"
              >
                🔒 Открыть доступ →
              </button>
            )}
            {isPremium() && (
              <span className="text-xs text-purple-500 bg-purple-50 rounded-full px-3 py-1">⭐ Премиум активен</span>
            )}
          </div>
        )}
      </header>

      {status === 'idle' && !isPremium() && usageCount >= FREE_LIMIT && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-purple-800 mb-3">Вы использовали все бесплатные сказки</h2>
            <p className="text-gray-500 mb-8">Разблокируйте доступ, чтобы создавать персональные сказки для вашего ребёнка</p>
            <button
              onClick={() => setShowPaywall(true)}
              className="w-full rounded-2xl py-4 text-white font-bold text-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #F97316, #F59E0B)' }}
            >
              ✨ Разблокировать сказки
            </button>
            <p className="text-xs text-gray-400 mt-4">От 149 ₽ · СБП или Telegram Stars</p>
          </div>
        </main>
      )}

      {status === 'idle' && (isPremium() || usageCount < FREE_LIMIT) && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-sm px-6 py-5 mb-6">
            <div className="space-y-3">
              {([
                ['📖', 'Уникальная сказка по вашему запросу'],
                ['🎨', '2 акварельные иллюстрации от ИИ'],
                ['🧠', 'Вопросы для обсуждения с ребёнком'],
                ['🪨', 'Предмет-якорь для закрепления урока'],
                ['📄', 'PDF для скачивания и печати'],
              ] as [string, string][]).map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{icon}</span>
                  <span className="text-gray-600 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Кнопка быстрого старта — над формой */}
            <button
              type="button"
              onClick={handleRandom}
              className="w-full rounded-2xl py-3.5 font-semibold text-base hover:opacity-90 transition-opacity cursor-pointer text-purple-700 mb-2"
              style={{ background: 'linear-gradient(to right, #EDE9FE, #FDE8FF)' }}
            >
              🎲 Мне повезёт! — создать сказку прямо сейчас
            </button>
            <p className="text-center text-xs text-gray-400 mb-6">Не хочешь заполнять? Нажми — сделаем случайную сказку за тебя</p>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">или заполни сам</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Имя ребёнка <span className="text-orange-400">*</span>
                  </label>
                  <input
                    name="childName"
                    value={form.childName}
                    onChange={handleChange}
                    required
                    placeholder="Маша"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Возраст</label>
                  <select
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                  >
                    <option>1-2 года</option>
                    <option>3-4 года</option>
                    <option>5-6 лет</option>
                    <option>7-8 лет</option>
                    <option>9-10 лет</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Главный герой или питомец <span className="text-orange-400">*</span>
                </label>
                <input
                  name="hero"
                  value={form.hero}
                  onChange={handleChange}
                  required
                  placeholder="котёнок Пушок, дракончик Огонёк, щенок Бобик..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Страх или проблема ребёнка <span className="text-orange-400">*</span>
                </label>
                <input
                  name="fear"
                  value={form.fear}
                  onChange={handleChange}
                  required
                  placeholder="боится темноты, не хочет делиться, боится собак..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Любимые вещи и интересы</label>
                <input
                  name="favorites"
                  value={form.favorites}
                  onChange={handleChange}
                  placeholder="динозавры, мороженое, рисование, космос..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Урок или ценность сказки</label>
                <input
                  name="lesson"
                  value={form.lesson}
                  onChange={handleChange}
                  placeholder="смелость, дружба, доброта, честность..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <button
                type="submit"
                className="w-full text-white rounded-xl py-3.5 font-semibold text-base hover:opacity-90 transition-opacity cursor-pointer"
                style={{ background: 'linear-gradient(to right, #F97316, #F59E0B)' }}
              >
                ✨ Создать сказку
              </button>
            </form>
          </div>

          {savedStories.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-purple-800">📚 Мои сказки</h2>
                <span className="text-sm text-orange-400">{savedStories.length} сохранено</span>
              </div>
              <div className="space-y-3">
                {savedStories.map(saved => (
                  <div
                    key={saved.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4"
                  >
                    <button onClick={() => handleOpenSaved(saved)} className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{saved.story.title}</div>
                      <div className="text-sm text-gray-400 mt-0.5">
                        {saved.childName} · {saved.savedAt}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(saved.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xl leading-none"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {status === 'loading' && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <div className="text-7xl mb-6 animate-bounce">🪄</div>
            <h2 className="text-2xl font-semibold text-purple-700">Сказка создаётся...</h2>
            <p className="text-gray-400 mt-3">Это займёт около минуты</p>
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-orange-300 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </main>
      )}

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
