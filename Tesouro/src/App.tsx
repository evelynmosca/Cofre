import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import world from './assets/bayou-world-v2.png'
import panorama from './assets/bayou-panorama.png'
import { WorldMap } from './game/WorldMap'
import { Puzzles, FinalRitual, FinalSequence } from './game/Puzzles'
import { chapters } from './game/content'
import {
  initialState,
  loadGame,
  saveGame,
  completeChapter,
  enterChapter,
  resumeGame,
  type GameState,
} from './game/state'
import { Artifact, Icon } from './game/Icons'
import { BayouAudio } from './game/audio'
import './experience.css'

type ModalName = 'journal' | 'help' | 'settings' | 'restart' | null
type Preferences = { sound: boolean; effects: boolean; volume: number; motion: boolean }
const PREFS_KEY = 'cofre-preferences-v3'
const sound = new BayouAudio()
const numeral = (n: number) => String(n).padStart(2, '0')
function loadPreferences(): Preferences {
  const defaults = {
    sound: false,
    effects: true,
    volume: 0.45,
    motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
  try {
    const data = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null')
    if (!data || typeof data !== 'object') return defaults
    return {
      sound: typeof data.sound === 'boolean' ? data.sound : false,
      effects: typeof data.effects === 'boolean' ? data.effects : true,
      volume:
        typeof data.volume === 'number' && Number.isFinite(data.volume)
          ? Math.min(1, Math.max(0, data.volume))
          : 0.45,
      motion: typeof data.motion === 'boolean' ? data.motion : defaults.motion,
    }
  } catch {
    return defaults
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(loadGame),
    [home, setHome] = useState(true)
  const [modal, setModal] = useState<ModalName>(null),
    [preferences, setPreferences] = useState(loadPreferences)
  const [saveOk, setSaveOk] = useState(true),
    [notice, setNotice] = useState(''),
    [online, setOnline] = useState(navigator.onLine)
  const content = useRef<HTMLDivElement>(null)
  const view = home ? 'home' : state.view
  const update = (changes: Partial<GameState>) =>
    setState((current) => ({ ...current, ...changes }))
  useEffect(() => {
    setSaveOk(saveGame(state))
  }, [state])
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences))
    } catch {
      /* preferences remain usable in memory */
    }
    document.documentElement.dataset.motion = preferences.motion ? 'full' : 'reduced'
    sound.volume(preferences.volume)
    if (!preferences.sound) sound.stop()
  }, [preferences])
  useEffect(() => () => sound.stop(), [])
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    addEventListener('online', sync)
    addEventListener('offline', sync)
    return () => {
      removeEventListener('online', sync)
      removeEventListener('offline', sync)
    }
  }, [])
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (import.meta.env.PROD)
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
    else
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => {
            if (registration.active?.scriptURL.endsWith('/sw.js')) void registration.unregister()
          }),
        )
        .catch(() => {})
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!home)
      requestAnimationFrame(() =>
        content.current
          ?.querySelector<HTMLElement>('[data-screen-title]')
          ?.focus({ preventScroll: true }),
      )
  }, [home, state.view, state.active, state.phase])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])
  const toggleSound = async () => {
    if (preferences.sound) {
      sound.stop()
      setPreferences((p) => ({ ...p, sound: false }))
      return
    }
    try {
      await sound.start(preferences.volume)
      setPreferences((p) => ({ ...p, sound: true }))
    } catch {
      setNotice('O navegador não conseguiu iniciar o áudio. Tente novamente.')
      setPreferences((p) => ({ ...p, sound: false }))
    }
  }
  const activateSound = () => {
    if (preferences.sound)
      void sound
        .start(preferences.volume)
        .catch(() => setPreferences((p) => ({ ...p, sound: false })))
  }
  const fresh = () => {
    setState({
      ...initialState,
      completed: [],
      discovered: [],
      view: 'intro',
      startedAt: Date.now(),
    })
    setHome(false)
    setModal(null)
    activateSound()
  }
  const newJourney = () => (state.startedAt && !state.endedAt ? setModal('restart') : fresh())
  const resume = () => {
    setState((current) => resumeGame(current))
    setHome(false)
    activateSound()
  }
  const openMap = () => {
    setHome(false)
    update({ view: 'map' })
  }
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen()
      else setNotice('A tela cheia não está disponível neste navegador.')
    } catch {
      setNotice('A tela cheia não está disponível neste navegador.')
    }
  }
  const enterFinal = () =>
    update({ view: state.wish && state.endedAt ? 'ending' : state.ritual ? 'vault' : 'ritual' })
  return (
    <div
      className="app"
      style={{ '--world': `url(${world})`, '--panorama': `url(${panorama})` } as CSSProperties}
      onClick={(event) => {
        if (preferences.effects && (event.target as HTMLElement).closest('button:not(:disabled)'))
          sound.click()
      }}
    >
      <div ref={content} inert={modal ? true : undefined}>
        <header
          className={`topbar ${view === 'home' || view === 'intro' ? 'topbar-transparent' : ''}`}
        >
          <button
            className="wordmark"
            onClick={() => setHome(true)}
            aria-label="O Cofre das Sombras — início"
          >
            <span className="brand-mark">
              <Icon name="compass" size={30} />
            </span>
            <span>
              O COFRE<small>DAS SOMBRAS</small>
            </span>
          </button>
          {!['home', 'intro'].includes(view) && (
            <nav className="main-nav" aria-label="Navegação principal">
              <button
                className={view === 'map' ? 'active' : ''}
                onClick={openMap}
                aria-label="O mapa"
                title="O mapa"
              >
                <Icon name="compass" size={16} />
                <span>O mapa</span>
              </button>
              <button
                onClick={() => setModal('journal')}
                aria-label={`Meu diário · ${state.completed.length} artefatos`}
                title="Meu diário"
              >
                <Icon name="book" size={16} />
                <span>Meu diário</span>
                <sup>{state.completed.length}</sup>
              </button>
            </nav>
          )}
          <div className="header-actions">
            <button
              className={`icon-button sound-toggle ${preferences.sound ? 'enabled' : ''}`}
              onClick={toggleSound}
              aria-label={preferences.sound ? 'Desativar som ambiente' : 'Ativar som ambiente'}
              aria-pressed={preferences.sound}
              title={preferences.sound ? 'Desativar som' : 'Ativar som'}
            >
              <Icon name={preferences.sound ? 'sound' : 'mute'} />
              <span>SOM {preferences.sound ? 'ON' : 'OFF'}</span>
            </button>
            <span className="header-divider" />
            <button
              className="icon-button"
              onClick={() => setModal('help')}
              aria-label="Como jogar"
              title="Como jogar"
            >
              <Icon name="help" />
            </button>
            <button
              className="icon-button"
              onClick={() => setModal('settings')}
              aria-label="Configurações"
              title="Configurações"
            >
              <Icon name="settings" />
            </button>
            <button
              className="icon-button fullscreen-button"
              onClick={fullscreen}
              aria-label="Alternar tela cheia"
              title="Tela cheia"
            >
              <Icon name="expand" />
            </button>
          </div>
        </header>
        <main id="main-content">
          {view === 'home' && (
            <Home
              has={state.startedAt > 0}
              completed={state.completed.length}
              fresh={newJourney}
              resume={resume}
              help={() => setModal('help')}
            />
          )}
          {view === 'intro' && <Intro enter={openMap} />}
          {view === 'map' && (
            <div className="map-screen">
              <div className="map-heading">
                <div>
                  <p className="eyebrow">NOVA ORLEANS · ALÉM DO MUNDO VISÍVEL</p>
                  <h1 data-screen-title tabIndex={-1}>
                    As trilhas do <em>desejo.</em>
                  </h1>
                </div>
                <div className="map-progress">
                  <span>VERDADES REVELADAS</span>
                  <b>
                    {numeral(state.completed.length)}
                    <small> / 06</small>
                  </b>
                  <div
                    className="progress-dots"
                    aria-label={`${state.completed.length} de 6 regiões concluídas`}
                  >
                    {chapters.map((c, i) => (
                      <i key={c.id} className={state.completed.includes(i) ? 'complete' : ''} />
                    ))}
                  </div>
                </div>
              </div>
              <WorldMap
                completed={state.completed}
                active={
                  state.completed.includes(state.active)
                    ? Math.min(state.completed.length, 5)
                    : state.active
                }
                onEnter={(n) => setState((current) => enterChapter(current, n))}
                onFinal={enterFinal}
                finalUnlocked={state.completed.length === 6}
                finalCompleted={!!state.endedAt}
              />
              <footer className="map-bottom">
                <span>
                  <i className="status-light" />
                  {saveOk
                    ? 'Sua jornada é salva automaticamente'
                    : 'Salvamento indisponível neste navegador'}
                </span>
                <span>
                  6 REGIÕES <i>·</i> 6 ARTEFATOS <i>·</i> UM DESEJO
                </span>
                <button onClick={() => setModal('help')}>
                  Guia do viajante <Icon name="arrow" size={14} />
                </button>
              </footer>
            </div>
          )}
          {view === 'stage' && (
            <Stage
              state={state}
              update={update}
              finish={() => setState((current) => completeChapter(current))}
              map={openMap}
            />
          )}
          {view === 'ritual' && (
            <FinalScene
              title="As raízes se lembram."
              kicker="O RITUAL · PRIMEIRO SELO"
              description="Os artefatos guardam a ordem da sua história. Devolva cada verdade ao lugar a que pertence."
              step={1}
            >
              <FinalRitual onComplete={() => update({ ritual: true, view: 'vault' })} />
            </FinalScene>
          )}
          {view === 'vault' && <Vault state={state} update={update} />}
          {view === 'ending' && <Ending state={state} fresh={newJourney} map={openMap} />}
        </main>
        {!online && (
          <div className="offline-note" role="status">
            Você está offline. Sua aventura continua neste dispositivo.
          </div>
        )}
      </div>
      <Atmosphere />
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {modal && (
        <Modal
          title={
            modal === 'journal'
              ? 'Diário do viajante'
              : modal === 'help'
                ? 'Guia do viajante'
                : modal === 'restart'
                  ? 'Começar uma nova jornada'
                  : 'Configurações'
          }
          close={() => setModal(null)}
        >
          {modal === 'journal' ? (
            <Journal state={state} />
          ) : modal === 'help' ? (
            <Help />
          ) : modal === 'settings' ? (
            <Settings
              preferences={preferences}
              setPreferences={setPreferences}
              toggleSound={toggleSound}
              saveOk={saveOk}
            />
          ) : (
            <div className="restart-content">
              <Icon name="compass" size={50} />
              <h3>Uma nova travessia?</h3>
              <p>
                O progresso desta jornada será substituído. Você já revelou {state.completed.length}{' '}
                de 6 regiões.
              </p>
              <button className="button" onClick={fresh}>
                Começar novamente <Icon name="arrow" size={16} />
              </button>
              <button className="button-secondary" onClick={() => setModal(null)}>
                Preservar minha jornada
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="mist" />
      {Array.from({ length: 15 }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--x': `${(i * 29 + 7) % 100}%`,
              '--y': `${(i * 17 + 31) % 95}%`,
              '--delay': `${-i * 1.7}s`,
              '--duration': `${6 + (i % 5)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
function Home({
  has,
  completed,
  fresh,
  resume,
  help,
}: {
  has: boolean
  completed: number
  fresh: () => void
  resume: () => void
  help: () => void
}) {
  return (
    <section className="home-screen">
      <div className="home-landscape" aria-hidden="true" />
      <div className="home-copy">
        <p className="eyebrow">
          <span className="tiny-star">✧</span> UMA AVENTURA DO OUTRO LADO
        </p>
        <h1 data-screen-title tabIndex={-1}>
          O Cofre
          <br />
          <span>
            das <em>Sombras</em>
          </span>
          <i className="title-diamond">✧</i>
        </h1>
        <div className="ornament">
          <span />
          <Icon name="sparkle" size={16} />
          <span />
        </div>
        <p className="home-tagline">
          Todo desejo tem um preço.
          <br />
          <span>Você está pronto para descobrir o seu?</span>
        </p>
        <p className="home-description">
          Sob a névoa de Nova Orleans, seis caminhos guardam um segredo. Siga as luzes, desafie as
          sombras e descubra o que realmente vale desejar.
        </p>
        <div className="home-cta">
          <button className="button button-gold" onClick={has ? resume : fresh}>
            {has ? 'Continuar minha jornada' : 'Iniciar minha jornada'}
            <Icon name="arrow" size={19} />
          </button>
          {has ? (
            <button className="text-button" onClick={fresh}>
              Começar de novo <span>↗</span>
            </button>
          ) : (
            <button className="text-button" onClick={help}>
              Conhecer a experiência <Icon name="book" size={15} />
            </button>
          )}
        </div>
        <div className="home-detail">
          <span className="detail-symbol">
            <Icon name="compass" size={21} />
          </span>
          <span>
            {has ? `${completed} de 6 regiões reveladas` : 'Explore no seu ritmo'}
            <small>
              {has
                ? 'Seu desejo ainda espera por você.'
                : 'Uma jornada de exploração, escolhas e mistério.'}
            </small>
          </span>
        </div>
      </div>
      <div className="scene-caption">
        <span className="caption-line" />
        <p>
          29°57′ N &nbsp; 90°04′ W<small>O BAYOU, LOUISIANA</small>
        </p>
      </div>
      <div className="home-bottom">
        <span>UMA HISTÓRIA SOBRE O QUE NOS MOVE</span>
        <div>
          <span>EXPLORAÇÃO</span>
          <i>✧</i>
          <span>ENIGMAS</span>
          <i>✧</i>
          <span>DESCOBERTA</span>
        </div>
        <span className="headphones">
          <Icon name="sound" size={14} /> MELHOR COM FONES
        </span>
      </div>
    </section>
  )
}
function Intro({ enter }: { enter: () => void }) {
  const [line, setLine] = useState(0)
  const lines = [
    {
      title: 'Você seguiu as luzes.',
      text: 'Dizem que o pântano só revela seus caminhos a quem carrega um desejo. Esta noite, as lamparinas se acenderam para você.',
    },
    {
      title: 'Mas as sombras também escutam.',
      text: 'Um homem de cartola lhe entrega uma carta: “Há um cofre do outro lado. Seis verdades abrem a passagem. Só não confunda o que deseja com aquilo de que precisa.”',
    },
    {
      title: 'Todo caminho começa com uma escolha.',
      text: 'Explore o mapa. Investigue as regiões. Reúna os seis artefatos. A cada enigma, você estará mais perto do cofre — e do seu verdadeiro desejo.',
    },
  ]
  return (
    <section className="intro-screen">
      <div className="intro-art">
        <div className="tarot-card">
          <div className="tarot-corner">
            I <span>✧</span>
          </div>
          <Icon name="compass" size={100} />
          <div className="tarot-moon">☾</div>
          <p>O VIAJANTE</p>
          <small>ENTRE A LUZ E O DESEJO</small>
          <span className="tarot-base">✦</span>
        </div>
      </div>
      <div className="intro-copy">
        <p className="eyebrow">PRÓLOGO · O CHAMADO DO BAYOU</p>
        <h1 data-screen-title tabIndex={-1}>
          {lines[line].title}
        </h1>
        <p className="narrative-text">{lines[line].text}</p>
        <div className="intro-pagination">
          {lines.map((_, i) => (
            <span key={i} className={i === line ? 'active' : ''} />
          ))}
          <small>{numeral(line + 1)} / 03</small>
        </div>
        <button
          className="button button-gold"
          onClick={() => (line < 2 ? setLine(line + 1) : enter())}
        >
          {line < 2 ? 'Continuar a história' : 'Abrir o mapa'}
          <Icon name="arrow" size={18} />
        </button>
        <button className="text-button" onClick={enter}>
          Ir direto ao mapa
        </button>
      </div>
      <span className="intro-quote">“Os amigos do outro lado estão esperando.”</span>
    </section>
  )
}
function Stage({
  state,
  update,
  finish,
  map,
}: {
  state: GameState
  update: (p: Partial<GameState>) => void
  finish: () => void
  map: () => void
}) {
  const chapter = chapters[state.active]
  const phaseIndex = ['explore', 'quiz', 'puzzle', 'reward'].indexOf(state.phase)
  return (
    <section className={`adventure chapter-${state.active}`}>
      <div className="chapter-scenery" aria-hidden="true" />
      <aside className="chapter-story">
        <button className="back-link" onClick={map}>
          <Icon name="back" size={16} /> Voltar ao mapa
        </button>
        <p className="eyebrow">
          CAPÍTULO {numeral(state.active + 1)} <span> / VI</span>
        </p>
        <h1 data-screen-title tabIndex={-1}>
          {chapter.title}
        </h1>
        <p className="chapter-location">
          <Icon name="compass" size={14} />
          {chapter.location}
        </p>
        <div className="story-rule" />
        <p className="narrative-text">{chapter.description}</p>
        <ol className="chapter-steps">
          {['Investigue os sinais', 'Escute a carta', chapter.puzzle, 'Revele o artefato'].map(
            (step, i) => (
              <li
                key={step}
                className={i < phaseIndex ? 'done' : i === phaseIndex ? 'current' : ''}
              >
                <span>{i < phaseIndex ? <Icon name="check" size={12} /> : numeral(i + 1)}</span>
                {step}
              </li>
            ),
          )}
        </ol>
        <div className="chapter-reward-preview">
          <Artifact index={state.active} size={26} />
          <span>
            ESTA REGIÃO GUARDA<small>{chapter.artifact}</small>
          </span>
        </div>
      </aside>
      <div className="activity-area">
        <div className="panel" key={`${state.active}-${state.phase}`}>
          {state.phase === 'explore' && <Explore state={state} update={update} />}
          {state.phase === 'quiz' && (
            <Quiz chapter={state.active} complete={() => update({ phase: 'puzzle' })} />
          )}
          {state.phase === 'puzzle' && (
            <Puzzles chapter={state.active} onComplete={() => update({ phase: 'reward' })} />
          )}
          {state.phase === 'reward' && (
            <div className="reward-content">
              <p className="eyebrow">UMA VERDADE FOI REVELADA</p>
              <div className="artifact-display">
                <span className="artifact-orbit" />
                <Artifact index={state.active} size={85} />
              </div>
              <h2>{chapter.artifact}</h2>
              <blockquote>“{chapter.clue}”</blockquote>
              <p>Guarde esta verdade. Ela fará parte do ritual que abre o Cofre das Sombras.</p>
              <button className="button button-gold" onClick={finish}>
                Guardar e voltar ao mapa
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
        </div>
        <span className="activity-footnote">
          <Icon name="feather" size={13} />
          As respostas estão nas pistas. Observe antes de escolher.
        </span>
      </div>
    </section>
  )
}
function Explore({ state, update }: { state: GameState; update: (p: Partial<GameState>) => void }) {
  const [selected, setSelected] = useState<number | null>(null),
    chapter = chapters[state.active]
  const discover = (index: number) => {
    setSelected(index)
    update({ discovered: [...new Set([...state.discovered, index])] })
  }
  return (
    <div className="explore-content">
      <div className="panel-kicker">
        <p className="eyebrow">01 · EXPLORAÇÃO</p>
        <span>{state.discovered.length} / 3 sinais</span>
      </div>
      <h2>Há histórias escondidas aqui.</h2>
      <p>Toque nos três vestígios. Cada um guarda uma parte da verdade.</p>
      <div className="discovery-grid">
        {chapter.discoveries.map((discovery, i) => (
          <button
            className={`discovery-card ${state.discovered.includes(i) ? 'discovered' : ''} ${selected === i ? 'selected' : ''}`}
            onClick={() => discover(i)}
            key={discovery.title}
            aria-pressed={selected === i}
          >
            <span className="discovery-number">{numeral(i + 1)}</span>
            <span className="discovery-symbol">{discovery.symbol}</span>
            <b>{discovery.title}</b>
            <small>
              {state.discovered.includes(i) ? (
                <>
                  <Icon name="check" size={11} /> Investigado
                </>
              ) : (
                'Investigar vestígio ↗'
              )}
            </small>
          </button>
        ))}
      </div>
      <div className="discovery-narrative" aria-live="polite">
        {selected !== null ? (
          <>
            <Icon name="feather" size={22} />
            <p>{chapter.discoveries[selected].text}</p>
          </>
        ) : (
          <>
            <Icon name="sparkle" size={22} />
            <p>
              {state.discovered.length
                ? 'Selecione um vestígio para reler sua história.'
                : 'Uma carta, uma marca, um sussurro… o que chamou sua atenção?'}
            </p>
          </>
        )}
      </div>
      <button
        className="button"
        disabled={state.discovered.length < 3}
        onClick={() => update({ phase: 'quiz' })}
      >
        {state.discovered.length < 3
          ? `Investigue os ${3 - state.discovered.length} sinais restantes`
          : 'Escutar a carta'}
        <Icon name={state.discovered.length < 3 ? 'lock' : 'arrow'} size={16} />
      </button>
    </div>
  )
}
function Quiz({ chapter, complete }: { chapter: number; complete: () => void }) {
  const data = chapters[chapter],
    [answer, setAnswer] = useState(''),
    right = answer === data.answer
  return (
    <div className="quiz-content">
      <p className="eyebrow">02 · A CARTA PERGUNTA</p>
      <h2>{data.question}</h2>
      <p>Relembre os vestígios que encontrou nesta região.</p>
      <div className="quiz-answers">
        {data.options.map((option, i) => (
          <button
            key={option}
            onClick={() => setAnswer(option)}
            disabled={right}
            className={answer === option ? (right ? 'correct' : 'incorrect') : ''}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
            {answer === option && <Icon name={right ? 'check' : 'close'} size={17} />}
          </button>
        ))}
      </div>
      {answer && (
        <p className={`feedback ${right ? 'positive' : ''}`} role="status">
          {right
            ? 'A carta reconhece a verdade. O desafio está aberto.'
            : 'Esse caminho esconde um atalho. Lembre-se do que os vestígios revelaram e tente novamente.'}
        </p>
      )}
      {right && (
        <button className="button button-gold" onClick={complete}>
          Entrar no desafio
          <Icon name="arrow" size={16} />
        </button>
      )}
    </div>
  )
}
function FinalScene({
  title,
  kicker,
  description,
  step,
  children,
}: {
  title: string
  kicker: string
  description: string
  step: number
  children: ReactNode
}) {
  return (
    <section className="final-scene">
      <div className="final-intro">
        <span className="final-sigil">
          <Icon name="key" size={38} />
        </span>
        <p className="eyebrow">{kicker}</p>
        <h1 data-screen-title tabIndex={-1}>
          {title}
        </h1>
        <p>{description}</p>
        <div className="final-progress">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={i <= step ? 'active' : ''}>
              {i < step ? <Icon name="check" size={12} /> : numeral(i)}
            </span>
          ))}
        </div>
      </div>
      <div className="panel final-panel" key={kicker}>
        {children}
      </div>
    </section>
  )
}
function Vault({ state, update }: { state: GameState; update: (p: Partial<GameState>) => void }) {
  if (!state.key)
    return (
      <FinalScene
        title="A última porta."
        kicker="O COFRE · SEGUNDO SELO"
        description="Seis regiões. Seis verdades. A chave que você conquistou agora encontra sua fechadura."
        step={2}
      >
        <div className="vault-content">
          <div className="vault-door">
            <div className="vault-outer">
              <div className="vault-inner">
                <Icon name="key" size={65} />
              </div>
            </div>
            <span>VI · VERITAS · VI</span>
          </div>
          <h2>Nem todo tesouro é de ouro.</h2>
          <p>Use a Chave das Sombras para despertar o mecanismo do cofre.</p>
          <button className="button button-gold" onClick={() => update({ key: true })}>
            <Icon name="key" size={19} />
            Usar a Chave das Sombras
          </button>
        </div>
      </FinalScene>
    )
  if (!state.circle)
    return (
      <FinalScene
        title="O círculo das seis verdades."
        kicker="O COFRE · TERCEIRO SELO"
        description="O mecanismo reconhece os símbolos da sua travessia. Recorde a ordem em que cada artefato chegou até você."
        step={3}
      >
        <FinalSequence kind="symbols" onComplete={() => update({ circle: true })} />
      </FinalScene>
    )
  if (!state.lessons)
    return (
      <FinalScene
        title="O que as sombras ensinaram?"
        kicker="O COFRE · ÚLTIMO SELO"
        description="Primeiro entendemos o que queremos. Então escolhemos, reconhecemos o preço e aceitamos as consequências."
        step={4}
      >
        <FinalSequence kind="lessons" onComplete={() => update({ lessons: true })} />
      </FinalScene>
    )
  return (
    <FinalScene
      title="O desejo é seu."
      kicker="DO OUTRO LADO · A VERDADE FINAL"
      description="O cofre se abre. Lá dentro, nenhum ouro. Apenas um espelho — e a chance de escolher com consciência."
      step={4}
    >
      <Wish state={state} update={update} />
    </FinalScene>
  )
}
function Wish({ state, update }: { state: GameState; update: (p: Partial<GameState>) => void }) {
  const wishValid = state.wish.trim().length >= 10,
    careValid = state.care.trim().length >= 15
  return (
    <form
      className="wish-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (wishValid && careValid)
          update({
            wish: state.wish.trim(),
            care: state.care.trim(),
            endedAt: Date.now(),
            view: 'ending',
          })
      }}
    >
      <p className="eyebrow">UMA PROMESSA A SI MESMO</p>
      <h2>O que você realmente deseja?</h2>
      <p>Seu desejo fica guardado apenas neste navegador.</p>
      <label htmlFor="wish">
        Meu verdadeiro desejo
        <textarea
          id="wish"
          value={state.wish}
          onChange={(event) => update({ wish: event.target.value })}
          maxLength={400}
          placeholder="Eu desejo…"
          minLength={10}
          required
          aria-describedby="wish-hint"
        />
        <small id="wish-hint">Ao menos 10 caracteres · {state.wish.length}/400</small>
      </label>
      <label htmlFor="care">
        Como vou realizá-lo com responsabilidade
        <textarea
          id="care"
          value={state.care}
          onChange={(event) => update({ care: event.target.value })}
          maxLength={700}
          placeholder="Posso construir esse caminho…"
          minLength={15}
          required
          aria-describedby="care-hint"
        />
        <small id="care-hint">Ao menos 15 caracteres · {state.care.length}/700</small>
      </label>
      <button type="submit" className="button button-gold" disabled={!wishValid || !careValid}>
        Selar meu desejo
        <Icon name="feather" size={18} />
      </button>
    </form>
  )
}
function Ending({ state, fresh, map }: { state: GameState; fresh: () => void; map: () => void }) {
  const minutes = Math.max(1, Math.round(((state.endedAt || Date.now()) - state.startedAt) / 60000))
  const download = () => {
    const text = `O COFRE DAS SOMBRAS\nUma jornada concluída\n\nMEU DESEJO\n${state.wish}\n\nMEU CAMINHO\n${state.care}\n\n6 regiões exploradas · 6 verdades reveladas\nTempo da jornada: ${minutes} min\n\nTodo desejo tem um caminho. A escolha é sua.\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'meu-desejo-cofre-das-sombras.txt'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <section className="ending-screen">
      <div className="ending-emblem">
        <Icon name="sparkle" size={58} />
      </div>
      <p className="eyebrow">VOCÊ ATRAVESSOU AS SOMBRAS</p>
      <h1 data-screen-title tabIndex={-1}>
        O verdadeiro tesouro
        <br />
        <em>sempre foi a escolha.</em>
      </h1>
      <p className="ending-copy">
        O desejo não precisa de atalhos.
        <br />
        Precisa de um caminho que faça sentido para você.
      </p>
      <div className="wish-keepsake">
        <Icon name="feather" size={25} />
        <span>SEU DESEJO</span>
        <blockquote>“{state.wish}”</blockquote>
        <p>{state.care}</p>
      </div>
      <div className="ending-stats">
        <span>
          <b>06</b>REGIÕES EXPLORADAS
        </span>
        <i>✧</i>
        <span>
          <b>06</b>ARTEFATOS REUNIDOS
        </span>
        <i>✧</i>
        <span>
          <b>
            {numeral(minutes)}
            <small> min</small>
          </b>
          SUA TRAVESSIA
        </span>
      </div>
      <div className="ending-actions">
        <button className="button button-gold" onClick={download}>
          Guardar meu desejo
          <Icon name="feather" size={16} />
        </button>
        <button className="button-secondary" onClick={map}>
          Revisitar o mapa
        </button>
        <button className="text-button" onClick={fresh}>
          Uma nova jornada <Icon name="arrow" size={15} />
        </button>
      </div>
      <p className="ending-signoff">As luzes do bayou sempre reconhecerão você.</p>
    </section>
  )
}
function Journal({ state }: { state: GameState }) {
  const [tab, setTab] = useState<'artifacts' | 'clues'>('artifacts')
  return (
    <div className="journal-content">
      <p className="eyebrow">MEMÓRIAS DO OUTRO LADO</p>
      <h3>O que a travessia revelou.</h3>
      <p>
        {state.completed.length} de 6 verdades reunidas. Cada descoberta aproxima você do cofre.
      </p>
      <div className="journal-tabs" role="tablist" aria-label="Conteúdo do diário">
        <button
          role="tab"
          id="artifacts-tab"
          aria-controls="journal-panel"
          aria-selected={tab === 'artifacts'}
          onClick={() => setTab('artifacts')}
        >
          Artefatos <span>{state.completed.length}/6</span>
        </button>
        <button
          role="tab"
          id="clues-tab"
          aria-controls="journal-panel"
          aria-selected={tab === 'clues'}
          onClick={() => setTab('clues')}
        >
          Pistas da jornada
        </button>
      </div>
      <div
        role="tabpanel"
        id="journal-panel"
        aria-labelledby={tab === 'artifacts' ? 'artifacts-tab' : 'clues-tab'}
      >
        {tab === 'artifacts' ? (
          <div className="journal-grid">
            {chapters.map((chapter, i) => (
              <article key={chapter.id} className={state.completed.includes(i) ? 'collected' : ''}>
                <span className="journal-item-number">{numeral(i + 1)}</span>
                {state.completed.includes(i) ? (
                  <Artifact index={i} size={44} />
                ) : (
                  <Icon name="lock" size={32} />
                )}
                <h4>{state.completed.includes(i) ? chapter.artifact : 'Ainda nas sombras'}</h4>
                <p>{chapter.title}</p>
              </article>
            ))}
          </div>
        ) : (
          <ol className="journal-clues">
            {chapters.map((chapter, i) => (
              <li key={chapter.id} className={state.completed.includes(i) ? 'collected' : ''}>
                <span>{numeral(i + 1)}</span>
                <div>
                  <b>{chapter.title}</b>
                  <p>
                    {state.completed.includes(i)
                      ? chapter.clue
                      : 'Explore esta região para revelar sua verdade.'}
                  </p>
                </div>
                {state.completed.includes(i) ? (
                  <Icon name="check" size={17} />
                ) : (
                  <Icon name="lock" size={17} />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="journal-note">
        <Icon name="feather" size={17} />
        <p>
          Os símbolos seguem a ordem do mapa. Quando chegar a hora do ritual, sua história será a
          chave.
        </p>
      </div>
    </div>
  )
}
function Help() {
  return (
    <div className="help-content">
      <p className="eyebrow">PARA ENCONTRAR SEU CAMINHO</p>
      <h3>
        Confie nas pistas.
        <br />
        <em>Questione os atalhos.</em>
      </h3>
      <p>
        Uma aventura inspirada no mistério do bayou e no universo de{' '}
        <cite>A Princesa e o Sapo</cite>, sobre desejos, escolhas e consequências.
      </p>
      <div className="help-steps">
        {[
          {
            icon: 'compass',
            title: 'Navegue pelo mapa',
            text: 'Escolha uma região iluminada e toque em “Explorar região”. Cada capítulo concluído revela o próximo.',
          },
          {
            icon: 'book',
            title: 'Investigue e resolva',
            text: 'Leia os três vestígios, responda à carta e vença o desafio. Todas as atividades têm instruções e podem ser repetidas.',
          },
          {
            icon: 'key',
            title: 'Reúna as seis verdades',
            text: 'Guarde cada artefato para concluir a região. Consulte seu diário e retorne ao mapa para acessar o ritual final.',
          },
        ].map((item, i) => (
          <article key={item.title}>
            <span>
              <Icon name={item.icon} size={25} />
            </span>
            <div>
              <small>0{i + 1}</small>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="help-shortcuts">
        <span>
          <kbd>Tab</kbd> Navegar
        </span>
        <span>
          <kbd>Enter</kbd> Escolher
        </span>
        <span>
          <kbd>Esc</kbd> Fechar janelas
        </span>
      </div>
      <p className="small-note">
        Seu progresso é salvo neste dispositivo. Use “Continuar” ao voltar. Em um desafio, voltar ao
        mapa preserva a etapa; o minijogo em andamento recomeça ao entrar novamente.
      </p>
    </div>
  )
}
function Settings({
  preferences,
  setPreferences,
  toggleSound,
  saveOk,
}: {
  preferences: Preferences
  setPreferences: (update: (p: Preferences) => Preferences) => void
  toggleSound: () => void
  saveOk: boolean
}) {
  return (
    <div className="settings-content">
      <p className="eyebrow">NO SEU RITMO</p>
      <h3>Prepare a atmosfera.</h3>
      <p>Encontre o equilíbrio para a sua travessia.</p>
      <label className="setting-row">
        <span>
          <b>Som ambiente</b>
          <small>Águas do bayou e notas suaves do outro lado.</small>
        </span>
        <input type="checkbox" checked={preferences.sound} onChange={toggleSound} />
        <i className="toggle-track" />
      </label>
      <label className="volume-setting">
        <span>
          Volume <b>{Math.round(preferences.volume * 100)}%</b>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={preferences.volume}
          onChange={(event) =>
            setPreferences((p) => ({ ...p, volume: Number(event.target.value) }))
          }
        />
      </label>
      <label className="setting-row">
        <span>
          <b>Efeitos de interação</b>
          <small>Toques sonoros, quando o som está ativado.</small>
        </span>
        <input
          type="checkbox"
          checked={preferences.effects}
          onChange={(event) => setPreferences((p) => ({ ...p, effects: event.target.checked }))}
        />
        <i className="toggle-track" />
      </label>
      <label className="setting-row">
        <span>
          <b>Animações de ambiente</b>
          <small>Névoa, vaga-lumes e transições suaves.</small>
        </span>
        <input
          type="checkbox"
          checked={preferences.motion}
          onChange={(event) => setPreferences((p) => ({ ...p, motion: event.target.checked }))}
        />
        <i className="toggle-track" />
      </label>
      <div className="settings-save">
        <Icon name={saveOk ? 'check' : 'help'} size={18} />
        <span>
          {saveOk ? 'Salvamento automático ativo' : 'Armazenamento indisponível'}
          <small>
            {saveOk
              ? 'Seu progresso fica guardado neste navegador.'
              : 'Seu progresso fica disponível somente enquanto esta página estiver aberta.'}
          </small>
        </span>
      </div>
      <p className="small-note">A ambientação sonora é original e gerada pelo próprio jogo.</p>
    </div>
  )
}
function Modal({
  title,
  children,
  close,
}: {
  title: string
  children: ReactNode
  close: () => void
}) {
  const dialog = useRef<HTMLDivElement>(null),
    onClose = useRef(close)
  onClose.current = close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('button')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose.current()
        return
      }
      if (event.key !== 'Tab') return
      const elements = [
          ...(dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea, a[href], [tabindex="0"]',
          ) || []),
        ],
        first = elements[0],
        last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', keydown)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        className="modal-window"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-topline">
          <span id="modal-title">{title}</span>
          <button className="icon-button" onClick={close} aria-label="Fechar janela">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-bottomline">
          <span>O COFRE DAS SOMBRAS</span>
          <Icon name="sparkle" size={12} />
          <span>DIÁRIO DO OUTRO LADO</span>
        </div>
      </div>
    </div>
  )
}
