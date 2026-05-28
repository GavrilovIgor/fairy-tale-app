# Сказка-диалог (Interactive Story) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить второй режим генерации — "Сказка-диалог", где сказка содержит структурированные пропуски с подсказками. Родитель читает, ребёнок завершает, тап по плашке "схлопывает" её как прочитанную. Картинки не генерируются.

**Architecture:** Расширяем существующий `/api/generate` параметром `mode: 'classic' | 'interactive'`. При interactive — отдельная ветка промпта возвращает `scenes[].segments` (массив `text` и `blank` сегментов с `hint`). Новый клиентский компонент `<InteractiveScene>` рендерит сегменты с тап-плашками. UI — вторая кнопка в финальном шаге визарда формы. Старые сохранённые сказки не ломаются (новые поля optional).

**Tech Stack:** Next.js 16, TypeScript, Tailwind, next-intl (ru/en), Gemini API. Тестирование — `npm run build` (typecheck) + `npm run lint` + ручная верификация через preview-инструменты (dev server). Юнит-тестов в проекте нет, новые не вводим.

**Спек:** [docs/superpowers/specs/2026-05-28-interactive-story-design.md](../specs/2026-05-28-interactive-story-design.md)

---

## File Map

| Файл | Назначение | Действие |
|---|---|---|
| `app/api/generate/route.ts` | Принимает `mode`, ветвит промпт, скипает `prefetchImages` для interactive | Modify |
| `app/[locale]/page.tsx` | Расширить типы Story/Scene, добавить кнопку в визард, передать `mode` в `generate()`, ветвление рендера сцены | Modify |
| `components/InteractiveScene.tsx` | Рендер сегментов и плашек с состоянием "прочитано" | Create |
| `messages/ru.json` | Локализация: текст кнопки, бейдж, подзаголовок | Modify |
| `messages/en.json` | То же для английского | Modify |
| `app/globals.css` | Print-стили для плашек | Modify |

---

## Task 1: Расширить типы Story/Scene/Segment

**Files:**
- Modify: `app/[locale]/page.tsx:39-41`

- [ ] **Step 1: Заменить определения типов**

Найти в `app/[locale]/page.tsx` строки 39-41:

```ts
interface Scene { text:string; imagePrompt:string }
interface Story { title:string; scenes:Scene[]; discussion?:string[]; anchor?:{title:string;description:string}; storySeed?:number }
interface SavedStory { id:string; savedAt:string; childName:string; story:Story; images?:Record<number,string> }
```

Заменить на:

```ts
type StoryMode = 'classic' | 'interactive'
type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }
interface Scene { text?:string; segments?:Segment[]; imagePrompt:string }
interface Story { title:string; scenes:Scene[]; mode?:StoryMode; discussion?:string[]; anchor?:{title:string;description:string}; storySeed?:number }
interface SavedStory { id:string; savedAt:string; childName:string; story:Story; images?:Record<number,string> }
```

- [ ] **Step 2: Проверить, что typecheck проходит**

Run: `npm run build` (в директории проекта)
Expected: успешная сборка (могут быть warnings — это норма; ошибки `Type 'string | undefined'` в местах, где код обращается к `scene.text` напрямую — это ожидаемо, исправим в следующих задачах).

Если есть ошибки конкретно про `text` becoming optional — записать их, исправим в Task 2. Если ошибки в других местах — это регрессия, исправить сразу.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat(types): extend Story/Scene with mode and segments for interactive mode"
```

---

## Task 2: Защитить classic-путь от optional text

Расширение `text?:string` могло сломать места, где `scene.text` использовался напрямую как `string`. Пройдёмся по ним и проставим fallback `?? ''`.

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Найти все использования scene.text**

Run: `grep -n "scene\.text\|\.scenes\[" app/\[locale\]/page.tsx`
Expected output: список строк. Для каждой строки проверить — если значение используется как string без проверки, добавить `?? ''`.

- [ ] **Step 2: Найти использования в map-функции**

Найти строку (использует `.text`) в коде сохранения / отображения / pre-load картинок. Обычно:
- `imgUrl(scene.imagePrompt, ...)` — `imagePrompt` остался обязательным, ОК
- Рендер `<p>{scene.text}</p>` — браузер сам пропустит `undefined`, ОК визуально, но TypeScript может ругаться

Где TypeScript показывает ошибку — добавить `?? ''` или сузить тип через `scene.text &&`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: успешная сборка без новых TypeScript-ошибок.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "fix(types): guard against optional scene.text in classic render path"
```

