export interface EssayTheme {
  id: string
  title: string
  textType: string
  prompt: string
  planningQuestions: string[]
}

export const essayThemes: Record<string, EssayTheme[]> = {
  enem: [
    {
      id: 'enem-acesso-leitura', title: 'Acesso à leitura em comunidades rurais', textType: 'Texto dissertativo-argumentativo',
      prompt: 'Escreva um texto dissertativo-argumentativo sobre os obstáculos ao acesso continuado à leitura em comunidades rurais brasileiras. Apresente uma tese, desenvolva argumentos e proponha uma intervenção que respeite os direitos humanos.',
      planningQuestions: ['Quais obstáculos dificultam o acesso a livros e espaços de leitura?', 'Como esses obstáculos afetam grupos diferentes?', 'Quem poderia agir, de que forma e com qual finalidade?'],
    },
    {
      id: 'enem-servicos-digitais', title: 'Acesso a serviços públicos digitais', textType: 'Texto dissertativo-argumentativo',
      prompt: 'Escreva um texto dissertativo-argumentativo sobre os desafios para garantir acesso equitativo aos serviços públicos digitais no Brasil. Defenda uma posição com argumentos e proponha uma intervenção que respeite os direitos humanos.',
      planningQuestions: ['Que barreiras de conexão ou letramento digital existem?', 'Quem é mais afetado?', 'Como ampliar o acesso sem eliminar o atendimento presencial necessário?'],
    },
  ],
  fuvest: [
    {
      id: 'fuvest-tempo-atencao', title: 'O valor da atenção em um cotidiano conectado', textType: 'Dissertação',
      prompt: 'Escreva uma dissertação sobre como a atenção é disputada no cotidiano conectado e quais efeitos isso tem na vida coletiva. Delimite uma tese e desenvolva argumentos próprios.',
      planningQuestions: ['O que significa prestar atenção nesse contexto?', 'Quais interesses disputam a atenção?', 'Há benefícios e perdas que precisam ser ponderados?'],
    },
  ],
  unicamp: [
    {
      id: 'unicamp-carta-biblioteca', title: 'Uma biblioteca para o bairro', textType: 'Carta aberta',
      prompt: 'Escreva uma carta aberta aos moradores do seu bairro defendendo uma proposta concreta de ampliação do acesso à biblioteca comunitária. Considere o destinatário, a finalidade e argumentos ligados às necessidades locais.',
      planningQuestions: ['A quem a carta se dirige?', 'Que mudança concreta você propõe?', 'Que razões podem mobilizar os moradores?'],
    },
  ],
}

export function getEssayTheme(vestibularSlug: string, themeId: string) {
  return essayThemes[vestibularSlug]?.find((theme) => theme.id === themeId) ?? null
}
