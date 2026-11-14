/**
 * Caixa de e-mail de DESENVOLVIMENTO. Não use em produção.
 *
 * - Recebe e-mails por SMTP em 127.0.0.1:1025 (sem autenticação, só loopback).
 * - Mostra as mensagens em http://127.0.0.1:8025 (e em /messages.json).
 *
 * Uso (em outro terminal):  npm run mail:dev --workspace=apps/api
 * API com:  MAIL_TRANSPORT=smtp SMTP_HOST=127.0.0.1 SMTP_PORT=1025 APP_URL=http://localhost:5173
 */
import http from 'http'
import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'

const SMTP_PORT = Number(process.env.DEV_MAILBOX_SMTP_PORT ?? 1025)
const HTTP_PORT = Number(process.env.DEV_MAILBOX_HTTP_PORT ?? 8025)
const HOST = '127.0.0.1'

interface StoredMessage { id: number; receivedAt: string; to: string; subject: string; text: string; html: string }
const messages: StoredMessage[] = []

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, _session, callback) {
    simpleParser(stream).then((parsed) => {
      const to = Array.isArray(parsed.to) ? parsed.to.map((a) => a.text).join(', ') : parsed.to?.text ?? ''
      messages.unshift({ id: messages.length + 1, receivedAt: new Date().toISOString(), to,
        subject: parsed.subject ?? '', text: parsed.text ?? '', html: typeof parsed.html === 'string' ? parsed.html : '' })
      console.log(`[dev-mailbox] mensagem para ${to}: ${parsed.subject ?? ''}`)
      callback()
    }).catch((error: Error) => callback(error))
  },
})

const web = http.createServer((req, res) => {
  if (req.url === '/messages.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(messages))
    return
  }
  const items = messages.map((m) => `<article><h2>${escape(m.subject)}</h2>
<p><small>${escape(m.receivedAt)} · para ${escape(m.to)}</small></p>
<pre>${escape(m.text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</pre></article>`).join('<hr>')
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!doctype html><meta charset="utf-8"><title>Caixa de desenvolvimento — Kuaa</title>
<style>body{font:15px system-ui;max-width:760px;margin:2rem auto;padding:0 1rem}pre{white-space:pre-wrap;background:#f4f1ea;padding:1rem}</style>
<h1>Caixa de e-mail de desenvolvimento</h1><p>Somente local. Recarregue para ver novas mensagens.</p>${items || '<p>Nenhuma mensagem ainda.</p>'}`)
})

smtp.listen(SMTP_PORT, HOST, () => console.log(`[dev-mailbox] SMTP em ${HOST}:${SMTP_PORT}`))
web.listen(HTTP_PORT, HOST, () => console.log(`[dev-mailbox] Caixa em http://${HOST}:${HTTP_PORT}`))
