import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useSabia } from '../../hooks/useSabia'
import type { ChatMessage } from '../../hooks/useSabia'

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

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Olá! Sou o Sabiá 🦜, seu tutor de estudos. Estou aqui para te ajudar a entender qualquer matéria do vestibular — mas não entrego respostas prontas! Em vez disso, vou te fazer perguntas e dar dicas até você chegar lá sozinho. O que você está estudando hoje?',
}

export default function SabiaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mutate, isPending } = useSabia()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending])

  function handleSend() {
    const text = input.trim()
    if (!text || isPending) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')

    // Histórico enviado ao backend (exclui a mensagem de boas-vindas e a que acabamos de adicionar)
    const historyForBackend = updatedMessages.slice(1, -1)

    mutate(
      { message: text, history: historyForBackend },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Ops, tive um problema de conexão. Pode repetir sua pergunta?',
            },
          ])
        },
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
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
            <div>
              <h1
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#531A61',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Sabiá
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, Arial, sans-serif' }}>
                Tutor de IA · método socrático
              </p>
            </div>
          </div>

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
            <span>O Sabiá te ajuda a <strong>entender</strong> — ele não entrega respostas prontas.</span>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.map((msg, i) =>
            msg.role === 'user' ? (
              <UserBubble key={i} content={msg.content} />
            ) : (
              <SabiaBubble key={i} content={msg.content} />
            ),
          )}

          {isPending && <TypingIndicator />}

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
              placeholder="Pergunte qualquer coisa... (Enter para enviar)"
              disabled={isPending}
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
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
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
            Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
