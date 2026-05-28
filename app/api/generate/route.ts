import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prefetchImages } from '@/lib/imageCache'
import { getPostHog } from '@/lib/posthog-server'

export const maxDuration = 120

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

function getAgeProfile(ageStr: string) {
  const n = parseInt(ageStr) || 0
  if (n <= 4) return {
    words: '380–460',
    style: 'Ориентир: Сутеев, Андрей Усачев. Предложения 4–7 слов — короткие, ёмкие, как маленькие шажки. Только знакомые слова. Ритм и повторы ("Шаг, ещё шажок. Вот так."). Конкретные образы: не "испугался", а "в животике стало холодно". Диалоги живые, без объяснений. Никаких вводных оборотов типа "Нужно сказать, что...".',
  }
  if (n <= 6) return {
    words: '520–640',
    style: 'Ориентир: Киплинг (Маугли), Свен Нурдквист (Петсон и Финдус), собачка Соня. Предложения 8–12 слов с живым ритмом. 1–2 новых слова объяснены через действие. Много деталей: запахи, звуки, текстуры. Диалоги с характером — персонажи говорят по-разному. Без сухих итогов и нравоучений.',
  }
  if (n <= 9) return {
    words: '700–840',
    style: 'Ориентир: Евгения Чернышова, Киплинг. Полноценные литературные предложения с внутренним монологом героя. Метафоры и сравнения через бытовое ("страх был как мокрый свитер — тяжёлый и липкий"). Эмоциональная нюансировка. Несколько точек зрения.',
  }
  return {
    words: '900–1080',
    style: 'Ориентир: Александр Волков (Волшебник Изумрудного города). Насыщенный литературный язык, сложные переплетённые эмоции. Глубокие метафоры. Несколько персонажей с характерами. Моральная неоднозначность — добро даётся через усилие.',
  }
}

function getBlankDensity(ageStr: string, locale: 'ru' | 'en' = 'ru'): { count: string; hintStyle: string } {
  const n = parseInt(ageStr) || 0
  if (n <= 4) {
    return locale === 'en'
      ? { count: '2–3 blanks per scene', hintStyle: 'Hints of 1–2 words, very concrete: "what color?", "who is this?", "what did he say?", "where did he run?". Only what the child can answer with a single word.' }
      : { count: '2–3 пропуска на сцену', hintStyle: 'Подсказки в 1–2 слова, очень конкретные: "какого цвета?", "кто это?", "что сказал?", "куда побежал?". Только то, на что ребёнок может ответить одним словом.' }
  }
  if (n <= 6) {
    return locale === 'en'
      ? { count: '4–5 blanks per scene', hintStyle: 'Hints of 2–3 words: "what did he feel?", "how did he act?", "where did he run?", "what did he see?". Allow answers of 1–3 words.' }
      : { count: '4–5 пропусков на сцену', hintStyle: 'Подсказки в 2–3 слова: "что почувствовал?", "как поступил?", "куда побежал?", "что увидел?". Допускают ответ из 1–3 слов.' }
  }
  if (n <= 9) {
    return locale === 'en'
      ? { count: '5–7 blanks per scene', hintStyle: 'Hints are open-ended, 2–5 words: "why did he decide this?", "what happened next?", "how did he figure it out?". Encourage developed answers.' }
      : { count: '5–7 пропусков на сцену', hintStyle: 'Подсказки открытые, 2–5 слов: "почему он так решил?", "что было дальше?", "как он это придумал?". Поощряют развёрнутые ответы.' }
  }
  return locale === 'en'
    ? { count: '4–6 blanks per scene', hintStyle: 'Hints on plot decisions, 3–6 words: "what decision did he make?", "what did he see around the corner?", "how did he explain this to himself?". Stimulate narrative thinking.' }
    : { count: '4–6 пропусков на сцену', hintStyle: 'Подсказки на сюжетные развилки, 3–6 слов: "какое решение принял?", "что увидел за поворотом?", "как объяснил себе это?". Стимулируют сюжетное мышление.' }
}

