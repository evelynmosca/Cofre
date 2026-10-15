import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { chapters } from './content'
import './puzzles.css'

type PuzzleProps = { onComplete: () => void }
type Feedback = { text: string; kind: 'neutral' | 'error' | 'success' }

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  return (
    <div
      className={`px-feedback px-feedback-${feedback.kind}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span aria-hidden="true">
        {feedback.kind === 'success' ? '✦' : feedback.kind === 'error' ? '↻' : '◇'}
      </span>
      <p>{feedback.text}</p>
    </div>
  )
}

function Complete({
  children = 'A verdade foi revelada. O artefato é seu.',
  onComplete,
}: PuzzleProps & { children?: ReactNode }) {
  return (
    <div className="px-complete">
      <p>
        <span aria-hidden="true">✧</span> {children}
      </p>
      <button className="button" onClick={onComplete}>
        Recolher artefato <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

export function Puzzles({ chapter, onComplete }: { chapter: number; onComplete: () => void }) {
  switch (chapter) {
    case 0:
      return <Memory onComplete={onComplete} />
    case 1:
      return <Agreements onComplete={onComplete} />
    case 2:
      return <Library onComplete={onComplete} />
    case 3:
      return <Mirrors onComplete={onComplete} />
    case 4:
      return <Judgment onComplete={onComplete} />
    default:
      return <Review onComplete={onComplete} />
  }
}

const memorySigns = [
  { symbol: '☾', label: 'Lua' },
  { symbol: '✦', label: 'Estrela' },
  { symbol: '♠', label: 'Espadas' },
  { symbol: '◇', label: 'Cristal' },
  { symbol: '◉', label: 'Olho' },
  { symbol: '⌁', label: 'Laço' },
]

function Memory({ onComplete }: PuzzleProps) {
  const [deck] = useState(() =>
    shuffle(
      memorySigns.flatMap((sign, pair) => [
        { ...sign, pair },
        { ...sign, pair },
      ]),
    ),
  )
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'Vire duas cartas por vez e reúna os seis pares de símbolos.',
    kind: 'neutral',
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const finished = matched.length === 12

  function flip(index: number) {
    if (finished || open.length === 2 || open.includes(index) || matched.includes(index)) return
    const next = [...open, index]
    setOpen(next)
    if (next.length !== 2) return
    setMoves((value) => value + 1)
    const same = deck[next[0]].pair === deck[next[1]].pair
    setFeedback({
      kind: same ? 'success' : 'neutral',
      text: same
        ? `Par de ${deck[index].label.toLowerCase()} encontrado. Guarde esse símbolo.`
        : 'Os símbolos são diferentes. Memorize suas posições e tente novamente.',
    })
    timer.current = setTimeout(
      () => {
        if (same) setMatched((value) => [...value, ...next])
        setOpen([])
        timer.current = null
      },
      same ? 400 : 1050,
    )
  }

  return (
    <div className="puzzle-content px-memory">
      <p className="eyebrow">Desafio I · As cartas do destino</p>
      <h2>O que as cartas escondem?</h2>
      <p className="px-intro">
        Seis sinais, doze cartas. Encontre cada par para revelar a primeira peça do cofre.
      </p>
      <div className="px-progress">
        <span>
          <b>{matched.length / 2}</b> / 6 pares
        </span>
        <span>
          {moves} {moves === 1 ? 'tentativa' : 'tentativas'}
        </span>
        <div className="px-progress-track">
          <i style={{ width: `${(matched.length / 12) * 100}%` }} />
        </div>
      </div>
      <div className="px-memory-grid" aria-label="Mesa com doze cartas de memória">
        {deck.map((card, index) => {
          const revealed = open.includes(index) || matched.includes(index)
          const found = matched.includes(index)
          return (
            <button
              key={index}
              className={`px-memory-card ${revealed ? 'px-face-up' : ''} ${found ? 'px-matched' : ''}`}
              onClick={() => flip(index)}
              disabled={finished || found || (open.length === 2 && !open.includes(index))}
              aria-label={`Carta ${index + 1}: ${revealed ? card.label + (found ? ', par encontrado' : '') : 'fechada'}`}
              aria-pressed={revealed}
            >
              <span className="px-card-inner">
                <span className="px-card-back" aria-hidden="true">
                  <i>✧</i>
                  <small>O OUTRO LADO</small>
                </span>
                <span className="px-card-front" aria-hidden="true">
                  <i>{card.symbol}</i>
                  <small>{card.label}</small>
                  {found && <b>✓</b>}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {!finished && <FeedbackLine feedback={feedback} />}
      {finished && (
        <Complete onComplete={onComplete}>
          Seis pares reunidos em {moves} tentativas. As cartas reconhecem você.
        </Complete>
      )}
    </div>
  )
}

const agreementRounds = [
  {
    title: 'Um restaurante antes da meia-noite',
    story:
      'Uma jovem sonha em abrir seu restaurante. Um estranho oferece um salão pronto, mas pede todas as economias da família. Se ela aceitar, seus parentes ficarão sem reserva para emergências.',
    steps: [
      'Ela deseja abrir o próprio restaurante.',
      'O estranho promete um salão pronto nesta noite.',
      'Ela precisa entregar todas as economias da família.',
      'A família fica sem reserva para uma emergência.',
    ],
  },
  {
    title: 'Aplausos emprestados',
    story:
      'Um músico quer ser reconhecido. Uma máscara mágica promete fama imediata, desde que ele finja ser outra pessoa. Depois de descobrir a mentira, seus amigos deixam de confiar nele.',
    steps: [
      'O músico deseja ter seu talento reconhecido.',
      'A máscara promete fama e aplausos imediatos.',
      'Ele terá que abandonar sua identidade e mentir.',
      'Seus amigos descobrem a mentira e perdem a confiança.',
    ],
  },
  {
    title: 'A travessia do pântano',
    story:
      'Um viajante quer voltar para casa. O barqueiro promete levá-lo em segurança, cobrando o medalhão de sua avó. Ao chegar, ele percebe que perdeu a última lembrança que tinha dela.',
    steps: [
      'O viajante deseja voltar para casa.',
      'O barqueiro promete uma travessia segura.',
      'O viajante deve entregar o medalhão da avó.',
      'Ele fica sem a última lembrança de sua avó.',
    ],
  },
]

function Agreements({ onComplete }: PuzzleProps) {
  const [round, setRound] = useState(0)
  const [selection, setSelection] = useState<number[]>([])
  const [validated, setValidated] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'Selecione as quatro cartas na ordem em que o acordo acontece.',
    kind: 'neutral',
  })
  const data = agreementRounds[round]
  const order = [
    [2, 0, 3, 1],
    [1, 3, 0, 2],
    [3, 1, 2, 0],
  ][round]
  const labels = ['Desejo', 'Promessa', 'Preço', 'Consequência']
  function change(next: number[]) {
    setSelection(next)
    setFeedback({
      text: 'Você pode tocar em uma posição para retirar a carta e ajustar a ordem.',
      kind: 'neutral',
    })
  }
  function validate() {
    const correct = selection.filter((value, index) => value === index).length
    const success = correct === 4
    setValidated(success)
    setFeedback({
      kind: success ? 'success' : 'error',
      text: success
        ? 'Acordo decifrado. Você identificou o desejo, a oferta, o preço e o que vem depois.'
        : `${correct} de 4 posições estão corretas. Desejo é o que se quer; promessa é a oferta; preço é o que se entrega; consequência é o que acontece depois.`,
    })
  }
  return (
    <div className="puzzle-content px-agreements">
      <p className="eyebrow">Desafio II · A anatomia de um acordo</p>
      <div className="px-rounds" aria-label={`Acordo ${round + 1} de 3`}>
        {[0, 1, 2].map((i) => (
          <span className={i <= round ? 'px-active' : ''} key={i}>
            {i + 1}
          </span>
        ))}
      </div>
      <h2>{data.title}</h2>
      <p className="px-story">{data.story}</p>
      <ol className="px-order-slots" aria-label="Ordem do acordo">
        {labels.map((label, index) => (
          <li key={label}>
            <span>
              {String(index + 1).padStart(2, '0')} · {label}
            </span>
            <button
              disabled={validated || selection[index] === undefined}
              onClick={() => change(selection.filter((_, i) => i !== index))}
              aria-label={
                selection[index] === undefined
                  ? `${label}: posição vazia`
                  : `Retirar da posição ${label}: ${data.steps[selection[index]]}`
              }
              className={selection[index] !== undefined ? 'px-filled' : ''}
            >
              {selection[index] !== undefined
                ? data.steps[selection[index]]
                : 'Selecione uma carta'}
            </button>
          </li>
        ))}
      </ol>
      <div className="px-choice-grid">
        {order.map((index) => (
          <button
            className="px-paper-card"
            key={index}
            disabled={validated || selection.includes(index)}
            onClick={() => change([...selection, index])}
          >
            <span aria-hidden="true">◇</span>
            {data.steps[index]}
          </button>
        ))}
      </div>
      {!validated && (
        <div className="px-actions">
          <button className="button" disabled={selection.length !== 4} onClick={validate}>
            Revelar o acordo
          </button>
          <button
            className="button-secondary"
            disabled={!selection.length}
            onClick={() => change([])}
          >
            Limpar ordem
          </button>
        </div>
      )}
      <FeedbackLine feedback={feedback} />
      {validated &&
        (round < 2 ? (
          <button
            className="button"
            onClick={() => {
              setRound((value) => value + 1)
              setSelection([])
              setValidated(false)
              setFeedback({
                text: 'Um novo acordo chegou à mesa. Leia a situação antes de escolher.',
                kind: 'neutral',
              })
            }}
          >
            Examinar o próximo acordo →
          </button>
        ) : (
          <Complete onComplete={onComplete}>
            Três promessas, três preços. Agora você sabe ler as entrelinhas.
          </Complete>
        ))}
    </div>
  )
}

type Book = { title: string; marks: number; symbol: string; color: string }
const books: Book[] = [
  { title: 'Marés', marks: 3, symbol: '☾', color: 'sea' },
  { title: '', marks: 2, symbol: '◉', color: 'wine' },
  { title: 'Raízes', marks: 3, symbol: '◉', color: 'moss' },
  { title: '', marks: 3, symbol: '◇', color: 'umber' },
  { title: 'Ecos', marks: 1, symbol: '✦', color: 'wine' },
  { title: 'Cinzas', marks: 2, symbol: '☾', color: 'sea' },
  { title: '', marks: 4, symbol: '◉', color: 'umber' },
  { title: '', marks: 3, symbol: '◉', color: 'moss' },
  { title: 'Noite', marks: 3, symbol: '✦', color: 'sea' },
  { title: '', marks: 1, symbol: '◇', color: 'wine' },
  { title: 'Destinos', marks: 4, symbol: '◉', color: 'umber' },
  { title: '', marks: 2, symbol: '☾', color: 'moss' },
]

function Library({ onComplete }: PuzzleProps) {
  const [choice, setChoice] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'Procure um único volume que corresponda às três pistas ao mesmo tempo.',
    kind: 'neutral',
  })
  const finished = choice === 7
  function inspect(index: number) {
    if (finished) return
    const book = books[index]
    setChoice(index)
    setFeedback(
      index === 7
        ? {
            kind: 'success',
            text: 'Sem título, três marcas e o olho dos espíritos. Você encontrou o Livro das Sombras.',
          }
        : {
            kind: 'error',
            text: book.title
              ? `Este volume tem o título “${book.title}”. O livro procurado não tem palavras na capa.`
              : book.marks !== 3
                ? `Este volume tem ${book.marks} marcas na lombada. O livro procurado tem exatamente três.`
                : 'O símbolo deste volume é um cristal. Procure o olho circular dos espíritos.',
          },
    )
  }
  return (
    <div className="puzzle-content px-library">
      <p className="eyebrow">Desafio III · A biblioteca do outro lado</p>
      <h2>Um livro que não diz seu nome</h2>
      <p className="px-intro">
        A anotação do bibliotecário descreve a capa. Observe os doze volumes e encontre a combinação
        exata.
      </p>
      <div className="px-clue-strip">
        <span>
          <i aria-hidden="true">—</i> Sem título na capa
        </span>
        <span>
          <i aria-hidden="true">Ⅲ</i> Três marcas na lombada
        </span>
        <span>
          <i aria-hidden="true">◉</i> O olho dos espíritos
        </span>
      </div>
      <div className="px-bookshelf" aria-label="Estante com doze volumes">
        {books.map((book, index) => (
          <button
            key={index}
            className={`px-book px-book-${book.color} ${choice === index ? (finished ? 'px-book-correct' : 'px-book-wrong') : ''}`}
            disabled={finished}
            onClick={() => inspect(index)}
            aria-label={`Volume ${index + 1}, ${book.title ? `título ${book.title}` : 'sem título'}, ${book.marks} marcas na lombada, símbolo ${book.symbol === '◉' ? 'olho dos espíritos' : book.symbol === '☾' ? 'lua' : book.symbol === '◇' ? 'cristal' : 'estrela'}`}
          >
            <span className="px-book-cover" aria-hidden="true">
              <span className="px-book-spine">
                {Array.from({ length: book.marks }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <span className="px-book-title">{book.title || <i> </i>}</span>
              <span className="px-book-symbol">{book.symbol}</span>
              <span className="px-book-ornament">⌁</span>
            </span>
            <span className="px-book-number">Volume {String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
      <FeedbackLine feedback={feedback} />
      {finished && <Complete onComplete={onComplete} />}
    </div>
  )
}

type Silhouette = { hat: 'tall' | 'short'; cane: 'left' | 'right'; arm: 'open' | 'down' }
const silhouetteRounds: { target: Silhouette; choices: Silhouette[] }[] = [
  {
    target: { hat: 'tall', cane: 'right', arm: 'down' },
    choices: [
      { hat: 'tall', cane: 'left', arm: 'down' },
      { hat: 'short', cane: 'right', arm: 'down' },
      { hat: 'tall', cane: 'right', arm: 'down' },
      { hat: 'tall', cane: 'right', arm: 'open' },
    ],
  },
  {
    target: { hat: 'short', cane: 'left', arm: 'open' },
    choices: [
      { hat: 'short', cane: 'left', arm: 'down' },
      { hat: 'short', cane: 'left', arm: 'open' },
      { hat: 'tall', cane: 'left', arm: 'open' },
      { hat: 'short', cane: 'right', arm: 'open' },
    ],
  },
  {
    target: { hat: 'tall', cane: 'left', arm: 'open' },
    choices: [
      { hat: 'tall', cane: 'right', arm: 'open' },
      { hat: 'short', cane: 'left', arm: 'open' },
      { hat: 'tall', cane: 'left', arm: 'down' },
      { hat: 'tall', cane: 'left', arm: 'open' },
    ],
  },
]
function describeShadow(shadow: Silhouette) {
  return `cartola ${shadow.hat === 'tall' ? 'alta' : 'baixa'}, bengala à ${shadow.cane === 'left' ? 'esquerda' : 'direita'} da imagem e braço livre ${shadow.arm === 'open' ? 'aberto' : 'abaixado'}`
}
function ShadowFigure({ shadow, reference = false }: { shadow: Silhouette; reference?: boolean }) {
  const leftCane = shadow.cane === 'left'
  const armSide = leftCane ? 1 : -1
  return (
    <svg
      viewBox="0 0 130 190"
      className="px-shadow-svg"
      role={reference ? 'img' : undefined}
      aria-label={reference ? `Referência: ${describeShadow(shadow)}` : undefined}
      aria-hidden={reference ? undefined : true}
    >
      <ellipse cx="65" cy="178" rx="44" ry="5" fill="currentColor" opacity=".15" />
      <g fill="currentColor" stroke="currentColor" strokeLinejoin="round">
        <path d="M54 111 48 170 60 172 67 126 75 172 87 170 77 109Z" strokeWidth="2" />
        <path d="M47 62 82 62 79 105 90 132 67 123 43 132 50 102Z" strokeWidth="2" />
        <path d="M51 169 41 177 61 177 61 170M75 169 75 177 96 177 85 169" strokeWidth="2" />
        <circle cx="65" cy="47" r="13" />
        <path d="M59 56H71V68H59Z" />
        <rect
          x="43"
          y={shadow.hat === 'tall' ? 10 : 24}
          width="43"
          height={shadow.hat === 'tall' ? 25 : 11}
          rx="2"
        />
        <rect x="35" y="33" width="60" height="7" rx="2" />
        <path
          d={leftCane ? 'M49 68 27 90 18 81' : 'M80 68 102 90 111 81'}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={
            shadow.arm === 'open'
              ? armSide === 1
                ? 'M81 69 103 62 119 51'
                : 'M49 69 27 62 11 51'
              : armSide === 1
                ? 'M81 69 91 90 89 111'
                : 'M49 69 39 90 41 111'
          }
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={leftCane ? 'M18 169V85Q18 73 27 78' : 'M112 169V85Q112 73 103 78'}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <path d="m58 65 7 6 7-6-7 23Z" fill={reference ? '#e8d3a3' : '#c0a276'} opacity=".6" />
    </svg>
  )
}

function Mirrors({ onComplete }: PuzzleProps) {
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'A referência está iluminada. Compare cartola, lado da bengala e posição do braço livre.',
    kind: 'neutral',
  })
  const data = silhouetteRounds[round]
  function choose(index: number) {
    if (solved) return
    const shadow = data.choices[index]
    const success =
      shadow.hat === data.target.hat &&
      shadow.cane === data.target.cane &&
      shadow.arm === data.target.arm
    setSelected(index)
    setSolved(success)
    const mismatch =
      shadow.hat !== data.target.hat
        ? 'a altura da cartola'
        : shadow.cane !== data.target.cane
          ? 'o lado da bengala'
          : 'a posição do braço livre'
    setFeedback({
      kind: success ? 'success' : 'error',
      text: success
        ? 'Reflexo verdadeiro. Os três detalhes correspondem à referência.'
        : `Há uma diferença: observe ${mismatch}. Os lados são os da imagem, sem inverter o espelho.`,
    })
  }
  return (
    <div className="puzzle-content px-mirrors">
      <p className="eyebrow">Desafio IV · Galeria dos espelhos · {round + 1}/3</p>
      <h2>Encontre a sombra verdadeira</h2>
      <p className="px-intro">
        Somente uma silhueta repete os três detalhes do viajante. Compare como as imagens aparecem,
        sem inverter os lados.
      </p>
      <div className="px-reference">
        <span className="px-mirror-label">O VIAJANTE · REFERÊNCIA</span>
        <ShadowFigure shadow={data.target} reference />
        <span className="px-reference-details">Cartola · Bengala · Braço livre</span>
      </div>
      <div className="px-shadow-options" aria-label="Quatro silhuetas para comparar">
        {data.choices.map((shadow, index) => (
          <button
            key={index}
            className={`px-shadow-choice ${selected === index ? (solved ? 'px-shadow-correct' : 'px-shadow-wrong') : ''}`}
            disabled={solved}
            onClick={() => choose(index)}
            aria-label={`Espelho ${String.fromCharCode(65 + index)}: ${describeShadow(shadow)}`}
            aria-pressed={selected === index}
          >
            <span>Espelho {String.fromCharCode(65 + index)}</span>
            <ShadowFigure shadow={shadow} />
            <small>
              {selected === index ? (solved ? 'VERDADEIRO' : 'COMPARE NOVAMENTE') : 'Comparar'}
            </small>
          </button>
        ))}
      </div>
      <FeedbackLine feedback={feedback} />
      {solved &&
        (round < 2 ? (
          <button
            className="button"
            onClick={() => {
              setRound((value) => value + 1)
              setSelected(null)
              setSolved(false)
              setFeedback({
                kind: 'neutral',
                text: 'A galeria mudou. Observe a nova referência antes de escolher.',
              })
            }}
          >
            Atravessar o próximo espelho →
          </button>
        ) : (
          <Complete onComplete={onComplete}>
            Os três espelhos foram decifrados. Você enxergou além da aparência.
          </Complete>
        ))}
    </div>
  )
}

const judgmentCases = [
  {
    text: '“Quero abrir um restaurante para realizar o sonho da minha família.”',
    answer: 'Desejo',
    reason:
      'A frase revela aquilo que a pessoa quer alcançar. Ainda não há uma decisão nem uma troca.',
  },
  {
    text: 'Antes de assinar, a viajante decide recusar um acordo que prejudicaria sua irmã.',
    answer: 'Escolha',
    reason: 'Recusar é uma decisão consciente. A personagem escolhe como agir diante da oferta.',
  },
  {
    text: 'Para receber a riqueza prometida, o homem precisa entregar dez anos da própria vida.',
    answer: 'Preço',
    reason: 'Os dez anos são o que ele deve entregar em troca da promessa.',
  },
  {
    text: 'Depois de mentir para conseguir fama, o músico perde a confiança dos amigos.',
    answer: 'Consequência',
    reason: 'A perda de confiança é o resultado que vem depois da mentira.',
  },
  {
    text: '“Meu maior sonho é voltar para casa e reencontrar as pessoas que amo.”',
    answer: 'Desejo',
    reason: 'Voltar para casa é a vontade que move a personagem.',
  },
  {
    text: 'A jovem prefere trabalhar pelo seu sonho e diz “não” ao atalho oferecido.',
    answer: 'Escolha',
    reason: 'Dizer “não” e seguir outro caminho expressa uma decisão.',
  },
  {
    text: 'O barqueiro exige o medalhão da família em troca da travessia.',
    answer: 'Preço',
    reason: 'O medalhão é a cobrança feita em troca do serviço.',
  },
  {
    text: 'Após entregar suas economias por um salão, a família fica sem reserva para emergências.',
    answer: 'Consequência',
    reason: 'Ficar sem reserva é o efeito da entrega das economias.',
  },
]
const lessonDefinitions = [
  { label: 'Desejo', description: 'O que se quer alcançar', symbol: '✦' },
  { label: 'Escolha', description: 'A decisão de como agir', symbol: '⌁' },
  { label: 'Preço', description: 'O que é entregue em troca', symbol: '◇' },
  { label: 'Consequência', description: 'O resultado que vem depois', symbol: '◉' },
]

function Judgment({ onComplete }: PuzzleProps) {
  const [index, setIndex] = useState(0)
  const [solved, setSolved] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'Use as definições das quatro máscaras para interpretar cada situação.',
    kind: 'neutral',
  })
  const data = judgmentCases[index]
  function choose(label: string) {
    if (solved) return
    setChosen(label)
    const correct = label === data.answer
    setSolved(correct)
    setFeedback({
      kind: correct ? 'success' : 'error',
      text: correct
        ? data.reason
        : `Reconsidere: ${label.toLowerCase()} significa “${lessonDefinitions.find((lesson) => lesson.label === label)!.description.toLowerCase()}”. Qual elemento a frase destaca?`,
    })
  }
  return (
    <div className="puzzle-content px-judgment">
      <p className="eyebrow">Desafio V · O julgamento dos espíritos</p>
      <h2>Qual máscara conta esta história?</h2>
      <div className="px-progress">
        <span>
          Situação <b>{index + 1}</b> de 8
        </span>
        <span>Leia, reconheça, escolha.</span>
        <div className="px-progress-track">
          <i style={{ width: `${((index + (solved ? 1 : 0)) / 8) * 100}%` }} />
        </div>
      </div>
      <blockquote className="px-case">
        <span aria-hidden="true">“</span>
        {data.text}
      </blockquote>
      <div className="px-mask-options">
        {lessonDefinitions.map((lesson) => (
          <button
            key={lesson.label}
            className={`px-mask ${chosen === lesson.label ? (solved ? 'px-answer-right' : 'px-answer-wrong') : ''}`}
            disabled={solved}
            onClick={() => choose(lesson.label)}
          >
            <i aria-hidden="true">{lesson.symbol}</i>
            <b>{lesson.label}</b>
            <small>{lesson.description}</small>
          </button>
        ))}
      </div>
      <FeedbackLine feedback={feedback} />
      {solved &&
        (index < 7 ? (
          <button
            className="button"
            onClick={() => {
              setIndex((value) => value + 1)
              setSolved(false)
              setChosen(null)
              setFeedback({
                kind: 'neutral',
                text: 'Uma nova voz atravessa a névoa. Que elemento ela revela?',
              })
            }}
          >
            Ouvir a próxima situação →
          </button>
        ) : (
          <Complete onComplete={onComplete}>
            Oito histórias compreendidas. As máscaras já não confundem você.
          </Complete>
        ))}
    </div>
  )
}

function Review({ onComplete }: PuzzleProps) {
  const questions = chapters.slice(0, 5)
  const [options, setOptions] = useState(() => questions.map((chapter) => shuffle(chapter.options)))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState(false)
  const data = questions[index]
  const selected = answers[index]
  const score = answers.filter((answer, i) => answer === questions[i].answer).length
  const success = result && score >= 4
  function retry() {
    setOptions(questions.map((chapter) => shuffle(chapter.options)))
    setIndex(0)
    setAnswers([])
    setResult(false)
  }
  return (
    <div className="puzzle-content px-review">
      <p className="eyebrow">Desafio VI · A memória da jornada</p>
      <h2>
        {result
          ? success
            ? 'Você aprendeu a atravessar as sombras'
            : 'Toda lembrança pode ser reencontrada'
          : 'O que ficou do outro lado?'}
      </h2>
      <p className="px-intro">
        Cinco perguntas sobre as verdades da jornada. Você precisa de pelo menos quatro acertos para
        despertar a chave.
      </p>
      {result ? (
        <>
          <div className={`px-score ${success ? 'px-score-pass' : ''}`}>
            <span>
              {score}
              <small>/5</small>
            </span>
            <p>
              {success ? 'A chave reconhece sua compreensão.' : 'A árvore pede mais uma tentativa.'}
              <small>Meta: 4 de 5 acertos (80%).</small>
            </p>
          </div>
          {!success && (
            <div className="px-review-notes">
              <h3>Relembre estas verdades</h3>
              {questions.map(
                (question, i) =>
                  answers[i] !== question.answer && (
                    <p key={question.title}>
                      <b>{question.question}</b>
                      <span>{question.answer}</span>
                    </p>
                  ),
              )}
            </div>
          )}
          {success ? (
            <Complete onComplete={onComplete}>
              As cinco lições estão reunidas. A Chave das Sombras despertou.
            </Complete>
          ) : (
            <>
              <FeedbackLine
                feedback={{
                  kind: 'error',
                  text: `Você acertou ${score} de 5. Leia as respostas acima e tente novamente; sua jornada permanece salva.`,
                }}
              />
              <button className="button" onClick={retry}>
                Recomeçar as cinco perguntas ↻
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="px-progress">
            <span>
              Pergunta <b>{index + 1}</b> de 5
            </span>
            <span>
              {score} {score === 1 ? 'acerto' : 'acertos'}
            </span>
            <div className="px-progress-track">
              <i style={{ width: `${((index + (selected ? 1 : 0)) / 5) * 100}%` }} />
            </div>
          </div>
          <p className="px-question-source">Lembrança de {data.title}</p>
          <h3 className="px-question">{data.question}</h3>
          <div className="px-answers">
            {options[index].map((answer, optionIndex) => (
              <button
                key={answer}
                disabled={!!selected}
                onClick={() => setAnswers((values) => [...values, answer])}
                className={
                  selected === answer
                    ? answer === data.answer
                      ? 'px-answer-right'
                      : 'px-answer-wrong'
                    : selected && answer === data.answer
                      ? 'px-answer-right'
                      : ''
                }
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>
                {answer}
                <i aria-hidden="true">
                  {selected && answer === data.answer ? '✓' : selected === answer ? '×' : '◇'}
                </i>
              </button>
            ))}
          </div>
          {selected ? (
            <>
              <FeedbackLine
                feedback={{
                  kind: selected === data.answer ? 'success' : 'error',
                  text:
                    selected === data.answer
                      ? 'Verdade reconhecida. Leve esta lembrança com você.'
                      : `A verdade desta etapa: ${data.answer}. Guarde-a para a próxima tentativa.`,
                }}
              />
              <button
                className="button"
                onClick={() => (index === 4 ? setResult(true) : setIndex((value) => value + 1))}
              >
                {index === 4 ? 'Revelar meu resultado' : 'Próxima lembrança'} →
              </button>
            </>
          ) : (
            <FeedbackLine
              feedback={{
                kind: 'neutral',
                text: 'Escolha uma resposta. Você verá o resultado antes de seguir.',
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

type SequenceItem = { id: number; symbol: string; label: string; hint?: string }
type SequenceBoardProps = PuzzleProps & {
  eyebrow: string
  title: string
  intro: string
  clue: string
  items: SequenceItem[]
  supply: number[]
  finishLabel: string
  completion: string
}

function SequenceBoard({
  eyebrow,
  title,
  intro,
  clue,
  items,
  supply,
  finishLabel,
  completion,
  onComplete,
}: SequenceBoardProps) {
  const [selection, setSelection] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>({
    text: 'Selecione as peças para preencher as posições. Toque em uma posição preenchida para retirá-la.',
    kind: 'neutral',
  })
  const itemFor = (id: number) => items.find((item) => item.id === id)!
  function change(next: number[]) {
    setSelection(next)
    setInvalid(false)
    setFeedback({
      kind: 'neutral',
      text: 'A sequência pode ser ajustada. Use Desfazer, Limpar ou retire uma peça da posição.',
    })
  }
  function validate() {
    const correct = selection.filter((id, i) => id === items[i].id).length
    const success = correct === items.length
    setFinished(success)
    setInvalid(!success)
    setFeedback({
      kind: success ? 'success' : 'error',
      text: success
        ? completion
        : `${correct} de ${items.length} posições estão corretas. As posições em destaque precisam mudar. ${clue}`,
    })
  }
  return (
    <div className="puzzle-content px-sequence">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="px-intro">{intro}</p>
      <div className="px-sequence-clue">
        <span aria-hidden="true">⌁</span>
        <p>{clue}</p>
      </div>
      <ol
        className="px-sequence-slots"
        style={{ '--px-slots': items.length } as CSSProperties}
        aria-label="Sequência escolhida"
      >
        {items.map((_, index) => {
          const current = selection[index] === undefined ? undefined : itemFor(selection[index])
          return (
            <li key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <button
                className={`${current ? 'px-filled' : ''} ${invalid && current && current.id !== items[index].id ? 'px-slot-wrong' : ''}`}
                disabled={finished || !current}
                onClick={() => change(selection.filter((__, i) => i !== index))}
                aria-label={
                  current
                    ? `Posição ${index + 1}, ${current.label}. Retirar peça.`
                    : `Posição ${index + 1}, vazia`
                }
              >
                <i aria-hidden="true">{current?.symbol || '✧'}</i>
                <small>{current?.label || 'Aguardando'}</small>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="px-sequence-supply" aria-label="Peças disponíveis">
        {supply.map((id) => {
          const item = itemFor(id)
          return (
            <button
              className="px-artifact-choice"
              key={id}
              disabled={finished || selection.includes(id)}
              onClick={() => change([...selection, id])}
            >
              <i aria-hidden="true">{item.symbol}</i>
              <b>{item.label}</b>
              {item.hint && <small>{item.hint}</small>}
              {selection.includes(id) && (
                <span className="px-choice-position">Posição {selection.indexOf(id) + 1}</span>
              )}
            </button>
          )
        })}
      </div>
      {!finished && (
        <div className="px-actions">
          <button
            className="button"
            disabled={selection.length !== items.length}
            onClick={validate}
          >
            Confirmar sequência
          </button>
          <button
            className="button-secondary"
            disabled={!selection.length}
            onClick={() => change(selection.slice(0, -1))}
          >
            ↶ Desfazer
          </button>
          <button
            className="button-secondary"
            disabled={!selection.length}
            onClick={() => change([])}
          >
            Limpar
          </button>
        </div>
      )}
      <FeedbackLine feedback={feedback} />
      {finished && (
        <button className="button" onClick={onComplete}>
          {finishLabel} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}

export function FinalRitual({ onComplete }: PuzzleProps) {
  const items = useMemo(
    () =>
      chapters.slice(0, 5).map((chapter, id) => ({
        id,
        label: chapter.artifact,
        symbol: chapter.symbol,
        hint: chapter.title,
      })),
    [],
  )
  return (
    <SequenceBoard
      onComplete={onComplete}
      eyebrow="O ritual · Cinco raízes, cinco verdades"
      title="Devolva os artefatos à jornada"
      intro="A chave é o destino deste ritual. Coloque os cinco artefatos anteriores na ordem em que foram encontrados e desperte as raízes da árvore."
      clue="Siga o caminho do mapa: Portal → Sala das Cartas → Biblioteca → Galeria dos Espelhos → Câmara dos Espíritos."
      items={items}
      supply={[2, 4, 0, 3, 1]}
      finishLabel="Despertar o cofre"
      completion="As cinco raízes se acenderam. A memória da jornada abriu o caminho até o cofre."
    />
  )
}

export function FinalSequence({
  kind,
  onComplete,
}: {
  kind: 'symbols' | 'lessons'
  onComplete: () => void
}) {
  const symbols = chapters.map((chapter, id) => ({
    id,
    symbol: chapter.symbol,
    label: chapter.artifact,
    hint: chapter.title,
  }))
  const lessons = lessonDefinitions.map((lesson, id) => ({
    id,
    symbol: lesson.symbol,
    label: lesson.label,
    hint: lesson.description,
  }))
  return kind === 'symbols' ? (
    <SequenceBoard
      key="symbols"
      onComplete={onComplete}
      eyebrow="O cofre · Primeiro selo"
      title="O círculo dos seis"
      intro="Cada artefato carrega um símbolo. Reconstitua a ordem completa da jornada para romper o primeiro selo."
      clue="O caminho começa no Portal, passa pela Sala, Biblioteca, Galeria e Câmara, e termina na Árvore das Sombras."
      items={symbols}
      supply={[3, 1, 5, 0, 4, 2]}
      finishLabel="Romper o primeiro selo"
      completion="Os seis símbolos estão na ordem da jornada. O primeiro selo se abriu."
    />
  ) : (
    <SequenceBoard
      key="lessons"
      onComplete={onComplete}
      eyebrow="O cofre · Último selo"
      title="As lições das sombras"
      intro="Antes de fazer seu desejo, organize os quatro elementos de uma decisão consciente."
      clue="Primeiro, reconheça o que deseja. Depois, escolha como agir. Compreenda o que essa escolha custa e, por fim, o resultado que ela traz."
      items={lessons}
      supply={[2, 0, 3, 1]}
      finishLabel="Abrir o coração do cofre"
      completion="Desejo, escolha, preço e consequência. O último selo reconheceu sua compreensão."
    />
  )
}
