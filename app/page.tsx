'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: { WebApp: { ready: ()=>void; expand: ()=>void; openInvoice: (u:string,cb?:(s:string)=>void)=>void } }
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const K = { date:'ft-date', count:'ft-count', extra:'ft-extra', paid:'ft-paid-until', stories:'ft-saved', owner:'ft-owner' }
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
function isOwner() { try { return localStorage.getItem(K.owner)==='1' } catch { return false } }
function isPremium() { return isDevMode() || isOwner() || getPaidUntil() > Date.now() }
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

// ── Guided input suggestion data ──────────────────────────────────────────────
const AGE_OPTIONS = ['3 года','4 года','5 лет','6 лет','7 лет','8 лет','9 лет','10+ лет']
const HERO_SUGGESTIONS = ['котёнок','щенок','лисёнок','дракончик','зайчонок','медвежонок','принцесса','маленький рыцарь','волшебник','фея']
const SITUATION_SUGGESTIONS: Record<SituationType,string[]> = {
  fear:        ['боится темноты','боится собак','боится врача и уколов','боится грозы','боится страшных снов','боится остаться одному'],
  emotion:     ['злится и кричит','ревнует к братику или сестричке','обижается и замыкается','не хочет делиться','расстраивается из-за мелочей','завидует другу'],
  adaptation:  ['идёт в новый садик','переехали в новый дом','идёт в первый класс','появился братик или сестричка','новая школа','родители расстались'],
  behavior:    ['дерётся с другими детьми','говорит неправду','не убирает игрушки','не хочет ложиться спать','капризничает за едой','не слушается'],
  preparation: ['завтра к стоматологу','завтра к врачу на укол','первый день в садике','первый полёт на самолёте','операция или обследование','переход в новый класс'],
  fun:         ['хочет стать волшебником','мечтает найти клад','хочет подружиться со всеми животными','хочет стать супергероем'],
}
const FAVORITES_OPTIONS = ['динозавры','принцессы','супергерои','машинки','животные','космос','единороги','рыцари','феи','море','рисование','спорт']
const LESSON_SUGGESTIONS = ['быть смелым','делиться с другими','говорить правду','быть добрым','не бояться нового','справляться со злостью','дружить','слушаться родителей']
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
  // Transparent floating nav — Stitch hero screen
  return (
    <header className="fixed top-0 w-full z-50 bg-transparent print:hidden hidden md:block">
      <div className="w-full px-10 py-6 flex justify-between items-center">
        <div className="font-headline-lg text-white drop-shadow-md italic" style={{fontFamily:'Literata,Georgia,serif',fontSize:24,fontWeight:700}}>Волшебная Сказка</div>
        <button className="text-white text-sm font-semibold bg-white/15 backdrop-blur-md px-5 py-2 rounded-full border border-white/25 hover:bg-white/25 transition-all cursor-pointer">
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
      <div className="px-edge-margin-desktop flex flex-col md:flex-row justify-between items-center gap-stack-md">
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

// ── Chip suggestion helpers ───────────────────────────────────────────────────
const cBase = 'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer'
const cOn   = 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
const cOff  = 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-[#1a3a2a]/50'
const hintLabel = 'text-[11px] font-medium uppercase tracking-wider mt-1'

function AgeChips({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AGE_OPTIONS.map(a=>(
        <button key={a} type="button" onClick={()=>onChange(a===value?'':a)}
          className={`${cBase} ${value===a?cOn:cOff}`}>{a}</button>
      ))}
    </div>
  )
}

function SuggestionChips({options,value,onChange}:{options:string[];value:string;onChange:(v:string)=>void}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt=>(
        <button key={opt} type="button" onClick={()=>onChange(opt===value?'':opt)}
          className={`${cBase} ${value===opt?cOn:cOff}`}>{opt}</button>
      ))}
    </div>
  )
}

function MultiSuggestionChips({options,value,onChange}:{options:string[];value:string;onChange:(v:string)=>void}) {
  const sel = value ? value.split(',').map(s=>s.trim()).filter(Boolean) : []
  const toggle = (opt:string)=>{
    const s=new Set(sel); if(s.has(opt)) s.delete(opt); else s.add(opt)
    onChange([...s].join(', '))
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt=>(
        <button key={opt} type="button" onClick={()=>toggle(opt)}
          className={`${cBase} ${sel.includes(opt)?cOn:cOff}`}>{opt}</button>
      ))}
    </div>
  )
}

