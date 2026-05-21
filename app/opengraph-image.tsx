import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #7c3aed 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* Декоративные звёзды */}
      <div style={{ position: 'absolute', top: 60, left: 80, fontSize: 40, opacity: 0.4 }}>✦</div>
      <div style={{ position: 'absolute', top: 120, right: 140, fontSize: 24, opacity: 0.3 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 80, left: 160, fontSize: 30, opacity: 0.3 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 100, right: 80, fontSize: 48, opacity: 0.35 }}>✦</div>

      <div style={{ fontSize: 90, marginBottom: 16 }}>✨</div>
      <div style={{ fontSize: 58, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>
        Волшебная Сказка
      </div>
      <div style={{
        fontSize: 28,
        marginTop: 20,
        opacity: 0.85,
        textAlign: 'center',
        maxWidth: 800,
        lineHeight: 1.4,
      }}>
        Персональные сказки для детей с иллюстрациями
      </div>
      <div style={{
        marginTop: 32,
        display: 'flex',
        gap: 32,
        fontSize: 22,
        opacity: 0.7,
      }}>
        <span>3 сказки бесплатно</span>
        <span>·</span>
        <span>Готово за 1 минуту</span>
        <span>·</span>
        <span>С иллюстрациями</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
