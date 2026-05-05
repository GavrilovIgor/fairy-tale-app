'use client'

import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    Telegram?: { WebApp: { ready: () => void; expand: () => void } }
  }
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
}: {
  story: Story
  onBack: () => void
  onSave: () => void
  alreadySaved: boolean
  storyRef: React.RefObject<HTMLDivElement | null>
  onDownloadPDF: () => void
  pdfLoading: boolean
  pdfError: string
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

      <div className="mt-12 flex gap-3 justify-center print:hidden flex-wrap">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
        >
          ← Новая сказка
        </button>
        <button
          onClick={onSave}
          disabled={alreadySaved}
          className={`px-5 py-3 rounded-xl transition-colors cursor-pointer ${
            alreadySaved
              ? 'bg-green-100 text-green-600 border border-green-300'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {alreadySaved ? '✓ Сохранено' : '🔖 Сохранить'}
        </button>
        <button
          onClick={onDownloadPDF}
          disabled={pdfLoading}
          className="px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-60"
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

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'reading'>('idle')
  const [story, setStory] = useState<Story | null>(null)
  const [currentChildName, setCurrentChildName] = useState('')
  const [error, setError] = useState('')
  const [savedStories, setSavedStories] = useState<SavedStory[]>([])
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
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
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    setAlreadySaved(false)

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
      setCurrentChildName(form.childName)
      setAlreadySaved(false)
      setStatus('done')
    } catch {
      setError('Не удалось подключиться к серверу.')
      setStatus('idle')
    }
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

  const handleDownloadPDF = async () => {
    if (!story) return
    setPdfLoading(true)
    setPdfError('')

    // Контейнер создаём заранее — finally гарантирует удаление
    const container = document.createElement('div')
    document.body.appendChild(container)

    try {
      // Скачиваем картинки как data URL напрямую по URL из данных сказки
      const dataUrls = await Promise.all(
        story.scenes.map(async (scene, i) => {
          try {
            const res = await fetch(imageUrl(scene.imagePrompt, i))
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

      // Строим DOM с чистыми inline-стилями — без Tailwind/oklch, иначе html2canvas падает
      Object.assign(container.style, {
        position: 'fixed', top: '0', left: '0',
        opacity: '0.01', zIndex: '-9999', pointerEvents: 'none',
        width: '794px', padding: '48px', background: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#222222', boxSizing: 'border-box',
      } as CSSStyleDeclaration)

      const add = (tag: string, styles: string, text?: string): HTMLElement => {
        const el = document.createElement(tag)
        el.style.cssText = styles
        if (text !== undefined) el.textContent = text
        return el
      }

      container.appendChild(add('h1',
        'text-align:center;font-size:26px;font-weight:700;margin:0 0 36px;color:#1a1a1a;font-family:Arial,Helvetica,sans-serif',
        story.title
      ))

      for (let i = 0; i < story.scenes.length; i++) {
        if (dataUrls[i]) {
          const img = document.createElement('img')
          img.src = dataUrls[i]!
          img.style.cssText = 'width:100%;display:block;margin-bottom:18px;border-radius:10px'
          container.appendChild(img)
        }
        container.appendChild(add('p',
          'font-size:15px;line-height:1.8;margin:0 0 36px;color:#333;font-family:Arial,Helvetica,sans-serif',
          story.scenes[i].text
        ))
      }

      if (story.discussion?.length) {
        container.appendChild(add('div',
          'background:#7c3aed;color:#fff;font-size:16px;font-weight:700;text-align:center;padding:14px;border-radius:12px;margin:12px 0 20px;font-family:Arial,Helvetica,sans-serif',
          'Поговорите с ребёнком'
        ))
        for (let i = 0; i < story.discussion.length; i++) {
          const row = add('div', 'overflow:hidden;margin-bottom:16px')
          row.appendChild(add('div',
            'float:left;width:28px;height:28px;background:#7c3aed;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;margin-right:12px;font-family:Arial,Helvetica,sans-serif',
            String(i + 1)
          ))
          row.appendChild(add('p',
            'margin:0 0 0 40px;font-size:14px;line-height:1.7;color:#333;padding-top:4px;font-family:Arial,Helvetica,sans-serif',
            story.discussion[i]
          ))
          container.appendChild(row)
        }
      }

      if (story.anchor) {
        const box = add('div', 'border:2px solid #f59e0b;border-radius:12px;padding:18px 22px;background:#fffbeb;margin-top:16px')
        box.appendChild(add('h4',
          'color:#b45309;font-weight:700;font-size:14px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif',
          `Предмет-якорь: ${story.anchor.title}`
        ))
        box.appendChild(add('p',
          'color:#555;font-size:13px;line-height:1.6;margin:0;font-family:Arial,Helvetica,sans-serif',
          story.anchor.description
        ))
        container.appendChild(box)
      }

      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: false,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width
      const usableH = pageH - margin * 2
      const totalPages = Math.ceil(imgH / usableH)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', margin, margin - page * usableH, imgW, imgH)
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
      setPdfError(`Не удалось создать PDF: ${msg.slice(0, 100)}`)
    } finally {
      document.body.removeChild(container)
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen print:bg-white" style={{ background: 'linear-gradient(160deg, #FFFBF4 0%, #FFF3E3 50%, #FFE9D5 100%)' }}>
      <header className="text-center py-10 print:py-4">
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-4xl font-bold text-purple-800 print:text-black">Волшебная Сказка</h1>
        {status === 'idle' && (
          <p className="text-orange-400 mt-2">Персональная сказка для вашего ребёнка</p>
        )}
      </header>

      {status === 'idle' && (
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
                className="w-full text-white rounded-xl py-3.5 font-semibold text-lg hover:opacity-90 transition-opacity cursor-pointer"
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
        />
      )}
    </div>
  )
}
