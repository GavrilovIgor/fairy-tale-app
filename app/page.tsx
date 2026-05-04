'use client'

import { useState, useEffect } from 'react'

interface Scene {
  text: string
  imagePrompt: string
}

interface Story {
  title: string
  scenes: Scene[]
}

interface FormData {
  childName: string
  age: string
  hero: string
  fear: string
  favorites: string
  lesson: string
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

  // Stagger image requests: 0s, 4s, 8s
  useEffect(() => {
    if (index > 0) {
      const t = setTimeout(() => setActive(true), index * 4000)
      return () => clearTimeout(t)
    }
  }, [index])

  const src = `${imageUrl(prompt, index)}&retry=${retry}`

  return (
    <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-purple-50 shadow-lg print:shadow-none">
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl animate-spin">🎨</div>
          <span className="text-xs text-purple-300">Рисуем...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="text-3xl">🖼️</div>
          <span className="text-xs text-purple-300 mb-1">Не удалось загрузить</span>
          <button
            onClick={() => { setError(false); setLoaded(false); setRetry(r => r + 1) }}
            className="text-xs text-purple-400 underline cursor-pointer"
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

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [story, setStory] = useState<Story | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>({
    childName: '',
    age: '5-6 лет',
    hero: '',
    fear: '',
    favorites: '',
    lesson: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка генерации')
        setStatus('idle')
        return
      }

      setStory(data)
      setStatus('done')
    } catch {
      setError('Не удалось подключиться. Проверьте что Ollama запущен.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 print:bg-white">
      <header className="text-center py-10 print:py-4">
        <h1 className="text-4xl font-bold text-purple-800 print:text-black">✨ Волшебная Сказка</h1>
        {status !== 'done' && (
          <p className="text-purple-400 mt-2">Персональная сказка для вашего ребёнка</p>
        )}
      </header>

      {status === 'idle' && (
        <main className="max-w-2xl mx-auto px-4 pb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Имя ребёнка <span className="text-pink-500">*</span>
                  </label>
                  <input
                    name="childName"
                    value={form.childName}
                    onChange={handleChange}
                    required
                    placeholder="Маша"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Возраст</label>
                  <select
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                  >
                    <option>3-4 лет</option>
                    <option>5-6 лет</option>
                    <option>7-8 лет</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Главный герой или питомец <span className="text-pink-500">*</span>
                </label>
                <input
                  name="hero"
                  value={form.hero}
                  onChange={handleChange}
                  required
                  placeholder="котёнок Пушок, дракончик Огонёк, щенок Бобик..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Страх или проблема ребёнка <span className="text-pink-500">*</span>
                </label>
                <input
                  name="fear"
                  value={form.fear}
                  onChange={handleChange}
                  required
                  placeholder="боится темноты, не хочет делиться, боится собак..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Любимые вещи и интересы</label>
                <input
                  name="favorites"
                  value={form.favorites}
                  onChange={handleChange}
                  placeholder="динозавры, мороженое, рисование, космос..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Урок или ценность сказки</label>
                <input
                  name="lesson"
                  value={form.lesson}
                  onChange={handleChange}
                  placeholder="смелость, дружба, доброта, честность..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl py-3.5 font-semibold text-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                ✨ Создать сказку
              </button>
            </form>
          </div>
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
                  className="w-3 h-3 rounded-full bg-purple-300 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {status === 'done' && story && (
        <main className="max-w-3xl mx-auto px-4 pb-16 print:px-0">
          <div className="text-center mb-12 print:mb-6">
            <h2 className="text-3xl font-bold text-purple-800 print:text-black">{story.title}</h2>
          </div>

          <div className="space-y-14 print:space-y-8">
            {story.scenes.map((scene, i) => (
              <div
                key={i}
                className={`flex gap-8 items-start print:gap-4 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0 w-56 print:w-40">
                  <StoryImage prompt={scene.imagePrompt} index={i} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed text-lg print:text-base">{scene.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-4 justify-center print:hidden">
            <button
              onClick={() => { setStatus('idle'); setStory(null) }}
              className="px-6 py-3 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              ← Новая сказка
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer"
            >
              🖨️ Распечатать
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