const SCENARIO_INSTRUCTIONS: Record<string, string> = {
  fear: 'Герой встречает источник своего страха. Через знакомство — а не бегство — делает один маленький шаг навстречу и открывает: страх меньше, чем казался. Важно: герой не перестаёт бояться мгновенно, он делает шаг несмотря на страх — и это и есть смелость.',
  emotion: 'Героя захлёстывает сильная эмоция — злость, обида, ревность или грусть. Ключевой момент: эмоция принята ("это злость, она имеет право быть"), затем найден способ выразить её не причиняя вред. Решение — не "успокойся", а "выскажи/нарисуй/пробеги".',
  adaptation: 'Герой попадает в новое место — всё чужое и пугающее. Он находит одну маленькую знакомую деталь, и от неё, как от нити, распутывает новый мир, находя в нём своё место.',
  behavior: 'Герой совершает ошибку и видит её последствия — без наказания, через сочувствие к тому, кому стало плохо. Он находит способ исправить — это даётся непросто, но приносит облегчение и гордость.',
  preparation: 'Сказка — предварительный просмотр предстоящего события: герой проходит через него шаг за шагом, заранее узнавая что будет. Язык простой и предсказуемый, никаких неожиданных поворотов, финал обязательно спокойный и тёплый.',
  fun: 'Весёлое волшебное приключение с удивительными открытиями. Герой делает что-то доброе и неожиданное, что меняет мир вокруг к лучшему.',
}

interface PromptParams {
  childName: string; age: string; hero: string; situation: string
  situationType: string; favorites: string; lesson: string
  words: string; style: string; scenarioHint: string
}

function buildRuPrompt(p: PromptParams): string {
  return `Ты — мастер сказкотерапии и детской литературы. Создай терапевтическую сказку на русском языке.

ДАННЫЕ:
- Имя ребёнка: ${p.childName}
- Возраст: ${p.age}
- Главный герой: ${p.hero}
- Ситуация/запрос: ${p.situation}
- Любимые вещи: ${p.favorites || 'не указано'}
- Урок: ${p.lesson || 'определи по ситуации'}

ВОЗРАСТНАЯ АДАПТАЦИЯ — СОБЛЮДАЙ СТРОГО:
- Суммарная длина текста: ${p.words} слов
- Языковой стиль: ${p.style}

ТЕРАПЕВТИЧЕСКАЯ СТРУКТУРА (строго по порядку, распредели по двум сценам):
1. Узнаваемый герой — читатель с первых строк чувствует "это похоже на меня" (обстановка, настроение, похожие привычки)
2. Появление проблемы — герой сталкивается с чем-то аналогичным "${p.situation}"
3. Эмоция названа телесно — "в животе что-то сжалось", "стало холодно внутри", "щёки запылали" — конкретно и телесно
4. Волшебный помощник — появляется, но НЕ решает за героя: задаёт нужный вопрос или показывает где искать силу внутри
5. Герой ищет ресурс внутри себя — пробует, возможно ошибается, пробует снова
6. Момент трансформации — конкретный поступок, прочувствованный телесно ("вдруг стало легче", "страх стал чуть меньше")
7. Тёплый конкретный финал — имя "${p.childName}" упоминается органично

ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА:
- Текст сказки — обычный текст БЕЗ какой-либо markdown-разметки. Никаких **звёздочек**, _подчёркиваний_, #заголовков или других символов форматирования
- Тон: тёплый, живой, как голос любящего родителя — не лектора
- Сенсорные детали в каждой сцене: запахи, звуки, тактильные ощущения
- Эмоция названа явно хотя бы раз: "это называлось [эмоция]" или "это был [страх/злость/...]"
- Минимум один живой диалог в каждой сцене — персонажи говорят коротко и по-своему
- Ноль нравоучений в лоб — только через образ и поступок
- Взрослые и волшебные персонажи НЕ спасают — герой справляется сам

ЗАПРЕЩЕНО (признаки роботизированного текста):
- Вводные обороты: "Нужно сказать, что...", "Следует отметить...", "Дело в том, что...", "Таким образом..."
- Перечисления через точку с запятой или нумерованные списки внутри текста
- Абстрактные формулировки вместо конкретных образов ("испытал страх" вместо "ноги стали ватными")
- Прямые резюме типа "И понял герой, что..." — только действие, не вывод
- Слово в слово повторять ситуацию из запроса — переводи в метафору и образ

СЮЖЕТНАЯ МЕХАНИКА ДЛЯ ЭТОЙ ТЕМЫ:
${p.scenarioHint}

Верни ТОЛЬКО валидный JSON, без markdown, без обёртки \`\`\`json:
{
  "title": "Красивое название сказки",
  "scenes": [
    {
      "text": "Сцена 1: шаги 1–4. Узнаваемый герой, появление проблемы, называние эмоции, встреча с помощником.",
      "imagePrompt": "cute ${p.hero} character [ОПИСАНИЕ КОНКРЕТНОГО ДЕЙСТВИЯ ИЗ СЦЕНЫ], enchanted magical forest, warm cinematic lighting, watercolor storybook illustration, correct anatomy, exactly two arms, no extra limbs, child-friendly, detailed background"
    },
    {
      "text": "Сцена 2: шаги 5–7. Герой находит ресурс, делает шаг, момент трансформации, тёплый финал.",
      "imagePrompt": "cute ${p.hero} character [ОПИСАНИЕ КОНКРЕТНОГО ДЕЙСТВИЯ ИЗ СЦЕНЫ], golden magical clearing, warm sunlight, watercolor storybook illustration, correct anatomy, exactly two arms, no extra limbs, child-friendly, triumphant joyful mood"
    }
  ],
  "discussion": [
    "Вход через героя (безопасно): сформулируй вопрос про чувства героя в конкретный момент сказки",
    "Личное соединение: сформулируй мягкий вопрос связывающий ситуацию в сказке с опытом ребёнка",
    "Ресурсный вопрос: сформулируй вопрос про то что помогло герою — и перекинь мостик к ребёнку"
  ],
  "anchor": {
    "title": "Короткое название предмета-якоря (2–3 слова)",
    "description": "Предмет: [простой предмет легко найти дома]. Ритуал: [одно физическое действие]. Фраза-активация: '[3–5 слов]'. Когда использовать: [конкретная ситуация связанная с '${p.situation}']."
  }
}`
}