---

## Task 3: Промпт interactive-режима — функции buildRuInteractivePrompt и buildEnInteractivePrompt

**Files:**
- Modify: `app/api/generate/route.ts` (добавление функций после `buildEnPrompt`)

- [ ] **Step 1: Добавить функцию плотности пропусков по возрасту**

В `app/api/generate/route.ts`, рядом с `getAgeProfile`, добавить:

```ts
function getBlankDensity(ageStr: string): { count: string; hintStyle: string } {
  const n = parseInt(ageStr) || 0
  if (n <= 4) return {
    count: '2–3 пропуска на сцену',
    hintStyle: 'Подсказки в 1–2 слова, очень конкретные: "какого цвета?", "кто это?", "что сказал?", "куда побежал?". Только то, на что ребёнок может ответить одним словом.',
  }
  if (n <= 6) return {
    count: '4–5 пропусков на сцену',
    hintStyle: 'Подсказки в 2–3 слова: "что почувствовал?", "как поступил?", "куда побежал?", "что увидел?". Допускают ответ из 1–3 слов.',
  }
  if (n <= 9) return {
    count: '5–7 пропусков на сцену',
    hintStyle: 'Подсказки открытые, 2–5 слов: "почему он так решил?", "что было дальше?", "как он это придумал?". Поощряют развёрнутые ответы.',
  }
  return {
    count: '4–6 пропусков на сцену',
    hintStyle: 'Подсказки на сюжетные развилки, 3–6 слов: "какое решение принял?", "что увидел за поворотом?", "как объяснил себе это?". Стимулируют сюжетное мышление.',
  }
}
```

- [ ] **Step 2: Добавить buildRuInteractivePrompt**

Сразу после `buildRuPrompt` добавить:

```ts
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
```

- [ ] **Step 3: Добавить buildEnInteractivePrompt (английский аналог)**

Сразу после `buildRuInteractivePrompt` добавить аналогичную функцию на английском:

```ts
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
```

Также обновить интерфейс `PromptParams` (если он narrow) — `InteractivePromptParams` его уже расширяет.

- [ ] **Step 4: Проверить typecheck**

Run: `npm run build`
Expected: успешная сборка.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat(api): add interactive prompt builders with age-adaptive blank density"
```

---

## Task 4: Подключить mode в /api/generate

**Files:**
- Modify: `app/api/generate/route.ts:176-220`

- [ ] **Step 1: Принять mode из body и валидировать**

Заменить строку 177:

```ts
const { childName, age, hero, situation, situationType, favorites, lesson, locale = 'ru' } = await req.json()
```

На:

```ts
const { childName, age, hero, situation, situationType, favorites, lesson, locale = 'ru', mode = 'classic' } = await req.json()
const storyMode: 'classic' | 'interactive' = mode === 'interactive' ? 'interactive' : 'classic'
```

- [ ] **Step 2: Ветвление выбора промпта**

Заменить блок (строки ~196-199):

```ts
const isEn = locale === 'en'
const prompt = isEn
  ? buildEnPrompt({ childName, age, hero, situation, situationType, favorites, lesson, words, style, scenarioHint })
  : buildRuPrompt({ childName, age, hero, situation, situationType, favorites, lesson, words, style, scenarioHint })
