import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useSabia } from '../../hooks/useSabia'
import { isAxiosError } from 'axios'
import { useAuthStore } from '../../stores/auth.store'

const SABIA_AVATAR = (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #531A61, #840033)',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      fontSize: 15,
    }}
  >
    🦜
  </div>
)

function UserBubble({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div
        style={{
          maxWidth: '75%',
          background: '#531A61',
          color: '#fff',
          borderRadius: '18px 18px 4px 18px',
          padding: '12px 16px',
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: 'Inter, Arial, sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </div>
    </div>
  )
}

function SabiaBubble({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      {SABIA_AVATAR}
      <div
        style={{
          maxWidth: '75%',
          background: 'var(--surface, #fff)',
          color: 'var(--text, #1a0a1f)',
          border: '1px solid var(--line-soft, rgba(83,26,97,.12))',
          borderRadius: '4px 18px 18px 18px',
          padding: '12px 16px',
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: 'Inter, Arial, sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
      {SABIA_AVATAR}
      <div
        style={{
          background: 'var(--surface, #fff)',
          border: '1px solid var(--line-soft, rgba(83,26,97,.12))',
          borderRadius: '4px 18px 18px 18px',
          padding: '14px 18px',
          display: 'flex',
          gap: 5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#840033',
              display: 'inline-block',
              animation: `sabia-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
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
    ? 'O Sabiá está indisponível no momento. Sua mensagem foi mantida; tente novamente em instantes.'
    : isAxiosError(error) && error.response?.status === 429
      ? 'Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.'
      : 'Não foi possível confirmar o envio. Confira sua conexão e recarregue o histórico antes de tentar novamente.'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending])

  function openConversation(id: string | null) {
    if (isPending) return
    drafts.current[conversationId ?? 'new'] = input
    setInput(drafts.current[id ?? 'new'] ?? '')
    setConversationId(id)
    setHistoryOpen(false)
    reset()
  }

  function handleSend() {
    const text = input.trim()
    if (!text || input.length > 2000 || blocked || sendingRef.current) return
    sendingRef.current = true

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
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  return (
    <AppLayout>
      <style>{`
        @keyframes sabia-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: .4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          padding: '0 16px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 0 16px',
            borderBottom: '1px solid var(--line-soft, rgba(83,26,97,.1))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #531A61, #840033)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
              }}
            >
              🦜
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#531A61',
                  margin: 0,
                  letterSpacing: 0,
                }}
              >
                Sabiá
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, Arial, sans-serif' }}>
                Tutor de IA · método socrático
              </p>
            </div>
            <button type="button" aria-label="Histórico de conversas" title="Histórico de conversas" aria-expanded={historyOpen} aria-controls="sabia-history" onClick={() => setHistoryOpen(!historyOpen)} style={{ width: 44, height: 44, flexShrink: 0, border: '1px solid var(--line-soft)', background: '#fff', color: '#531A61', borderRadius: 6 }}><i className="bi bi-clock-history" aria-hidden="true" /></button>
            <button type="button" aria-label="Nova conversa" title="Nova conversa" disabled={isPending} onClick={() => openConversation(null)} style={{ width: 44, height: 44, flexShrink: 0, border: '1px solid var(--line-soft)', background: '#fff', color: '#531A61', borderRadius: 6 }}><i className="bi bi-plus-lg" aria-hidden="true" /></button>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 13, overflowWrap: 'anywhere', color: '#6b6571' }}>{conversations.data?.find((item) => item.id === conversationId)?.title ?? (conversationId ? 'Conversa' : 'Nova conversa')}</p>
          {historyOpen && <section id="sabia-history" aria-label="Histórico de conversas" style={{ marginTop: 12, border: '1px solid var(--line-soft)', borderRadius: 6, background: '#fff', padding: 12, maxHeight: 220, overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Histórico</h2>
            {conversations.isPending && <p role="status">Carregando histórico...</p>}
            {conversations.isError && <button onClick={() => void conversations.refetch()}>Tentar carregar novamente</button>}
            {conversations.isSuccess && !conversations.data.length && <p style={{ fontSize: 13 }}>Nenhuma conversa salva ainda.</p>}
            {conversations.data?.map((item) => <button key={item.id} type="button" disabled={isPending} aria-current={item.id === conversationId ? 'true' : undefined} onClick={() => openConversation(item.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid var(--line-soft)', background: item.id === conversationId ? '#f5eef7' : '#fff', padding: '10px 8px', borderRadius: 4 }}>
              <strong style={{ display: 'block', fontSize: 13, color: '#281f2c', overflowWrap: 'anywhere' }}>{item.title}</strong>
              <span style={{ fontSize: 11, color: '#6b6571' }}>{new Date(item.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · {item._count.messages} mensagens</span>
            </button>)}
          </section>}

          {/* Aviso */}
          <div
            style={{
              marginTop: 12,
              background: 'rgba(255,220,92,.12)',
              border: '1px solid rgba(255,220,92,.3)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              color: '#7a5c00',
              fontFamily: 'Inter, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>💡</span>
            <span>As respostas são geradas por IA e podem conter erros. Confira informações importantes com seu professor.</span>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {history.isPending && <p role="status">Carregando conversa...</p>}
          {history.isError && <div role="alert">
            <p>Não foi possível carregar seu histórico.</p>
            <button onClick={() => void history.refetch()} disabled={history.isFetching}>Tentar novamente</button>
          </div>}
          {history.isSuccess && messages.length === 0 && <p>O que você está estudando hoje?</p>}
          {messages.map((msg) => <div key={msg.id}>
            <p style={{ fontSize: 10, color: '#6b6571', textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: 4 }}><time dateTime={msg.createdAt}>{new Date(msg.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></p>
            {msg.role === 'user' ? <UserBubble content={msg.content} /> : <SabiaBubble content={msg.content} />}
          </div>)}

          {isPending && <TypingIndicator />}
          {error && <div role="alert">
            <p>{errorText}</p>
            <button onClick={handleSend} disabled={blocked || !input.trim()}>Tentar novamente</button>
            <button onClick={() => void history.refetch()} disabled={isPending || history.isFetching}>Recarregar histórico</button>
          </div>}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: '1px solid var(--line-soft, rgba(83,26,97,.1))',
            padding: '12px 0 20px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              background: 'var(--surface, #fff)',
              border: '1.5px solid rgba(83,26,97,.2)',
              borderRadius: 16,
              padding: '10px 12px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Qual é sua dúvida?"
              aria-label="Mensagem para o Sabiá"
              maxLength={2000}
              disabled={blocked}
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                fontFamily: 'Inter, Arial, sans-serif',
                color: 'var(--text, #1a0a1f)',
                background: 'transparent',
                lineHeight: 1.5,
                overflowY: 'auto',
                minHeight: 24,
                minWidth: 0,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || blocked}
              aria-label="Enviar mensagem"
              title="Enviar mensagem"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: 'none',
                background: input.trim() && !isPending ? '#531A61' : 'rgba(83,26,97,.2)',
                color: '#fff',
                cursor: input.trim() && !isPending ? 'pointer' : 'not-allowed',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                transition: 'background .15s',
              }}
            >
              <i className="bi bi-send-fill" style={{ fontSize: 15 }} />
            </button>
          </div>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 11,
              color: '#9ca3af',
              fontFamily: 'Inter, Arial, sans-serif',
              textAlign: 'center',
            }}
          >
            {input.length}/2000
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
