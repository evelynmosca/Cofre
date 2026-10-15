export type Chapter = {
  id: number
  title: string
  location: string
  artifact: string
  symbol: string
  description: string
  clue: string
  question: string
  answer: string
  options: string[]
  discoveries: { title: string; text: string; symbol: string }[]
  puzzle: string
}

export const chapters: Chapter[] = [
  {
    id: 0,
    title: 'Portal das Sombras',
    location: 'French Quarter · o último lampião',
    artifact: 'Carta do Destino',
    symbol: '✦',
    description:
      'O jazz se apaga ao dobrar a esquina. Sob a luz verde de um lampião, uma porta aparece onde antes havia um muro. Do outro lado, uma voz de veludo convida você a entrar: “Um desejo tão grande merece uma pequena conversa…”',
    clue: 'Antes de aceitar uma promessa, descubra o preço que ela esconde.',
    question: 'O que acompanha toda promessa feita pelas sombras?',
    answer: 'Um preço',
    options: [
      'Uma recompensa garantida',
      'Um preço',
      'Um destino sem escolhas',
      'Uma sorte infinita',
    ],
    discoveries: [
      {
        title: 'O anúncio dourado',
        symbol: '✦',
        text: '“Tudo o que você quiser”, promete o letreiro. Nas letras pequenas, você encontra: “Toda promessa tem um preço”. A tinta ainda está molhada.',
      },
      {
        title: 'O baralho do viajante',
        symbol: '♠',
        text: 'Doze cartas guardam seis pares: espadas, olho, lua, estrela, cristal e laço. A mesma marca sempre tem uma companheira. Observe e memorize antes de virar a próxima.',
      },
      {
        title: 'A sombra no muro',
        symbol: '☾',
        text: 'O homem sorri, mas sua sombra estende a mão para cobrar. Uma inscrição deixa o aviso: “Encontrar um par exige memória. Aceitar uma promessa exige atenção”.',
      },
    ],
    puzzle: 'As cartas do destino',
  },
  {
    id: 1,
    title: 'Sala das Cartas',
    location: 'A botica · atrás da cortina de veludo',
    artifact: 'Fragmento do Pergaminho',
    symbol: '⌁',
    description:
      'Uma cortina vinho se fecha atrás de você. Cartas deslizam sozinhas pela mesa e uma pena escreve sem mão alguma. O anfitrião oferece um atalho; o contrato parece curto demais para uma promessa tão grande.',
    clue: 'Desejo, promessa, preço, consequência: leia o acordo até a última linha.',
    question: 'O que precisa ser compreendido antes de aceitar um acordo?',
    answer: 'A consequência',
    options: [
      'A cor da assinatura',
      'A pressa de quem oferece',
      'A consequência',
      'A sorte do próximo jogador',
    ],
    discoveries: [
      {
        title: 'A primeira carta',
        symbol: '♡',
        text: 'O texto começa com um DESEJO: aquilo que alguém quer. Em seguida vem a PROMESSA: o que o anfitrião diz que entregará. Uma coisa nasce da outra.',
      },
      {
        title: 'As letras pequenas',
        symbol: '⌁',
        text: 'Depois da promessa aparece o PREÇO: o que será entregue em troca. Só então se revela a CONSEQUÊNCIA: o efeito que permanece depois da escolha.',
      },
      {
        title: 'A assinatura interrompida',
        symbol: '✎',
        text: 'Um viajante riscou a própria assinatura e anotou: “Leia até o fim. DESEJO → PROMESSA → PREÇO → CONSEQUÊNCIA. Nenhum brilho compensa uma consequência que você não compreendeu”.',
      },
    ],
    puzzle: 'O acordo nas entrelinhas',
  },
  {
    id: 2,
    title: 'Biblioteca do Outro Lado',
    location: 'A cabana · sobre as águas imóveis',
    artifact: 'Livro das Sombras',
    symbol: '◐',
    description:
      'A passarela termina em uma cabana maior por dentro do que por fora. Livros respiram nas estantes. Entre as páginas, nomes e dívidas cruzam gerações. Um único volume pode explicar o que os credores do outro lado vieram buscar.',
    clue: 'Os credores exigem aquilo que lhes pertence. Procure o livro sem nome, com três marcas e o olho dos espíritos.',
    question: 'O que os espíritos exigem de quem contrai uma dívida?',
    answer: 'Aquilo que lhes pertence',
    options: [
      'Qualquer lembrança feliz',
      'Aquilo que lhes pertence',
      'Um desejo de outra pessoa',
      'Uma nova promessa vazia',
    ],
    discoveries: [
      {
        title: 'O registro das dívidas',
        symbol: '⌁',
        text: 'O registro é preciso: os espíritos retornam por aquilo que lhes pertence, conforme o acordo. Esquecer uma cláusula não apaga o que foi prometido.',
      },
      {
        title: 'O catálogo queimado',
        symbol: '≡',
        text: 'Há um espaço sem título no catálogo. Ao lado dele, três riscos verticais foram gravados na madeira. O volume procurado não tem nome e carrega exatamente três marcas.',
      },
      {
        title: 'O selo que observa',
        symbol: '◉',
        text: 'Na cera da estante, um olho dentro de um círculo identifica os espíritos: ◉. Combine as três pistas: sem nome, três marcas, selo do olho. Apenas um livro reúne todas elas.',
      },
    ],
    puzzle: 'O volume sem nome',
  },
  {
    id: 3,
    title: 'Galeria dos Espelhos',
    location: 'A mansão · o salão esquecido',
    artifact: 'Cristal da Verdade',
    symbol: '◇',
    description:
      'Na mansão abandonada, os espelhos ainda recebem convidados. Um mostra riqueza, outro oferece fama, outro promete que nada será perdido. Mas seus reflexos se movem antes de você. A saída pertence a quem consegue observar além do encanto.',
    clue: 'O reflexo mais perigoso mostra apenas o que você deseja. Compare os detalhes com a referência.',
    question: 'Qual reflexo é mais perigoso?',
    answer: 'O que mostra só o que desejamos',
    options: [
      'O que revela uma dúvida',
      'O que acompanha nossos movimentos',
      'O que mostra só o que desejamos',
      'O que permite ver os detalhes',
    ],
    discoveries: [
      {
        title: 'O espelho da fortuna',
        symbol: '◇',
        text: 'O ouro reluz, mas as pessoas desaparecem do reflexo. Um desejo pode esconder tudo o que você não quer enxergar. A imagem mais sedutora também pode ser a menos verdadeira.',
      },
      {
        title: 'A marca na moldura',
        symbol: '♟',
        text: 'O viajante deixou uma referência de sua silhueta. Observe três detalhes: cartola alta ou baixa, bengala à esquerda ou à direita da imagem e braço livre aberto ou abaixado. A figura verdadeira combina todos eles.',
      },
      {
        title: 'O vidro rachado',
        symbol: '✧',
        text: 'As imagens falsas mudam pequenos detalhes para distrair você. Compare cada silhueta diretamente com a referência, sem inverter os lados. Quando as três características coincidirem, você terá encontrado a figura correspondente.',
      },
    ],
    puzzle: 'O reflexo verdadeiro',
  },
  {
    id: 4,
    title: 'Câmara dos Espíritos',
    location: 'O bayou profundo · entre as raízes',
    artifact: 'Máscara dos Espíritos',
    symbol: '◉',
    description:
      'Vaga-lumes desaparecem quando as máscaras despertam. As vozes não querem saber o tamanho do seu desejo. Querem saber se você entende de onde ele vem, o que está disposto a escolher e quem arcará com os efeitos da sua decisão.',
    clue: 'O verdadeiro poder está em compreender o desejo e assumir as próprias escolhas.',
    question: 'Onde está o verdadeiro poder?',
    answer: 'Em compreender o desejo',
    options: [
      'Em controlar o desejo dos outros',
      'Em aceitar qualquer atalho',
      'Em nunca mudar de ideia',
      'Em compreender o desejo',
    ],
    discoveries: [
      {
        title: 'A máscara do desejo',
        symbol: '♡',
        text: 'DESEJO é o que move alguém: uma vontade, uma ambição ou um medo. ESCOLHA é a decisão tomada diante disso. Compreender o desejo ajuda a escolher com liberdade.',
      },
      {
        title: 'A máscara da cobrança',
        symbol: '⌁',
        text: 'PREÇO é o que se entrega em troca de algo: dinheiro, tempo ou outro recurso. CONSEQUÊNCIA é o efeito que a decisão deixa no mundo. O que é pago e o que acontece depois podem ser coisas diferentes.',
      },
      {
        title: 'A máscara do julgamento',
        symbol: '◉',
        text: 'As máscaras apresentarão situações. Descubra se cada uma descreve um DESEJO, uma ESCOLHA, um PREÇO ou uma CONSEQUÊNCIA. Leia o centro de cada situação, sem se deixar levar pelo brilho da oferta.',
      },
    ],
    puzzle: 'O julgamento das máscaras',
  },
  {
    id: 5,
    title: 'Árvore das Sombras',
    location: 'O coração do pântano · onde a noite escuta',
    artifact: 'Chave das Sombras',
    symbol: '⚿',
    description:
      'As águas se abrem diante de um cipreste ancestral. Cinco raízes abraçam um cofre que não tem reflexo. Pela primeira vez, o anfitrião se cala. O caminho até aqui guardava a última pergunta: depois de compreender o preço, o que você realmente deseja?',
    clue: 'Conhecer o próprio desejo abre a passagem. Um sonho também precisa de escolhas e cuidado para crescer.',
    question: 'O que permite atravessar as sombras sem se perder?',
    answer: 'Conhecer o próprio desejo',
    options: [
      'Esquecer todas as consequências',
      'Confiar em qualquer promessa',
      'Conhecer o próprio desejo',
      'Entregar a escolha a outra pessoa',
    ],
    discoveries: [
      {
        title: 'As cinco raízes',
        symbol: '⌁',
        text: 'Cada raiz guarda um encontro da jornada: Portal, Sala das Cartas, Biblioteca, Galeria e Câmara. Seus artefatos serão usados nessa mesma ordem para despertar a árvore.',
      },
      {
        title: 'A memória do caminho',
        symbol: '✦',
        text: 'Recorde as cinco verdades: toda promessa tem um preço; compreenda a consequência; as dívidas cobram o que foi prometido; desconfie do reflexo que só agrada; compreenda o desejo que move você.',
      },
      {
        title: 'A fechadura viva',
        symbol: '⚿',
        text: 'A última chave não é um atalho. Você precisará reconhecer o próprio desejo e pensar em como realizá-lo com cuidado. O cofre se abre para quem assume a própria história.',
      },
    ],
    puzzle: 'As memórias do caminho',
  },
]