```

На:

```ts
const isEn = locale === 'en'
const { count: blankCount, hintStyle } = getBlankDensity(age)
const baseParams = { childName, age, hero, situation, situationType, favorites, lesson, words, style, scenarioHint }
const prompt = storyMode === 'interactive'
  ? (isEn ? buildEnInteractivePrompt({ ...baseParams, blankCount, hintStyle }) : buildRuInteractivePrompt({ ...baseParams, blankCount, hintStyle }))
  : (isEn ? buildEnPrompt(baseParams) : buildRuPrompt(baseParams))
```

- [ ] **Step 3: Постобработка ответа Gemini для interactive**

Заменить блок (строки ~213-220) на:

```ts
if (story.scenes) {
  story.storySeed = Math.floor(Math.random() * 99991)
  story.mode = storyMode
  if (storyMode === 'interactive') {
    story.scenes = story.scenes.map((scene: { segments?: Array<{ type: string; value?: string; hint?: string }>; imagePrompt?: string }, sceneIdx: number) => {
      const segments = Array.isArray(scene.segments) ? scene.segments : []
      let blankCounter = 0
      const cleaned = segments
        .filter((s) => s && (s.type === 'text' || s.type === 'blank'))
        .map((s) => {
          if (s.type === 'text') {
            const value = (s.value ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/_{1,2}(.+?)_{1,2}/g, '$1')
            return { type: 'text' as const, value }
          }
          const hint = (s.hint ?? '...').slice(0, 60)
          const id = `s${sceneIdx}-b${blankCounter++}`
          return { type: 'blank' as const, hint, id }
        })
      return { segments: cleaned, imagePrompt: '' }
    })
    // НЕ вызываем prefetchImages — картинок нет
  } else {
    story.scenes = story.scenes.map((scene: { text: string; imagePrompt: string }) => ({
      ...scene,
      text: scene.text?.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/_{1,2}(.+?)_{1,2}/g, '$1') ?? '',
      imagePrompt: scene.imagePrompt?.slice(0, 120) ?? '',
    }))
    prefetchImages(story.scenes, story.storySeed)
  }

  // Записываем каждую генерацию
  const { error: genError } = await supabaseAdmin.from('story_generations').insert({
    user_id: user?.id ?? null,
    locale,
  })
  if (genError) console.error('[story_generations insert error]', genError)

  const ph = getPostHog()
  ph.capture({
    distinctId: `server-${req.headers.get('x-forwarded-for') ?? 'unknown'}`,
    event: 'story_generated',
    properties: { age, hero, situationType, locale, model: modelName, mode: storyMode },
  })
  await ph.flush()
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: успешная сборка.

- [ ] **Step 5: Manual smoke-test — classic mode не сломался**

Run: `npm run dev` (в фоне), затем:
```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"childName":"Тест","age":"5","hero":"котёнок","situation":"боится темноты","situationType":"fear","favorites":"машинки","lesson":"","locale":"ru"}' \
  | head -c 400
```
Expected: JSON со `scenes[].text` (classic-формат). Если получили segments или ошибку — баг, исправить.

- [ ] **Step 6: Manual smoke-test — interactive mode возвращает segments**

```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"childName":"Тест","age":"5","hero":"котёнок","situation":"боится темноты","situationType":"fear","favorites":"машинки","lesson":"","locale":"ru","mode":"interactive"}' \
  | head -c 800
```
Expected: JSON с `mode:"interactive"` и `scenes[].segments[]` где есть `{type:"text",value:"..."}` и `{type:"blank",hint:"...",id:"s0-b0"}`. Первый и последний сегмент сцены — type:"text".

Если Gemini вернул мусор → проверить промпт, при необходимости укрепить инструкции. Если структура не валидируется на сервере (cleaned пустой) → проверить filter/map.

- [ ] **Step 7: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat(api): support interactive mode generation with segment cleanup"
```

---

## Task 5: Компонент InteractiveScene

**Files:**
- Create: `components/InteractiveScene.tsx`

- [ ] **Step 1: Создать компонент**

Создать файл `components/InteractiveScene.tsx` с содержимым:

```tsx
'use client'

