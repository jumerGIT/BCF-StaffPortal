'use client'
import dynamic from 'next/dynamic'

const QRScanner = dynamic(
  () => import('./QRScanner').then((m) => m.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    ),
  }
)

export function QRScannerLoader() {
  return <QRScanner />
}