interface InteractivePromptParams extends PromptParams {
  blankCount: string
  hintStyle: string
}

function buildRuInteractivePrompt(p: InteractivePromptParams): string {
  return `Ты — мастер сказкотерапии и детской литературы. Создай ИНТЕРАКТИВНУЮ терапевтическую сказку на русском языке, в которой ребёнок завершает пропуски своим словом.

ДАННЫЕ:
- Имя ребёнка: ${p.childName}
- Возраст: ${p.age}
- Главный герой: ${p.hero}
- Ситуация/запрос: ${p.situation}
- Любимые вещи: ${p.favorites || 'не указано'}
- Урок: ${p.lesson || 'определи по ситуации'}

ВОЗРАСТНАЯ АДАПТАЦИЯ:
- Суммарная длина текста: ${p.words} слов
- Языковой стиль: ${p.style}

ПЛОТНОСТЬ ПРОПУСКОВ:
- ${p.blankCount}
- ${p.hintStyle}

СЦЕНАРИЙ:
${p.scenarioHint}

ФОРМАТ ОТВЕТА — СТРОГО JSON:
{
  "title": "Название сказки (2–5 слов)",
  "scenes": [
    {
      "segments": [
        {"type":"text","value":"Полноценный связный текст сцены до пропуска. "},
        {"type":"blank","hint":"какого цвета?"},
        {"type":"text","value":" текст после пропуска до следующего пропуска. "},
        {"type":"blank","hint":"что сделал?"},
        {"type":"text","value":" заключительный текст сцены."}
      ],
      "imagePrompt": ""
    },
    { "segments": [...], "imagePrompt": "" },
    { "segments": [...], "imagePrompt": "" }
  ]
}

ПРАВИЛА ИНТЕРАКТИВНОСТИ:
1. Ровно 3 сцены.
2. В каждой сцене — массив segments в порядке чтения.
3. Первый и последний сегмент в каждой сцене — type:"text" (нельзя начинать или заканчивать пропуском).
4. Сегменты type:"text" — связный литературный текст. НИКАКИХ "___" или плейсхолдеров внутри value.
5. Пропуски (type:"blank") — в естественных местах, где ребёнок может вставить слово/фразу: цвет предмета, имя нового персонажа, эмоция героя, что он сделал, куда пошёл.
6. Hint — короткий наводящий вопрос, не дающий ответа. Не повторять подряд один и тот же hint.
7. imagePrompt — пустая строка "" (картинки в этом режиме не используются).
8. Полная сказка должна читаться связно даже если читать только text-сегменты подряд (пропуски — украшение, а не каркас).
9. Имя ребёнка "${p.childName}" органично упоминается в финале.
10. НИКАКОГО Markdown — никаких **, *, _ — только чистый текст в value.

Ответ — ТОЛЬКО JSON, без markdown-обёртки.`
}