import React, { useState } from 'react'

type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }

interface Props {
  segments: Segment[]
}

export function InteractiveScene({ segments }: Props) {
  const [read, setRead] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) => {
    setRead(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }
        const isRead = read.has(seg.id)
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => toggle(seg.id)}
            aria-pressed={isRead}
            aria-label={isRead ? `Прочитано: ${seg.hint}` : `Пропуск: ${seg.hint}`}
            className={[
              'interactive-blank',
              'inline-flex items-center align-baseline mx-1 px-2.5 py-0.5 rounded-full',
              'text-[0.92em] font-medium whitespace-nowrap',
              'transition-all active:scale-95 cursor-pointer select-none',
              isRead
                ? 'bg-stone-200 text-stone-500 line-through opacity-60'
                : 'bg-amber-100 text-amber-900 hover:brightness-95',
            ].join(' ')}
          >
            {seg.hint}
          </button>
        )
      })}
    </p>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: успешная сборка, файл компилируется.

- [ ] **Step 3: Commit**

```bash
git add components/InteractiveScene.tsx
git commit -m "feat(components): add InteractiveScene with tap-to-mark-read blank chips"
```

---

## Task 6: Прокинуть mode через generate() и форму

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Расширить generate() параметром mode**

Найти строку 1525:
```ts
const generate = async(data:FormData)=>{
```

Заменить сигнатуру и обновить fetch + последующую логику pre-load картинок. Заменить функцию целиком (строки ~1525-1565):

```ts
const generate = async(data:FormData, mode:StoryMode = 'classic')=>{
  if(!canGenerate()){setShowPaywall(true);return}
  setStatus('loading'); setError(''); setAlreadySaved(false); setCurrentChildName(data.childName)
  setImageCache({})
  try{
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data, locale, mode})})
    const json=await res.json()
    if(!res.ok){setError(json.error||'Ошибка генерации');setStatus('idle');return}

    // Pre-load картинок только для classic — в interactive картинок нет
    const cache:Record<number,string>={}
    if (json.mode !== 'interactive') {
      const fetchImg=async(url:string):Promise<Blob|null>=>{
        try{
          const r=await fetch(url)
          if(r.ok)return await r.blob()
        }catch{}
        return null
      }
      const loaders=(json.scenes as Scene[]).map(async(scene,i)=>{
        const base=imgUrl(scene.imagePrompt,i,json.storySeed??0)
        for(let attempt=0;attempt<3;attempt++){
          const url=attempt===0?base:`${base}&t=${Date.now()}`
          const blob=await fetchImg(url)
          if(blob){cache[i]=URL.createObjectURL(blob);return}
          if(attempt<3)await new Promise(r=>setTimeout(r,3000*(attempt+1)))
        }
        cache[i] = `/story-fallback-${i%2}.jpg`
      })
      await Promise.allSettled(loaders)
    }

    const ex=getExtra()
    if(ex>0){setExtra(ex-1);setExtraState(ex-1)}else{incUsage();setUsageCount(getAnonUsed())}
    setStory(json); setCurrentChildName(data.childName); setAlreadySaved(false)
    setImageCache(cache)
    setStatus('done')
    setSelectedVoice(data.voice ?? null)
    setMobileTab('create')
  }catch{setError('Не удалось подключиться к серверу.');setStatus('idle')}
}
```

- [ ] **Step 2: Обновить CreateForm props и сигнатуру onGenerate**

Найти строку 480 (объявление `CreateForm`). Заменить:

```tsx
function CreateForm({onGenerate,isLoading,onOpenLibrary,onShowAuth,onShowProfile,onShowPaywall,user}:{onGenerate:(f:FormData)=>Promise<void>;isLoading:boolean;...})
```

На (тип onGenerate с опциональным mode):

