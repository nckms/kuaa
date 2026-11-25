# Banco de questões reais (ENEM)

## O que entrou

- **2.526 questões reais do ENEM 2009–2023** (provas do INEP): 1.706 só de
  texto (fase 1) + 820 com uma figura e alternativas em texto (fase 2). As
  figuras ficam em `apps/web/public/question-media/enem/` (WebP, ~12 KB cada,
  geradas por `scripts/official/convert-images.py`). Fonte da transcrição: base aberta enem.dev
  (github.com/yunger7/enem-api). Arquivo: `apps/api/prisma/official/enem.json`.
- Importação automática no pré-deploy (`npm run db:migrate` → `import-official`),
  idempotente: cria as novas, atualiza texto/tópico, **nunca apaga explicação**.
- Ids estáveis `cofenem<ano>q<número>[ing|esp]`; o aluno vê "ENEM 2020 · questão 43".

## Como a prática usa

1. Questões oficiais do tópico (e dos tópicos equivalentes, ver `OFFICIAL_SIBLINGS`
   em `modules/quiz/official.ts`) que o aluno ainda não viu, na ordem original
   das alternativas.
2. Se houver menos de 3 inéditas: acervo autoral (`curated-*.ts`).
3. IA só se não houver nenhuma das duas (sempre identificada).

O simulado do ENEM também passa a priorizar questões oficiais.

## Explicação

A prova não traz explicação. Na primeira vez que alguém pratica uma questão, a
IA escreve a explicação (com o gabarito oficial fixado no prompt), que é
guardada para todos (nas questões com figura, a IA recebe a imagem; se não
conseguir carregá-la, não explica e mostra só o gabarito) e aparece com "Explicação escrita com apoio de IA ·
gabarito oficial". Se a IA não responder em 9 s, o aluno vê o gabarito oficial
e a explicação aparece na revisão. Explicação revisada por professor pode
substituir a da IA direto no banco (o importador não sobrescreve).

## Classificação por tópico

A base só informa a área (Matemática, Natureza, Humanas, Linguagens, idioma).
O tópico vem de palavras-chave (`scripts/official/enem-topics.mjs`) dentro da
área: 665 com confiança alta, o resto baixa (campo `confidence` no JSON).
Erros de classificação são esperados; corrigir = ajustar palavras-chave e
rodar `node scripts/official/build-enem.mjs <repo enem-api>` de novo.

## Próximas fases

- **Fase 2b:** ~220 questões com várias figuras ou alternativas em imagem
  (o app ainda mostra uma figura por questão) e 6 sem figura na base.
- **Fase 3:** Fuvest/Unicamp — não há base aberta estruturada; exigiria extrair
  dos PDFs das bancas.

## Jurídico (revisar com advogado)

As provas do ENEM são publicadas pelo INEP, mas trazem textos, charges e
tirinhas de terceiros (com a fonte citada na própria questão). Plataformas de
estudo usam essas provas amplamente; ainda assim, incluir na revisão jurídica.
A transcrição usada (enem.dev) é um projeto aberto sob GPL-2.0 (código).
