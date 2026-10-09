import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuthStore } from '../../stores/auth.store'
import { useEnroll, useMyEnrollments } from '../../hooks/useEnrollments'
import { useVestibulares } from '../../hooks/useVestibulares'
import { api } from '../../services/api'
import type { User, UserPreferences } from '../../types/user'

export default function SettingsPage() {
  const { user, updateUser, loadEnrollments, firstVestibularSlug } = useAuthStore()
  const memberships = useMyEnrollments()
  const catalog = useVestibulares()
  const enroll = useEnroll()
  const [newId, setNewId] = useState('')
  const [minutes, setMinutes] = useState(String(user?.preferences?.dailyStudyMinutes ?? 30))
  const [message, setMessage] = useState('')
  const [enrollmentError, setEnrollmentError] = useState('')
  useEffect(() => { setMinutes(String(user?.preferences?.dailyStudyMinutes ?? 30)) }, [user?.preferences?.dailyStudyMinutes])

  const save = useMutation({
    mutationFn: async (input: { activeVestibularId?: string; preferences?: Partial<UserPreferences> }) => {
      const { data } = await api.patch<User>('/users/me', input)
      return data
    },
    onMutate: () => setMessage(''),
    onSuccess: (data) => { updateUser(data); setMessage('Configurações salvas.') },
  })
  const busy = save.isPending || enroll.isPending
  const enrolledIds = new Set(memberships.data?.map((item) => item.enrollment.vestibularId))
  const available = catalog.data?.filter((item) => !enrolledIds.has(item.id)) ?? []
  const activeId = memberships.data?.find((item) => item.vestibular.slug === firstVestibularSlug)?.enrollment.vestibularId ?? ''
  const validMinutes = Number.isInteger(Number(minutes)) && Number(minutes) >= 5 && Number(minutes) <= 240

  async function addEnrollment() {
    setEnrollmentError('')
    setMessage('')
    try {
      await enroll.mutateAsync(newId)
      setNewId('')
      await loadEnrollments()
      setMessage('Matrícula adicionada.')
    } catch {
      setEnrollmentError('Não foi possível atualizar as matrículas. Recarregue a lista antes de tentar novamente.')
      void memberships.refetch()
    }
  }

  return (
    <AppLayout>
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '28px 20px', color: 'var(--text)' }}>
        <h1 style={{ fontSize: 26, marginBottom: 28 }}>Configurações</h1>
        <section style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Vestibulares</h2>
          {memberships.isLoading && <p role="status">Carregando matrículas...</p>}
          {memberships.isError && <p role="alert">Não foi possível carregar matrículas. <button onClick={() => void memberships.refetch()}>Tentar novamente</button></p>}
          {!memberships.isLoading && !memberships.isError && (
            <label style={{ display: 'grid', gap: 8 }}>
              Vestibular ativo
              <select value={activeId} disabled={busy || !memberships.data?.length} onChange={(event) => save.mutate({ activeVestibularId: event.target.value })} style={{ padding: 12, width: '100%', minWidth: 0 }}>
                {!memberships.data?.length && <option value="">Nenhuma matrícula</option>}
                {memberships.data?.map((item) => <option key={item.enrollment.id} value={item.enrollment.vestibularId}>{item.vestibular.name}</option>)}
              </select>
            </label>
          )}
          <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
            <label htmlFor="new-vestibular">Nova matrícula</label>
            <select id="new-vestibular" value={newId} onChange={(event) => setNewId(event.target.value)} disabled={busy || catalog.isLoading || memberships.isLoading || memberships.isError || catalog.isError} style={{ padding: 12, width: '100%', minWidth: 0 }}>
              <option value="">{catalog.isLoading ? 'Carregando opções...' : available.length ? 'Selecione um vestibular' : 'Nenhum vestibular disponível'}</option>
              {available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="btn btn-outline-secondary" disabled={!newId || busy || memberships.isError || catalog.isError} onClick={() => void addEnrollment()}><i className="bi bi-plus-lg" aria-hidden="true" /> {enroll.isPending ? 'Matriculando...' : 'Adicionar matrícula'}</button>
            {catalog.isError && <p role="alert">Não foi possível carregar vestibulares. <button onClick={() => void catalog.refetch()}>Tentar novamente</button></p>}
            {enrollmentError && <p role="alert">{enrollmentError}</p>}
          </div>
        </section>
        <section style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Meta diária</h2>
          <form onSubmit={(event) => { event.preventDefault(); if (validMinutes) save.mutate({ preferences: { dailyStudyMinutes: Number(minutes) } }) }} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12 }}>
            <label style={{ display: 'grid', gap: 8, flex: '1 1 180px' }}>Minutos de estudo por dia
              <input type="number" min={5} max={240} step={1} required value={minutes} onChange={(event) => setMinutes(event.target.value)} style={{ padding: 10, width: '100%' }} />
            </label>
            <button type="submit" className="btn btn-outline-secondary" disabled={busy || !validMinutes}><i className="bi bi-check-lg" aria-hidden="true" /> Salvar meta</button>
          </form>
        </section>
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Acessibilidade</h2>
          <div style={{ display: 'grid', gap: 18 }}>
            <label style={{ display: 'flex', gap: 12, alignItems: 'center' }}><input type="checkbox" checked={user?.preferences?.reducedMotion ?? false} disabled={busy} onChange={(event) => save.mutate({ preferences: { reducedMotion: event.target.checked } })} /> Reduzir movimento</label>
            <label style={{ display: 'flex', gap: 12, alignItems: 'center' }}><input type="checkbox" checked={user?.preferences?.highContrast ?? false} disabled={busy} onChange={(event) => save.mutate({ preferences: { highContrast: event.target.checked } })} /> Alto contraste</label>
          </div>
        </section>
        <p role="status" style={{ marginTop: 24 }}>{save.isPending ? 'Salvando...' : message}</p>
        {save.isError && <p role="alert">Não foi possível salvar. Suas configurações anteriores foram mantidas. Tente novamente.</p>}
        <section style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line-soft)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Sua experiência</h2>
          <Link to="/avaliacao"><i className="bi bi-chat-square-text" aria-hidden="true" /> Avaliar a plataforma</Link>
        </section>
      </div>
    </AppLayout>
  )
}
