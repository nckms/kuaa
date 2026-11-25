import { useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'

/** Reduz a foto para no máximo 1600 px e JPEG: questão continua legível e o envio fica leve. */
export async function compressPhoto(file: File, maxSide = 1600): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image(); el.onload = () => resolve(el); el.onerror = () => reject(new Error('imagem inválida')); el.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally { URL.revokeObjectURL(url) }
}

/** "Tira foto e o Sabiá explica" (Kuaa Plus). */
export default function PhotoButton({ conversationId, disabled, onDone, onPending }: {
  conversationId: string | null; disabled: boolean; onDone: (conversationId: string) => void; onPending: (pending: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const client = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const [error, setError] = useState<{ text: string; plus?: boolean } | null>(null)
  const send = useMutation({
    retry: false,
    mutationFn: async (file: File) => (await api.post<{ conversationId: string; readable: boolean }>('/sabia/photo',
      { image: await compressPhoto(file), conversationId }, { timeout: 65_000 })).data,
    onMutate: () => { setError(null); onPending(true) },
    onSettled: () => onPending(false),
    onSuccess: async (data) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['sabia', userId, 'messages', data.conversationId] }),
        client.invalidateQueries({ queryKey: ['sabia', userId, 'conversations'] }),
      ])
      onDone(data.conversationId)
    },
    onError: (err) => {
      const body = axios.isAxiosError(err) ? (err.response?.data as { code?: string; error?: string } | undefined) : undefined
      setError(body?.code === 'PLUS_REQUIRED' ? { text: 'Mandar foto de questão é do Kuaa Plus.', plus: true }
        : { text: body?.error ?? 'Não foi possível enviar a foto. Tente de novo.' })
    },
  })
  return (
    <>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send.mutate(f) }} />
      <button type="button" className="sabia-photo" disabled={disabled || send.isPending} onClick={() => input.current?.click()}
        aria-label="Mandar foto de uma questão" title="Mandar foto de uma questão (Plus)">
        <i className={`bi ${send.isPending ? 'bi-hourglass-split' : 'bi-camera'}`} aria-hidden="true" />
      </button>
      {send.isPending && <p className="sabia-photo-status" role="status">Lendo a foto da questão…</p>}
      {error && <p className="sabia-photo-status is-error" role="alert">{error.text} {error.plus && <Link to="/planos">Conhecer o Plus</Link>}</p>}
    </>
  )
}
