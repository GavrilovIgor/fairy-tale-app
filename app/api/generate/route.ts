import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prefetchImages } from '@/lib/imageCache'

export const maxDuration = 120

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

export async function POST(req: NextRequest) {
  const { childName, age, hero, situation, situationType, favorites, lesson } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY не настроен. Добавьте ключ в файл .env.local' },
      { status: 500 }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  const scenarioInstructions: Record<string, string> = {
    fear: 'Герой встречает то, чего боится, и шаг за шагом учится не бояться — через любопытство, дружбу или маленькую победу.',
    emotion: 'Герой переживает сложную эмоцию (злость, обида, ревность, грусть). Он учится назвать её словами и выразить по-доброму, не причиняя вред другим.',
    adaptation: 'Герой попадает в новое место или ситуацию и сначала теряется. Постепенно он открывает в новом что-то хорошее и находит своё место.',
    behavior: 'Герой совершает ошибку (не хочет делиться, обманывает, грубит). Он видит последствия, понимает что пошло не так и исправляет ситуацию.',
    preparation: 'Герой готовится к важному событию (поход к врачу, новое место, встреча с незнакомыми людьми). Сказка шаг за шагом показывает как всё пройдёт — спокойно и предсказуемо, с добрым финалом. Язык простой и конкретный, без неожиданных поворотов.',
    fun: 'Весёлое волшебное приключение. Герой отправляется в путешествие, встречает удивительных персонажей и делает что-то доброе.',
  }

  const scenarioHint = scenarioInstructions[situationType] || scenarioInstructions.fun

  const prompt = `Ты — талантливый русскоязычный детский писатель. Напиши волшебную сказку на русском языке для ребёнка ${age}.

О ком сказка:
- Имя ребёнка: ${childName}
- Главный герой: ${hero}
- Ситуация: ${situation}
- Любимые вещи: ${favorites || 'не указано'}
- Чему учит сказка: ${lesson || 'определи сам по ситуации — смелость, доброта, дружба'}

Требования:
- Язык: красивый литературный русский, тёплый и образный — как лучшие русские детские сказки
- Длина: 700–800 слов (5 минут чтения), каждая из двух частей — 350–400 слов
- Сюжетная механика: ${scenarioHint}
- Богатые описания природы, эмоций, деталей окружающего мира
- Живые диалоги между персонажами
- Имя ребёнка "${childName}" упоминается в сказке органично (например, в посвящении или в тексте)

Верни ТОЛЬКО валидный JSON, без markdown, без обёртки \`\`\`json:
{
  "title": "Красивое название сказки",
  "scenes": [
    {
      "text": "Начало и кульминация 350–400 слов: знакомство с героем, его миром, ситуацией — и встреча с главным испытанием...",
      "imagePrompt": "cute ${hero} in magical world, facing a challenge, soft warm light, watercolor children book illustration style"
    },
    {
      "text": "Развязка 350–400 слов: герой находит выход, делает правильный выбор, счастливый тёплый финал...",
      "imagePrompt": "happy ${hero} with friends in cozy magical place, golden warm light, watercolor children book illustration style"
    }
  ],
  "discussion": [
    "Эмпатичный вопрос: случалось ли с ребёнком что-то похожее на то, что чувствовал герой?",
    "Вопрос про выбор героя: почему герой поступил именно так?",
    "Вопрос про ребёнка: что бы он сделал или взял с собой, если бы оказался на месте героя?"
  ],
  "anchor": {
    "title": "Название конкретного предмета или ритуала из сказки",
    "description": "2-3 предложения: как родителю вместе с ребёнком создать или найти этот предмет, и что говорить с ним в трудный момент. Связать с уроком сказки."
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
        // Start fetching images in background — they'll be cached by the time user sees the story
        prefetchImages(story.scenes)
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
