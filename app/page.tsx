'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: { WebApp: { ready: ()=>void; expand: ()=>void; openInvoice: (u:string,cb?:(s:string)=>void)=>void } }
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const K = { date:'ft-date', count:'ft-count', extra:'ft-extra', paid:'ft-paid-until', stories:'ft-saved' }
const today = () => new Date().toLocaleDateString('en-CA')
function getDailyUsage() {
  try {
    if (localStorage.getItem(K.date) !== today()) { localStorage.setItem(K.date,today()); localStorage.setItem(K.count,'0'); return 0 }
    return parseInt(localStorage.getItem(K.count)||'0',10)
  } catch { return 0 }
}
function incUsage() { try { localStorage.setItem(K.count,String(getDailyUsage()+1)) } catch{} }
function getExtra() { try { return parseInt(localStorage.getItem(K.extra)||'0',10) } catch { return 0 } }
function setExtra(n:number) { try { localStorage.setItem(K.extra,String(Math.max(0,n))) } catch{} }
function getPaidUntil() { try { return parseInt(localStorage.getItem(K.paid)||'0',10) } catch { return 0 } }
function setPaidUntil(ms:number) { try { localStorage.setItem(K.paid,String(ms)) } catch{} }
function isDevMode() {
  try { return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' } catch { return false }
}
function isPremium() { return isDevMode() || getPaidUntil() > Date.now() }
function canGenerate() { return isPremium() || getDailyUsage()<1 || getExtra()>0 }
function loadSaved(): SavedStory[] { try { return JSON.parse(localStorage.getItem(K.stories)||'[]') } catch { return [] } }
function saveTos(s:SavedStory[]) { localStorage.setItem(K.stories,JSON.stringify(s)) }

// ── Types ─────────────────────────────────────────────────────────────────────
interface Scene { text:string; imagePrompt:string }
interface Story { title:string; scenes:Scene[]; discussion?:string[]; anchor?:{title:string;description:string} }
interface SavedStory { id:string; savedAt:string; childName:string; story:Story }
type SituationType = 'fear'|'emotion'|'adaptation'|'behavior'|'preparation'|'fun'
interface FormData { childName:string; age:string; hero:string; situation:string; situationType:SituationType; favorites:string; lesson:string }
type MobileTab = 'create'|'library'|'profile'

// ── Situation config ──────────────────────────────────────────────────────────
const SIT_TYPES: {id:SituationType;emoji:string;label:string;hint:string}[] = [
  {id:'fear',       emoji:'😨',label:'Страх',         hint:'боится темноты, собак, врача...'},
  {id:'emotion',    emoji:'😤',label:'Эмоции',        hint:'злится, ревнует, обижается...'},
  {id:'adaptation', emoji:'🏠',label:'Новое',         hint:'новый садик, переезд, школа...'},
  {id:'preparation',emoji:'🗓️',label:'Событие',       hint:'завтра к врачу, стрижка...'},
  {id:'behavior',   emoji:'🤝',label:'Поведение',     hint:'не делится, не слушается...'},
  {id:'fun',        emoji:'✨',label:'Просто сказка',hint:'весёлое приключение'},
]

const R_NAMES  = ['Маша','Саша','Дима','Аня','Ваня','Катя','Соня','Миша','Даша','Лёша']
const R_AGES   = ['3-4 года','5-6 лет','7-8 лет','9-10 лет']
const R_HEROES = ['котёнок Пушок','дракончик Огонёк','щенок Бобик','лисёнок Рыжик','медвежонок Топтыжка','зайчонок Ушастик']
const R_SITS:{situation:string;situationType:SituationType}[] = [
  {situation:'боится темноты',          situationType:'fear'},
  {situation:'боится идти к врачу',     situationType:'fear'},
  {situation:'не хочет идти в новый садик',situationType:'adaptation'},
  {situation:'злится и кричит',         situationType:'emotion'},
  {situation:'ревнует к младшему братику',situationType:'emotion'},
  {situation:'завтра первый раз к стоматологу',situationType:'preparation'},
]
const R_FAVS = ['динозавры и космос','мороженое и рисование','машинки и конструктор','принцессы и единороги']
const pick = <T,>(a:T[]):T => a[Math.floor(Math.random()*a.length)]
const imgUrl = (p:string,i:number) => `/api/image?prompt=${encodeURIComponent(p.trim().slice(0,120))}&seed=${i*137+42}`

// ── Image component ───────────────────────────────────────────────────────────
function StoryImage({prompt,index}:{prompt:string;index:number}) {
  const [phase,setPhase] = useState<'loading'|'done'|'fallback'>('loading')
  const [src,setSrc] = useState<string|null>(null)
  const mounted = useRef(true)
  useEffect(()=>{ mounted.current=true; return()=>{ mounted.current=false } },[])
  const load = useCallback(async(attempt=0)=>{
    if(!mounted.current)return
    setPhase('loading'); setSrc(null)
    try {
      const url = attempt>0?`${imgUrl(prompt,index)}&t=${Date.now()}`:imgUrl(prompt,index)
      const res = await fetch(url)
      if(!res.ok)throw new Error(`${res.status}`)
      const blob = await res.blob()
      if(!mounted.current)return
      setSrc(URL.createObjectURL(blob)); setPhase('done')
    } catch {
      if(!mounted.current)return
      if(attempt<3) setTimeout(()=>load(attempt+1),5000*(attempt+1))
      else setPhase('fallback')
    }
  },[prompt,index])
  useEffect(()=>{ const t=setTimeout(()=>load(0),index*600); return()=>clearTimeout(t) },[prompt,index,load])
  useEffect(()=>()=>{ if(src)URL.revokeObjectURL(src) },[src])

  const fallbackBgs = [['#FEF3C7','#FDE68A'],['#EDE9FE','#C4B5FD'],['#D1FAE5','#6EE7B7']]
  const [c1,c2] = fallbackBgs[index%3]
  return (
    <div className="relative w-full overflow-hidden print:shadow-none" style={{background:c1,aspectRatio:'4/3',borderRadius:'1rem'}}>
      {phase==='loading'&&(
        <div className="absolute inset-0 watercolor-shimmer flex flex-col items-center justify-center gap-2">
          <span className="text-3xl animate-pulse">🎨</span>
          <span className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>Создаём иллюстрацию...</span>
        </div>
      )}
      {phase==='fallback'&&(
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{background:`linear-gradient(135deg,${c1},${c2})`}}>
          <span className="text-4xl">✨</span>
          <button onClick={()=>load(0)} className="text-xs bg-white/80 hover:bg-white px-4 py-1.5 rounded-full cursor-pointer transition-colors" style={{color:'var(--primary)'}}>
            Повторить загрузку
          </button>
        </div>
      )}
      {phase==='done'&&src&&(
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Иллюстрация ${index+1}`}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={e=>{(e.target as HTMLImageElement).style.opacity='1'}} />
      )}
    </div>
  )
}

// ── Desktop Navigation ────────────────────────────────────────────────────────
function DesktopNav({activeTab,onTabChange}:{activeTab:string;onTabChange:(t:string)=>void}) {
  // Exact Stitch HTML from screen 4371a933
  return (
    <header className="hidden md:block bg-background border-b border-outline-variant/20 sticky top-0 z-50 print:hidden">
      <div className="max-w-container-max mx-auto px-edge-margin-desktop flex justify-between items-center h-20">
        <div className="font-headline-md text-headline-md text-primary">Magic Fairy Tales</div>
        <nav className="flex gap-stack-lg items-center">
          {[
            ['library',  'Библиотека'],
            ['create',   'Создать сказку'],
            ['benefits', 'Преимущества'],
            ['support',  'Поддержка'],
          ].map(([id,label])=>(
            <button key={id} onClick={()=>onTabChange(id)}
              className={`font-body-md text-body-md transition-colors cursor-pointer ${
                activeTab===id
                  ? 'text-primary font-bold border-b-2 border-secondary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}>
              {label}
            </button>
          ))}
        </nav>
        <button className="font-body-md text-body-md text-primary font-medium hover:text-secondary transition-all cursor-pointer">
          Войти
        </button>
      </div>
    </header>
  )
}

