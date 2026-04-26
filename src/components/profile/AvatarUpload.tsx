'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  avatarUrl: string | null
  name: string
  onUpdated: (url: string) => void
}

export function AvatarUpload({ userId, avatarUrl, name, onUpdated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatarUrl)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: data.publicUrl }),
      })
      if (!res.ok) throw new Error('Failed to save avatar')

      setPreview(publicUrl)
      onUpdated(publicUrl)
    } catch (err) {
      console.error(err)
      setPreview(avatarUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-base-100 bg-primary/10 shadow-md ring-2 ring-base-300"
      >
        {preview ? (
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary">{initials}</span>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin text-white" />
            : <Camera className="h-6 w-6 text-white" />
          }
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
