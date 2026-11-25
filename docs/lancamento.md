# Lançamento da assinatura — checklist

Estado em 25/11/2026: código em produção; venda **desligada** (sem chaves Stripe no Railway).

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
- [ ] Domínio próprio + SMTP/Resend (recuperação de senha e e-mail semanal).
- [ ] Termos de uso e política de privacidade revisados (menores de idade, LGPD, documento de estudante, assinatura e cancelamento).
- [ ] `npm run metrics` como linha de base.