```tsx
function CreateForm({onGenerate,isLoading,onOpenLibrary,onShowAuth,onShowProfile,onShowPaywall,user}:{onGenerate:(f:FormData,mode?:StoryMode)=>Promise<void>;isLoading:boolean;onOpenLibrary?:()=>void;onShowAuth?:()=>void;onShowProfile?:()=>void;onShowPaywall?:()=>void;user?:User|null})
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: успешная сборка. Места, где `onGenerate(form)` вызывался без второго аргумента — продолжают работать (default `'classic'`).

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat(client): pass mode through generate and skip image preload for interactive"
```

---

## Task 7: Добавить вторую кнопку в визард

**Files:**
- Modify: `app/[locale]/page.tsx:936-942`

- [ ] **Step 1: Найти финальный шаг визарда**

Найти блок (строка ~936):

```tsx
{step===5&&(
  <button type="button" onClick={()=>{saveLastChild(form.childName,form.age);onGenerate(form)}} disabled={isLoading}
    className="flex-1 py-3 rounded-xl text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
    style={{background:'#a46713'}}>
    {isLoading ? t('wizard.creating') : t('wizard.create')}
  </button>
)}
```

- [ ] **Step 2: Заменить на две кнопки в адаптивной разметке**

Заменить блок выше на:

```tsx
{step===5&&(
  <div className="flex-1 flex flex-col sm:flex-row gap-2">
    <button type="button"
      onClick={()=>{saveLastChild(form.childName,form.age);onGenerate(form,'classic')}}
      disabled={isLoading}
      className="flex-1 py-3 rounded-xl text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
      style={{background:'#a46713'}}>
      {isLoading ? t('wizard.creating') : t('wizard.create')}
    </button>
    <button type="button"
      onClick={()=>{saveLastChild(form.childName,form.age);onGenerate(form,'interactive')}}
      disabled={isLoading}
      className="flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 border-2"
      style={{background:'transparent',borderColor:'#a46713',color:'#a46713'}}>
      💬 {t('wizard.createInteractive')}
    </button>
  </div>
)}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: успешная сборка. Ключ `wizard.createInteractive` отсутствует в messages — next-intl покажет fallback (имя ключа). Это исправит Task 9.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat(ui): add second wizard button for interactive story mode"
```

---

## Task 8: Ветвление рендера сцены — interactive vs classic

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Импортировать InteractiveScene**

Найти блок импортов наверху файла (строки 1-11) и добавить:

```tsx
import { InteractiveScene } from '@/components/InteractiveScene'
```

- [ ] **Step 2: Найти рендер сцен в режиме чтения сказки**

Run: `grep -n "scene\.text\|story\.scenes\.map\|scenes\.map" app/\[locale\]/page.tsx`

Найти место, где сцены отображаются на экране после генерации (`status === 'done'`). Там должен быть код вида:
```tsx
{story.scenes.map((scene, i) => (
  <div ...>
    <StoryImage prompt={scene.imagePrompt} index={i} ... />
    <p>{scene.text}</p>
  </div>
))}
```

- [ ] **Step 3: Добавить ветвление**

Заменить рендер сцены на условный:

```tsx
{story.scenes.map((scene, i) => {
  const isInteractive = story.mode === 'interactive' && Array.isArray(scene.segments)
  return (
    <div key={i} className="...">
      {!isInteractive && (
        <StoryImage prompt={scene.imagePrompt} index={i} preloadedSrc={imageCache[i]} storySeed={story.storySeed} />
      )}
      {isInteractive
        ? <InteractiveScene segments={scene.segments!} />
        : <p className="...">{scene.text ?? ''}</p>}
    </div>
  )
})}
```

(Точные className и атрибуты `<StoryImage>` — сохранить из существующего кода, не переписывать.)

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: успешная сборка.

