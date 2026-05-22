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
        borderRadius: 40,
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 110,
      }}
    >
      ✨
    </div>,
    { width: 180, height: 180 }
  )
}
