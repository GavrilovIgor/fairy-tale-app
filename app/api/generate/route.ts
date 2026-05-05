import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 120

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

export async function POST(req: NextRequest) {
  const { childName, age, hero, fear, favorites, lesson } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY не настроен. Добавьте ключ в файл .env.local' },
      { status: 500 }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  const prompt = `Ты — талантливый русскоязычный детский писатель. Напиши волшебную сказку на русском языке для ребёнка ${age}.

О ком сказка:
- Имя ребёнка: ${childName}
- Главный герой: ${hero}
- Страх или проблема ребёнка: ${fear}
- Любимые вещи: ${favorites || 'не указано'}
- Урок сказки: ${lesson || 'смелость и доброта'}

Требования:
- Язык: красивый литературный русский язык
- Длина: 700–800 слов (5 минут чтения), каждая из двух частей — 350–400 слов
- Стиль: волшебный, образный, тёплый — как лучшие русские детские сказки
- Герой преодолевает страх и побеждает благодаря смелости и доброте
- Богатые описания природы, эмоций, деталей окружающего мира
- Диалоги между персонажами

Верни ТОЛЬКО валидный JSON, без markdown, без обёртки \`\`\`json:
{
  "title": "Красивое название сказки",
  "scenes": [
    {
      "text": "Начало и кульминация 350–400 слов: знакомство с героем, его миром, проблемой — и встреча с главным испытанием...",
      "imagePrompt": "cute ${hero} in enchanted forest facing magical challenge, soft warm light, watercolor style"
    },
    {
      "text": "Развязка 350–400 слов: герой преодолевает страх, урок, счастливый финал...",
      "imagePrompt": "happy ${hero} celebrating victory with friends, golden warm sunset, watercolor style"
    }
  ],
  "discussion": [
    "Эмпатичный вопрос: случалось ли с ребёнком что-то похожее на то, что чувствовал герой?",
    "Вопрос про выбор героя: почему герой поступил именно так, а не иначе?",
    "Вопрос про ребёнка: что бы он сделал или взял с собой, если бы оказался на месте героя?"
  ],
  "anchor": {
    "title": "Название конкретного предмета или ритуала из сказки",
    "description": "2-3 предложения: как родителю вместе с ребёнком создать или найти этот предмет, и что говорить/делать с ним в трудные моменты. Привязать к уроку сказки."
  }
}`

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()

      const jsonText = text.startsWith('```')
        ? text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
        : text

      const story = JSON.parse(jsonText)

      if (story.scenes) {
        story.scenes = story.scenes.map((scene: { text: string; imagePrompt: string }) => ({
          ...scene,
          imagePrompt: scene.imagePrompt?.slice(0, 120) ?? '',
        }))
      }

      return NextResponse.json(story)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('overloaded')
      console.error(`Model ${modelName} failed:`, msg.slice(0, 100))
      if (!isRetryable) break
      // try next model
    }
  }

  return NextResponse.json(
    { error: 'Сервис временно перегружен. Подождите минуту и попробуйте снова.' },
    { status: 503 }
  )
}
