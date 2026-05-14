import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVestibulares } from '../../hooks/useVestibulares'
import { useMyEnrollments, useEnroll } from '../../hooks/useEnrollments'
import { useAuthStore } from '../../stores/auth.store'
import type { Vestibular } from '../../types/trail'

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full mb-4" />
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

interface VestibularCardProps {
  vestibular: Vestibular
  selected: boolean
  enrolled: boolean
  onClick: () => void
}

function VestibularCard({ vestibular, selected, enrolled, onClick }: VestibularCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={enrolled}
      className="text-left rounded-2xl border-2 p-6 transition-all w-full focus:outline-none"
      style={{
        borderColor: enrolled ? '#840033' : selected ? '#531A61' : '#e5e7eb',
        backgroundColor: enrolled ? '#fff5f7' : selected ? '#f3eaf7' : '#ffffff',
        cursor: enrolled ? 'default' : 'pointer',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">🎓</span>
        {selected && !enrolled && (
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#FFDC5C', color: '#531A61' }}
          >
            ✓
          </span>
        )}
        {enrolled && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#840033', color: '#fff' }}
          >
            Matriculado
          </span>
        )}
      </div>
      <h3 className="font-bold text-lg" style={{ color: '#531A61' }}>
        {vestibular.name}
      </h3>
      <p className="text-sm text-gray-500">{vestibular.institution}</p>
      <p className="text-xs text-gray-400 mt-1">{vestibular.description}</p>
    </button>
  )
}

export default function SelectVestibular() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { data: vestibulares, isLoading } = useVestibulares()
  const { data: enrollments } = useMyEnrollments()
  const enroll = useEnroll()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const enrolledIds = new Set(enrollments?.map((e) => e.enrollment.vestibularId) ?? [])

  async function handleConfirm() {
    if (!selectedId) return
    const vestibular = vestibulares?.find((v) => v.id === selectedId)
    if (!vestibular) return

    enroll.mutate(selectedId, {
      onSuccess: () => {
        navigate(`/trilha/${vestibular.slug}`)
      },
    })
  }

  function handleSelect(v: Vestibular) {
    if (enrolledIds.has(v.id)) return
    setSelectedId((prev) => (prev === v.id ? null : v.id))
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#faf8ff' }}>
      {/* Navbar mínima */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold" style={{ color: '#531A61' }}>🦅 KUAA</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
          Sair
        </button>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#531A61' }}>
          Para qual vestibular você está se preparando?
        </h1>
        <p className="text-gray-500 mb-10">Você pode adicionar mais vestibulares depois.</p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vestibulares?.map((v) => (
              <VestibularCard
                key={v.id}
                vestibular={v}
                selected={selectedId === v.id}
                enrolled={enrolledIds.has(v.id)}
                onClick={() => handleSelect(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botão fixo na base */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleConfirm}
            disabled={!selectedId || enroll.isPending}
            className="w-full py-4 rounded-xl font-bold text-base transition hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: '#531A61', color: '#FFFFFF' }}
          >
            {enroll.isPending ? 'Matriculando…' : 'Começar minha trilha →'}
          </button>
          {enroll.isError && (
            <p className="text-center text-sm mt-2" style={{ color: '#840033' }}>
              Erro ao matricular. Tente novamente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
