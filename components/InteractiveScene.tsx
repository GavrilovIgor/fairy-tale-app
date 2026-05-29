'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }
type BlankState = 'idle' | 'revealed' | 'done'

interface Props {
  segments: Segment[]
}

export function InteractiveScene({ segments }: Props) {
  const t = useTranslations('interactive')
  const [states, setStates] = useState<Record<string, BlankState>>({})

  const getState = (id: string): BlankState => states[id] ?? 'idle'

  const advance = (id: string) => {
    setStates(prev => {
      const cur = prev[id] ?? 'idle'
      const next: BlankState = cur === 'idle' ? 'revealed' : cur === 'revealed' ? 'done' : 'idle'
      return { ...prev, [id]: next }
    })
  }

  return (
    <p className="text-lg sm:text-xl leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }

        const state = getState(seg.id)

        return (
          <span key={seg.id} className="interactive-blank inline-block align-baseline mx-1 whitespace-nowrap">
            {/* Пустое место — всегда видно */}
            <span className={[
              'inline-block border-b-2 min-w-[3rem] text-center text-[0.92em]',
              state === 'done'
                ? 'border-stone-300 text-stone-400 line-through'
                : 'border-current text-transparent',
            ].join(' ')}>{'   '}</span>

            {/* Подсказка — кнопка */}
            <button
              type="button"
              onClick={() => advance(seg.id)}
              aria-label={state === 'idle'
                ? t('tapForHint')
                : state === 'revealed'
                  ? `${t('blankLabel')}: ${seg.hint}`
                  : t('readLabel')}
              data-hint={seg.hint}
              className={[
                'ml-1 text-[0.82em] cursor-pointer select-none transition-all active:scale-95',
                state === 'idle'
                  ? 'text-stone-300 hover:text-stone-500'
                  : state === 'revealed'
                    ? 'text-amber-700 font-medium'
                    : 'text-stone-300 line-through',
              ].join(' ')}
            >
              {state === 'idle'   && '(?)'}
              {state === 'revealed' && `(${seg.hint})`}
              {state === 'done'   && `(${seg.hint})`}
            </button>
          </span>
        )
      })}
    </p>
  )
}
