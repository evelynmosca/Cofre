import { useState } from 'react'

type SaveState = { portalDone: boolean; cardsDone: boolean }

const places = [
  ['portal', 'Portal das Sombras', 'A primeira porta esta entreaberta.'],
  ['cards', 'Sala das Cartas', 'Velas aguardam um novo acordo.'],
  ['library', 'Biblioteca do Outro Lado', 'A nevoa ainda guarda os livros.'],
  ['mirrors', 'Galeria dos Espelhos', 'Nenhum reflexo e inocente.'],
  ['spirits', 'Camara dos Espiritos', 'As mascaras ainda dormem.'],
  ['ritual', 'Sala do Ritual', 'O cofre chama de longe.'],
] as const

export function MapFixed({save,onEnter}:{save:SaveState;onEnter:(place:string)=>void}) {
  const [traveling, setTraveling] = useState<string | null>(null)
  const moveTo = (place:string) => {
    if (traveling) return
    setTraveling(place)
    window.setTimeout(() => onEnter(place), 650)
  }

  return <section className={`map scene bayou-scene ${traveling ? 'traveling' : ''}`} aria-label="Mapa panoramico da aventura">
    <div className="map-vignette" />
    <div className="map-title"><p>DO FRENCH QUARTER AO CORACAO DO PANTANO</p><h2>As trilhas do desejo</h2><small>O cofre observa alem da nevoa.</small></div>
    <div className="map-route route-one" /><div className="map-route route-two" />
    {places.map(([id,name,desc], i) => {
      const available = id === 'portal' || (id === 'cards' && save.portalDone)
      const complete = (id === 'portal' && save.portalDone) || (id === 'cards' && save.cardsDone)
      return <button key={id} type="button" className={`place place-${i} ${available ? 'open' : ''} ${complete ? 'done' : ''}`} disabled={!available || Boolean(traveling)} onClick={() => available && moveTo(id)}>
        <i aria-hidden="true">{complete ? '✦' : i === 0 ? '⌂' : '♠'}</i><strong>{name}</strong><small>{available ? desc : 'A nevoa ainda esconde este lugar'}</small>
      </button>
    })}
    <div className={`map-player ${save.portalDone ? 'moved' : ''}`} aria-label="Sua presenca no mapa">♙</div>
    <div className="vault-tree" aria-label="A grande arvore do Cofre das Sombras"><span>O COFRE DAS SOMBRAS</span></div>
    {traveling && <div className="travel-message" role="status">A trilha se move sob seus pes...</div>}
    {save.portalDone && <aside className="unlocked">VAGA-LUMES REVELAM A TRILHA<br/><b>SALA DAS CARTAS DESBLOQUEADA</b></aside>}
  </section>
}

export function CardsHall({onComplete}:{onComplete:()=>void}) {
  const [step,setStep] = useState<'story'|'puzzle'|'success'>('story')
  const [order,setOrder] = useState<string[]>([])
  const concepts = ['DESEJO','PROMESSA','PRECO','CONSEQUENCIA']
  const add = (concept:string) => { if (!order.includes(concept)) setOrder(current => [...current, concept]) }
  const solved = concepts.every((concept,index) => order[index] === concept)
  return <section className="card-hall scene bayou-scene" aria-label="Sala das Cartas">
    <div className="hall-curtains"/><div className="hall-table"/>
    {step === 'story' && <div className="dialogue"><p className="speaker">O HOMEM DAS SOMBRAS</p><p>Todo mundo quer alguma coisa. O interessante e descobrir o que entrega em troca.</p><button onClick={() => setStep('puzzle')}>EXAMINAR A MESA</button></div>}
    {step === 'puzzle' && <div className="agreement"><p className="speaker">O ACORDO</p><h2>Monte o caminho de uma promessa.</h2><p>Selecione as cartas na ordem em que um acordo cobra seu preco.</p><div className="agreement-slots" aria-label="Sequencia escolhida">{concepts.map((_,index)=><span key={index}>{order[index] || '—'}</span>)}</div><div className="agreement-cards">{concepts.map(concept=><button type="button" key={concept} disabled={order.includes(concept) || solved} onClick={() => add(concept)}>{concept}</button>)}</div>{order.length === 4 && !solved && <button className="reset-agreement" onClick={() => setOrder([])}>A SOMBRA CONFUNDIU A ORDEM — TENTAR DE NOVO</button>}{solved && <button className="claim" onClick={() => setStep('success')}>SELAR O ACORDO</button>}</div>}
    {step === 'success' && <div className="dialogue"><p className="speaker">NOVO ARTEFATO</p><h2>FRAGMENTO DO PERGAMINHO</h2><p>As velas se acendem. A proxima trilha ja conhece seu nome.</p><button onClick={onComplete}>VOLTAR AO MAPA</button></div>}
  </section>
}
