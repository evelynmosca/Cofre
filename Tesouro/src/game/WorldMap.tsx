import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import worldImage from '../assets/bayou-world-v2.png'
import { chapters } from './content'
import './map.css'

type WorldMapProps = {
  completed: number[]
  active: number
  onEnter: (chapter: number) => void
  onFinal: () => void
  finalUnlocked: boolean
  finalCompleted: boolean
}

const positions = [
  { x: 10, y: 57, label: 'left' },
  { x: 23, y: 47, label: 'right' },
  { x: 41, y: 52, label: 'left' },
  { x: 56, y: 41, label: 'right' },
  { x: 72, y: 49, label: 'left' },
  { x: 91, y: 54, label: 'right' },
]

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3M6 10h12v10H6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h15m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 12 4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WorldMap({
  completed,
  active,
  onEnter,
  onFinal,
  finalUnlocked,
  finalCompleted,
}: WorldMapProps) {
  const [selected, setSelected] = useState(Math.min(5, Math.max(0, active)))
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    pointer: number
    x: number
    y: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    setSelected(Math.min(5, Math.max(0, active)))
  }, [active])

  const chapter = chapters[selected]
  const isComplete = completed.includes(selected)
  const isAvailable = selected === 0 || completed.includes(selected - 1) || isComplete
  const previous = chapters[Math.max(0, selected - 1)]
  const number = String(selected + 1).padStart(2, '0')

  function boundedPan(x: number, y: number, nextZoom = zoom) {
    const bounds = viewport.current?.getBoundingClientRect()
    const maxX = ((bounds?.width ?? 0) * (nextZoom - 1)) / 2
    const maxY = ((bounds?.height ?? 0) * (nextZoom - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }

  function changeZoom(delta: number) {
    const nextZoom = Math.round(Math.max(1, Math.min(2.2, zoom + delta)) * 10) / 10
    setZoom(nextZoom)
    setPan((current) => boundedPan(current.x, current.y, nextZoom))
  }

  function resetMap() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1 || (event.target as HTMLElement).closest('button')) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointer !== event.pointerId) return
    setPan(
      boundedPan(
        drag.current.originX + event.clientX - drag.current.x,
        drag.current.originY + event.clientY - drag.current.y,
      ),
    )
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleMapKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || zoom <= 1) return
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [48, 0],
      ArrowRight: [-48, 0],
      ArrowUp: [0, 48],
      ArrowDown: [0, -48],
    }
    if (event.key === 'Home') {
      event.preventDefault()
      resetMap()
      return
    }
    const direction = directions[event.key]
    if (direction) {
      event.preventDefault()
      setPan((current) => boundedPan(current.x + direction[0], current.y + direction[1]))
    }
  }

  return (
    <section
      className={`wm-map ${finalUnlocked ? 'wm-map-final-ready' : ''}`}
      aria-label="Mapa interativo do Bayou"
    >
      <div className="wm-rail">
        <span className="wm-rail-title">
          <span className="wm-spark" aria-hidden="true">
            ✦
          </span>{' '}
          ATLAS DO BAYOU
        </span>
        <span className="wm-coordinates">29°57′ N &nbsp; 90°04′ W</span>
        <button
          className={`wm-help-toggle ${helpOpen ? 'wm-is-on' : ''}`}
          type="button"
          aria-expanded={helpOpen}
          aria-controls="wm-instructions"
          onClick={() => setHelpOpen(!helpOpen)}
        >
          <span aria-hidden="true">?</span> Como explorar
        </button>
      </div>

      {helpOpen && (
        <div className="wm-instructions" id="wm-instructions">
          <span aria-hidden="true">✧</span>
          <p>
            Escolha um dos seis destinos e selecione <strong>Explorar região</strong>. Reúna um selo
            em cada atividade para revelar o próximo caminho. Use + para aproximar e arraste o mapa.
            No teclado, use Tab para escolher os destinos e as setas para mover o mapa ampliado.
          </p>
          <button
            type="button"
            aria-label="Fechar instruções do mapa"
            onClick={() => setHelpOpen(false)}
          >
            ×
          </button>
        </div>
      )}

      <div
        ref={viewport}
        className={`wm-viewport ${zoom > 1 ? 'wm-zoomed' : ''} ${dragging ? 'wm-dragging' : ''}`}
        tabIndex={0}
        role="region"
        aria-label={`Paisagem interativa. Ampliação ${Math.round(zoom * 100)}%. Seis destinos. Use Tab para explorar.`}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          drag.current = null
          setDragging(false)
        }}
        onKeyDown={handleMapKey}
      >
        <div
          className="wm-world"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img
            className="wm-painting"
            src={worldImage}
            alt="Sob a lua de Nova Orleans, passarelas atravessam o pântano e conectam um portal de madeira, uma tenda de cartas, uma biblioteca, um casarão iluminado, máscaras espirituais e um cofre em uma árvore antiga."
            draggable={false}
          />
          <div className="wm-painting-shade" />
          <svg className="wm-route" viewBox="0 0 1672 941" fill="none" aria-hidden="true">
            <path
              className="wm-route-shadow"
              d="M167 605 C250 674 310 635 385 554 S570 655 685 600 S815 559 937 518 S1085 630 1204 579 S1400 693 1522 607"
            />
            <path
              className="wm-route-line"
              d="M167 605 C250 674 310 635 385 554 S570 655 685 600 S815 559 937 518 S1085 630 1204 579 S1400 693 1522 607"
            />
          </svg>
          <div className="wm-fireflies" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${8 + ((i * 23) % 86)}%`,
                  top: `${31 + ((i * 17) % 48)}%`,
                  animationDelay: `${i * -0.73}s`,
                  animationDuration: `${4 + (i % 4)}s`,
                }}
              />
            ))}
          </div>
          {chapters.map((place, index) => {
            const position = positions[index]
            const done = completed.includes(index)
            const available = index === 0 || completed.includes(index - 1) || done
            const selectedPin = selected === index
            return (
              <button
                type="button"
                key={place.id}
                className={`wm-pin ${available ? 'wm-pin-open' : 'wm-pin-locked'} ${done ? 'wm-pin-done' : ''} ${selectedPin ? 'wm-pin-selected' : ''} wm-label-${position.label}`}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                onClick={() => setSelected(index)}
                aria-label={`${index + 1}. ${place.title}. ${done ? 'Concluído' : available ? 'Disponível para explorar' : `Bloqueado. Conclua ${chapters[index - 1]?.title} para entrar`}`}
                aria-pressed={selectedPin}
              >
                <span className="wm-pin-halo" />
                <span className="wm-pin-marker">
                  {done ? (
                    <CheckIcon />
                  ) : available ? (
                    String(index + 1).padStart(2, '0')
                  ) : (
                    <LockIcon />
                  )}
                </span>
                <span className="wm-pin-caption">
                  <small>
                    {done ? 'SELO RECUPERADO' : available ? 'CAMINHO ABERTO' : 'AINDA NA NÉVOA'}
                  </small>
                  <strong>{place.title}</strong>
                </span>
                <span className="wm-pin-stem" />
              </button>
            )
          })}
        </div>

        <div className="wm-scene-caption" aria-hidden="true">
          <span>LOUISIANA, 1926</span>
          <p>O outro lado está mais perto do que parece.</p>
        </div>
        <div className="wm-compass" aria-hidden="true">
          <span>N</span>
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="23" stroke="currentColor" strokeOpacity=".3" />
            <path
              d="m32 5 5 22 22 5-22 5-5 22-5-22-22-5 22-5z"
              stroke="currentColor"
              strokeWidth=".7"
            />
            <path d="m32 14 5 18-5 18-5-18z" fill="currentColor" fillOpacity=".7" />
            <circle cx="32" cy="32" r="3" fill="#0c1b1a" stroke="currentColor" />
          </svg>
        </div>
        <div
          className="wm-controls"
          aria-label="Controles do mapa"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Aproximar mapa"
            disabled={zoom >= 2.2}
            onClick={() => changeZoom(0.3)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Afastar mapa"
            disabled={zoom <= 1}
            onClick={() => changeZoom(-0.3)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="wm-reset"
            type="button"
            aria-label="Restaurar visão completa do mapa"
            title="Visão completa"
            onClick={resetMap}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="wm-selection-hint">
          <span className="wm-hint-dot" />
          {zoom > 1 ? 'Arraste para descobrir cada detalhe' : 'Escolha um destino para explorar'}
        </div>
      </div>

      <div
        className={`wm-destination ${!isAvailable ? 'wm-destination-locked' : ''}`}
        aria-live="polite"
      >
        <div className="wm-destination-emblem" aria-hidden="true">
          {isComplete ? <CheckIcon /> : !isAvailable ? <LockIcon /> : chapter.symbol}
          <span>{number}</span>
        </div>
        <div className="wm-destination-copy">
          <p className="wm-destination-kicker">
            CAPÍTULO {number}
            <span /> {chapter.location}
          </p>
          <h3>{chapter.title}</h3>
          <p className="wm-destination-description">
            {isAvailable
              ? chapter.description
              : `A névoa se dissipa depois de concluir ${previous.title}.`}
          </p>
        </div>
        <div className="wm-destination-actions">
          <span className={`wm-status ${isComplete ? 'wm-status-complete' : ''}`}>
            {isComplete ? (
              <>
                <CheckIcon /> Selo recuperado
              </>
            ) : isAvailable ? (
              <>
                <span className="wm-status-light" />
                Pronto para explorar
              </>
            ) : (
              <>
                <LockIcon />
                Caminho bloqueado
              </>
            )}
          </span>
          <button
            className="wm-enter"
            type="button"
            disabled={!isAvailable}
            onClick={() => onEnter(selected)}
          >
            {isComplete ? 'Revisitar região' : 'Explorar região'}
            {isAvailable ? <ArrowIcon /> : <LockIcon />}
          </button>
          {finalUnlocked && (
            <button className="wm-final-shortcut" type="button" onClick={onFinal}>
              {finalCompleted ? 'Rever o desfecho' : 'Abrir o cofre'}
              <ArrowIcon />
            </button>
          )}
        </div>
      </div>

      {finalUnlocked && (
        <div className="wm-vault-callout">
          <div>
            <span className="wm-vault-symbol" aria-hidden="true">
              ✦
            </span>
            <p>
              <strong>
                {finalCompleted
                  ? 'O Bayou conhece a sua história.'
                  : 'Os seis selos estão reunidos.'}
              </strong>
              <span>
                {finalCompleted
                  ? 'Você pode retornar ao último encontro.'
                  : 'A árvore antiga finalmente abriu o caminho.'}
              </span>
            </p>
          </div>
          <button type="button" onClick={onFinal}>
            {finalCompleted ? 'Rever o desfecho' : 'Abrir o cofre'}
            <ArrowIcon />
          </button>
        </div>
      )}

      <div className="wm-map-legend" aria-label="Legenda do mapa">
        <span>
          <i className="wm-legend-open" />
          Disponível
        </span>
        <span>
          <i className="wm-legend-done" />
          Concluído
        </span>
        <span>
          <i className="wm-legend-locked" />
          Bloqueado
        </span>
        <p>
          {completed.filter((id) => id >= 0 && id < chapters.length).length} de {chapters.length}{' '}
          selos encontrados
        </p>
      </div>
    </section>
  )
}