function buildEnInteractivePrompt(p: InteractivePromptParams): string {
  return `You are a master of therapeutic storytelling for children. Create an INTERACTIVE therapeutic story in English where the child completes blanks with their own word.

DATA:
- Child's name: ${p.childName}
- Age: ${p.age}
- Main hero: ${p.hero}
- Situation/request: ${p.situation}
- Favorites: ${p.favorites || 'not specified'}
- Lesson: ${p.lesson || 'determine from situation'}

AGE ADAPTATION:
- Total word count: ${p.words} words
- Language style: ${p.style}

BLANK DENSITY:
- ${p.blankCount}
- ${p.hintStyle}

SCENARIO:
${p.scenarioHint}

RESPONSE FORMAT — STRICT JSON:
{
  "title": "Story title (2-5 words)",
  "scenes": [
    {
      "segments": [
        {"type":"text","value":"Coherent text of the scene before the blank. "},
        {"type":"blank","hint":"what color?"},
        {"type":"text","value":" text after the blank until the next blank. "},
        {"type":"blank","hint":"what did he do?"},
        {"type":"text","value":" closing text of the scene."}
      ],
      "imagePrompt": ""
    },
    { "segments": [...], "imagePrompt": "" },
    { "segments": [...], "imagePrompt": "" }
  ]
}

INTERACTIVITY RULES:
1. Exactly 3 scenes.
2. Each scene contains segments[] in reading order.
3. First and last segment of each scene MUST be type:"text" (never start or end with a blank).
4. type:"text" segments — coherent literary text. NO "___" or placeholders inside value.
5. Blanks (type:"blank") — at natural insertion points: object color, new character name, hero's emotion, what they did, where they went.
6. Hint — short leading question that does NOT give the answer. Do not repeat the same hint consecutively.
7. imagePrompt — empty string "" (images are not used in this mode).
8. The full story must read coherently even if only text-segments are read in sequence (blanks are flavor, not skeleton).
9. Child's name "${p.childName}" appears organically in the ending.
10. NO Markdown — no **, *, _ — pure text in value only.

Output — JSON ONLY, no markdown wrapper.`
}