- [ ] **Step 5: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat(ui): render InteractiveScene when story.mode is interactive"
```

---

## Task 9: i18n — новые ключи

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Открыть `messages/ru.json` и найти секцию `wizard`**

Run: `grep -n "wizard\|create\":" messages/ru.json | head -10`
Найти объект `wizard` с ключами `create`, `creating`, `next`, `back`, `skip`.

- [ ] **Step 2: Добавить ключ createInteractive в ru.json**

В объект `wizard` добавить:

```json
"createInteractive": "Сказка-диалог"
```

Также рядом (в корне или в секции для interactive — на усмотрение, при отсутствии — создать `interactive`):

```json
"interactive": {
  "badge": "💬 диалог",
  "subtitle": "Ребёнок заканчивает пропуски своими словами"
}
```

- [ ] **Step 3: Добавить такие же ключи в en.json**

В `messages/en.json`:

```json
"createInteractive": "Story Dialogue"
```

И:

```json
"interactive": {
  "badge": "💬 dialogue",
  "subtitle": "Child completes blanks with their own words"
}
```

- [ ] **Step 4: Verify build и переход в браузер**

Run: `npm run build`
Expected: успешная сборка, ключи валидны.

Run: `npm run dev` (если ещё не запущен), открыть http://localhost:3000/ru, пройти визард до шага 5 → должна появиться вторая кнопка "Сказка-диалог".

- [ ] **Step 5: Commit**

```bash
git add messages/ru.json messages/en.json
git commit -m "feat(i18n): add interactive mode translations for ru and en"
```

---

## Task 10: Бейдж "диалог" в библиотеке сохранённых сказок

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Найти LibraryScreen или карточку сохранённой сказки**

Run: `grep -n "LibraryScreen\|SavedStory\|savedAt\|childName" app/\[locale\]/page.tsx | head -15`

Найти карточку сохранённой сказки в `LibraryScreen` — там показывается заголовок и дата. Добавить рядом с заголовком условный бейдж.

- [ ] **Step 2: Добавить бейдж**

Внутри карточки, рядом с `{entry.story.title}` или `{entry.childName}`:

```tsx
{entry.story.mode === 'interactive' && (
  <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900">
    {t('interactive.badge')}
  </span>
)}
```

(Использовать существующий `t` из `useTranslations` в этом компоненте; если scope другой — взять верхний scope или namespace.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: успешная сборка.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat(ui): show dialogue badge on saved interactive stories"
```

---

## Task 11: Print-стили для плашек

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Открыть `app/globals.css` и найти секцию `@media print`**

Run: `grep -n "@media print\|@page" app/globals.css`

Если секция есть — добавить в неё. Если нет — создать в конце файла.

- [ ] **Step 2: Добавить правила**

```css
@media print {
  .interactive-blank {
    background: transparent !important;
    color: #000 !important;
    text-decoration: none !important;
    opacity: 1 !important;
    padding: 0 !important;
    border: none !important;
    border-bottom: 1px solid #000 !important;
    border-radius: 0 !important;
    min-width: 3em;
    display: inline-block;
    font-style: normal;
  }
  .interactive-blank::after {
    content: " (" attr(aria-label) ")";
    font-size: 0.7em;
    font-style: italic;
    color: #666;
    margin-left: 0.25em;
  }
}
```

Примечание: использовать `aria-label` или альтернативно — обернуть hint в `<span class="hint">` и стилизовать. Для простоты использован aria-label, который у нас уже есть.

Если `aria-label` показывает префикс "Пропуск: " — этого мы не хотим в печати. Тогда альтернативно — использовать `data-hint` атрибут.

**Лучший вариант:** в `InteractiveScene` уже добавить `data-hint={seg.hint}` на кнопку и в CSS — `content: " (" attr(data-hint) ")"`.

