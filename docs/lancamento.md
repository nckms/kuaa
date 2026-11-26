# Lançamento da assinatura — checklist

Estado em 26/11/2026: código em produção; venda **desligada** (sem chaves Stripe no Railway).

## 0. Bloqueio: provedor de IA (decisão do Nicolas, antes de tudo)
Os termos da API do Gemini (ai.google.dev/terms, em vigor desde 23/03/2026) e do Vertex AI
(Google Cloud Service Specific Terms, seção 20(d)) proíbem usar o serviço em app "directed towards or
is likely to be accessed by individuals under the age of 18", tanto no plano pago quanto no gratuito. O Kuaa
aceita cadastro a partir de 13 anos e o público do ENEM inclui muitos menores. No plano gratuito,
além disso, o Google usa o conteúdo para melhorar produtos e revisores humanos podem lê-lo.
- [ ] Decidir: trocar o provedor (OpenAI e Anthropic aceitam produtos para menores com salvaguardas:
      aviso de IA, filtro, monitoramento, LGPD), restringir o Kuaa a 18+ ou manter (não recomendado).
- [ ] **Não ativar faturamento do Gemini antes dessa decisão.**
- [ ] Depois da decisão: trocar `apps/api/src/lib/gemini.ts` (todos os módulos passam por ele),
      atualizar a seção "Com quem compartilhamos" de `/privacidade` e refazer a calibração da redação.

## 1. Stripe (dono da conta)
- [ ] Ativar a conta em modo real (dados da empresa/MEI, documento, conta bancária).
- [ ] Em Configurações → Métodos de pagamento, confirmar **Pix** ligado e que o Checkout de **assinatura** oferece Pix (Pix Automático). Na conta de teste, a assinatura mostrava só cartão.
- [ ] Gerar nova chave secreta (a de teste circulou em chat) e uma chave restrita para o servidor, se preferir.

## 2. Configuração (pode ser feita pelo Claude depois do item 1)
- [ ] `STRIPE_SECRET_KEY=sk_live_… npm run stripe-setup --workspace=apps/api` (cria produto, preços `kuaa_plus_mensal` R$ 29,90 e `kuaa_plus_mensal_estudante` R$ 14,95 e o portal).
- [ ] Criar endpoint de webhook live para `https://kuaa-web.vercel.app/api/v1/billing/webhook` com os eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created|updated|deleted|paused|resumed`, `invoice.paid`, `invoice.payment_failed`.
- [ ] Railway: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_USER_IDS` (id da conta do dono no Kuaa).
- [ ] Vercel (opcional): `VITE_SUPPORT_EMAIL`.

## 3. Teste real (com valor real, depois estornar)
- [ ] Conta nova no site, `/planos`, assinar com Pix Automático no celular; confirmar Plus ativo.
- [ ] Cancelar pelo "Gerenciar ou cancelar"; confirmar que o Plus fica até o fim do período.
- [ ] Estornar a cobrança no painel da Stripe.
- [ ] Enviar documento de estudante, aprovar em `/admin/estudantes`, conferir preço de R$ 14,95.

## 4. Antes de divulgar
- [ ] Domínio próprio + e-mail (recuperação de senha, e-mail semanal e relatório do responsável: hoje **nada disso chega**).
      Depois que o Nicolas comprar o domínio, o Claude faz:
      1. Vercel: adicionar o domínio ao projeto `kuaa-web` e configurar o DNS que o painel pedir.
      2. Railway: `APP_URL=https://<domínio>`, `FRONTEND_URL=https://<domínio>,https://kuaa-web.vercel.app`
         (lista separada por vírgula, usada no CORS e na checagem de origem), `VAPID_SUBJECT=https://<domínio>`.
      3. Resend: criar o domínio, publicar os registros DNS (SPF/DKIM) e verificar. Railway: `MAIL_TRANSPORT=smtp`,
         `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=resend`, `SMTP_PASS=<API key>`,
         `MAIL_FROM=Kuaa <nao-responda@<domínio>>`.
      4. Stripe: webhook live apontando para `https://<domínio>/api/v1/billing/webhook`.
      5. `apps/web/index.html`: `og:url` e `og:image` com o domínio novo.
      6. Teste: esqueci a senha, convite de responsável e e-mail semanal chegando numa caixa real.
- [x] Rascunho de `/termos` e `/privacidade` no ar, com aviso de "versão preliminar" (links no rodapé, cadastro e checkout).
- [ ] Revisão por advogado (menores, LGPD, documento de estudante, renovação automática, arrependimento de 7 dias).
- [ ] Preencher em `apps/web/src/pages/Legal/LegalPage.tsx` (`LEGAL`): responsável (nome/CPF ou CNPJ do MEI) e e-mail de contato público; tirar o aviso de versão preliminar depois da revisão.
- [x] Exportar dados e excluir conta em Configurações (LGPD art. 18).
- [ ] Revisão jurídica do uso das provas do ENEM com textos de terceiros (ver `docs/banco-enem.md`).
- [ ] `npm run metrics` como linha de base.

## Decisões pendentes (Nicolas)

- **Provas anteriores no Plus?** Hoje estão liberadas para todos. Proposta para quando a venda abrir:
  gratuito = 1 prova completa por mês; Plus = ilimitado. Só ligar junto com a abertura da venda
  (antes disso o aluno não teria como desbloquear).
- **Provedor de IA**: ver item 0. Em 25/11 a cota gratuita do Gemini acabou à noite; desde #69, um modelo
  sem cota fica de fora por 10 minutos (sem esperar o 429 a cada chamada), mas sem cota nenhuma a
  explicação aparece como "sendo preparada" e as correções do Plus falham.

## Limites de infraestrutura
- **Vercel (plano gratuito): 100 deploys por dia.** Em 25/11 o limite foi atingido e dois PRs ficaram sem
  deploy até o dia seguinte. Desde #73 as branches `fix/*`, `perf/*`, `feat/*`, `docs/*` e `calib/*` não geram
  preview. Antes de um lançamento com divulgação, evitar muitos merges de web no mesmo dia.
