import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useSabia } from '../../hooks/useSabia'
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../stores/auth.store'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'
import './SabiaPage.css'

const CHIPS = ['Explica concessão vs. adversativa', 'Me dá 3 questões de porcentagem', 'Como estruturar uma redação?', 'Resumo de Era Vargas']

function formatWhen(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export default function SabiaPage() {
  const userId = useAuthStore((state) => state.user?.id)
  return <SabiaConversation key={userId} />
}

function SabiaConversation() {
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const drafts = useRef<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate, isPending, error, reset, history, conversations } = useSabia(conversationId)
  const messages = history.data ?? []
  const blocked = isPending || (!history.data && !history.isSuccess)
  const sendingRef = useRef(false)
  const errorText = isAxiosError(error) && error.response?.status === 503
    ? 'A Sabiá está indisponível no momento. Sua mensagem foi mantida; tente novamente em instantes.'
    : isAxiosError(error) && error.response?.status === 429
      ? 'Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.'
      : 'Não foi possível confirmar o envio. Confira sua conexão e recarregue o histórico antes de tentar novamente.'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isPending])

  function openConversation(id: string | null) {
    if (isPending) return
    drafts.current[conversationId ?? 'new'] = input
    setInput(drafts.current[id ?? 'new'] ?? '')
    setConversationId(id)
    setHistoryOpen(false)
    reset()
  }

  function send(raw?: string) {
    const text = (raw ?? input).trim()
    if (!text || text.length > 2000 || blocked || sendingRef.current) return
    sendingRef.current = true
    if (raw !== undefined) setInput(raw)

    mutate(
      { message: text, conversationId },
      {
        onSuccess: (data) => {
          delete drafts.current[conversationId ?? 'new']
          setConversationId(data.conversationId)
          setInput('')
          if (textareaRef.current) textareaRef.current.style.height = 'auto'
        },
        onSettled: () => { sendingRef.current = false },
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`
    }
  }

  const historyList = (
    <>
      <button type="button" className="sabia-new" disabled={isPending} onClick={() => openConversation(null)}><i className="bi bi-plus-lg" aria-hidden="true" />Nova conversa</button>
      <span className="sabia-recent k-mono">RECENTES</span>
      {conversations.isPending && <p role="status" className="sabia-hist-note">Carregando histórico...</p>}
      {conversations.isError && <button type="button" className="k-link-btn" style={{ padding: '4px 10px' }} onClick={() => void conversations.refetch()}>Tentar carregar novamente</button>}
      {conversations.isSuccess && !conversations.data.length && <p className="sabia-hist-note">Nenhuma conversa salva ainda.</p>}
      {conversations.data?.map((item) => (
        <button key={item.id} type="button" className={`sabia-hist-item${item.id === conversationId ? ' is-active' : ''}`} disabled={isPending}
          aria-current={item.id === conversationId ? 'true' : undefined} onClick={() => openConversation(item.id)}>
          <span>{item.title}</span><small>{formatWhen(item.updatedAt)} · {item._count.messages} mensagens</small>
        </button>
      ))}
    </>
  )

  return (
    <AppLayout>
      <div className="sabia">
        <aside className="sabia-history" aria-label="Histórico de conversas">{historyList}</aside>
        <div className="sabia-main">
          <header className="sabia-head">
            <KuaaMascotLogo size={40} radius={12} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1>Sabiá</h1>
              <div className="sabia-status"><span />Tutora de IA · pode errar, confira o essencial</div>
            </div>
            <button type="button" className="sabia-icon-btn sabia-hist-toggle" aria-label="Histórico de conversas" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}><i className="bi bi-clock-history" aria-hidden="true" /></button>
            <button type="button" className="sabia-icon-btn sabia-hist-toggle" aria-label="Nova conversa" disabled={isPending} onClick={() => openConversation(null)}><i className="bi bi-plus-lg" aria-hidden="true" /></button>
          </header>
          {historyOpen && <div className="sabia-history-drop">{historyList}</div>}

          <div className="sabia-scroll">
            <div className="sabia-thread">
              {history.isPending && <p role="status" className="k-muted">Carregando conversa...</p>}
              {history.isError && <div role="alert" className="k-alert">
                <p style={{ margin: '0 0 8px' }}>Não foi possível carregar seu histórico.</p>
                <button type="button" className="k-btn k-btn-outline is-sm" onClick={() => void history.refetch()} disabled={history.isFetching}>Tentar novamente</button>
              </div>}
              {history.isSuccess && messages.length === 0 && !isPending && (
                <div className="sabia-empty">
                  <img src="/brand/owl-light.png" alt="" />
                  <h2>O que vamos estudar hoje?</h2>
                  <p>Pergunte qualquer coisa — eu explico passo a passo.</p>
                </div>
              )}
              {messages.map((msg) => {
                const bot = msg.role !== 'user'
                return (
                  <div key={msg.id} className={`sabia-msg${bot ? '' : ' is-user'}`}>
                    {bot && <KuaaMascotLogo size={32} radius={10} />}
                    <div className="sabia-msg-col">
                      <div className="sabia-bubble">{msg.content}</div>
                      <time dateTime={msg.createdAt}>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                  </div>
                )
              })}
              {isPending && (
                <>
                  <div className="sabia-msg is-user"><div className="sabia-msg-col"><div className="sabia-bubble">{input}</div></div></div>
                  <div className="sabia-msg"><KuaaMascotLogo size={32} radius={10} /><div className="sabia-bubble sabia-typing" aria-label="Sabiá está digitando"><span /><span /><span /></div></div>
                </>
              )}
              {error && <div role="alert" className="k-alert">
                <p style={{ margin: '0 0 10px' }}>{errorText}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="k-btn k-btn-primary is-sm" onClick={() => send()} disabled={blocked || !input.trim()}>Tentar novamente</button>
                  <button type="button" className="k-btn k-btn-outline is-sm" onClick={() => void history.refetch()} disabled={isPending || history.isFetching}>Recarregar histórico</button>
                </div>
              </div>}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="sabia-compose">
            <div className="sabia-compose-inner">
              {messages.length === 0 && <div className="sabia-chips">{CHIPS.map((chip) => <button key={chip} type="button" disabled={blocked} onClick={() => send(chip)}>{chip}</button>)}</div>}
              <div className="sabia-input">
                <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown} rows={1} maxLength={2000} disabled={blocked}
                  placeholder="Pergunte à Sabiá…" aria-label="Mensagem para a Sabiá" />
                <button type="button" onClick={() => send()} disabled={!input.trim() || blocked} aria-label="Enviar mensagem" className={input.trim() && !blocked ? 'is-ready' : ''}><i className="bi bi-arrow-up" aria-hidden="true" /></button>
              </div>
              <div className="sabia-foot"><span>Enter envia · Shift+Enter quebra linha</span><span className="k-mono">{input.length}/2000</span></div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
