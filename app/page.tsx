'use client'

import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    Telegram?: { WebApp: { ready: () => void; expand: () => void; switchInlineQuery?: (query: string, chatTypes?: string[]) => void } }
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
          onShare={handleShare}
          shareStatus={shareStatus}
        />
      )}
    </div>
  )
}
