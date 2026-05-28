'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/AuthModal'
import { NameModal } from '@/components/NameModal'
import { ProfileModal } from '@/components/ProfileModal'
import { UserMenu } from '@/components/UserMenu'
import type { User } from '@supabase/supabase-js'

declare global {
  interface Window {
    Telegram?: { WebApp: { ready: ()=>void; expand: ()=>void; openInvoice: (u:string,cb?:(s:string)=>void)=>void } }
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const K = { total:'ft-total', extra:'ft-extra', paid:'ft-paid-until', stories:'ft-saved', owner:'ft-owner', ref:'ft-referral' }
const FREE_ANON_LIMIT = 3   // пожизненный лимит для незарегистрированных

function getAnonUsed() { try { return parseInt(localStorage.getItem(K.total)||'0',10) } catch { return 0 } }
function incUsage() { try { localStorage.setItem(K.total,String(getAnonUsed()+1)) } catch{} }
function getExtra() { try { return parseInt(localStorage.getItem(K.extra)||'0',10) } catch { return 0 } }
function setExtra(n:number) { try { localStorage.setItem(K.extra,String(Math.max(0,n))) } catch{} }
function getPaidUntil() { try { return parseInt(localStorage.getItem(K.paid)||'0',10) } catch { return 0 } }
function setPaidUntil(ms:number) { try { localStorage.setItem(K.paid,String(ms)) } catch{} }
function isDevMode() {
  try { return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' } catch { return false }
}
function isOwner() { try { return localStorage.getItem(K.owner)==='1' } catch { return false } }
function isPremium() { return isDevMode() || isOwner() || getPaidUntil() > Date.now() }
function canGenerate() { return isPremium() || getAnonUsed()<FREE_ANON_LIMIT || getExtra()>0 }
function loadSaved(): SavedStory[] { try { return JSON.parse(localStorage.getItem(K.stories)||'[]') } catch { return [] } }
function saveTos(s:SavedStory[]) { localStorage.setItem(K.stories,JSON.stringify(s)) }

// ── Types ─────────────────────────────────────────────────────────────────────
type StoryMode = 'classic' | 'interactive'
type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }
interface Scene { text?:string; segments?:Segment[]; imagePrompt:string }
interface Story { title:string; scenes:Scene[]; mode?:StoryMode; discussion?:string[]; anchor?:{title:string;description:string}; storySeed?:number }
interface SavedStory { id:string; savedAt:string; childName:string; story:Story; images?:Record<number,string> }
type SituationType = 'fear'|'emotion'|'adaptation'|'behavior'|'preparation'|'fun'
interface FormData { childName:string; age:string; hero:string; situation:string; situationType:SituationType; favorites:string; lesson:string }
type MobileTab = 'create'|'library'|'profile'

// ── Situation config ──────────────────────────────────────────────────────────
// ── SIT_TYPES id list (labels come from messages) ────────────────────────────
const SIT_TYPE_IDS: SituationType[] = ['fear','emotion','adaptation','preparation','behavior','fun']

const pick = <T,>(a:T[]):T => a[Math.floor(Math.random()*a.length)]

// ── Utility: typed raw messages access for arrays ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MsgRaw = any
const imgUrl = (p:string,i:number,storySeed=0) => `/api/image?prompt=${encodeURIComponent(p.trim().slice(0,120))}&seed=${storySeed+i*137+42}`

// ── Image component ───────────────────────────────────────────────────────────
function StoryImage({prompt,index,sharp=false,preloadedSrc,storySeed=0}:{prompt:string;index:number;sharp?:boolean;preloadedSrc?:string;storySeed?:number}) {
  const [phase,setPhase] = useState<'loading'|'done'|'fallback'>(preloadedSrc?'done':'loading')
  const [src,setSrc] = useState<string|null>(preloadedSrc??null)
  const mounted = useRef(true)
  useEffect(()=>{ mounted.current=true; return()=>{ mounted.current=false } },[])
  const load = useCallback(async(attempt=0)=>{
    if(!mounted.current)return
    setPhase('loading'); setSrc(null)
    try {
      const url = attempt>0?`${imgUrl(prompt,index,storySeed)}&t=${Date.now()}`:imgUrl(prompt,index,storySeed)
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
  useEffect(()=>{
    if(preloadedSrc) return
    const t=setTimeout(()=>load(0),index*600); return()=>clearTimeout(t)
  },[prompt,index,load,preloadedSrc])
  useEffect(()=>()=>{ if(src&&!preloadedSrc)URL.revokeObjectURL(src) },[src,preloadedSrc])

  // Local fallback paths (start with /) — show immediately, no spinner, no retry
  const isLocalFallback = preloadedSrc?.startsWith('/')
  const fallbackBgs = [['#FEF3C7','#FDE68A'],['#EDE9FE','#C4B5FD'],['#D1FAE5','#6EE7B7']]
  const [c1,c2] = fallbackBgs[index%3]

  if (isLocalFallback) return (
    <div className="relative w-full overflow-hidden print:shadow-none" style={{aspectRatio:'4/3',borderRadius:sharp?0:'1rem'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preloadedSrc} alt={`Иллюстрация ${index+1}`}
        className="absolute inset-0 w-full h-full object-cover"/>
    </div>
  )

  return (
    <div className="relative w-full overflow-hidden print:shadow-none" style={{background:c1,aspectRatio:'4/3',borderRadius:sharp?0:'1rem'}}>
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

// ── Language Switcher ─────────────────────────────────────────────────────────
function LangSwitcher() {
  const locale = useLocale()
  const toggle = () => {
    const path = window.location.pathname
    const href = locale === 'ru'
      ? `/en${path === '/' ? '' : path}`
      : (path.startsWith('/en') ? path.slice(3) || '/' : path)
    window.location.href = href
  }
  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors cursor-pointer text-xs font-semibold tracking-wider"
      style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',padding:'4px 8px',borderRadius:999}}>
      {locale === 'ru' ? '🇺🇸 EN' : '🇷🇺 RU'}
    </button>
  )
}

// ── Desktop Navigation ────────────────────────────────────────────────────────
function DesktopNav({activeTab,onTabChange,user,onShowAuth,onSignOut,onEditProfile,onMyStories}:{
  activeTab:string;onTabChange:(t:string)=>void
  user:User|null;onShowAuth:()=>void;onSignOut:()=>void;onEditProfile:()=>void;onMyStories:()=>void
}) {
  const t = useTranslations('nav')
  return (
    <header className="fixed top-0 w-full z-50 bg-transparent print:hidden hidden md:block">
      <div className="w-full px-10 py-6 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wizard/hero-fox.jpg" alt="" aria-hidden
            style={{width:28,height:28,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%',border:'1.5px solid rgba(255,255,255,0.35)',flexShrink:0}}/>
          <div className="flex flex-col gap-0">
            <span className="italic leading-tight" style={{fontFamily:'Literata,Georgia,serif',fontSize:24,fontWeight:700,color:'#fff',
              textShadow:'0 0 18px rgba(212,145,42,0.55), 0 0 36px rgba(212,145,42,0.2)'}}>
              {t('logo')}
            </span>
            <span className="tracking-wide" style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,0.38)',letterSpacing:'0.08em'}}>
              {t('tagline')}
            </span>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <LangSwitcher/>
          {user ? (
            <UserMenu user={user} onSignOut={onSignOut} onEditProfile={onEditProfile} onMyStories={onMyStories}/>
          ) : (
            <button onClick={onShowAuth}
              className="text-white text-sm font-semibold bg-white/15 backdrop-blur-md px-5 py-2 rounded-full border border-white/25 hover:bg-white/25 transition-all cursor-pointer">
              {t('login')}
            </button>
          )}
        </div>
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
  const t = useTranslations('tabs')
  const tabs:[MobileTab,string,string][] = [
    ['create',  t('create'),  'auto_fix_high'],
    ['library', t('library'), 'menu_book'],
    ['profile', t('profile'), 'person'],
  ]
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-3 px-4 print:hidden"
      style={{background:'rgba(10,31,20,0.97)',backdropFilter:'blur(12px)',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
      {tabs.map(([id,label,icon])=>(
        <button key={id} onClick={()=>onChange(id)}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition-all"
          style={{color:active===id?'#d4912a':'rgba(255,255,255,0.45)'}}>
          <span className="material-symbols-outlined" style={{fontSize:22}}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Site Footer (from Stitch screen 4371a933) ────────────────────────────────
function SiteFooter() {
  const t = useTranslations('footer')
  const locale = useLocale()
  return (
    <footer className="print:hidden" style={{background:'#0a1f14',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="max-w-[900px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="italic text-sm font-bold" style={{fontFamily:'Literata,Georgia,serif',color:'rgba(255,255,255,0.5)'}}>{t('logo')}</div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 items-center">
          <a href={locale === 'en' ? '/en/privacy' : '/privacy'} className="text-xs hover:opacity-80 transition-opacity" style={{color:'rgba(255,255,255,0.35)'}}>
            {t('privacy')}
          </a>
          <a href="mailto:gigor92@gmail.com" className="text-xs hover:opacity-80 transition-opacity" style={{color:'rgba(255,255,255,0.35)'}}>
            {t('contact')}
          </a>
          <LangSwitcher/>
        </div>
        <p className="text-xs" style={{color:'rgba(255,255,255,0.25)'}}>{t('copy')}</p>
      </div>
    </footer>
  )
}

// ── Paywall ───────────────────────────────────────────────────────────────────
function Paywall({onPaid,onClose,userId}:{onPaid:()=>void;onClose?:()=>void;userId?:string}) {
  const tNav = useTranslations('nav')
  const tCommonPaywall = useTranslations('common')
  const [loading,setLoading] = useState<string|null>(null)
  const [screen,setScreen] = useState<'choose'|'email'|'code'>('choose')
  const [pendingPlan,setPendingPlan] = useState<'monthly_sub'|'story_pack'|null>(null)
  const [email,setEmail] = useState('')
  const [emailErr,setEmailErr] = useState('')
  const [emailLoading,setEmailLoading] = useState(false)
  const [code,setCode] = useState('')
  const [codeErr,setCodeErr] = useState('')
  const [codeLoading,setCodeLoading] = useState(false)

  const freeLimit = userId ? 6 : 3
  const freeUsed = Math.min(getAnonUsed(), freeLimit)

  const buyYookassa = async(plan:'monthly_sub'|'story_pack', resolvedUserId?:string)=>{
    const uid = resolvedUserId ?? userId
    setLoading(plan)
    try {
      const res = await fetch('/api/yookassa/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,userId:uid})})
      const data = await res.json()
      if(!res.ok)throw new Error(data.error)
      if(data.paymentId){
        try{ localStorage.setItem('ft-pending-pay', JSON.stringify({id:data.paymentId,plan,ts:Date.now()})) }catch{}
      }
      window.location.href = data.confirmationUrl
    } catch { setLoading(null); alert('Ошибка платежа, попробуйте позже') }
  }

  // Если не залогинен — сначала создаём аккаунт по email
  const handlePlanClick = (plan:'monthly_sub'|'story_pack')=>{
    if(userId){ buyYookassa(plan); return }
    setPendingPlan(plan); setScreen('email')
  }

  const submitEmail = async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!email.trim()||!email.includes('@')){ setEmailErr('Введите корректный email'); return }
    setEmailLoading(true); setEmailErr('')
    try{
      const res = await fetch('/api/auth/pre-pay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim()})})
      const data = await res.json()
      if(!res.ok) throw new Error(data.error)
      await buyYookassa(pendingPlan!, data.userId)
    } catch { setEmailErr('Ошибка, попробуйте ещё раз'); setEmailLoading(false) }
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

  const overlay = 'fixed inset-0 z-50 flex items-end md:items-center justify-center'
  const overlayBg = {background:'rgba(10,31,20,0.85)',backdropFilter:'blur(8px)'}

  const CardWrapper = ({children}:{children:React.ReactNode})=>(
    <div className={overlay} style={overlayBg} onClick={e=>{if(e.target===e.currentTarget)onClose?.()}}>
      <div className="w-full md:max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden"
        style={{background:'#fffdf8',boxShadow:'0 -8px 40px rgba(0,0,0,0.4)'}}>
        {/* Fox header */}
        <div className="relative h-32 overflow-hidden" style={{background:'#0d2b1e'}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-desktop.jpg" alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{objectPosition:'center 15%',opacity:0.6}}/>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fffdf8]"/>
          {onClose&&(
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              style={{background:'rgba(255,255,255,0.2)',color:'white',fontSize:18}}>×</button>
          )}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="italic font-bold text-base" style={{fontFamily:'Literata,Georgia,serif',color:'#0d2b1e',
              textShadow:'0 0 12px rgba(212,145,42,0.4)'}}>{tNav('logo')}</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )

  if(screen==='email') return (
    <CardWrapper>
      <div className="p-6">
        <button onClick={()=>setScreen('choose')} className="text-sm mb-4 cursor-pointer flex items-center gap-1" style={{color:'#9ca3af'}}>
          ← {tCommonPaywall('back')}
        </button>
        <h3 className="italic font-bold text-xl text-center mb-2" style={{fontFamily:'Literata,Georgia,serif',color:'#0d2b1e'}}>
          Ваш email для аккаунта
        </h3>
        <p className="text-xs text-center mb-5" style={{color:'#9ca3af'}}>
          Покупка привяжется к этому адресу. Войти сможете по ссылке из письма.
        </p>
        <form onSubmit={submitEmail} className="flex flex-col gap-3">
          <input value={email} onChange={e=>{setEmail(e.target.value);setEmailErr('')}}
            type="email" placeholder="your@email.com" required autoFocus
            className="form-input-night"/>
          {emailErr&&<p className="text-xs text-red-500">{emailErr}</p>}
          <button type="submit" disabled={emailLoading||!email.trim()}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 transition-all"
            style={{background:'#a46713'}}>
            {emailLoading?'Секунду...':'Перейти к оплате →'}
          </button>
        </form>
        <p className="text-[11px] text-center mt-3" style={{color:'#b0b8b0'}}>
          Имя — первая часть email. Измените потом в профиле.
        </p>
      </div>
    </CardWrapper>
  )

  if(screen==='code') return (
    <CardWrapper>
      <div className="p-6">
        <button onClick={()=>setScreen('choose')} className="text-sm mb-4 cursor-pointer flex items-center gap-1" style={{color:'#9ca3af'}}>
          ← {tCommonPaywall('back')}
        </button>
        <h3 className="italic font-bold text-xl text-center mb-5" style={{fontFamily:'Literata,Georgia,serif',color:'#0d2b1e'}}>
          Код активации
        </h3>
        <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setCodeErr('')}}
          placeholder="XXXXXXXX" maxLength={8} autoFocus
          className="w-full border-2 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.3em] focus:outline-none mb-3"
          style={{borderColor:codeErr?'#ef4444':'rgba(13,43,30,0.2)',background:'#f7f3ed'}} />
        {codeErr&&<p className="text-red-500 text-sm text-center mb-3">{codeErr}</p>}
        <button onClick={redeemCode} disabled={codeLoading||code.length<6}
          className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50 cursor-pointer hover:opacity-90 transition-all"
          style={{background:'#0d2b1e'}}>
          {codeLoading?'Проверяем...':'Активировать'}
        </button>
      </div>
    </CardWrapper>
  )

  return (
    <CardWrapper>
      <div className="p-6">
        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs" style={{color:'#9ca3af'}}>Бесплатные сказки</span>
            <span className="text-xs font-semibold" style={{color:'#0d2b1e'}}>{freeUsed} / {freeLimit}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{background:'rgba(13,43,30,0.1)'}}>
            <div className="h-1.5 rounded-full" style={{background:'#c4812a',width:'100%'}}/>
          </div>
        </div>

        <h2 className="italic font-bold text-xl text-center mb-5" style={{fontFamily:'Literata,Georgia,serif',color:'#0d2b1e'}}>
          Продолжить волшебство
        </h2>

        <div className="flex flex-col gap-3 mb-4">
          {/* Plan: story_pack */}
          <button onClick={()=>handlePlanClick('story_pack')} disabled={!!loading}
            className="w-full rounded-2xl py-4 font-bold cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between px-5"
            style={{background:'rgba(196,129,42,0.1)',border:'1.5px solid rgba(196,129,42,0.35)',color:'#7a4e0a'}}>
            <span style={{fontSize:16}}>{loading==='story_pack'?'Переходим...':'3 сказки'}</span>
            <span style={{fontSize:22,fontWeight:900,color:'#a46713'}}>49 ₽</span>
          </button>
          {/* Plan: monthly — preferred */}
          <button onClick={()=>handlePlanClick('monthly_sub')} disabled={!!loading}
            className="w-full rounded-2xl py-4 font-bold text-white cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between px-5 relative"
            style={{background:'#0d2b1e',boxShadow:'0 4px 20px rgba(13,43,30,0.3)'}}>
            <span className="absolute -top-2.5 right-4 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{background:'#3a9e5f'}}>Лучший выбор</span>
            <span style={{fontSize:16}}>{loading==='monthly_sub'?'Переходим...':'Безлимит на месяц'}</span>
            <span style={{fontSize:22,fontWeight:900}}>99 ₽</span>
          </button>
        </div>

        <p className="text-center text-xs mb-3" style={{color:'#b0b8b0'}}>СБП · Карта · SberPay · Mir Pay</p>
        <button onClick={()=>setScreen('code')}
          className="w-full text-xs py-2 cursor-pointer hover:opacity-70 transition-opacity text-center"
          style={{color:'#b0b8b0'}}>
          Есть код активации →
        </button>
      </div>
    </CardWrapper>
  )
}

// ── Chip suggestion helpers ───────────────────────────────────────────────────
const cBase = 'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer'
const cOn   = 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
const cOff  = 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-[#1a3a2a]/50'
const hintLabel = 'text-[11px] font-medium uppercase tracking-wider mt-1'


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

const LAST_CHILD_KEY = 'ft-last-child'
function getLastChild():{name:string;age:string}{
  try{ const d=JSON.parse(localStorage.getItem(LAST_CHILD_KEY)||'{}'); return {name:d.name||'',age:d.age||''} }
  catch{ return {name:'',age:''} }
}
function saveLastChild(name:string,age:string){ try{localStorage.setItem(LAST_CHILD_KEY,JSON.stringify({name,age}))}catch{} }

function CreateForm({onGenerate,isLoading,onOpenLibrary,onShowAuth,onShowProfile,user}:{onGenerate:(f:FormData,mode?:StoryMode)=>Promise<void>;isLoading:boolean;onOpenLibrary?:()=>void;onShowAuth?:()=>void;onShowProfile?:()=>void;user?:User|null}) {
  const t = useTranslations()
  const [form,setForm] = useState<FormData>({childName:'',age:'',hero:'',situation:'',situationType:'fear',favorites:'',lesson:''})
  const wizardRef = useRef<HTMLElement>(null)

  useEffect(()=>{
    const last = getLastChild()
    if(last.name||last.age) setForm(f=>({...f,childName:last.name,age:last.age}))
  },[])
  const [step,setStep] = useState(1)

  // ── Locale-aware data from messages ──────────────────────────────────────────
  const tRaw = t.raw as (key: string) => MsgRaw
  const HERO_CARDS:  {name:string;img:string}[]                         = tRaw('wizard.heroes')
  const AGE_GROUPS:  string[]                                            = tRaw('wizard.ageGroups')
  const SIT_TYPES_L: {id:string;label:string;hint:string;img:string}[]  = tRaw('wizard.situationTypes')
  const SIT_SUGG:    Record<SituationType,string[]>                      = tRaw('wizard.situationSuggestions')
  const FAVORITES:   string[]                                            = tRaw('wizard.favorites')
  const R_NAMES:     string[]                                            = tRaw('wizard.randomNames')
  const R_HEROES:    string[]                                            = tRaw('wizard.randomHeroes').map((h:{name:string})=>h.name??h)
  const R_FAVS:      string[]                                            = tRaw('wizard.randomFavorites')
  const R_AGES:      string[]                                            = AGE_GROUPS

  const sitType = SIT_TYPES_L.find(s=>s.id===form.situationType) ?? SIT_TYPES_L[0]

  const R_SITS:{situation:string;situationType:SituationType}[] = [
    {situation:SIT_SUGG.fear[0],      situationType:'fear'},
    {situation:SIT_SUGG.fear[2],      situationType:'fear'},
    {situation:SIT_SUGG.adaptation[0],situationType:'adaptation'},
    {situation:SIT_SUGG.emotion[0],   situationType:'emotion'},
    {situation:SIT_SUGG.emotion[1],   situationType:'emotion'},
    {situation:SIT_SUGG.preparation[0],situationType:'preparation'},
  ]

  const handleRandom = async()=>{
    const r=pick(R_SITS)
    const rf:FormData={childName:pick(R_NAMES),age:pick(R_AGES),hero:pick(R_HEROES),
      situation:r.situation,situationType:r.situationType as SituationType,favorites:pick(R_FAVS),lesson:''}
    setForm(rf); saveLastChild(rf.childName,rf.age); await onGenerate(rf)
  }

  const canNext = () => {
    if(step===1) return form.childName.trim().length>0 && form.age.length>0
    if(step===2) return form.hero.trim().length>0
    if(step===3) return form.situation.trim().length>0
    return true
  }

  const toggleFav = (f2:string) => setForm(f=>{
    const arr=f.favorites?f.favorites.split(',').map(s=>s.trim()).filter(Boolean):[]
    return {...f, favorites: arr.includes(f2)?arr.filter(s=>s!==f2).join(', '):[...arr,f2].join(', ')}
  })

  const chip = (active:boolean) => `form-chip${active?' form-chip-active':''}`
  const sub  = (active:boolean) => `form-subchip${active?' form-subchip-active':''}`

  const STEP_LABELS = [t('wizard.step1Label'),t('wizard.step2Label'),t('wizard.step3Label'),t('wizard.step4Label')]

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          SECTION 1 — HERO (Stitch: screen a7285ac6)
          Dark forest, fox image, text at bottom 30%
      ══════════════════════════════════════════════════════ */}
      <section className="relative h-[88vh] md:h-screen w-full overflow-hidden" style={{background:'#0d2b1e'}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-desktop.jpg" alt="Волшебный лес с лисёнком"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] md:object-center" />
        {/* Mobile transparent header — overlaid on fox image */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 pt-12 pb-4">
          <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wizard/hero-fox.jpg" alt="" aria-hidden
              style={{width:24,height:24,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%',border:'1.5px solid rgba(255,255,255,0.35)',flexShrink:0}}/>
            <div className="flex flex-col gap-0">
              <span className="italic drop-shadow-md whitespace-nowrap" style={{fontFamily:'Literata,Georgia,serif',fontSize:17,fontWeight:700,color:'#fff',
                textShadow:'0 0 16px rgba(212,145,42,0.55), 0 0 32px rgba(212,145,42,0.2)'}}>
                {t('nav.logo')}
              </span>
              <span style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,0.38)',letterSpacing:'0.07em'}}>
                {t('nav.tagline')}
              </span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <button onClick={onOpenLibrary} className="cursor-pointer" style={{color:'white',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)',padding:'7px',borderRadius:999,lineHeight:0}}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>menu_book</span>
            </button>
            {user ? (
              <button onClick={onShowProfile} className="cursor-pointer hover:opacity-80 transition-opacity" style={{lineHeight:0,border:'none',background:'none',padding:0}}>
                {user.user_metadata?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(255,255,255,0.5)'}}/>
                  : <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:14,fontWeight:700}}>
                      {(user.email?.[0]??'U').toUpperCase()}
                    </div>
                }
              </button>
            ) : (
              <button onClick={onShowAuth} className="cursor-pointer whitespace-nowrap" style={{color:'white',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)',padding:'6px 12px',borderRadius:999,fontSize:12,fontWeight:600}}>{t('nav.login')}</button>
            )}
          </div>
        </div>
        {/* Bottom gradient — covers lower portion for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-b from-transparent via-[rgba(10,31,20,0.6)] to-[rgba(10,31,20,0.98)] pointer-events-none"/>
        {/* Text block — anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center text-center px-6 md:px-12 pb-8 md:pb-10">
          <h1 className="text-[30px] md:text-[46px] leading-tight font-bold text-white mb-4 tracking-tight" style={{fontFamily:'Literata,Georgia,serif'}}>
            {t('hero.h1')}
          </h1>
          <p className="text-white/75 text-[15px] md:text-[17px] max-w-sm md:max-w-none mb-6 leading-relaxed md:whitespace-nowrap">
            {t('hero.subtitle')}
          </p>
          <button type="button" onClick={()=>wizardRef.current?.scrollIntoView({behavior:'smooth'})}
            className="px-7 py-3 md:py-3.5 rounded-full font-bold text-[14px] md:text-[15px] tracking-wide shadow-[0_0_30px_rgba(164,103,19,0.4)] hover:scale-105 transition-all flex items-center gap-2 mb-3 cursor-pointer"
            style={{background:'#a46713',color:'#fff'}}>
            ✨ {t('hero.cta')}
          </button>
          <p className="text-white/45 text-[13px]">{t('hero.ctaHint')} <span className="material-symbols-outlined align-middle text-sm">arrow_downward</span></p>
        </div>
      </section>

      {/* ══ SECTION 1.5 — ПОЧЕМУ ЭТО РАБОТАЕТ ══ */}
      <section className="relative py-12 md:py-16 px-5 overflow-hidden" style={{background:'#0d2b1e'}}>
        {/* Background: fireflies + stars (как в секции формы) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="bokeh w-72 h-72 top-[-60px] right-[-40px]" style={{background:'#1a4a34'}}/>
          <div className="bokeh w-56 h-56 bottom-[10%] left-[-30px]" style={{background:'#143d2b'}}/>
          {([
            {t:'10%',l:'4%',d:'0s'},{t:'30%',r:'6%',d:'2s'},{t:'55%',l:'8%',d:'1s'},
            {t:'70%',r:'10%',d:'3s'},{t:'85%',l:'3%',d:'1.5s'},{t:'20%',r:'25%',d:'4s'},
            {t:'45%',l:'45%',d:'0.5s'},{t:'75%',r:'40%',d:'2.5s'},
          ] as {t:string;l?:string;r?:string;d:string}[]).map((p,i)=>(
            <div key={i} className="firefly" style={{top:p.t,...(p.l?{left:p.l}:{}),...(p.r?{right:p.r}:{}),animationDelay:p.d}}/>
          ))}
          {Array.from({length:14},(_,i)=>(
            <div key={i} style={{
              position:'absolute',width:i%3===0?'2px':'1.5px',height:i%3===0?'2px':'1.5px',
              borderRadius:'50%',background:'rgba(255,255,255,0.6)',
              top:`${5+(i*6.7)%88}%`,left:`${3+(i*13.1)%94}%`,
              animation:`twinkle ${2+(i%3)*0.9}s ease-in-out infinite`,animationDelay:`${(i*0.4)%3}s`
            }}/>
          ))}
        </div>

        <div className="relative z-10 max-w-[480px] mx-auto">
          {/* Heading */}
          <div className="text-center mb-9">
            <h2 className="text-[26px] md:text-[32px] font-bold italic mb-3" style={{fontFamily:'Literata,Georgia,serif',color:'#fef9f3'}}>
              {t('why.title')}
            </h2>
            <div className="w-12 h-[2px] mx-auto rounded-full" style={{background:'rgba(212,145,42,0.55)'}}/>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-4">
            {([
              { img: '/wizard/hero-fox.jpg', imgPos: 'center 40%', titleKey: 'why.card1Title', textKey: 'why.card1Text' },
              { img: '/wizard/magic-book.jpg', imgPos: 'center 30%', titleKey: 'why.card2Title', textKey: 'why.card2Text' },
              { img: '/story-fallback-0.jpg', imgPos: 'center 35%', titleKey: 'why.card3Title', textKey: 'why.card3Text' },
            ] as {img:string;imgPos:string;titleKey:string;textKey:string}[]).map((item,i)=>(
              <div key={i} className="rounded-2xl overflow-hidden text-center"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(212,145,42,0.2)',backdropFilter:'blur(8px)'}}>
                {/* Full-width image strip */}
                <div className="w-full h-36 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt="" aria-hidden
                    className="w-full h-full object-cover"
                    style={{objectPosition:item.imgPos}}/>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(13,43,30,0.95)]"/>
                </div>
                {/* Text */}
                <div className="px-6 pt-3 pb-6">
                  <h3 className="font-bold text-[15px] mb-2" style={{fontFamily:'Literata,Georgia,serif',color:'#fef9f3'}}>
                    {t(item.titleKey as Parameters<typeof t>[0])}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{color:'rgba(254,249,243,0.5)'}}>
                    {t(item.textKey as Parameters<typeof t>[0])}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom quote */}
          <p className="text-center text-[11px] italic mt-8" style={{color:'rgba(212,145,42,0.65)'}}>
            {t('why.quote')}
          </p>
        </div>
      </section>

      {/* ══ SECTION 2 — WIZARD FORM ══ */}
      <section ref={wizardRef} className="relative w-full py-16 md:py-20 overflow-hidden flex flex-col items-center" style={{background:'#0d2b1e'}}>
        {/* Background: bokeh + more fireflies + star particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="bokeh w-96 h-96 top-[-100px] left-[-100px]" style={{background:'#1a4a34'}}/>
          <div className="bokeh w-80 h-80 bottom-[20%] right-[-50px]" style={{background:'#143d2b'}}/>
          {/* Fireflies ×12 */}
          {([
            {t:'8%',l:'6%',d:'0s'},{t:'22%',r:'8%',d:'1.5s'},{t:'38%',l:'12%',d:'3s'},
            {t:'55%',r:'14%',d:'0.7s'},{t:'70%',l:'5%',d:'2.2s'},{t:'85%',r:'6%',d:'4s'},
            {t:'15%',r:'28%',d:'1s'},{t:'48%',l:'30%',d:'3.5s'},{t:'62%',r:'32%',d:'2s'},
            {t:'30%',l:'50%',d:'0.3s'},{t:'78%',l:'42%',d:'4.5s'},{t:'92%',r:'22%',d:'1.8s'},
          ] as {t:string;l?:string;r?:string;d:string}[]).map((p,i)=>(
            <div key={i} className="firefly" style={{top:p.t,...(p.l?{left:p.l}:{}),...(p.r?{right:p.r}:{}),animationDelay:p.d}}/>
          ))}
          {/* Star particles ×18 */}
          {Array.from({length:18},(_,i)=>(
            <div key={i} style={{
              position:'absolute',width:i%4===0?'2.5px':'1.5px',height:i%4===0?'2.5px':'1.5px',
              borderRadius:'50%',background:'rgba(255,255,255,0.75)',pointerEvents:'none',
              top:`${8+(i*5.3)%84}%`,left:`${4+(i*11.7)%92}%`,
              animation:`twinkle ${2.5+(i%3)*0.8}s ease-in-out infinite`,animationDelay:`${(i*0.45)%3}s`
            }}/>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-[560px] mx-auto px-4 flex flex-col items-center">
          {/* Section heading */}
          <div className="text-center mb-8">
            <h2 className="font-bold text-[28px] md:text-[38px] leading-tight mb-3" style={{fontFamily:'Literata,Georgia,serif',color:'#fef9f3'}}>
              {t('wizard.title')}
            </h2>
            <p className="text-[14px] leading-relaxed" style={{color:'rgba(254,249,243,0.55)'}}>
              {t('wizard.subtitle')}
            </p>
          </div>

          {/* Wizard card */}
          <div className="w-full rounded-[24px] p-6 md:p-8" style={{background:'#fffdf8',boxShadow:'0 20px 50px rgba(0,0,0,0.35)'}}>

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-1">
              {[1,2,3,4].map(s=>(
                <div key={s} style={{
                  flex:1,height:5,borderRadius:999,transition:'all 0.35s',
                  background:s<step?'#0d2b1e':s===step?'#a46713':'rgba(0,0,0,0.1)'
                }}/>
              ))}
            </div>
            <p className="text-[11px] font-semibold mb-6" style={{color:'#a46713'}}>
              {t('wizard.stepLabel', {step, label: STEP_LABELS[step-1]})}{step===4?` ${t('wizard.optional')}`:''}
            </p>

            {/* ── STEP 1: Имя + возраст ── */}
            {step===1&&(
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>{t('wizard.childNameLabel')}</label>
                  <input value={form.childName} placeholder={t('wizard.childNamePlaceholder')}
                    onChange={e=>setForm(f=>({...f,childName:e.target.value}))}
                    className="form-input-night" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>{t('wizard.ageLabel')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUPS.map(a=>(
                      <button key={a} type="button" onClick={()=>setForm(f=>({...f,age:a}))}
                        className="py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                        style={form.age===a
                          ?{background:'#0d2b1e',color:'#fff',border:'2px solid #0d2b1e'}
                          :{background:'#f7f3ed',color:'#466252',border:'2px solid transparent'}}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Герой ── */}
            {step===2&&(
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>{t('wizard.heroLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {HERO_CARDS.map(h=>(
                    <button key={h.name} type="button" onClick={()=>setForm(f=>({...f,hero:h.name}))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left"
                      style={form.hero===h.name
                        ?{background:'#0d2b1e',color:'#fff',border:'2px solid #0d2b1e'}
                        :{background:'#f7f3ed',color:'#466252',border:'2px solid transparent'}}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={h.img} alt={h.name}
                        style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0,
                          boxShadow: form.hero===h.name ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none'}}/>
                      <span>{h.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#727973'}}>{t('wizard.heroCustomLabel')}</label>
                  <input value={HERO_CARDS.some(h=>h.name===form.hero)?'':form.hero}
                    placeholder={t('wizard.heroPlaceholder')}
                    onChange={e=>setForm(f=>({...f,hero:e.target.value}))}
                    className="form-input-night" />
                </div>
              </div>
            )}

            {/* ── STEP 3: Ситуация ── */}
            {step===3&&(
              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>{t('wizard.topicLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {SIT_TYPES_L.map(sit=>(
                    <button key={sit.id} type="button"
                      onClick={()=>setForm(f=>({...f,situationType:sit.id as SituationType,situation:''}))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left"
                      style={form.situationType===sit.id
                        ?{background:'#0d2b1e',color:'#fff',border:'2px solid #0d2b1e'}
                        :{background:'#f7f3ed',color:'#466252',border:'2px solid transparent'}}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sit.img} alt={sit.label}
                        style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',flexShrink:0,
                          boxShadow: form.situationType===sit.id ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none'}}/>
                      <div>
                        <div>{sit.label}</div>
                        <div className="text-[10px] font-normal opacity-60">{sit.hint}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{background:'#f7f3ed'}}>
                  {(SIT_SUGG[form.situationType] ?? []).slice(0,5).map(s=>(
                    <button key={s} type="button" onClick={()=>setForm(f=>({...f,situation:s}))}
                      className={sub(form.situation===s)}>{s}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#727973'}}>{t('wizard.situationCustomLabel')}</label>
                  <input value={form.situation} placeholder={sitType.hint}
                    onChange={e=>setForm(f=>({...f,situation:e.target.value}))}
                    className="form-input-night" />
                </div>
              </div>
            )}

            {/* ── STEP 4: Опционально ── */}
            {step===4&&(
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest" style={{color:'#466252'}}>{t('wizard.favoritesLabel')}</label>
                  <p className="text-xs mt-0.5" style={{color:'rgba(70,98,82,0.6)'}}>{t('wizard.favoritesHint')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FAVORITES.map(f2=>(
                    <button key={f2} type="button" onClick={()=>toggleFav(f2)}
                      className={chip(form.favorites.includes(f2))}>{f2}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest" style={{color:'#727973'}}>{t('wizard.favoritesCustomLabel')}</label>
                  <input value={form.favorites} placeholder={t('wizard.favoritesPlaceholder')}
                    onChange={e=>setForm(f=>({...f,favorites:e.target.value}))}
                    className="form-input-night" />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-7">
              {step>1&&(
                <button type="button" onClick={()=>setStep(s=>s-1)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:opacity-80"
                  style={{background:'#f7f3ed',color:'#466252'}}>
                  {t('wizard.back')}
                </button>
              )}
              {step<4&&(
                <button type="button" onClick={()=>setStep(s=>s+1)} disabled={!canNext()}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
                  style={{background:'#0d2b1e'}}>
                  {t('wizard.next')}
                </button>
              )}
              {step===4&&(
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
            </div>
            {step===4&&(
              <button type="button" onClick={()=>onGenerate(form)} disabled={isLoading}
                className="w-full text-center text-xs mt-3 cursor-pointer hover:opacity-70 transition-opacity"
                style={{color:'rgba(70,98,82,0.5)'}}>
                {t('wizard.skip')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <SiteFooter/>
    </>
  )
}


// ── Story Reading — издательский стиль (Stitch 9314fcfa / 403e6050 / 7ca8e409) ─
function StoryReading({story,onBack,onSave,alreadySaved,onShare,shareStatus,onDownloadPDF,pdfLoading,pdfError,storyRef,imageCache}:{
  story:Story;onBack:()=>void;onSave:()=>void;alreadySaved:boolean
  onShare:()=>void;shareStatus:string;onDownloadPDF:()=>void;pdfLoading:boolean;pdfError:string
  storyRef:React.RefObject<HTMLDivElement|null>;imageCache?:Record<number,string>
}) {
  const t = useTranslations('story')
  const serif = "'Lora', Georgia, serif"
  const sans  = "'Plus Jakarta Sans', sans-serif"

  return (
    <div className="min-h-screen bg-white print:bg-white" style={{fontFamily:sans}}>
      {/* ── Top nav ── */}
      <header className="h-[52px] flex items-center px-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-20 print:hidden">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-800 cursor-pointer hover:opacity-60 transition-opacity" aria-label={t('headerTitle')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <h1 className="text-[15px] font-semibold tracking-wide flex-1 text-center pr-6" style={{fontFamily:sans,color:'#0d2b1e'}}>
          {t('headerTitle')}
        </h1>
      </header>

      <div ref={storyRef} className="max-w-[680px] mx-auto pb-10">
        {/* ── Scenes ── */}
        {story.scenes.map((scene, i) => (
          <div key={i}>
            {/* Chapter header */}
            <section className="text-center pt-8 pb-5 px-6">
              <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{fontFamily:sans,color:'#9ca3af'}}>
                {t('chapter', {n: i+1})}
              </p>
              {i===0 && (
                <h2 className="font-bold leading-tight" style={{fontFamily:serif,fontSize:28,color:'#0d2b1e'}}>
                  {story.title}
                </h2>
              )}
            </section>

            {/* Full-width illustration — no rounded corners, bleeds to edges */}
            <section className="w-full border-b border-gray-200">
              <div className="w-full bg-[#fdfaf5]" style={{aspectRatio:'4/3'}}>
                <StoryImage prompt={scene.imagePrompt} index={i} sharp preloadedSrc={imageCache?.[i]} storySeed={story.storySeed}/>
              </div>
            </section>

            {/* Story text */}
            <section className="px-6 py-6 print:py-4">
              <p className={i===0?'drop-cap':''} style={{
                fontFamily:serif,fontSize:19,lineHeight:2.0,color:'#1f2937',
                textAlign:'justify',hyphens:'auto'
              }}>
                {scene.text ?? ''}
              </p>
            </section>
          </div>
        ))}

        {/* ── Discussion questions (Stitch 403e6050) ── */}
        {story.discussion && story.discussion.length > 0 && (
          <section className="px-6 py-4 print:py-6">
            {/* Ornamental divider */}
            <div className="flex items-center my-6">
              <div className="h-px bg-gray-200 flex-1"/>
              <span className="mx-4 text-gray-300 text-lg select-none">✦</span>
              <div className="h-px bg-gray-200 flex-1"/>
            </div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3" style={{color:'#0d2b1e'}}>
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.5 4.5C14.5 4.5 12 7 12 10C12 7 9.5 4.5 6.5 4.5C4 4.5 2 6.5 2 9C2 14.5 12 21.5 12 21.5C12 21.5 22 14.5 22 9C22 6.5 20 4.5 17.5 4.5Z"/>
                </svg>
              </div>
              <h3 className="italic mb-2" style={{fontFamily:serif,fontSize:22,color:'#0d2b1e'}}>
                {t('discussTitle')}
              </h3>
            </div>
            {/* Questions with watermark numbers */}
            <div>
              {story.discussion.map((q, i) => (
                <div key={i} className="relative py-7" style={{borderBottom: i<story.discussion!.length-1?'1px solid #f3f4f6':'none'}}>
                  <div className="absolute left-0 top-5 select-none pointer-events-none" style={{
                    fontFamily:serif,fontSize:48,lineHeight:1,
                    color:'rgba(13,43,30,0.08)',zIndex:0
                  }}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <p className="relative pl-12 pr-2 italic" style={{fontFamily:serif,fontSize:17,lineHeight:1.8,color:'#374151',zIndex:1}}>
                    {q}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Anchor (Stitch 7ca8e409) ── */}
        {story.anchor && (
          <section className="px-4 pb-4 pt-2 print:pb-8">
            <div className="relative overflow-hidden rounded shadow-sm p-6" style={{
              background:'#fff',border:'1px solid #e5e7eb',borderTop:'2px solid #d97706'
            }}>
              <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none" style={{background:'linear-gradient(to bottom,rgba(217,119,6,0.04),transparent)'}}/>
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
                  <path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/>
                  <path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>
                </svg>
                <span className="uppercase tracking-widest" style={{fontFamily:sans,fontSize:11,color:'#92400e'}}>
                  {t('anchorLabel')}
                </span>
              </div>
              <h3 className="mb-3" style={{fontFamily:serif,fontSize:20,fontWeight:700,color:'#1a1c1b'}}>
                {story.anchor.title}
              </h3>
              <p className="mb-5" style={{fontFamily:serif,fontSize:16,lineHeight:1.8,color:'#374151'}}>
                {story.anchor.description}
              </p>
              <hr style={{borderColor:'#f3f4f6',marginBottom:16}}/>
              <p className="text-center italic" style={{fontFamily:serif,fontSize:12,color:'#9ca3af'}}>
                {t('anchorNote')}
              </p>
            </div>
          </section>
        )}

        {/* ── Actions ── */}
        <section className="px-4 pt-2 pb-8 space-y-3 print:hidden">
          <button onClick={onBack}
            className="w-full cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-center"
            style={{height:52,background:'#0d2b1e',color:'#fff',borderRadius:4,fontFamily:serif,fontSize:16,fontWeight:700,border:'none'}}>
            {t('newStory')}
          </button>
          <div className="flex gap-3">
            <button onClick={onSave} disabled={alreadySaved}
              className="flex-1 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{height:44,border:'1px solid #0d2b1e',color:'#0d2b1e',borderRadius:4,background:'#fff',fontFamily:sans,fontSize:14,fontWeight:600}}>
              {alreadySaved ? t('saved') : t('save')}
            </button>
            <button onClick={onDownloadPDF} disabled={pdfLoading}
              className="flex-1 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{height:44,border:'1px solid #0d2b1e',color:'#0d2b1e',borderRadius:4,background:'#fff',fontFamily:sans,fontSize:14,fontWeight:600}}>
              {pdfLoading ? t('pdfCreating') : t('pdfDownload')}
            </button>
            <button onClick={onShare} aria-label="Поделиться"
              className="flex-1 flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform"
              style={{height:44,border:'1px solid #0d2b1e',color:'#0d2b1e',borderRadius:4,background:'#fff'}}>
              {shareStatus!=='idle'
                ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              }
            </button>
          </div>
          {pdfError&&<p className="text-sm text-center text-red-500">{pdfError}</p>}
          <p className="text-center italic py-2" style={{fontFamily:serif,fontSize:14,color:'#9ca3af'}}>
            {t('headerTitle')}
          </p>
        </section>
      </div>
    </div>
  )
}

// ── Library screen (mobile) ───────────────────────────────────────────────────
function LibraryScreen({saved,onOpen,onDelete,onCreateNew}:{saved:SavedStory[];onOpen:(s:SavedStory)=>void;onDelete:(id:string)=>void;onCreateNew?:()=>void}) {
  const t = useTranslations('library')
  return (
    <div className="relative min-h-screen overflow-hidden" style={{background:'#0d2b1e'}}>
      {/* Bokeh */}
      <div className="bokeh w-96 h-96 pointer-events-none" style={{position:'absolute',top:'-80px',left:'-80px',background:'#1a4a34'}}/>
      <div className="bokeh w-80 h-80 pointer-events-none" style={{position:'absolute',bottom:'20%',right:'-50px',background:'#143d2b'}}/>
      {/* Fireflies ×10 */}
      {([
        {t:'8%',l:'6%',d:'0s'},{t:'22%',r:'8%',d:'1.5s'},{t:'38%',l:'12%',d:'3s'},
        {t:'55%',r:'14%',d:'0.7s'},{t:'70%',l:'5%',d:'2.2s'},{t:'85%',r:'6%',d:'4s'},
        {t:'15%',r:'28%',d:'1s'},{t:'48%',l:'30%',d:'3.5s'},{t:'62%',r:'32%',d:'2s'},
        {t:'30%',l:'50%',d:'0.3s'},
      ] as {t:string;l?:string;r?:string;d:string}[]).map((p,i)=>(
        <div key={i} className="firefly" style={{position:'absolute',top:p.t,...(p.l?{left:p.l}:{}),...(p.r?{right:p.r}:{}),animationDelay:p.d,pointerEvents:'none'}}/>
      ))}
      {/* Star particles ×20 */}
      {Array.from({length:20},(_,i)=>(
        <div key={i} style={{
          position:'absolute',width:i%4===0?'2.5px':'1.5px',height:i%4===0?'2.5px':'1.5px',
          borderRadius:'50%',background:'rgba(255,255,255,0.75)',pointerEvents:'none',
          top:`${6+(i*4.8)%86}%`,left:`${3+(i*11.3)%93}%`,
          animation:`twinkle ${2.5+(i%3)*0.8}s ease-in-out infinite`,animationDelay:`${(i*0.45)%3}s`
        }}/>
      ))}

      <div className="relative z-10 max-w-[620px] mx-auto px-4 pt-20 pb-20">

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wizard/hero-fox.jpg" alt="" aria-hidden
              style={{width:56,height:56,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%',border:'2px solid rgba(255,255,255,0.25)'}}/>
          </div>
          <h1 className="italic font-bold text-2xl mb-2" style={{fontFamily:'Literata,Georgia,serif',color:'#fff',
            textShadow:'0 0 18px rgba(212,145,42,0.45)'}}>
            {t('title')}
          </h1>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{color:'rgba(255,255,255,0.55)'}}>
            {t('subtitle')}
          </p>
        </div>

        {/* CTA — create new */}
        <button onClick={onCreateNew}
          className="w-full rounded-2xl py-4 font-bold text-sm mb-8 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{background:'#a46713',color:'#fff',boxShadow:'0 0 24px rgba(164,103,19,0.4)'}}>
          {t('create')}
        </button>

        {/* Stories list */}
        {saved.length===0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🌙</p>
            <p className="font-serif text-lg font-bold mb-2" style={{color:'rgba(255,255,255,0.8)'}}>{t('emptyTitle')}</p>
            <p className="text-sm" style={{color:'rgba(255,255,255,0.4)'}}>
              {t('emptyHint')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{color:'rgba(255,255,255,0.35)'}}>
                {t('yourStories')}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)'}}>
                {saved.length}
              </span>
            </div>
            {saved.map(s=>(
              <div key={s.id} className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
                style={{background:'#fffdf8',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}
                onClick={()=>onOpen(s)}>
                <div className="flex gap-4 p-4 items-center">
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                    style={{boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/wizard/magic-book.jpg" alt="" aria-hidden
                      style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 30%'}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate mb-0.5" style={{color:'#0d2b1e'}}>{s.story.title}</div>
                    <div className="text-xs" style={{color:'#9ca3af'}}>{s.childName} · {s.savedAt}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();onDelete(s.id)}}
                    className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-lg flex-shrink-0 px-1"
                    aria-label="Удалить">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen({ childName }: { childName?: string }) {
  const t = useTranslations('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalMs = 28000, stepMs = 150
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += stepMs
      const t = Math.min(elapsed / totalMs, 1)
      const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2
      setProgress(Math.min(Math.round(eased * 90), 90))
      if (t >= 1) clearInterval(timer)
    }, stepMs)
    return () => clearInterval(timer)
  }, [])

  const activeStep = progress < 33 ? 0 : progress < 66 ? 1 : 2
  const steps = [t('step1'), t('step2'), t('step3')]
  const fireflies = [
    {top:'10%',left:'7%', w:3,delay:'0s',  dur:'9s' },
    {top:'22%',left:'83%',w:4,delay:'1.5s',dur:'11s'},
    {top:'38%',left:'15%',w:3,delay:'3s',  dur:'8s' },
    {top:'30%',left:'70%',w:3,delay:'0.8s',dur:'13s'},
    {top:'15%',left:'52%',w:2,delay:'2.2s',dur:'10s'},
    {top:'60%',left:'88%',w:3,delay:'4s',  dur:'12s'},
    {top:'73%',left:'28%',w:2,delay:'1.2s',dur:'9s' },
    {top:'82%',left:'62%',w:3,delay:'5s',  dur:'10s'},
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{background:'#0d2b1e'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loading-forest.jpg" alt="" aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{objectPosition:'center 40%'}}/>

      {/* Gradient overlay: image visible top 50%, fades to solid dark at 75% */}
      <div className="absolute inset-0" style={{
        background:'linear-gradient(to bottom,transparent 0%,transparent 42%,rgba(13,43,30,0.7) 60%,#0d2b1e 75%)'
      }}/>

      {/* Fireflies */}
      {fireflies.map((f,i)=>(
        <div key={i} className="loading-firefly" style={{top:f.top,left:f.left,width:f.w,height:f.w,animationDelay:f.delay,animationDuration:f.dur}}/>
      ))}

      {/* UI — absolute bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center px-6 pb-8 gap-4">
        <h1 style={{fontFamily:'Literata,Georgia,serif',fontSize:28,fontWeight:700,color:'#f9f9f7',lineHeight:1.2}}>
          {t('titleGeneric')}
        </h1>

        <div className="flex justify-center gap-2 w-full">
          {steps.map((s,i)=>(
            <div key={i} className="rounded-full flex items-center justify-center"
              style={{
                padding:'6px 10px',
                background: i===activeStep ? '#e7c365' : 'rgba(255,255,255,0.06)',
                border: i===activeStep ? 'none' : '1px solid rgba(255,255,255,0.15)',
                boxShadow: i===activeStep ? '0 0 12px rgba(231,195,101,0.45)' : 'none',
                transition:'all 0.6s ease',
              }}>
              <span style={{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:11,fontWeight:600,
                color:i===activeStep?'#2c1700':'rgba(255,255,255,0.35)',whiteSpace:'nowrap'}}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <div style={{width:'100%',maxWidth:300}}>
          <div className="relative w-full rounded-full" style={{height:7,background:'rgba(255,255,255,0.08)'}}>
            <div className="absolute top-0 left-0 h-full rounded-full"
              style={{width:`${progress}%`,background:'linear-gradient(90deg,#C4704A,#e7c365)',transition:'width 0.25s ease'}}>
              {progress>2&&(
                <div className="absolute rounded-full" style={{
                  right:-6,top:'50%',transform:'translateY(-50%)',
                  width:13,height:13,background:'#e7c365',
                  boxShadow:'0 0 10px rgba(231,195,101,0.9),0 0 20px rgba(231,195,101,0.5)',
                }}/>
              )}
            </div>
          </div>
        </div>

        <p style={{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:12,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          {t('note')}
        </p>
      </div>
    </div>
  )
}

// ── PDF generation ────────────────────────────────────────────────────────────
async function generatePDF(story:Story) {
  const dataUrls = await Promise.all(story.scenes.map(async(scene,i)=>{
    try {
      const res = await fetch(imgUrl(scene.imagePrompt,i,story.storySeed)+'&retry=0')
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
  let totalH=M+64;for(let i=0;i<story.scenes.length;i++){totalH+=IMG_H+16;tCtx.font='16px serif';totalH+=wrap(tCtx,story.scenes[i].text??'',CW).length*LH+36}
  if(story.discussion?.length){totalH+=64;for(const q of story.discussion){tCtx.font='14px sans-serif';totalH+=Math.max(36,wrap(tCtx,q,CW-44).length*20)+14}}
  if(story.anchor){tCtx.font='13px sans-serif';totalH+=wrap(tCtx,story.anchor.description,CW-24).length*20+70}
  totalH+=M
  const canvas=document.createElement('canvas');canvas.width=W*SCALE;canvas.height=totalH*SCALE;const ctx=canvas.getContext('2d')!;ctx.scale(SCALE,SCALE)
  ctx.fillStyle='#f9f5ec';ctx.fillRect(0,0,W,totalH)
  let y=M;ctx.fillStyle='#2d4a1e';ctx.font='bold 28px serif';ctx.textAlign='center';ctx.fillText(story.title,W/2,y+36);y+=64;ctx.textAlign='left'
  for(let i=0;i<story.scenes.length;i++){
    if(images[i]){ctx.save();rrect(ctx,M,y,CW,IMG_H,12);ctx.clip();ctx.drawImage(images[i]!,M,y,CW,IMG_H);ctx.restore()}else{ctx.fillStyle='#e8f0e3';ctx.fillRect(M,y,CW,IMG_H)}
    y+=IMG_H+16;ctx.fillStyle='#1c1c1a';ctx.font='500 16px serif'
    for(const line of wrap(ctx,story.scenes[i].text??'',CW)){ctx.fillText(line,M,y+15);y+=LH};y+=36
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
  const locale = useLocale()
  const tCommon = useTranslations('common')
  const [status,setStatus] = useState<'idle'|'loading'|'done'|'reading'>('idle')
  const [story,setStory] = useState<Story|null>(null)
  const [currentChildName,setCurrentChildName] = useState('')
  const [imageCache,setImageCache] = useState<Record<number,string>>({})
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
  const [user,setUser] = useState<User|null>(null)
  const [showAuth,setShowAuth] = useState(false)
  const [showName,setShowName] = useState(false)
  const [showProfile,setShowProfile] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // ── Migrate localStorage stories to Supabase ────────────────────────────────
  const migrateLocalStories = useCallback(async(userId:string)=>{
    const local = loadSaved()
    if(local.length===0) return
    for(const s of local){
      await supabase.from('stories').upsert({
        id: s.id, user_id: userId, title: s.story.title,
        child_name: s.childName, data: s.story,
      }, {onConflict:'id'}).select()
    }
  },[supabase])

  // ── Load premium status from Supabase ───────────────────────────────────────
  const loadPremiumStatus = useCallback(async(userId:string)=>{
    const {data} = await supabase.from('purchases').select('*').eq('user_id',userId).order('created_at',{ascending:false})
    if(!data?.length) return
    const now = Date.now()
    const activeSub = data.find(p=>
      ['monthly_sub','yearly_sub','referral_reward'].includes(p.plan)&&
      p.expires_at&&new Date(p.expires_at).getTime()>now
    )
    if(activeSub){
      const ts = new Date(activeSub.expires_at).getTime()
      setPaidUntil(ts); try{localStorage.setItem('ft-paid-until',String(ts))}catch{}
      return
    }
    const extra = data
      .filter(p=>['registration_bonus','three_stories','story_pack'].includes(p.plan)&&(p.stories_remaining??0)>0)
      .reduce((s,p)=>s+(p.stories_remaining??0),0)
    if(extra>0){ setExtraState(extra); try{localStorage.setItem('ft-extra',String(extra))}catch{} }
  },[supabase])

  // ── Load stories from Supabase ───────────────────────────────────────────────
  const loadDbStories = useCallback(async()=>{
    const {data} = await supabase.from('stories').select('*').order('created_at',{ascending:false})
    if(data?.length){
      const dbStories:SavedStory[] = data.map(s=>({
        id:s.id, savedAt:new Date(s.created_at).toLocaleDateString('ru-RU'),
        childName:s.child_name, story:s.data
      }))
      const local = loadSaved()
      const merged = [...dbStories, ...local.filter(l=>!dbStories.find(d=>d.id===l.id))]
      setSaved(merged); saveTos(merged)
    }
  },[supabase])

  useEffect(()=>{
    window.scrollTo(0,0)
    if('scrollRestoration' in history) history.scrollRestoration='manual'
    window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand()
    setSaved(loadSaved()); setUsageCount(getAnonUsed()); setExtraState(getExtra())

    // Auth state
    supabase.auth.getUser().then(({data:{user}})=>{ setUser(user); if(user){ loadDbStories(); loadPremiumStatus(user.id) } })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session)=>{
      const u = session?.user ?? null
      setUser(u)
      if(u){
        migrateLocalStories(u.id); loadDbStories(); loadPremiumStatus(u.id)
        if(event==='SIGNED_IN'){
          if(!u.user_metadata?.full_name && !u.user_metadata?.name) setShowName(true)
          // Бонус за регистрацию (+3 сказки)
          fetch('/api/user/register-bonus',{method:'POST'}).then(()=>loadPremiumStatus(u.id)).catch(()=>{})
          // Реферальная привязка
          const refCode = localStorage.getItem(K.ref)
          if(refCode){
            fetch('/api/referral/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({referrerCode:refCode})})
              .then(()=>{ try{localStorage.removeItem(K.ref)}catch{} }).catch(()=>{})
          }
        }
      }
    })

    // ── Payment check ────────────────────────────────────────────────────────
    const applyPayment=(plan:string)=>{
      if(plan==='yearly_sub') setPaidUntil(Date.now()+365*24*60*60*1000)
      else if(plan==='monthly_sub') setPaidUntil(Date.now()+30*24*60*60*1000)
      else setExtra(getExtra()+3)
      setUsageCount(getAnonUsed()); setExtraState(getExtra())
      setCheckingPayment(false); setShowPaywall(false)
      try{ localStorage.removeItem('ft-pending-pay') }catch{}
    }

    const clearPending=()=>{ try{localStorage.removeItem('ft-pending-pay')}catch{} }

    const pollPayment=(paymentId:string, plan:string)=>{
      window.history.replaceState({},'',' /'); setCheckingPayment(true)
      let attempts=0
      const poll=async()=>{
        attempts++
        try{
          const r=await fetch(`/api/yookassa/check?payment_id=${paymentId}`)
          const data=await r.json()
          if(data.paid){ applyPayment(plan); clearPending(); return }
        }catch{}
        if(attempts<10) setTimeout(poll,3000)
        else{ clearPending(); setCheckingPayment(false) } // не нашли — тихо закрываем
      }
      poll()
    }

    // 1. Проверяем URL параметры
    const params=new URLSearchParams(window.location.search)
    if(params.get('owner')==='1'){ try{localStorage.setItem(K.owner,'1')}catch{} }
    const refCode = params.get('ref')
    if(refCode){ try{localStorage.setItem(K.ref,refCode)}catch{} }
    const urlPaymentId=params.get('payment_id'), urlPlan=params.get('plan')
    if(urlPaymentId&&urlPlan){
      pollPayment(urlPaymentId, urlPlan)
    } else {
      // 2. Проверяем pending платёж из localStorage (если пользователь нажал "назад")
      try{
        const pending=localStorage.getItem('ft-pending-pay')
        if(pending){
          const {id,plan,ts}=JSON.parse(pending)
          // Проверяем только если не старше 2 часов
          if(Date.now()-ts < 2*60*60*1000){
            pollPayment(id, plan)
          } else {
            localStorage.removeItem('ft-pending-pay')
          }
        }
      }catch{}
    }

    return ()=>subscription.unsubscribe()
  },[])

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
          // Try up to 4 times — Pollinations can be slow
          for(let attempt=0;attempt<3;attempt++){
            const url=attempt===0?base:`${base}&t=${Date.now()}`
            const blob=await fetchImg(url)
            if(blob){cache[i]=URL.createObjectURL(blob);return}
            if(attempt<3)await new Promise(r=>setTimeout(r,3000*(attempt+1)))
          }
          // After 4 failed attempts — use universal fallback illustration
          cache[i] = `/story-fallback-${i%2}.jpg`
        })
        await Promise.allSettled(loaders)
      }

      const ex=getExtra()
      if(ex>0){setExtra(ex-1);setExtraState(ex-1)}else{incUsage();setUsageCount(getAnonUsed())}
      setStory(json); setCurrentChildName(data.childName); setAlreadySaved(false)
      setImageCache(cache)
      setStatus('done')
      setMobileTab('create')
    }catch{setError('Не удалось подключиться к серверу.');setStatus('idle')}
  }

  const handleSave=async()=>{
    if(!story)return
    // Конвертируем blob-URL картинок в base64 для хранения в localStorage
    const images:Record<number,string>={}
    await Promise.all(Object.entries(imageCache).map(async([k,blobUrl])=>{
      try{
        const res=await fetch(blobUrl)
        const blob=await res.blob()
        const dataUrl=await new Promise<string>(resolve=>{
          const r=new FileReader(); r.onloadend=()=>resolve(r.result as string); r.readAsDataURL(blob)
        })
        images[parseInt(k)]=dataUrl
      }catch{}
    }))
    const entry:SavedStory={id:Date.now().toString(),savedAt:new Date().toLocaleDateString('ru-RU'),childName:currentChildName,story,images}
    const updated=[entry,...saved]; setSaved(updated); saveTos(updated); setAlreadySaved(true)
    if(user){
      await supabase.from('stories').insert({
        id:entry.id, user_id:user.id, title:story.title,
        child_name:currentChildName, data:story
      })
    }
  }

  const handleDelete=async(id:string)=>{
    const updated=saved.filter(s=>s.id!==id); setSaved(updated); saveTos(updated)
    if(user){ await supabase.from('stories').delete().eq('id',id).eq('user_id',user.id) }
  }

  const handleSignOut=async()=>{ await supabase.auth.signOut(); setUser(null) }

  const handleShare=async()=>{
    if(!story)return
    const text=`${story.title}\n\n${story.scenes.map(s=>s.text??'').join('\n\n')}`
    // Всегда пробуем нативный share sheet (iOS/Android/desktop Safari)
    if(navigator.share){
      try{ await navigator.share({title:story.title,text,url:window.location.href}); return }
      catch(e){ if((e as Error).name==='AbortError') return } // пользователь закрыл — ок
    }
    // Fallback — копирование в буфер
    await navigator.clipboard.writeText(text)
    setShareStatus('copied')
    setTimeout(()=>setShareStatus('idle'),3000)
  }

  const handleDownloadPDF=async()=>{
    if(!story)return
    setPdfLoading(true); setPdfError('')
    try{await generatePDF(story)}
    catch(err){setPdfError(`Ошибка PDF: ${err instanceof Error?err.message:String(err)}`)}
    finally{setPdfLoading(false)}
  }

  const openSaved=(s:SavedStory)=>{
    setStory(s.story); setCurrentChildName(s.childName); setAlreadySaved(true)
    // Загружаем сохранённые картинки сразу — без запросов к Pollinations
    setImageCache(s.images||{})
    setStatus('reading'); setMobileTab('create')
  }

  const showForm = isPremium() || usageCount<1 || extra>0

  return (
    <div className="min-h-screen print:bg-white">
      {/* Payment checking */}
      {checkingPayment&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(10,31,20,0.85)',backdropFilter:'blur(8px)'}}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center" style={{boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
            <div className="text-5xl mb-4" style={{animation:'spin 2s linear infinite',display:'inline-block'}}>⏳</div>
            <h2 className="font-serif text-xl font-bold mb-2" style={{color:'var(--primary)'}}>Проверяем оплату...</h2>
            <p className="text-sm mb-6" style={{color:'var(--text-muted)'}}>СБП-платёж подтверждается банком, это занимает до 30 секунд</p>
            <button onClick={()=>{ try{localStorage.removeItem('ft-pending-pay')}catch{} setCheckingPayment(false) }}
              className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
              style={{color:'var(--text-muted)'}}>
              Закрыть и проверить позже
            </button>
          </div>
        </div>
      )}

      {!checkingPayment&&showPaywall&&(
        <Paywall onPaid={()=>{setShowPaywall(false);setUsageCount(getAnonUsed());setExtraState(getExtra());if(user)loadPremiumStatus(user.id)}} onClose={()=>setShowPaywall(false)} userId={user?.id}/>
      )}

      {/* Auth modal */}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)}/>}
      {/* Name modal — first login without name */}
      {showName&&user&&<NameModal email={user.email||''} onDone={name=>{
        setUser(u=>u?{...u,user_metadata:{...u.user_metadata,full_name:name}}:u)
        setShowName(false)
      }}/>}
      {/* Profile modal */}
      {showProfile&&user&&<ProfileModal user={user} onClose={()=>setShowProfile(false)}
        onUpdated={name=>{setUser(u=>u?{...u,user_metadata:{...u.user_metadata,full_name:name}}:u)}}
        onShowPaywall={()=>{setShowProfile(false);setShowPaywall(true)}}
        onSignOut={handleSignOut}/>}

      {/* Desktop nav */}
      {(status==='idle'||status==='loading')&&(
        <DesktopNav activeTab={desktopTab} onTabChange={setDesktopTab}
          user={user} onShowAuth={()=>setShowAuth(true)} onSignOut={handleSignOut}
          onEditProfile={()=>setShowProfile(true)} onMyStories={()=>{setStatus('idle');setMobileTab('library');setDesktopTab('library')}}/>
      )}

      {/* Content — всегда показываем форму, пейволл появляется при попытке создать */}
      {status==='idle'&&(
        <>
          {/* Mobile: no tab bar — nav via header icon */}
          <div className="md:hidden">
            {mobileTab==='create'&&<CreateForm onGenerate={generate} isLoading={false} onOpenLibrary={()=>setMobileTab('library')} onShowAuth={()=>setShowAuth(true)} onShowProfile={()=>setShowProfile(true)} user={user}/>}
            {mobileTab==='library'&&(
              <>
                <LibraryScreen saved={saved} onOpen={openSaved} onDelete={handleDelete} onCreateNew={()=>{setMobileTab('create');setDesktopTab('create')}}/>
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                  <button onClick={()=>setMobileTab('create')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold cursor-pointer"
                    style={{background:'rgba(10,31,20,0.9)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                    <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_back</span>
                    {tCommon('back')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop: form or library */}
          <div className="hidden md:block">
            {desktopTab==='library'
              ? <LibraryScreen saved={saved} onOpen={openSaved} onDelete={handleDelete} onCreateNew={()=>{setMobileTab('create');setDesktopTab('create')}}/>
              : <CreateForm onGenerate={generate} isLoading={false} onOpenLibrary={undefined} onShowAuth={()=>setShowAuth(true)} onShowProfile={()=>setShowProfile(true)} user={user}/>
            }
          </div>
        </>
      )}

      {status==='loading'&&<LoadingScreen childName={currentChildName}/>}

      {(status==='done'||status==='reading')&&story&&(
        <>
          {/* Desktop nav for reading */}
          <DesktopNav activeTab="library" onTabChange={()=>{}} user={user} onShowAuth={()=>setShowAuth(true)} onSignOut={handleSignOut} onEditProfile={()=>setShowProfile(true)} onMyStories={()=>{setStatus('idle');setMobileTab('library');setDesktopTab('library')}}/>
          <StoryReading
            story={story} storyRef={storyRef}
            imageCache={imageCache}
            onBack={()=>{
              Object.values(imageCache).forEach(u=>URL.revokeObjectURL(u))
              setImageCache({})
              setStatus('idle');setStory(null)
            }}
            onSave={handleSave} alreadySaved={alreadySaved}
            onShare={handleShare} shareStatus={shareStatus}
            onDownloadPDF={handleDownloadPDF} pdfLoading={pdfLoading} pdfError={pdfError}
          />
        </>
      )}
    </div>
  )
}
