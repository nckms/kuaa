import { Link } from 'react-router-dom'
import { LEGAL, LegalPage } from './LegalPage'

export default function TermsPage() {
  return <LegalPage title="Termos de Uso">
    <p>Estes termos valem para quem usa o Kuaa (site, app instalado e serviços ligados a ele). Ao criar uma conta você declara que leu e concorda com eles e com a <Link to="/privacidade">Política de Privacidade</Link>. Responsável: {LEGAL.responsible}.</p>

    <h2>1. O que é o Kuaa</h2>
    <p>Plataforma de estudo para o ENEM e vestibulares: diagnóstico, trilha de tópicos, questões com explicação, simulados, correção de redação e o assistente Sabiá. Parte do conteúdo (questões de prática, respostas do Sabiá e comentários de redação) é <strong>gerada por inteligência artificial</strong> e pode conter erros; confira com seu professor ou material de referência quando algo parecer estranho. O Kuaa é uma ferramenta de apoio: não garante aprovação, nota ou vaga.</p>

    <h2>2. Conta</h2>
    <ul>
      <li>Você precisa ter pelo menos 13 anos. Se tiver menos de 18, use o Kuaa com conhecimento do seu pai, mãe ou responsável legal.</li>
      <li>Os dados do cadastro devem ser verdadeiros. A conta é pessoal; não compartilhe sua senha.</li>
      <li>Você pode excluir sua conta quando quiser, em Configurações.</li>
    </ul>

    <h2>3. Plano gratuito e Kuaa Plus</h2>
    <ul>
      <li>O plano gratuito tem limites diários e mensais de uso, mostrados em <Link to="/planos">Planos</Link>.</li>
      <li>O Kuaa Plus é uma <strong>assinatura mensal com renovação automática</strong>, cobrada por Pix Automático (ou outro meio exibido no pagamento), processada pela Stripe. O valor e o que está incluído aparecem na página de Planos antes da compra.</li>
      <li>A contratação por menor de 18 anos exige que o pagamento seja feito ou autorizado pelo responsável legal; por isso o checkout pede essa confirmação.</li>
      <li><strong>Cancelamento:</strong> a qualquer momento em Planos → "Gerenciar ou cancelar". O acesso continua até o fim do período já pago e não há nova cobrança.</li>
      <li><strong>Arrependimento:</strong> você pode desistir em até 7 dias da primeira contratação (art. 49 do Código de Defesa do Consumidor) e recebe o valor de volta.</li>
      <li>Se uma cobrança falhar, o acesso Plus continua por alguns dias enquanto o pagamento é refeito; depois a conta volta ao plano gratuito, sem perder o histórico.</li>
      <li>Mudanças de preço valem só para os períodos seguintes e são avisadas com antecedência.</li>
    </ul>

    <h2>4. Meia para estudantes</h2>
    <p>Estudantes podem pedir o preço de meia enviando um comprovante de matrícula atual (carteirinha estudantil ou declaração da escola). O documento é analisado por uma pessoa e <strong>apagado assim que a análise termina</strong> (ou em até 30 dias, se não for analisado). A aprovação vale por 12 meses. Documento falso leva ao cancelamento do desconto.</p>

    <h2>5. Uso adequado</h2>
    <ul>
      <li>Não tente burlar limites, acessar dados de outras pessoas, sobrecarregar o serviço ou copiar o acervo em massa.</li>
      <li>Não envie ao Sabiá ou à redação conteúdo ilegal, ofensivo ou dados pessoais de terceiros.</li>
      <li>Contas que violem estes termos podem ser suspensas.</li>
    </ul>

    <h2>6. Conteúdo</h2>
    <p>Questões e textos do Kuaa são para seu estudo pessoal. Questões de provas oficiais pertencem às respectivas bancas e aparecem com a fonte. As redações que você escreve continuam suas.</p>

    <h2>7. Disponibilidade e responsabilidade</h2>
    <p>Trabalhamos para o Kuaa ficar no ar, mas pode haver instabilidade ou manutenção. Na medida permitida pela lei, não respondemos por decisões de estudo tomadas só com base no conteúdo gerado por IA.</p>

    <h2>8. Mudanças e contato</h2>
    <p>Podemos atualizar estes termos; mudanças relevantes serão avisadas no app ou por e-mail. Dúvidas: {LEGAL.contact}. Vale a lei brasileira.</p>
  </LegalPage>
}
