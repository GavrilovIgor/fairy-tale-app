'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }

interface Props {
  segments: Segment[]
}

export function InteractiveScene({ segments }: Props) {
  const t = useTranslations('interactive')
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
            aria-label={isRead ? `${t('readLabel')}: ${seg.hint}` : `${t('blankLabel')}: ${seg.hint}`}
            data-hint={seg.hint}
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
