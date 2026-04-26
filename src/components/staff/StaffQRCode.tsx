'use client'
import QRCode from 'react-qr-code'
import { Download } from 'lucide-react'

interface Props {
  userId: string
  name: string
}

export function StaffQRCode({ userId, name }: Props) {
  const download = () => {
    const svg = document.getElementById('staff-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a = document.createElement('a')
      a.download = `${name.replace(/\s+/g, '_')}_QR.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-box border bg-white p-4 shadow-sm">
        <QRCode id="staff-qr-svg" value={userId} size={160} />
      </div>
      <p className="text-xs text-base-content/50 text-center">
        Show this to your site head to clock in/out
      </p>
      <button onClick={download} className="btn btn-ghost btn-sm gap-1">
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
  )
}
