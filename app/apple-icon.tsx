import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* outer glow */}
      <div style={{
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(163,230,53,0.35) 0%, rgba(132,204,22,0.1) 40%, transparent 70%)',
        display: 'flex',
      }} />
      {/* mid glow */}
      <div style={{
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,249,157,0.9) 0%, rgba(132,204,22,0) 100%)',
        display: 'flex',
      }} />
      {/* core */}
      <div style={{
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: '#f0fdf4',
        display: 'flex',
      }} />
      {/* sparkles */}
      {([
        { top: 48, left: 112, size: 6, opacity: 0.6 },
        { top: 52, left: 28, size: 5, opacity: 0.5 },
        { top: 118, left: 104, size: 7, opacity: 0.7 },
        { top: 116, left: 30, size: 5, opacity: 0.4 },
      ] as Array<{top:number,left:number,size:number,opacity:number}>).map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top,
          left: s.left,
          width: s.size,
          height: s.size,
          borderRadius: '50%',
          background: `rgba(200,255,100,${s.opacity})`,
          display: 'flex',
        }} />
      ))}
    </div>,
    { width: 180, height: 180 }
  )
}