// ── Mobile Top Bar ────────────────────────────────────────────────────────────
function MobileTopBar({title}:{title:string}) {
  return (
    <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b print:hidden" style={{borderColor:'var(--border-light)'}}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{color:'var(--primary)',fontSize:22}}>auto_stories</span>
        <div className="font-serif text-lg font-bold italic" style={{color:'var(--primary)'}}>{title}</div>
      </div>
      <button className="cursor-pointer hover:opacity-70 transition-opacity">
        <span className="material-symbols-outlined" style={{color:'var(--text-muted)',fontSize:22}}>settings</span>
      </button>
    </div>
  )
}

// ── Mobile Tab Bar ────────────────────────────────────────────────────────────
function MobileTabBar({active,onChange}:{active:MobileTab;onChange:(t:MobileTab)=>void}) {
  const tabs:[MobileTab,string,string][] = [
    ['create',  'Создать',    'auto_fix_high'],
    ['library', 'Библиотека', 'menu_book'],
    ['profile', 'Профиль',   'person'],
  ]
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-3 px-4 print:hidden"
      style={{background:'#fff',borderTop:'1px solid var(--border-light)',boxShadow:'0 -2px 12px rgba(26,58,42,0.06)'}}>
      {tabs.map(([id,label,icon])=>(
        <button key={id} onClick={()=>onChange(id)}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition-all"
          style={{color:active===id?'var(--accent)':'var(--text-muted)'}}>
          <span className="material-symbols-outlined" style={{fontSize:22}}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Site Footer (from Stitch screen 4371a933) ────────────────────────────────
function SiteFooter() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/10 pt-stack-xl pb-stack-lg print:hidden">
      <div className="max-w-container-max mx-auto px-edge-margin-desktop flex flex-col md:flex-row justify-between items-center gap-stack-md">
        <div className="font-headline-md text-headline-md text-primary">Magic Fairy Tales</div>
        <div className="flex gap-stack-lg">
          {['Политика конфиденциальности','Условия использования','Контакты','Поддержка'].map(t=>(
            <a key={t} href="#" className="font-caption text-caption text-on-surface-variant hover:text-secondary transition-colors">{t}</a>
          ))}
        </div>
        <p className="font-caption text-caption text-on-surface-variant text-center md:text-right">
          © 2024 Magic Fairy Tales. All rights reserved. Crafted with care for little dreamers.
        </p>
      </div>
    </footer>
  )
}

// ── Paywall ───────────────────────────────────────────────────────────────────
function Paywall({onPaid}:{onPaid:()=>void}) {
  const [loading,setLoading] = useState<string|null>(null)
  const [screen,setScreen] = useState<'choose'|'code'>('choose')
  const [code,setCode] = useState('')
  const [codeErr,setCodeErr] = useState('')
  const [codeLoading,setCodeLoading] = useState(false)

  const buyYookassa = async(plan:'three_stories'|'unlimited_30d')=>{
    setLoading(plan)
    try {
      const res = await fetch('/api/yookassa/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})})
      const data = await res.json()
      if(!res.ok)throw new Error(data.error)
      window.location.href = data.confirmationUrl
    } catch { setLoading(null); alert('Ошибка платежа, попробуйте позже') }
  }
  const redeemCode = async()=>{
    if(!code.trim())return
    setCodeLoading(true); setCodeErr('')
    try {
      const res = await fetch('/api/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim()})})
      const data = await res.json()
      if(!res.ok){setCodeErr(data.error||'Неверный код');return}
      setPaidUntil(Date.now()+30*24*60*60*1000); onPaid()
    } catch { setCodeErr('Ошибка сети') }
    finally { setCodeLoading(false) }
  }

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center px-4'
  const overlayBg = {background:'rgba(26,26,46,0.6)',backdropFilter:'blur(8px)'}

  if(screen==='code') return (
    <div className={overlay} style={overlayBg}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-shadow">
        <button onClick={()=>setScreen('choose')} className="text-sm mb-4 cursor-pointer" style={{color:'var(--text-muted)'}}>← Назад</button>
        <div className="text-center text-4xl mb-4">🔑</div>
        <h3 className="font-serif text-xl font-bold text-center mb-4" style={{color:'var(--primary)'}}>Код активации</h3>
        <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setCodeErr('')}}
          placeholder="XXXXXXXX" maxLength={8}
          className="w-full border-2 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none mb-3"
          style={{borderColor:codeErr?'#ef4444':'var(--border)'}} />
        {codeErr&&<p className="text-red-500 text-sm text-center mb-3">{codeErr}</p>}
        <button onClick={redeemCode} disabled={codeLoading||code.length<6}
          className="w-full rounded-2xl py-3.5 font-bold text-white disabled:opacity-50 cursor-pointer hover:opacity-90"
          style={{background:'var(--primary)'}}>
          {codeLoading?'Проверяем...':'✅ Активировать'}
        </button>
      </div>
    </div>
  )

  return (
    <div className={overlay} style={overlayBg}>
      <div className="bg-white rounded-3xl p-7 max-w-sm w-full card-shadow">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📖</div>
          <h2 className="font-serif text-xl font-bold" style={{color:'var(--primary)'}}>Продолжить создавать сказки</h2>
          <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Выберите тариф</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[{plan:'three_stories' as const,label:'3 сказки',price:'149 ₽',tag:null},{plan:'unlimited_30d' as const,label:'30 дней',price:'349 ₽',tag:'Выгоднее'}].map(t=>(
            <div key={t.plan} className="relative rounded-2xl p-4 text-center"
              style={t.tag?{background:'var(--primary-light)',border:`2px solid var(--primary)`}:{background:'#fffbeb',border:'2px solid #fde68a'}}>
              {t.tag&&<div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'var(--primary)'}}>{t.tag}</div>}
              <div className="text-sm font-bold mt-1" style={{color:'var(--primary)'}}>{t.label}</div>
              <div className="text-2xl font-black text-gray-900 my-1">{t.price}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['three_stories','unlimited_30d'] as const).map((plan,i)=>(
            <button key={plan} onClick={()=>buyYookassa(plan)} disabled={!!loading}
              className="rounded-2xl py-3.5 font-bold text-white flex items-center justify-center cursor-pointer disabled:opacity-60 hover:opacity-90"
              style={{background:i===0?'linear-gradient(135deg,#f59e0b,#d97706)':'var(--primary)'}}>
              {loading===plan?'⏳':`💳 ${i===0?'149':'349'} ₽`}
            </button>
          ))}
        </div>
        <p className="text-center text-xs mb-2" style={{color:'var(--text-muted)'}}>СБП · Карта · SberPay · Mir Pay</p>
        <button onClick={()=>setScreen('code')} className="w-full text-xs py-1.5 cursor-pointer hover:opacity-80" style={{color:'var(--text-muted)'}}>
          Есть код активации →
        </button>
      </div>
    </div>
  )
}

