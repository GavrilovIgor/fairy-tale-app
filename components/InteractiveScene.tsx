'use client'

import React, { useState } from 'react'

type Segment = { type:'text'; value:string } | { type:'blank'; hint:string; id:string }

interface Props {
  segments: Segment[]
}

export function InteractiveScene({ segments }: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <p className="text-lg sm:text-xl leading-relaxed" style={{textAlign:'justify',hyphens:'auto'}}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>
        }

        const isRevealed = revealed.has(seg.id)

        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => toggle(seg.id)}
            data-hint={seg.hint}
            aria-label={isRevealed ? seg.hint : 'Нажмите чтобы увидеть подсказку'}
            className="interactive-blank inline-block align-baseline cursor-pointer select-none transition-all active:scale-95"
            style={{
              borderBottom: '2px solid currentColor',
              paddingBottom: 1,
              marginInline: '0.15em',
              minWidth: '2.5em',
              lineHeight: 1,
            }}
          >
            {isRevealed
              ? <span style={{color:'#a46713',fontSize:'0.85em',fontStyle:'italic'}}>({seg.hint})</span>
              : <span style={{opacity:0}}>&nbsp;&nbsp;&nbsp;</span>}
          </button>
        )
      })}
    </p>
  )
}
