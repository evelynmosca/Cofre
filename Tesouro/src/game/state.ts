export type View = 'home' | 'intro' | 'map' | 'stage' | 'ritual' | 'vault' | 'ending'

export type GameState = {
  version: 3
  view: View
  active: number
  completed: number[]
  phase: 'explore' | 'quiz' | 'puzzle' | 'reward'
  discovered: number[]
  ritual: boolean
  key: boolean
  circle: boolean
  lessons: boolean
  wish: string
  care: string
  startedAt: number
  endedAt: number
}

export const STORAGE_KEY = 'cofre-sombras-v3'
const LEGACY_KEY = 'cofre-sombras-v2'
const views: View[] = ['home', 'intro', 'map', 'stage', 'ritual', 'vault', 'ending']
const phases: GameState['phase'][] = ['explore', 'quiz', 'puzzle', 'reward']

export const initialState: GameState = {
  version: 3,
  view: 'home',
  active: 0,
  completed: [],
  phase: 'explore',
  discovered: [],
  ritual: false,
  key: false,
  circle: false,
  lessons: false,
  wish: '',
  care: '',
  startedAt: 0,
  endedAt: 0,
}

const freshState = (): GameState => ({ ...initialState, completed: [], discovered: [] })
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
const text = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 2000) : '')
const timestamp = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

// Only a contiguous sequence starting at zero can unlock the next location.
function completedPrefix(value: unknown): number[] {
  const valid = new Set(Array.isArray(value) ? value.filter((n) => integer(n, 0, 5)) : [])
  const prefix: number[] = []
  for (let n = 0; n < 6 && valid.has(n); n += 1) prefix.push(n)
  return prefix
}

function normalize(value: Record<string, unknown>): GameState {
  const completed = completedPrefix(value.completed)
  const active = integer(value.active, 0, Math.min(completed.length, 5))
    ? value.active
    : Math.min(completed.length, 5)
  const discovered = [
    ...new Set(
      Array.isArray(value.discovered)
        ? value.discovered.filter((n): n is number => integer(n, 0, 2))
        : [],
    ),
  ].sort()
  const proposedPhase = phases.includes(value.phase as GameState['phase'])
    ? (value.phase as GameState['phase'])
    : 'explore'
  const ritual = completed.length === 6 && value.ritual === true
  const key = ritual && value.key === true
  const circle = key && value.circle === true
  const lessons = circle && value.lessons === true
  const wish = text(value.wish)
  const startedAt = timestamp(value.startedAt)
  const endedAt =
    lessons && wish.trim() && startedAt && timestamp(value.endedAt) >= startedAt
      ? timestamp(value.endedAt)
      : 0
  let view: View = views.includes(value.view as View) ? (value.view as View) : 'map'
  if (
    (view === 'ritual' && completed.length < 6) ||
    (view === 'vault' && !ritual) ||
    (view === 'ending' && !endedAt)
  )
    view = 'map'
  return {
    version: 3,
    view,
    active,
    completed,
    phase: discovered.length === 3 ? proposedPhase : 'explore',
    discovered,
    ritual,
    key,
    circle,
    lessons,
    wish,
    care: text(value.care),
    startedAt,
    endedAt,
  }
}

function migrate(value: Record<string, unknown>): GameState {
  // v2 used "stage" both for selection and unlocks. The completed prefix is authoritative.
  return normalize({
    ...value,
    completed: value.done,
    active: value.stage,
    startedAt: value.started,
    phase: 'explore',
    discovered: [],
    // v2 did not retain a finish time; do not invent an elapsed time on every load.
    endedAt:
      value.view === 'ending' && typeof value.wish === 'string' && value.wish.trim()
        ? Date.now()
        : 0,
  })
}

export function loadGame(): GameState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const value: unknown = JSON.parse(stored)
      return record(value) && value.version === 3 ? normalize(value) : freshState()
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy === null) return freshState()
    const value: unknown = JSON.parse(legacy)
    return record(value) && value.v === 2 ? migrate(value) : freshState()
  } catch {
    return freshState()
  }
}

export function saveGame(state: GameState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function canEnter(state: GameState, chapter: number): boolean {
  return integer(chapter, 0, 5) && chapter <= completedPrefix(state.completed).length
}

export function enterChapter(state: GameState, chapter: number): GameState {
  if (!canEnter(state, chapter)) return state
  const continuing = chapter === state.active && !state.completed.includes(chapter)
  return {
    ...state,
    view: 'stage',
    active: chapter,
    phase: continuing ? state.phase : 'explore',
    discovered: continuing ? [...state.discovered] : [],
    startedAt: state.startedAt || Date.now(),
  }
}

export function completeChapter(state: GameState): GameState {
  if (!canEnter(state, state.active)) return state
  const completed = completedPrefix([...state.completed, state.active])
  return { ...state, view: 'map', completed, phase: 'explore', discovered: [] }
}

export function resumeGame(state: GameState): GameState {
  if (state.wish.trim() && state.endedAt > 0) return { ...state, view: 'ending' }
  if (state.ritual) return { ...state, view: 'vault' }
  if (state.completed.length === 6) return { ...state, view: 'ritual' }
  if (state.view === 'stage' && canEnter(state, state.active)) return { ...state, view: 'stage' }
  if (state.view === 'intro') return { ...state, view: 'intro' }
  return { ...state, view: 'map' }
}