function buildEnPrompt(p: PromptParams): string {
  return `You are a master of story therapy and children's literature. Create a therapeutic fairy tale in English.

STORY DATA:
- Child's name: ${p.childName}
- Age: ${p.age}
- Main character: ${p.hero}
- Challenge / situation: ${p.situation}
- Favorite things: ${p.favorites || 'not specified'}
- Lesson: ${p.lesson || 'determine from the situation'}

AGE ADAPTATION — FOLLOW STRICTLY:
- Total text length: ${p.words} words
- Language style: ${p.style}

THERAPEUTIC STRUCTURE (in order, split across two scenes):
1. Relatable hero — the reader immediately feels "this is like me" (setting, mood, familiar habits)
2. Problem emerges — the hero faces something analogous to "${p.situation}"
3. Emotion named physically — "something tightened in their chest", "their cheeks went hot", "legs felt heavy" — specific and bodily
4. Magical helper — appears but does NOT solve things: asks the right question or points to inner strength
5. Hero finds their own resource — tries, perhaps stumbles, tries again
6. Moment of transformation — a concrete act, felt physically ("suddenly it felt lighter", "the fear grew a little smaller")
7. Warm specific ending — child's name "${p.childName}" woven in naturally

RULES:
- Plain text ONLY — no **asterisks**, _underscores_, #headers or any markdown formatting
- Tone: warm, gentle, enveloping — like a loving parent's voice at bedtime
- Sensory details in every scene: smells, sounds, textures
- Name the emotion explicitly at least once: "this was called [emotion]" or "it was [fear / anger / ...]"
- At least one piece of dialogue per scene
- No moralising — only through image and action
- Adults and magical helpers do NOT rescue — the hero manages themselves

SCENARIO MECHANICS FOR THIS THEME:
${p.scenarioHint}

Return ONLY valid JSON, no markdown, no \`\`\`json wrapper:
{
  "title": "A beautiful story title in English",
  "scenes": [
    {
      "text": "Scene 1: steps 1–4. Relatable hero, problem emerges, emotion named, meets helper.",
      "imagePrompt": "cute ${p.hero} character [DESCRIBE THE SPECIFIC ACTION FROM THIS SCENE], enchanted magical forest, warm cinematic lighting, watercolor storybook illustration, correct anatomy, exactly two arms, no extra limbs, child-friendly, detailed background"
    },
    {
      "text": "Scene 2: steps 5–7. Hero finds resource, takes step, transformation moment, warm ending.",
      "imagePrompt": "cute ${p.hero} character [DESCRIBE THE SPECIFIC ACTION FROM THIS SCENE], golden magical clearing, warm sunlight, watercolor storybook illustration, correct anatomy, exactly two arms, no extra limbs, child-friendly, triumphant joyful mood"
    }
  ],
  "discussion": [
    "Entry through the hero (safe): ask about how the hero felt at a specific moment in the story",
    "Personal connection: a gentle question linking the story to the child's own experience",
    "Resource question: ask what helped the hero — and bridge it to the child"
  ],
  "anchor": {
    "title": "Short anchor object name (2–3 words)",
    "description": "Object: [simple everyday object easy to find at home]. Ritual: [one physical action]. Activation phrase: '[3–5 words the child says in a difficult moment]'. When to use: [specific situation related to '${p.situation}']."
  }
}`
}

export async function POST(req: NextRequest) {
  const { childName, age, hero, situation, situationType, favorites, lesson, locale = 'ru' } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY не настроен. Добавьте ключ в файл .env.local' },
      { status: 500 }
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  const { words, style } = getAgeProfile(age)
  const scenarioHint = SCENARIO_INSTRUCTIONS[situationType] ?? SCENARIO_INSTRUCTIONS.fun

  const isEn = locale === 'en'
  const prompt = isEn
    ? buildEnPrompt({ childName, age, hero, situation, situationType, favorites, lesson, words, style, scenarioHint })
    : buildRuPrompt({ childName, age, hero, situation, situationType, favorites, lesson, words, style, scenarioHint })

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
        story.storySeed = Math.floor(Math.random() * 99991)
        story.scenes = story.scenes.map((scene: { text: string; imagePrompt: string }) => ({
          ...scene,
          text: scene.text?.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/_{1,2}(.+?)_{1,2}/g, '$1') ?? '',
          imagePrompt: scene.imagePrompt?.slice(0, 120) ?? '',
        }))
        prefetchImages(story.scenes, story.storySeed)

        const ph = getPostHog()
        ph.capture({
          distinctId: `server-${req.headers.get('x-forwarded-for') ?? 'unknown'}`,
          event: 'story_generated',
          properties: { age, hero, situationType, locale, model: modelName },
        })
        await ph.flush()
      }

      return NextResponse.json(story)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('overloaded')
      console.error(`Model ${modelName} failed:`, msg.slice(0, 100))
      if (!isRetryable) break
    }
  }

  return NextResponse.json(
    { error: 'Сервис временно перегружен. Подождите минуту и попробуйте снова.' },
    { status: 503 }
  )
}
