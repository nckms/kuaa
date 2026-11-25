import { Link } from 'react-router-dom'
import { LEGAL, LegalPage } from './LegalPage'

export default function PrivacyPage() {
  return <LegalPage title="Política de Privacidade">
    <p>Esta política explica quais dados o Kuaa trata, para quê e quais são os seus direitos pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Controlador: {LEGAL.responsible}.</p>

    <h2>Quais dados e para quê</h2>
    <table>
      <thead><tr><th>Dado</th><th>Para quê</th><th>Base legal</th></tr></thead>
      <tbody>
        <tr><td>Nome, e-mail e senha (guardada só como hash). Escola, cidade e estado, se você informar.</td><td>Criar e proteger sua conta.</td><td>Execução do contrato</td></tr>
        <tr><td>Respostas, diagnóstico, progresso, simulados, redações e conversas com o Sabiá.</td><td>Montar sua trilha, medir evolução e dar feedback.</td><td>Execução do contrato</td></tr>
        <tr><td>Dados de pagamento (via Stripe). O Kuaa não vê nem guarda número de cartão ou dados bancários.</td><td>Cobrar e gerenciar a assinatura.</td><td>Execução do contrato e obrigação legal</td></tr>
        <tr><td>Comprovante de estudante.</td><td>Conceder a meia.</td><td>Consentimento (pedido no envio)</td></tr>
        <tr><td>Origem do cadastro (link de divulgação, campanha ou site que trouxe você) e métricas de uso agregadas.</td><td>Entender quais canais funcionam e melhorar o produto.</td><td>Legítimo interesse</td></tr>
        <tr><td>E-mail semanal com o próximo tópico.</td><td>Lembrar você de estudar.</td><td>Legítimo interesse (dá para desligar a qualquer momento)</td></tr>
      </tbody>
    </table>

    <h2>Crianças e adolescentes</h2>
    <p>O Kuaa é para pessoas a partir de 13 anos. Tratamos os dados de adolescentes no melhor interesse deles (art. 14 da LGPD): coletamos só o necessário para o estudo, não vendemos dados, não usamos publicidade comportamental e o ranking mostra apenas posições anônimas.</p>

    <h2>Com quem compartilhamos</h2>
    <ul>
      <li><strong>Google (Gemini)</strong>: o texto das perguntas ao Sabiá, das redações e o contexto do tópico são enviados para gerar respostas, questões e comentários. Não enviamos seu nome nem e-mail.</li>
      <li><strong>Stripe</strong>: processamento das assinaturas.</li>
      <li><strong>Vercel e Railway</strong>: hospedagem do site, da API e do banco de dados (servidores podem ficar fora do Brasil, com as garantias do art. 33 da LGPD).</li>
      <li>Serviço de envio de e-mail, quando ativo.</li>
      <li>Autoridades, só quando a lei exigir.</li>
    </ul>

    <h2>Por quanto tempo</h2>
    <ul>
      <li>Dados da conta e do estudo: enquanto a conta existir. Ao excluir a conta, apagamos esses dados; registros de pagamento podem ser mantidos pelo prazo exigido pela legislação fiscal.</li>
      <li>Comprovante de estudante: apagado ao fim da análise, ou em até 30 dias sem análise.</li>
    </ul>

    <h2>Cookies e armazenamento no navegador</h2>
    <p>Usamos um cookie essencial para manter você conectado (<code>kuaa_session</code>, protegido e inacessível a scripts) e o armazenamento local do navegador para preferências, a origem do cadastro por 30 dias e o funcionamento do app instalado. Não usamos cookies de publicidade.</p>

    <h2>Seus direitos</h2>
    <p>Você pode pedir acesso, correção, portabilidade, exclusão e informações sobre o uso dos seus dados, e revogar consentimentos. Em <Link to="/configuracoes">Configurações</Link> você baixa uma cópia dos seus dados e exclui a conta sozinho. Para outros pedidos: {LEGAL.contact}. Você também pode reclamar à ANPD.</p>

    <h2>Segurança</h2>
    <p>Senhas com hash, conexão criptografada, sessão em cookie HttpOnly e acesso restrito aos dados. Nenhum sistema é infalível; se houver um incidente relevante, avisaremos você e a ANPD.</p>
  </LegalPage>
}
