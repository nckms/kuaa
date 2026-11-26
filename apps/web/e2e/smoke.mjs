// Smoke test do caminho do aluno, contra um ambiente no ar (padrão: produção).
//   node apps/web/e2e/smoke.mjs [https://kuaa-web.vercel.app]
// Cria uma conta kuaa-test-smoke-*@example.com, faz onboarding ENEM, diagnóstico completo, uma prática
// até o resultado, confere o Índice (TRI) e as telas principais no celular (iPhone 13), e APAGA a conta
// no fim, mesmo se algo falhar. Sai com código 1 se algum passo falhar; prints de falha em e2e/out/.
// Requer Playwright com Chromium (já instalado nos ambientes do Claude; fora deles: npx playwright install chromium).
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = (await import('playwright')).default }
const { chromium, devices } = playwright

const BASE = (process.argv[2] ?? 'https://kuaa-web.vercel.app').replace(/\/$/, '')
const API = `${BASE}/api/v1`
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'out')
const stamp = Date.now()
const email = `kuaa-test-smoke-${stamp}@example.com`
const password = `Smoke${stamp}x!`
const results = []
const serverErrors = []

const browser = await chromium.launch()
const context = await browser.newContext({ ...devices['iPhone 13'] })
const page = await context.newPage()
page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) serverErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(/.*\/api\/v1/, '')}`) })
page.on('pageerror', (e) => serverErrors.push(`erro de JS: ${e.message.slice(0, 160)}`))

async function step(name, fn) {
  const t0 = Date.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, ms: Date.now() - t0, detail })
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - t0, detail: String(error?.message ?? error).slice(0, 300) })
    fs.mkdirSync(OUT, { recursive: true })
    await page.screenshot({ path: path.join(OUT, `falha-${results.length}.png`), fullPage: true }).catch(() => undefined)
    throw error
  }
}
const visibleButtons = () => page.$$eval('button', (els) => els.filter((e) => e.offsetParent && !e.disabled).map((e) => e.innerText.trim().replace(/\s+/g, ' ')))
async function token() {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!r.ok) throw new Error(`login ${r.status}`)
  return (await r.json()).accessToken
}

try {
  await step('cadastro', async () => {
    await page.goto(`${BASE}/cadastro`)
    await page.fill('#name', 'Teste Smoke'); await page.fill('#email', email); await page.fill('#password', password)
    await page.click('button[type=submit]')
    await page.waitForURL(/onboarding/, { timeout: 20_000 })
  })

  await step('onboarding ENEM', async () => {
    await page.getByRole('button', { name: /ENEM/ }).first().click()
    await page.getByRole('button', { name: 'Começar diagnóstico' }).click()
    await page.waitForURL(/diagnostico/, { timeout: 20_000 })
  })

  await step('diagnóstico completo', async () => {
    for (let i = 0; i < 80 && page.url().includes('diagnostico'); i++) {
      const labels = await visibleButtons()
      const next = labels.find((l) => /^(Iniciar questões|Confirmar|Responder|Próxima|Continuar|Ver resultado|Finalizar|Ver minha trilha|Ir para)/i.test(l))
      if (next) { await page.getByRole('button', { name: next, exact: true }).first().click(); await page.waitForTimeout(1800); continue }
      const option = page.locator('button[aria-pressed="false"]').first()
      if (await option.count()) { await option.click(); await page.waitForTimeout(400); continue }
      const other = labels.filter((l) => l && !/Sair|Fazer depois|Voltar|Pular|Sabiá|Dica/i.test(l))
      if (!other.length) break
      await page.getByRole('button', { name: other[0], exact: true }).first().click(); await page.waitForTimeout(1500)
    }
    const d = await (await fetch(`${API}/diagnostic/enem`, { headers: { authorization: `Bearer ${await token()}` } })).json()
    if (d.status !== 'completed') throw new Error(`diagnóstico não concluiu (status ${d.status})`)
  })

  await step('prática até o resultado', async () => {
    await page.goto(`${BASE}/dashboard`)
    await page.getByRole('button', { name: /Praticar agora/ }).or(page.getByRole('link', { name: /Praticar agora/ })).first().click()
    await page.waitForURL(/\/quiz\//, { timeout: 45_000 })
    for (let i = 0; i < 40 && page.url().includes('/quiz/'); i++) {
      const labels = await visibleButtons()
      const next = labels.find((l) => /^(Continuar|Confirmar|Ver resultado|Finalizar)/i.test(l))
      if (next) { await page.getByRole('button', { name: next }).first().click(); await page.waitForTimeout(3500); continue }
      const option = labels.find((l) => /^[A-E] /.test(l))
      if (option) { await page.getByRole('button', { name: option }).first().click(); await page.waitForTimeout(400); continue }
      await page.waitForTimeout(1500)
    }
    if (!/resultado/.test(page.url())) throw new Error(`não chegou ao resultado (${page.url().replace(BASE, '')})`)
  })

  await step('Índice (TRI) conta o diagnóstico', async () => {
    const d = await (await fetch(`${API}/index/enem`, { headers: { authorization: `Bearer ${await token()}` } })).json()
    if (!d.tri || d.tri.totalItems < 12) throw new Error(`tri.totalItems = ${d.tri?.totalItems}`)
    return `${d.tri.totalItems} questões oficiais`
  })

  const screens = ['dashboard', 'trilha/enem', 'indice', 'sabia', 'redacao/enem', 'simulado', 'provas', 'segunda-fase', 'erros', 'plano', 'ranking', 'perfil', 'configuracoes', 'planos']
  await step(`${screens.length} telas no celular`, async () => {
    const problems = []
    for (const s of screens) {
      await page.goto(`${BASE}/${s}`); await page.waitForTimeout(2500)
      const { width, text } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, text: document.body.innerText.trim().length }))
      if (width > 395) problems.push(`${s}: rolagem lateral (${width}px)`)
      if (text < 150) problems.push(`${s}: tela quase vazia`)
    }
    if (problems.length) throw new Error(problems.join('; '))
  })
} catch { /* o passo que falhou já foi registrado */ } finally {
  try {
    const t = await token()
    const r = await fetch(`${API}/users/me`, { method: 'DELETE', headers: { 'content-type': 'application/json', authorization: `Bearer ${t}` }, body: JSON.stringify({ password, confirm: 'EXCLUIR' }) })
    results.push({ name: 'conta de teste apagada', ok: r.status === 204, ms: 0, detail: r.status === 204 ? '' : `status ${r.status}` })
  } catch (error) {
    results.push({ name: 'conta de teste apagada', ok: false, ms: 0, detail: `${String(error)} (apagar ${email} manualmente)` })
  }
  await browser.close()
}

if (serverErrors.length) results.push({ name: 'sem erro 5xx nem erro de JS', ok: false, ms: 0, detail: [...new Set(serverErrors)].join('; ').slice(0, 400) })
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ms ? ` (${(r.ms / 1000).toFixed(1)} s)` : ''}${r.detail ? ` — ${r.detail}` : ''}`)
const failed = results.filter((r) => !r.ok)
console.log(failed.length ? `\n${failed.length} falha(s) em ${BASE}` : `\nTudo certo em ${BASE}`)
process.exit(failed.length ? 1 : 0)