// ── Create Story Form ─────────────────────────────────────────────────────────
function CreateForm({onGenerate,isLoading}:{onGenerate:(f:FormData)=>Promise<void>;isLoading:boolean}) {
  const [form,setForm] = useState<FormData>({childName:'',age:'',hero:'',situation:'',situationType:'fear',favorites:'',lesson:''})
  const sitType = SIT_TYPES.find(t=>t.id===form.situationType)!

  const handleRandom = async()=>{
    const r=pick(R_SITS)
    const rf:FormData={childName:pick(R_NAMES),age:pick(R_AGES),hero:pick(R_HEROES),
      situation:r.situation,situationType:r.situationType,favorites:pick(R_FAVS),lesson:''}
    setForm(rf); await onGenerate(rf)
  }

  // Exact Stitch input class from code.html
  const inp = "bg-transparent border-0 border-b border-[#6b7064] focus:ring-0 focus:border-[#1a3a2a] transition-colors py-2 px-0 w-full focus:outline-none"

  const FEATURES = [
    ['book_2',      'Уникальные сюжеты'],
    ['brush',       'Художественный стиль'],
    ['chat_bubble', 'Эмоциональный интеллект'],
    ['description', 'Печатное качество текста'],
  ]

  const CHIP_TYPES = [
    {id:'fear'       as SituationType, label:'Страх'},
    {id:'emotion'    as SituationType, label:'Эмоции'},
    {id:'adaptation' as SituationType, label:'Новое'},
    {id:'preparation'as SituationType, label:'Событие'},
    {id:'behavior'   as SituationType, label:'Поведение'},
    {id:'fun'        as SituationType, label:'Просто сказка'},
  ]

  return (
    <>
      {/* ── DESKTOP — exact code.html structure ── */}
      <div className="hidden md:block relative">
        <div className="px-edge-margin-desktop py-stack-xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-stack-xl items-start">

            {/* LEFT COLUMN — exact code.html */}
            <div className="flex flex-col">
              <div className="mb-stack-lg">
                {/* Drop cap: block, text-[120px], then heading with -mt-16 — exact Stitch */}
                <span className="font-lora text-[120px] leading-none text-primary/10 select-none block" aria-hidden>С</span>
                <h1 className="font-lora font-bold text-[56px] leading-[1.1] text-[#1a3a2a] -mt-16">
                  Создайте волшебную сказку для вашего ребёнка
                </h1>
              </div>

              <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-[540px]">
                Мы верим, что каждая история — это мост к сердцу ребёнка. Наши терапевтические сказки создаются индивидуально, помогая малышам мягко проживать эмоции и находить ответы на важные жизненные вопросы в уютной атмосфере магии и тепла.
              </p>

              {/* Feature list — exact code.html: icon + single label, no description */}
              <div className="space-y-stack-md mb-stack-xl">
                {FEATURES.map(([icon,label])=>(
                  <div key={label} className="flex items-center gap-stack-md text-primary">
                    <span className="material-symbols-outlined">{icon}</span>
                    <span className="font-label-md text-label-md">{label}</span>
                  </div>
                ))}
              </div>

              {/* Terracotta link — text-secondary */}
              <button type="button" onClick={handleRandom} disabled={isLoading}
                className="inline-flex items-center gap-2 text-secondary font-bold font-body-md group hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-40">
                Попробовать случайную сказку
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>

            {/* RIGHT COLUMN — exact code.html */}
            <div className="lg:pl-stack-xl">
              <div className="bg-surface-container-lowest border border-primary-container/10 p-stack-lg shadow-sm">
                <h2 className="font-headline-lg text-headline-lg text-primary mb-stack-lg">Создать сказку</h2>
                <form onSubmit={async e=>{e.preventDefault();await onGenerate(form)}} className="space-y-stack-lg">

                  {/* Row 1: Name + Age */}
                  <div className="grid grid-cols-2 gap-stack-md">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Имя ребёнка</label>
                      <input value={form.childName} required placeholder="Введите имя" type="text"
                        onChange={e=>setForm(f=>({...f,childName:e.target.value}))} className={inp} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Возраст</label>
                      <input value={form.age} placeholder="Напр. 5 лет" type="text"
                        onChange={e=>setForm(f=>({...f,age:e.target.value}))} className={inp} />
                    </div>
                  </div>

                  {/* Row 2: Hero */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Главный герой</label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#6b7064]">auto_stories</span>
                      <input value={form.hero} required placeholder="Маленький лисёнок, храбрый рыцарь..." type="text"
                        onChange={e=>setForm(f=>({...f,hero:e.target.value}))} className={`${inp} pl-8`} />
                    </div>
                  </div>

                  {/* Row 3: Theme chips — exact code.html */}
                  <div className="flex flex-col gap-3">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Тема сказки</label>
                    <div className="flex flex-wrap gap-2">
                      {CHIP_TYPES.map(t=>(
                        <button key={t.id} type="button"
                          onClick={()=>setForm(f=>({...f,situationType:t.id,situation:''}))}
                          className={`px-3 py-1 text-caption font-medium rounded-sm transition-colors cursor-pointer ${
                            form.situationType===t.id
                              ? 'bg-primary-container text-on-primary border border-primary-container'
                              : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:border-primary'
                          }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <input value={form.situation} required placeholder={sitType.hint}
                      onChange={e=>setForm(f=>({...f,situation:e.target.value}))} className={inp} />
                  </div>

                  {/* Row 4: Favorites — textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Любимые вещи и интересы</label>
                    <textarea value={form.favorites} placeholder="Космос, динозавры, рисование..." rows={2}
                      onChange={e=>setForm(f=>({...f,favorites:e.target.value}))}
                      className="bg-transparent border-0 border-b border-[#6b7064] focus:ring-0 focus:border-[#1a3a2a] transition-colors py-2 px-0 resize-none w-full focus:outline-none" />
                  </div>

                  {/* Row 5: Lesson — textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Чему учит сказка?</label>
                    <textarea value={form.lesson} placeholder="Доброте, дружбе, честности..." rows={2}
                      onChange={e=>setForm(f=>({...f,lesson:e.target.value}))}
                      className="bg-transparent border-0 border-b border-[#6b7064] focus:ring-0 focus:border-[#1a3a2a] transition-colors py-2 px-0 resize-none w-full focus:outline-none" />
                  </div>

                  {/* CTA — exact code.html: bg-[#1a3a2a] dark green */}
                  <button type="submit" disabled={isLoading}
                    className="w-full bg-[#1a3a2a] text-white py-4 font-label-md text-label-md uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50">
                    {isLoading ? 'Создаём сказку...' : 'Создать сказку'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── MOBILE — single column ── */}
      <div className="md:hidden px-edge-margin-mobile pt-stack-lg pb-32 relative">
        <div className="absolute inset-0 botanical-bg z-0" aria-hidden />
        <div className="relative z-10">
          <div className="mb-stack-lg">
            <span className="font-lora text-[72px] leading-none text-primary/10 select-none block" aria-hidden>С</span>
            <h1 className="font-lora font-bold text-[32px] leading-[1.2] text-[#1a3a2a] -mt-8">
              Создайте сказку для вашего ребёнка
            </h1>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
            Заполните детали, чтобы соткать волшебство.
          </p>

          <div className="bg-surface-container-lowest border border-primary-container/10 p-stack-lg shadow-sm">
            <form onSubmit={async e=>{e.preventDefault();await onGenerate(form)}} className="space-y-stack-lg">
              <div className="grid grid-cols-2 gap-stack-md">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Имя</label>
                  <input value={form.childName} required placeholder="Введите имя"
                    onChange={e=>setForm(f=>({...f,childName:e.target.value}))} className={inp} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Возраст</label>
                  <input value={form.age} placeholder="Лет"
                    onChange={e=>setForm(f=>({...f,age:e.target.value}))} className={inp} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Главный герой</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#6b7064]">auto_stories</span>
                  <input value={form.hero} required placeholder="Например, смелый котёнок"
                    onChange={e=>setForm(f=>({...f,hero:e.target.value}))} className={`${inp} pl-8`} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Тема сказки</label>
                <div className="flex flex-col gap-2">
                  {CHIP_TYPES.map(t=>(
                    <button key={t.id} type="button"
                      onClick={()=>setForm(f=>({...f,situationType:t.id,situation:''}))}
                      className={`px-3 py-2 text-caption font-medium rounded-sm text-left transition-colors cursor-pointer ${
                        form.situationType===t.id
                          ? 'bg-primary-container text-on-primary border border-primary-container'
                          : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <input value={form.situation} required placeholder={sitType.hint}
                  onChange={e=>setForm(f=>({...f,situation:e.target.value}))} className={inp} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Любимые вещи</label>
                <input value={form.favorites} placeholder="Космос, динозавры, рисование..."
                  onChange={e=>setForm(f=>({...f,favorites:e.target.value}))} className={inp} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Чему учит сказка?</label>
                <input value={form.lesson} placeholder="Доброте, дружбе..."
                  onChange={e=>setForm(f=>({...f,lesson:e.target.value}))} className={inp} />
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-[#1a3a2a] text-white py-4 font-label-md text-label-md uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] cursor-pointer disabled:opacity-50">
                {isLoading ? 'Создаём...' : 'Создать сказку'}
              </button>
            </form>
          </div>

          <button type="button" onClick={handleRandom} disabled={isLoading}
            className="mt-stack-lg inline-flex items-center gap-2 text-secondary font-bold font-body-md hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-40">
            Попробовать случайную сказку
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          <div className="mt-stack-xl text-center">
            <p className="font-lora italic text-[22px] leading-snug text-secondary">
              &ldquo;Каждая сказка — это мостик к сердцу ребёнка.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </>
  )
}


// ── Story Reading view (Stitch magazine layout) ───────────────────────────────
function StoryReading({story,onBack,onSave,alreadySaved,onShare,shareStatus,onDownloadPDF,pdfLoading,pdfError,storyRef}:{
  story:Story;onBack:()=>void;onSave:()=>void;alreadySaved:boolean
  onShare:()=>void;shareStatus:string;onDownloadPDF:()=>void;pdfLoading:boolean;pdfError:string
  storyRef:React.RefObject<HTMLDivElement|null>
}) {
  return (
    <div className="min-h-screen pb-28 md:pb-16 print:pb-0" style={{background:'var(--bg)'}}>
      <div ref={storyRef}>

        {/* ── Reading scenes — Stitch magazine layout ── */}
        {story.scenes.map((scene,i)=>(
          <section key={i} className="max-w-5xl mx-auto px-4 py-10 md:py-14">
            {i===0&&(
              <div className="text-center mb-10">
                <p className="text-label-caps mb-4 flex items-center justify-center gap-2" style={{color:'var(--text-muted)'}}>
                  <span>📖</span> Глава {i+1}
                </p>
                <h2 className="font-serif font-bold leading-tight" style={{fontSize:'clamp(28px,4vw,40px)',color:'var(--text)'}}>
                  {story.title}
                </h2>
              </div>
            )}
            <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch ${i%2===1?'lg:flex-row-reverse':''}`}>
              <div className="w-full lg:w-1/2 flex-shrink-0">
                <div className="relative w-full rounded-3xl overflow-hidden clay-shadow" style={{aspectRatio:'1/1'}}>
                  <StoryImage prompt={scene.imagePrompt} index={i} />
                </div>
                <div className="flex justify-center mt-3 gap-2 opacity-40" style={{color:'var(--primary)'}}>
                  <span className="text-xs">✦</span><span className="text-base">✨</span><span className="text-xs">✦</span>
                </div>
              </div>
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <p className={`text-body-reading leading-relaxed print:text-base ${i===0?'drop-cap':''}`}
                  style={{color:'var(--text)',fontFamily:'var(--font-serif)'}}>
                  {scene.text}
                </p>
              </div>
            </div>
          </section>
        ))}

        {/* ── THE END — Stitch bento 7/5 layout ── */}
        <section className="max-w-5xl mx-auto px-4 py-12 print:hidden">
          <div className="text-center mb-10">
            <h3 className="font-serif font-bold mb-2" style={{fontSize:52,color:'var(--primary)'}}>The End</h3>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{color:'var(--text-muted)'}}>
              Конец этой истории — начало следующей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
            {/* Discussion col-span-7 */}
            {story.discussion&&story.discussion.length>0&&(
              <div className="md:col-span-7 clay-card p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">💬</span>
                  <h4 className="font-serif text-xl font-bold" style={{color:'var(--text)'}}>Let&apos;s Talk About It</h4>
                </div>
                <p className="text-sm mb-5" style={{color:'var(--text-muted)'}}>Эти вопросы помогут вашему ребёнку исследовать темы истории.</p>
                <ul className="space-y-3 flex-1">
                  {story.discussion.map((q,qi)=>(
                    <li key={qi} className="rounded-xl p-4 flex gap-3 items-start" style={{background:'#fff'}}>
                      <span className="text-base mt-0.5 flex-shrink-0" style={{color:'var(--primary)'}}>
                        {['🌟','❤️','💡'][qi%3]}
                      </span>
                      <p className="text-sm leading-relaxed font-medium" style={{color:'var(--text)'}}>{q}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions + Tip col-span-5 */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="clay-card p-5 flex flex-col gap-3">
                <button onClick={onSave} disabled={alreadySaved}
                  className="clay-btn w-full py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {alreadySaved?<><span>✓</span><span>Сохранено</span></>:<><span>💾</span><span>Сохранить в библиотеку</span></>}
                </button>
                <button onClick={onDownloadPDF} disabled={pdfLoading}
                  className="clay-btn-outline w-full py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  <span>↓</span><span>{pdfLoading?'Создаём PDF...':'Скачать PDF'}</span>
                </button>
                <button onClick={onBack}
                  className="clay-btn-amber w-full py-3 font-semibold text-sm flex items-center justify-center gap-2">
                  <span>✨</span><span>Создать новую сказку</span>
                </button>
                <button onClick={onShare}
                  className="clay-btn-outline w-full py-3 font-semibold text-sm flex items-center justify-center gap-2">
                  <span>{shareStatus!=='idle'?'✓':'↗'}</span>
                  <span>{shareStatus!=='idle'?'Скопировано':'Поделиться'}</span>
                </button>
              </div>
              {story.anchor&&(
                <div className="tip-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <h5 className="font-bold text-sm" style={{color:'#1a3a1a'}}>Совет для родителей</h5>
                  </div>
                  <p className="text-xs leading-relaxed" style={{color:'#2d4a2d'}}>
                    {story.anchor.description}
                  </p>
                </div>
              )}
              <div className="clay-card p-4 text-center">
                <p className="text-xs font-semibold mb-3" style={{color:'var(--text-muted)'}}>Как вам эта история?</p>
                <div className="flex justify-center gap-4">
                  {['😔','😐','🙂','😍'].map(e=>(
                    <button key={e} className="text-2xl hover:scale-125 transition-transform cursor-pointer">{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {pdfError&&<p className="text-center text-sm text-red-500">{pdfError}</p>}
        </section>
      </div>
    </div>
  )
}

// ── Library screen (mobile) ───────────────────────────────────────────────────
function LibraryScreen({saved,onOpen,onDelete}:{saved:SavedStory[];onOpen:(s:SavedStory)=>void;onDelete:(id:string)=>void}) {
  return (
    <div className="px-5 pb-28">
      <MobileTopBar title="Волшебная Сказка" />
      <div className="mt-2 mb-6 rounded-3xl overflow-hidden relative" style={{background:'linear-gradient(135deg,var(--primary),#4a6741)',minHeight:160}}>
        <div className="p-6 text-white">
          <h2 className="font-serif text-2xl font-bold mb-1">Добро пожаловать</h2>
          <p className="text-sm opacity-80">Готовы отправиться в новое приключение?</p>
        </div>
        <div className="absolute right-4 bottom-4 text-5xl opacity-20">📖</div>
      </div>

      {saved.length===0?(
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="font-serif text-xl font-bold mb-2" style={{color:'var(--text)'}}>Библиотека пуста</h3>
          <p className="text-sm" style={{color:'var(--text-muted)'}}>Создайте первую сказку!</p>
        </div>
      ):(
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold" style={{color:'var(--text)'}}>Мои сказки</h3>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background:'var(--primary-light)',color:'var(--primary)'}}>{saved.length}</span>
          </div>
          <div className="space-y-3">
            {saved.map(s=>(
              <div key={s.id} className="bg-white rounded-2xl overflow-hidden flex gap-4 p-4 card-shadow-warm">
                <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl" style={{background:'var(--primary-light)'}}>📖</div>
                <div className="flex-1 min-w-0">
                  <button onClick={()=>onOpen(s)} className="text-left w-full">
                    <div className="font-bold text-sm truncate" style={{color:'var(--text)'}}>{s.story.title}</div>
                    <div className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{s.childName} · {s.savedAt}</div>
                  </button>
                  <button onClick={()=>onOpen(s)} className="mt-2 text-xs font-bold px-3 py-1 rounded-full cursor-pointer"
                    style={{background:'var(--primary-light)',color:'var(--primary)'}}>▶ Читать</button>
                </div>
                <button onClick={()=>onDelete(s.id)} className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-xl flex-shrink-0 self-start">×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 pb-28 md:pb-16">
      <div className="bg-white rounded-3xl p-16 text-center card-shadow">
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center float-anim" style={{background:'var(--primary-light)'}}>
            <span className="text-5xl">🪄</span>
          </div>
          <div className="absolute -top-2 -right-2 text-2xl twinkle">✨</div>
          <div className="absolute -bottom-2 -left-2 text-xl twinkle" style={{animationDelay:'0.7s'}}>⭐</div>
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2" style={{color:'var(--primary)'}}>Создаём сказку...</h2>
        <p className="text-sm font-medium" style={{color:'var(--text-muted)'}}>Волшебство занимает около минуты</p>
        <div className="mt-8 flex justify-center gap-2">
          {[0,1,2].map(i=>(
            <div key={i} className="w-2.5 h-2.5 rounded-full animate-pulse" style={{background:'var(--primary)',opacity:0.5,animationDelay:`${i*0.2}s`}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PDF generation ────────────────────────────────────────────────────────────
async function generatePDF(story:Story) {
  const dataUrls = await Promise.all(story.scenes.map(async(scene,i)=>{
    try {
      const res = await fetch(imgUrl(scene.imagePrompt,i)+'&retry=0')
      if(!res.ok)return null
      const blob = await res.blob()
      return new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result as string); r.onerror=reject; r.readAsDataURL(blob) })
    } catch { return null }
  }))
  const images = await Promise.all(dataUrls.map(url=>url?new Promise<HTMLImageElement|null>(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url}):Promise.resolve(null)))
  const SCALE=2,W=794,M=48,CW=W-M*2,LH=22,IMG_H=Math.round(CW*2/3)
  const rrect=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}
  const wrap=(ctx:CanvasRenderingContext2D,text:string,maxW:number):string[]=>{const words=text.split(' '),lines:string[]=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=word}else line=test};if(line)lines.push(line);return lines}
  const tmp=document.createElement('canvas');tmp.width=W;tmp.height=1;const tCtx=tmp.getContext('2d')!
  let totalH=M+64;for(let i=0;i<story.scenes.length;i++){totalH+=IMG_H+16;tCtx.font='16px serif';totalH+=wrap(tCtx,story.scenes[i].text,CW).length*LH+36}
  if(story.discussion?.length){totalH+=64;for(const q of story.discussion){tCtx.font='14px sans-serif';totalH+=Math.max(36,wrap(tCtx,q,CW-44).length*20)+14}}
  if(story.anchor){tCtx.font='13px sans-serif';totalH+=wrap(tCtx,story.anchor.description,CW-24).length*20+70}
  totalH+=M
  const canvas=document.createElement('canvas');canvas.width=W*SCALE;canvas.height=totalH*SCALE;const ctx=canvas.getContext('2d')!;ctx.scale(SCALE,SCALE)
  ctx.fillStyle='#f9f5ec';ctx.fillRect(0,0,W,totalH)
  let y=M;ctx.fillStyle='#2d4a1e';ctx.font='bold 28px serif';ctx.textAlign='center';ctx.fillText(story.title,W/2,y+36);y+=64;ctx.textAlign='left'
  for(let i=0;i<story.scenes.length;i++){
    if(images[i]){ctx.save();rrect(ctx,M,y,CW,IMG_H,12);ctx.clip();ctx.drawImage(images[i]!,M,y,CW,IMG_H);ctx.restore()}else{ctx.fillStyle='#e8f0e3';ctx.fillRect(M,y,CW,IMG_H)}
    y+=IMG_H+16;ctx.fillStyle='#1c1c1a';ctx.font='500 16px serif'
    for(const line of wrap(ctx,story.scenes[i].text,CW)){ctx.fillText(line,M,y+15);y+=LH};y+=36
  }
  if(story.discussion?.length){ctx.fillStyle='#2d4a1e';rrect(ctx,M,y,CW,44,10);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText('Поговорите с ребёнком',W/2,y+29);y+=58;ctx.textAlign='left';for(let i=0;i<story.discussion.length;i++){ctx.fillStyle='#2d4a1e';ctx.beginPath();ctx.arc(M+14,y+14,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),M+14,y+19);ctx.textAlign='left';ctx.fillStyle='#1c1c1a';ctx.font='14px sans-serif';const qLines=wrap(ctx,story.discussion[i],CW-44);let qy=y+2;for(const line of qLines){ctx.fillText(line,M+36,qy+14);qy+=20};y+=Math.max(36,qLines.length*20)+14}}
  if(story.anchor){y+=14;ctx.font='13px sans-serif';const aLines=wrap(ctx,story.anchor.description,CW-24);const boxH=20+24+aLines.length*20+16;ctx.strokeStyle='#fcd34d';ctx.lineWidth=2;rrect(ctx,M,y,CW,boxH,10);ctx.fillStyle='#fffbeb';ctx.fill();ctx.stroke();y+=16;ctx.fillStyle='#92400e';ctx.font='bold 13px sans-serif';ctx.fillText(`🪄 ${story.anchor.title}`,M+12,y+13);y+=26;ctx.fillStyle='#555';ctx.font='13px sans-serif';for(const line of aLines){ctx.fillText(line,M+12,y+13);y+=20}}
  const {jsPDF}=await import('jspdf');const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'})
  const pW=pdf.internal.pageSize.getWidth(),pH=pdf.internal.pageSize.getHeight(),pM=10,iW=pW-pM*2,iH=(canvas.height*iW)/canvas.width,uH=pH-pM*2
  const imgData=canvas.toDataURL('image/jpeg',0.85)
  for(let p=0;p<Math.ceil(iH/uH);p++){if(p>0)pdf.addPage();pdf.addImage(imgData,'JPEG',pM,pM-p*uH,iW,iH)}
  const isTg=!!window.Telegram?.WebApp
  if(isTg){const blob=pdf.output('blob'),url=URL.createObjectURL(blob);const opened=window.open(url,'_blank');if(!opened)pdf.save(`${story.title}.pdf`);setTimeout(()=>URL.revokeObjectURL(url),30000)}
  else pdf.save(`${story.title}.pdf`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [status,setStatus] = useState<'idle'|'loading'|'done'|'reading'>('idle')
  const [story,setStory] = useState<Story|null>(null)
  const [currentChildName,setCurrentChildName] = useState('')
  const [error,setError] = useState('')
  const [saved,setSaved] = useState<SavedStory[]>([])
  const [alreadySaved,setAlreadySaved] = useState(false)
  const [pdfLoading,setPdfLoading] = useState(false)
  const [pdfError,setPdfError] = useState('')
  const [shareStatus,setShareStatus] = useState<'idle'|'copied'|'copied-tg'>('idle')
  const [showPaywall,setShowPaywall] = useState(false)
  const [usageCount,setUsageCount] = useState(0)
  const [extra,setExtraState] = useState(0)
  const [checkingPayment,setCheckingPayment] = useState(false)
  const [mobileTab,setMobileTab] = useState<MobileTab>('create')
  const [desktopTab,setDesktopTab] = useState('create')
  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand()
    setSaved(loadSaved()); setUsageCount(getDailyUsage()); setExtraState(getExtra())
    const params=new URLSearchParams(window.location.search)
    const paymentId=params.get('payment_id'), plan=params.get('plan')
    if(paymentId&&plan){
      window.history.replaceState({},'',' /'); setCheckingPayment(true)
      let attempts=0
      const poll=async()=>{
        attempts++
        try{
          const r=await fetch(`/api/yookassa/check?payment_id=${paymentId}`)
          const data=await r.json()
          if(data.paid){
            if(data.plan==='unlimited_30d')setPaidUntil(Date.now()+30*24*60*60*1000)
            else setExtra(getExtra()+3)
            setUsageCount(getDailyUsage()); setExtraState(getExtra())
            setCheckingPayment(false); setShowPaywall(false); return
          }
        }catch{}
        if(attempts<20)setTimeout(poll,3000)
        else{setCheckingPayment(false);setShowPaywall(true)}
      }
      poll()
    }
  },[])

  const generate = async(data:FormData)=>{
    if(!canGenerate()){setShowPaywall(true);return}
    setStatus('loading'); setError(''); setAlreadySaved(false)
    try{
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      const json=await res.json()
      if(!res.ok){setError(json.error||'Ошибка генерации');setStatus('idle');return}
      const ex=getExtra()
      if(ex>0){setExtra(ex-1);setExtraState(ex-1)}else{incUsage();setUsageCount(getDailyUsage())}
      setStory(json); setCurrentChildName(data.childName); setAlreadySaved(false); setStatus('done')
      // On mobile, switch to reading after generate
      setMobileTab('create')
    }catch{setError('Не удалось подключиться к серверу.');setStatus('idle')}
  }

  const handleSave=()=>{
    if(!story)return
    const entry:SavedStory={id:Date.now().toString(),savedAt:new Date().toLocaleDateString('ru-RU'),childName:currentChildName,story}
    const updated=[entry,...saved]; setSaved(updated); saveTos(updated); setAlreadySaved(true)
  }

  const handleDelete=(id:string)=>{
    const updated=saved.filter(s=>s.id!==id); setSaved(updated); saveTos(updated)
  }

  const handleShare=async()=>{
    if(!story)return
    const text=`${story.title}\n\n${story.scenes.map(s=>s.text).join('\n\n')}`
    const isTg=!!window.Telegram?.WebApp
    if(!isTg&&navigator.share){try{await navigator.share({title:story.title,text})}catch{}}
    else{await navigator.clipboard.writeText(text);setShareStatus(isTg?'copied-tg':'copied');setTimeout(()=>setShareStatus('idle'),3000)}
  }

  const handleDownloadPDF=async()=>{
    if(!story)return
    setPdfLoading(true); setPdfError('')
    try{await generatePDF(story)}
    catch(err){setPdfError(`Ошибка PDF: ${err instanceof Error?err.message:String(err)}`)}
    finally{setPdfLoading(false)}
  }

  const openSaved=(s:SavedStory)=>{
    setStory(s.story); setCurrentChildName(s.childName); setAlreadySaved(true); setStatus('reading')
    setMobileTab('create')
  }

  const showForm = isPremium() || usageCount<1 || extra>0

  return (
    <div className="min-h-screen print:bg-white">
      {/* Payment checking */}
      {checkingPayment&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(26,26,46,0.7)',backdropFilter:'blur(8px)'}}>
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center card-shadow">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h2 className="font-serif text-xl font-bold mb-2" style={{color:'var(--primary)'}}>Проверяем оплату...</h2>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>СБП-платёж подтверждается банком</p>
          </div>
        </div>
      )}

      {!checkingPayment&&showPaywall&&(
        <Paywall onPaid={()=>{setShowPaywall(false);setUsageCount(getDailyUsage());setExtraState(getExtra())}}/>
      )}

      {/* Desktop nav */}
      {(status==='idle'||status==='loading')&&(
        <DesktopNav activeTab={desktopTab} onTabChange={setDesktopTab}/>
      )}

      {/* Content */}
      {status==='idle'&&!showForm&&(
        <div className="max-w-2xl mx-auto px-4 py-16 pb-28 md:pb-16">
          <div className="bg-white rounded-3xl p-10 text-center card-shadow">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="font-serif text-2xl font-bold mb-3" style={{color:'var(--primary)'}}>Бесплатные сказки закончились</h2>
            <p className="mb-8" style={{color:'var(--text-muted)'}}>Разблокируйте доступ — создавайте сказки для любой ситуации</p>
            <button onClick={()=>setShowPaywall(true)}
              className="w-full rounded-2xl py-4 text-white font-bold text-base cursor-pointer hover:opacity-90 transition-opacity"
              style={{background:'var(--primary)'}}>
              ✨ Разблокировать сказки
            </button>
            <p className="text-xs mt-4" style={{color:'var(--text-muted)'}}>От 149 ₽ · СБП · Карта · SberPay</p>
          </div>
        </div>
      )}

      {status==='idle'&&showForm&&(
        <>
          {/* Mobile: tabs */}
          <div className="md:hidden">
            <MobileTopBar title="Волшебная Сказка"/>
            {mobileTab==='create'&&<CreateForm onGenerate={generate} isLoading={false}/>}
            {mobileTab==='library'&&<LibraryScreen saved={saved} onOpen={openSaved} onDelete={handleDelete}/>}
            {mobileTab==='profile'&&(
              <div className="px-5 pb-28 text-center pt-16">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="font-serif text-xl font-bold mb-2" style={{color:'var(--text)'}}>Профиль</h3>
                <p className="text-sm" style={{color:'var(--text-muted)'}}>Скоро здесь появится личный кабинет</p>
              </div>
            )}
            <MobileTabBar active={mobileTab} onChange={setMobileTab}/>
          </div>

          {/* Desktop: full form + footer */}
          <div className="hidden md:block">
            <CreateForm onGenerate={generate} isLoading={false}/>
            <SiteFooter/>
          </div>
        </>
      )}

      {status==='loading'&&<LoadingScreen/>}

      {(status==='done'||status==='reading')&&story&&(
        <>
          {/* Desktop nav for reading */}
          <DesktopNav activeTab="library" onTabChange={()=>{}}/>
          <StoryReading
            story={story} storyRef={storyRef}
            onBack={()=>{setStatus('idle');setStory(null)}}
            onSave={handleSave} alreadySaved={alreadySaved}
            onShare={handleShare} shareStatus={shareStatus}
            onDownloadPDF={handleDownloadPDF} pdfLoading={pdfLoading} pdfError={pdfError}
          />
          {/* Mobile tab bar during reading */}
          <MobileTabBar active={mobileTab} onChange={(t)=>{
            if(t==='create'){setStatus('idle');setStory(null)}
            else setMobileTab(t)
          }}/>
        </>
      )}
    </div>
  )
}
