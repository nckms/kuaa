# Kuaa como app: web instalável hoje, lojas depois

## O que já existe (sem custo)

O site é um PWA: no Android/Chrome aparece "Instalar o app" (painel, rodapé da
landing e Configurações); no iPhone o cartão ensina "Compartilhar → Adicionar à
Tela de Início". Abre em tela cheia, com ícone da coruja, atalhos (Praticar,
Sabiá) e tela própria quando está sem internet. Atualiza sozinho a cada deploy
na Vercel — nenhuma loja precisa aprovar versão nova.

Para divulgar: "Baixe o Kuaa" pode apontar para `https://kuaa-web.vercel.app/?utm_source=app_link`.

## Android na Google Play (recomendado como próximo passo)

Caminho: **TWA (Trusted Web Activity)** com o Bubblewrap, que empacota o próprio
PWA num app Android. Sem código nativo para manter; o conteúdo continua vindo
do site.

O que depende do Nicolas:
1. Conta de desenvolvedor Google Play — **US$ 25, pagamento único**.
   Conta pessoal nova exige teste fechado com **12 testadores por 14 dias**
   antes de publicar em produção (regra atual do Google para contas pessoais;
   conta de empresa com CNPJ não tem essa exigência).
2. Política de privacidade publicada (rascunho em `/privacidade`, revisar com advogado).
3. Formulário de segurança de dados e de público-alvo (o Kuaa atende menores:
   declarar faixa etária 13+ e não usar anúncios).

O que eu faço quando a conta existir:
1. `npx @bubblewrap/cli init --manifest https://kuaa-web.vercel.app/manifest.webmanifest`
   (pacote `br.app.kuaa` ou o que for escolhido).
2. Gerar o `.aab` assinado.
3. Publicar `/.well-known/assetlinks.json` no site com a impressão SHA-256 da
   chave de assinatura do Play (aparece no Play Console → Integridade do app).
   Sem esse arquivo o app abre com barra de navegador.
4. Subir no teste fechado e depois em produção.

Pagamentos dentro do app Android: a assinatura do Kuaa Plus é de serviço
digital. Pela política do Google Play, vender isso dentro do app exige o
faturamento do Play (taxa de 15% em assinaturas). Opções:
- Versão da loja **sem botão de compra**, só login (o aluno assina pelo site com Pix) —
  mais simples; precisa conferir a política vigente antes de publicar.
- Ou integrar Google Play Billing (trabalho grande, sem Pix Automático).

## iPhone na App Store (depois)

- Conta Apple Developer: **US$ 99 por ano**, e build precisa de um Mac (ou serviço de build na nuvem).
- A Apple recusa app que é só um site embrulhado (diretriz 4.2). Só vale a pena
  com recurso nativo de verdade — por exemplo **notificações de lembrete de estudo**,
  que também ajudam a retenção. Caminho: Capacitor + plugin de notificações.
- Mesma questão de pagamento: assinatura digital dentro do app iOS usa a compra
  da Apple; o modelo "leitor" (sem compra no app) tem regras próprias.
- Enquanto isso, o PWA no iPhone já funciona pela tela de início.

## Ordem sugerida

1. Agora: divulgar o PWA (custo zero) e medir quantos instalam.
2. Com tração (ex.: 100 alunos ativos/semana): Google Play via TWA.
3. Com receita: iOS com notificações.