Если меняем подход — добавить `data-hint={seg.hint}` в `components/InteractiveScene.tsx` (атрибут button). Затем в CSS:
```css
.interactive-blank::after {
  content: " (" attr(data-hint) ")";
  ...
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: успешная сборка.

- [ ] **Step 4: Manual print preview**

Открыть `http://localhost:3000/ru`, сгенерировать interactive-сказку, нажать Ctrl+P / Cmd+P, проверить:
- Плашки превратились в подчёркнутые линии
- Hint виден курсивом рядом
- Состояние "прочитано" сброшено (нет line-through / opacity)

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/InteractiveScene.tsx
git commit -m "feat(print): style interactive blanks as underlined lines with hints"
```

---

## Task 12: Финальная ручная верификация (smoke E2E)

Запустить dev и пройти полный сценарий через preview-инструменты (или браузер).

- [ ] **Step 1: Запустить dev (если не запущен)**

`npm run dev` или через preview_start.

- [ ] **Step 2: Сценарий A — classic не сломан**

Пройти визард, нажать "Создать сказку" → должна получиться обычная сказка с картинками. Проверить, что сцены отображаются с `<StoryImage>` как раньше.

- [ ] **Step 3: Сценарий B — interactive работает**

Тот же визард, нажать "💬 Сказка-диалог" → сказка должна загрузиться значительно быстрее (нет ожидания картинок). Сцены отображаются с inline-плашками. Тап по плашке — она становится бледной и зачёркнутой. Повторный тап — возвращается.

- [ ] **Step 4: Сценарий C — мобильная вёрстка**

Через preview_resize переключить на 375px ширину. Проверить:
- Кнопки "Создать сказку" и "Сказка-диалог" в столбик
- Плашки тапаются пальцем (44px target по высоте достаточно — `py-0.5` + line-height сцены даёт ≥ 32px, для верности — обычный тап в браузере с device emulation)
- Плашки не разрываются между строк (`whitespace-nowrap`)

- [ ] **Step 5: Сценарий D — возрастная адаптивность**

Запустить через curl или UI три генерации с возрастами `3`, `6`, `9`. Проверить количество blank-сегментов в ответе соответствует ожиданиям (2-3 / 4-5 / 5-7 на сцену).

- [ ] **Step 6: Сценарий E — старые сохранённые сказки**

Если есть сохранённые сказки в localStorage (или вручную сохранить classic-сказку), открыть из библиотеки — должна отрисоваться как раньше.

- [ ] **Step 7: Сценарий F — сохранение interactive-сказки**

Сохранить interactive-сказку, перезагрузить страницу, открыть из библиотеки — рендерится с плашками, тапы работают, бейдж "💬 диалог" виден на карточке.

- [ ] **Step 8: Lint**

`npm run lint` — должен быть чистым (или с уровнем существующих warnings, без новых ошибок).

- [ ] **Step 9: Final commit (если были мелкие правки)**

```bash
git add -A
git commit -m "chore: final polish for interactive story feature"
```

---

## Definition of Done — финальный чек-лист

- [ ] Classic-генерация работает идентично прежней
- [ ] Interactive-генерация возвращает `segments[]`, картинки не запрашиваются
- [ ] Плотность пропусков соответствует возрасту (3-4 / 5-6 / 7-9 / 10+)
- [ ] Две кнопки видны в визарде, "Сказка-диалог" имеет outline-стиль
- [ ] Плашки тапаются на десктопе и мобильном, состояние "прочитано" работает
- [ ] Старые сохранённые сказки открываются корректно
- [ ] Новая interactive-сказка сохраняется и открывается из библиотеки с бейджем
- [ ] Печать даёт подчёркнутые линии + hint курсивом
- [ ] `npm run build` — без ошибок
- [ ] `npm run lint` — без новых ошибок
- [ ] Локализация работает в ru и en
- [ ] Работает в Telegram Mini App (визуальная проверка — модалок при тапе нет, скролл не ломается)

---

## Что НЕ делаем в этой итерации (явный YAGNI)

- ❌ Юнит-тесты (фреймворка нет, не вводим)
- ❌ Голосовой ввод
- ❌ Сохранение ответов ребёнка
- ❌ Ветвление сюжета
- ❌ Аналитика на тапы плашек
- ❌ Новые роуты или страницы