// ── Create Story Form — Stitch "Ночная сказка" design ────────────────────────
// Hero desktop: Stitch screen 31f3c84c (1376×768), mobile: 9bb16ef2 (768×1376)

function CreateForm({onGenerate,isLoading}:{onGenerate:(f:FormData)=>Promise<void>;isLoading:boolean}) {
  const [form,setForm] = useState<FormData>({childName:'',age:'',hero:'',situation:'',situationType:'fear',favorites:'',lesson:''})
  const sitType = SIT_TYPES.find(t=>t.id===form.situationType)!

  const handleRandom = async()=>{
    const r=pick(R_SITS)
    const rf:FormData={childName:pick(R_NAMES),age:pick(R_AGES),hero:pick(R_HEROES),
      situation:r.situation,situationType:r.situationType,favorites:pick(R_FAVS),lesson:''}
    setForm(rf); await onGenerate(rf)
  }

  const CHIP_TYPES = [
    {id:'fear'        as SituationType, label:'Страх'},
    {id:'emotion'     as SituationType, label:'Эмоции'},
    {id:'adaptation'  as SituationType, label:'Новое'},
    {id:'preparation' as SituationType, label:'Событие'},
    {id:'behavior'    as SituationType, label:'Поведение'},
    {id:'fun'         as SituationType, label:'Просто сказка'},
  ]

  const chip = (active:boolean) => `form-chip${active?' form-chip-active':''}`
  const sub  = (active:boolean) => `form-subchip${active?' form-subchip-active':''}`

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          SECTION 1 — HERO (Stitch: screen a7285ac6)
          Dark forest, fox image, text at bottom 30%
      ══════════════════════════════════════════════════════ */}
      <section className="relative h-screen w-full overflow-hidden" style={{background:'#0d2b1e'}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-desktop.jpg" alt="Волшебный лес с лисёнком"
          className="absolute inset-0 w-full h-full object-cover object-top md:object-center" />
        {/* Bottom gradient — covers lower portion for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-b from-transparent via-[rgba(10,31,20,0.6)] to-[rgba(10,31,20,0.98)] pointer-events-none"/>
        {/* Text block — anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center text-center px-6 md:px-12 pb-20 md:pb-10">
          <p className="hidden md:block text-white/55 text-[11px] font-semibold tracking-[0.15em] uppercase mb-3">✦ Терапевтические сказки для детей ✦</p>
          <h1 className="text-[28px] md:text-[48px] leading-tight font-bold text-white mb-1 tracking-tight" style={{fontFamily:'Literata,Georgia,serif'}}>
            Создайте волшебную сказку
          </h1>
          <h2 className="text-[18px] md:text-[28px] italic text-white/85 mb-3" style={{fontFamily:'Literata,Georgia,serif'}}>
            для вашего ребёнка
          </h2>
          <p className="hidden md:block text-white/70 text-[15px] max-w-lg mb-5 leading-relaxed">
            Мягкая персональная история, которая поможет малышу справиться со страхом, новой ситуацией или сложным переживанием
          </p>
          <button type="button" onClick={handleRandom} disabled={isLoading}
            className="px-7 py-3 md:py-3.5 rounded-full font-bold text-[14px] md:text-[15px] tracking-wide shadow-[0_0_30px_rgba(164,103,19,0.4)] hover:scale-105 transition-all flex items-center gap-2 mb-3 disabled:opacity-50 cursor-pointer"
            style={{background:'#a46713',color:'#fff'}}>
            ✨ Попробовать волшебство
          </button>
          <p className="text-white/45 text-[13px]">или заполните форму ниже для персональной сказки <span className="material-symbols-outlined align-middle text-sm">arrow_downward</span></p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — FORM (Stitch: screen e6fa9ca5)
          Dark forest bg, fireflies, centered card max-w-740
      ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full py-16 md:py-20 overflow-hidden flex flex-col items-center" style={{background:'#0d2b1e'}}>
        {/* Bokeh + Fireflies */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="bokeh w-96 h-96 top-[-100px] left-[-100px]" style={{background:'#1a4a34'}}/>
          <div className="bokeh w-80 h-80 bottom-[20%] right-[-50px]" style={{background:'#143d2b'}}/>
          <div className="firefly top-[20%] left-[15%]" style={{animationDelay:'0s'}}/>
          <div className="firefly top-[40%] right-[20%]" style={{animationDelay:'2s'}}/>
          <div className="firefly top-[60%] left-[25%]" style={{animationDelay:'4s'}}/>
          <div className="firefly top-[80%] right-[10%]" style={{animationDelay:'1s'}}/>
          <div className="firefly top-[10%] right-[30%]" style={{animationDelay:'3s'}}/>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[740px] mx-auto px-4 flex flex-col items-center">
          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="font-bold text-[32px] md:text-[44px] leading-tight mb-4" style={{fontFamily:'Literata,Georgia,serif',color:'#fef9f3'}}>
              Давай создавать волшебство
            </h2>
            <p className="text-[15px] max-w-[520px] mx-auto leading-relaxed" style={{color:'rgba(254,249,243,0.65)'}}>
              Выбери элементы, которые нравятся вашему малышу, и наша магия сплетёт из них неповторимую историю, полную доброты и чудес.
            </p>
            <div className="text-yellow-300 text-xl mt-3">✦</div>
          </div>

          {/* Form Card */}
          <div className="w-full rounded-[24px] p-6 md:p-10" style={{background:'#fffdf8',boxShadow:'0 20px 40px rgba(0,0,0,0.3)'}}>
            <form onSubmit={async e=>{e.preventDefault();await onGenerate(form)}} className="flex flex-col gap-8">

              {/* ── Имя + Возраст ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Имя ребёнка</label>
                  <input value={form.childName} required placeholder="Введите имя"
                    onChange={e=>setForm(f=>({...f,childName:e.target.value}))}
                    className="form-input-night" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Возраст</label>
                  <div className="flex flex-wrap gap-2">
                    {['3 года','4 года','5 лет','6 лет','7 лет','8 лет','9 лет','10+ лет'].map(a=>(
                      <button key={a} type="button" onClick={()=>setForm(f=>({...f,age:a}))}
                        className={chip(form.age===a)}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Главный герой ── */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Главный герой</label>
                <div className="flex flex-wrap gap-2">
                  {HERO_SUGGESTIONS.map(h=>(
                    <button key={h} type="button" onClick={()=>setForm(f=>({...f,hero:h}))}
                      className={chip(form.hero===h)}>{h}</button>
                  ))}
                </div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mt-2" style={{color:'#727973'}}>или напишите своё</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727973]/50" style={{fontSize:20}}>auto_stories</span>
                  <input value={form.hero} required placeholder="Маленький лисёнок, храбрый рыцарь..."
                    onChange={e=>setForm(f=>({...f,hero:e.target.value}))}
                    className="form-input-night pl-12" />
                </div>
              </div>

              {/* ── Тема сказки ── */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Тема сказки</label>
                <div className="flex flex-wrap gap-2">
                  {CHIP_TYPES.map(t=>(
                    <button key={t.id} type="button" onClick={()=>setForm(f=>({...f,situationType:t.id,situation:''}))}
                      className={chip(form.situationType===t.id)}>{t.label}{form.situationType===t.id?' ★':''}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1 p-4 rounded-xl" style={{background:'#f7f3ed'}}>
                  {SITUATION_SUGGESTIONS[form.situationType].map(s=>(
                    <button key={s} type="button" onClick={()=>setForm(f=>({...f,situation:s}))}
                      className={sub(form.situation===s)}>{s}</button>
                  ))}
                </div>
                <label className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#727973'}}>или опишите точнее</label>
                <input value={form.situation} required placeholder={sitType.hint}
                  onChange={e=>setForm(f=>({...f,situation:e.target.value}))}
                  className="form-input-night" />
              </div>

              {/* ── Любимые вещи ── */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Любимые вещи и интересы</label>
                <div className="flex flex-wrap gap-2">
                  {FAVORITES_OPTIONS.map(f2=>(
                    <button key={f2} type="button"
                      onClick={()=>setForm(f=>{
                        const arr=f.favorites?f.favorites.split(',').map(s=>s.trim()).filter(Boolean):[]
                        return {...f, favorites: arr.includes(f2) ? arr.filter(s=>s!==f2).join(', ') : [...arr,f2].join(', ')}
                      })}
                      className={chip(form.favorites.includes(f2))}>{f2}</button>
                  ))}
                </div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{color:'#727973'}}>или напишите своё</label>
                <input value={form.favorites} placeholder="Космос, динозавры, рисование..."
                  onChange={e=>setForm(f=>({...f,favorites:e.target.value}))}
                  className="form-input-night" />
              </div>

              {/* ── Чему учит ── */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>Чему учит сказка?</label>
                <div className="flex flex-wrap gap-2">
                  {LESSON_SUGGESTIONS.map(l=>(
                    <button key={l} type="button" onClick={()=>setForm(f=>({...f,lesson:l}))}
                      className={chip(form.lesson===l)}>{l}</button>
                  ))}
                </div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{color:'#727973'}}>или напишите своё</label>
                <input value={form.lesson} placeholder="Доброте, дружбе, честности..."
                  onChange={e=>setForm(f=>({...f,lesson:e.target.value}))}
                  className="form-input-night" />
              </div>

              {/* ── CTA ── */}
              <button type="submit" disabled={isLoading}
                className="w-full h-14 rounded-xl text-white font-bold text-sm uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                style={{background:'#0d2b1e'}}>
                {isLoading ? 'Создаём сказку...' : '✨ Создать сказку'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <SiteFooter/>
    </>
  )
}


// ── Story Reading (временный placeholder — ждёт согласования макета) ──────────
function StoryReading({story,onBack,onSave,alreadySaved,onShare,shareStatus,onDownloadPDF,pdfLoading,pdfError,storyRef}:{
  story:Story;onBack:()=>void;onSave:()=>void;alreadySaved:boolean
  onShare:()=>void;shareStatus:string;onDownloadPDF:()=>void;pdfLoading:boolean;pdfError:string
  storyRef:React.RefObject<HTMLDivElement|null>
}) {
  return (
    <div className="min-h-screen pb-28 md:pb-16 print:pb-0" style={{background:'var(--bg)'}}>
      <div ref={storyRef}>
        {story.scenes.map((scene,i)=>(
          <section key={i} className="max-w-5xl mx-auto px-4 py-10 md:py-14">
            {i===0&&(
              <div className="text-center mb-10">
                <p className="text-label-caps mb-4 flex items-center justify-center gap-2" style={{color:'var(--text-muted)'}}>
                  <span className="material-symbols-outlined" style={{fontSize:16}}>book_2</span> Глава {i+1}
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
        {/* Вопросы для обсуждения */}
        {story.discussion && story.discussion.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-10 print:pb-6">
            <div className="rounded-2xl p-6 md:p-8" style={{background:'#f0f5f0',border:'1px solid rgba(26,58,42,0.12)'}}>
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined" style={{color:'var(--primary)',fontSize:20}}>forum</span>
                <h3 className="font-serif font-bold text-lg" style={{color:'var(--primary)'}}>Поговорите с ребёнком</h3>
              </div>
              <div className="space-y-4">
                {story.discussion.map((q,i)=>(
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white mt-0.5" style={{background:'var(--primary)'}}>
                      {i+1}
                    </div>
                    <p className="leading-relaxed" style={{color:'var(--text)',fontFamily:'var(--font-serif)',fontSize:'1.05rem'}}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Якорь */}
        {story.anchor && (
          <section className="max-w-3xl mx-auto px-4 pb-12 print:pb-8">
            <div className="rounded-2xl p-6 md:p-8" style={{background:'#fffbeb',border:'1px solid #fcd34d'}}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{fontSize:20}}>✨</span>
                <h3 className="font-serif font-bold text-lg" style={{color:'#92400e'}}>{story.anchor.title}</h3>
              </div>
              <p className="leading-relaxed" style={{color:'#78350f',fontFamily:'var(--font-serif)',fontSize:'1.05rem'}}>{story.anchor.description}</p>
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto px-4 py-12 print:hidden">
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button onClick={onBack} className="clay-btn px-6 py-3 rounded-full font-semibold text-sm cursor-pointer">← Создать новую</button>
            <button onClick={onSave} disabled={alreadySaved} className="clay-btn px-6 py-3 rounded-full font-semibold text-sm cursor-pointer disabled:opacity-60">
              {alreadySaved ? '✓ Сохранено' : '💾 Сохранить'}
            </button>
            <button onClick={onDownloadPDF} disabled={pdfLoading} className="clay-btn-outline px-6 py-3 rounded-full font-semibold text-sm cursor-pointer">
              {pdfLoading ? 'Создаём...' : '↓ PDF'}
            </button>
            <button onClick={onShare} className="clay-btn-outline px-6 py-3 rounded-full font-semibold text-sm cursor-pointer">
              {shareStatus!=='idle' ? '✓ Скопировано' : '↗ Поделиться'}
            </button>
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
    if(params.get('owner')==='1'){ try{localStorage.setItem(K.owner,'1')}catch{} }
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
            {mobileTab!=='create'&&<MobileTopBar title="Волшебная Сказка"/>}
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
