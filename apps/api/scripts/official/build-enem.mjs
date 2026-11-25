// Gera prisma/official/enem.json a partir da base aberta enem.dev
// (github.com/yunger7/enem-api, provas do ENEM/INEP 2009–2023).
// Uso: node scripts/official/build-enem.mjs <caminho do repositório enem-api>
// Fase 1: só questões sem imagem (enunciado e alternativas em texto).
import fs from 'node:fs'
import path from 'node:path'
import { classify } from './enem-topics.mjs'

const root = process.argv[2]
if (!root) { console.error('Informe o caminho do repositório enem-api'); process.exit(1) }
const here = path.dirname(new URL(import.meta.url).pathname)
const out = path.resolve(here, '../../prisma/official/enem.json')
// Imagens já convertidas por convert-images.py (questões com uma imagem e alternativas em texto).
const mediaDir = path.resolve(here, '../../../web/public/question-media/enem')

const files = []
for (const year of fs.readdirSync(path.join(root, 'public')).filter((y) => /^\d{4}$/.test(y))) {
  const dir = path.join(root, 'public', year, 'questions')
  if (!fs.existsSync(dir)) continue
  for (const q of fs.readdirSync(dir)) {
    const file = path.join(dir, q, 'details.json')
    if (fs.existsSync(file)) files.push(file)
  }
}

// Texto puro: a base vem em markdown leve (negrito, itálico com _ ou *); o app mostra texto simples.
const clean = (text) => (text ?? '').replace(/\r/g, '')
  .replace(/\*\*([^*]+?)\*\*/g, '$1').replace(/__([^_]+?)__/g, '$1')
  .replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,;:!?]|$)/g, '$1$2').replace(/(^|[\s(])_([^_\n]+?)_(?=[\s).,;:!?]|$)/g, '$1$2')
  .replace(/^#{1,6}\s+/gm, '').replace(/\\([*_[\]()#.-])/g, '$1')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
const items = []
let skippedImages = 0
for (const file of files) {
  const q = JSON.parse(fs.readFileSync(file, 'utf8'))
  const lang = q.language === 'ingles' ? 'ing' : q.language === 'espanhol' ? 'esp' : ''
  const id = `cofenem${q.year}q${String(q.index).padStart(3, '0')}${lang}`
  const hasImage = (q.files?.length ?? 0) > 0 || /!\[/.test(q.context ?? '') || q.alternatives.some((a) => a.file)
  const imageUrl = hasImage && fs.existsSync(path.join(mediaDir, `${id}.webp`)) ? `/question-media/enem/${id}.webp` : null
  if (hasImage && !imageUrl) { skippedImages++; continue }
  const options = q.alternatives.map((a) => ({ id: a.letter, text: clean(a.text), isCorrect: a.letter === q.correctAlternative }))
  if (options.length !== 5 || options.filter((o) => o.isCorrect).length !== 1 || options.some((o) => !o.text)) continue
  // A imagem é exibida pelo app abaixo do texto; a marcação dela sai do enunciado.
  const context = (q.context ?? '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  const body = [clean(context), clean(q.alternativesIntroduction)].filter(Boolean).join('\n\n')
  if (body.length < 20) continue
  const topic = classify({ discipline: q.discipline, language: q.language, text: `${body}\n${options.map((o) => o.text).join('\n')}` })
  if (!topic) continue
  items.push({
    // Id compatível com a validação cuid das rotas (começa com "c", sem hífen) e estável entre importações.
    id,
    ...(imageUrl ? { imageUrl } : {}),
    year: q.year, number: q.index, language: q.language ?? null, discipline: q.discipline,
    topic: topic.topic, confidence: topic.confidence,
    body, options,
  })
}
items.sort((a, b) => a.id.localeCompare(b.id))
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify({ source: 'ENEM/INEP 2009–2023 · transcrição enem.dev (github.com/yunger7/enem-api)', generatedAt: new Date().toISOString().slice(0, 10), questions: items }))
const byTopic = {}
for (const i of items) byTopic[i.topic] = (byTopic[i.topic] ?? 0) + 1
console.log(`${items.length} questões gravadas (${items.filter((i) => i.imageUrl).length} com imagem; ${skippedImages} com imagem não suportada ficaram de fora) em ${out}`)
console.log('confiança alta:', items.filter((i) => i.confidence === 'alta').length)
console.log(Object.entries(byTopic).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${String(n).padStart(4)} ${t}`).join('\n'))
