// Node's built-in TypeScript runner runs these tests without an additional test dependency.
// @ts-ignore Node's test modules are provided by the runtime, not the browser type bundle.
import test from 'node:test'
// @ts-ignore See the runtime note above.
import assert from 'node:assert/strict'
import {
  initialState,
  loadGame,
  saveGame,
  canEnter,
  enterChapter,
  completeChapter,
  resumeGame,
  STORAGE_KEY,
} from './state.ts'
import type { GameState } from './state'

const values = new Map<string, string>()
const memoryStorage: Storage = {
  get length() {
    return values.size
  },
  clear() {
    values.clear()
  },
  getItem(key) {
    return values.get(key) ?? null
  },
  key(index) {
    return [...values.keys()][index] ?? null
  },
  removeItem(key) {
    values.delete(key)
  },
  setItem(key, value) {
    values.set(key, value)
  },
}
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage })
const fresh = (patch: Partial<GameState> = {}): GameState => ({
  ...initialState,
  completed: [],
  discovered: [],
  ...patch,
})

test('the map unlocks the contiguous route and revisits preserve every earned chapter', () => {
  let state = fresh()
  assert.equal(canEnter(state, 0), true)
  assert.equal(canEnter(state, 1), false)
  for (let n = 0; n < 6; n += 1) {
    state = completeChapter(enterChapter(state, n))
    assert.deepEqual(
      state.completed,
      Array.from({ length: n + 1 }, (_, i) => i),
    )
    assert.equal(state.view, 'map')
  }
  const revisited = completeChapter(enterChapter(state, 0))
  assert.deepEqual(revisited.completed, [0, 1, 2, 3, 4, 5])
  assert.equal(canEnter(revisited, 5), true)
  assert.equal(revisited.completed.length, 6)
})

test('locked and invalid chapters cannot be entered or completed', () => {
  const state = fresh()
  for (const n of [-1, 1, 5, 6, 1.5, NaN]) {
    assert.equal(canEnter(state, n), false)
    assert.equal(enterChapter(state, n), state)
    const invalid = { ...state, active: n }
    assert.equal(completeChapter(invalid), invalid)
  }
})

test('chapter zero and its partial investigation survive a map visit and resume', () => {
  const partial = fresh({ view: 'stage', discovered: [0, 2], startedAt: 1234 })
  const resumed = resumeGame(partial)
  assert.equal(resumed.active, 0)
  assert.equal(resumed.view, 'stage')
  const returned = enterChapter({ ...partial, view: 'map' }, 0)
  assert.deepEqual(returned.discovered, [0, 2])
  assert.equal(returned.startedAt, 1234)
})

test('replaying a location keeps final progress while resetting that exploration', () => {
  const state = fresh({
    completed: [0, 1, 2, 3, 4, 5],
    active: 5,
    ritual: true,
    key: true,
    circle: true,
    lessons: true,
    phase: 'reward',
    discovered: [0, 1, 2],
  })
  const replay = enterChapter(state, 0)
  assert.deepEqual(replay.discovered, [])
  assert.equal(replay.phase, 'explore')
  assert.equal(replay.ritual && replay.key && replay.circle && replay.lessons, true)
  assert.equal(resumeGame(replay).view, 'vault')
})

test('resume follows the saved activity, ritual, vault, and completed ending', () => {
  assert.equal(resumeGame(fresh({ view: 'intro' })).view, 'intro')
  assert.equal(resumeGame(fresh({ view: 'map', active: 2, completed: [0, 1] })).view, 'map')
  assert.equal(
    resumeGame(fresh({ view: 'stage', phase: 'puzzle', discovered: [0, 1, 2] })).phase,
    'puzzle',
  )
  const all = fresh({ completed: [0, 1, 2, 3, 4, 5] })
  assert.equal(resumeGame(all).view, 'ritual')
  assert.equal(resumeGame({ ...all, ritual: true }).view, 'vault')
  assert.equal(
    resumeGame({ ...all, ritual: true, wish: 'Concluir meu curso', endedAt: 500 }).view,
    'ending',
  )
})

test('new saves round trip without losing quiz or final answers', () => {
  values.clear()
  const state = fresh({
    view: 'stage',
    phase: 'quiz',
    discovered: [0, 1, 2],
    startedAt: 100,
    wish: 'Concluir meu curso',
    care: 'Estudar e cuidar de quem caminha comigo.',
  })
  assert.equal(saveGame(state), true)
  assert.deepEqual(loadGame(), state)
})

test('corrupt, null, wrong-version, and inaccessible saves fall back safely', () => {
  for (const stored of ['{invalid', 'null', '[]', '{"version":2}', '42']) {
    values.clear()
    values.set(STORAGE_KEY, stored)
    assert.deepEqual(loadGame(), initialState)
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked')
    },
  })
  assert.deepEqual(loadGame(), initialState)
  assert.equal(saveGame(fresh()), false)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage })
})

test('invalid fields cannot skip chapters or jump directly into the vault', () => {
  values.clear()
  values.set(
    STORAGE_KEY,
    JSON.stringify({
      version: 3,
      view: 'vault',
      active: 5,
      completed: [0, 0, 2, 3, '1'],
      phase: 'reward',
      discovered: [0, 0, 9, '1'],
      ritual: true,
      key: true,
      circle: true,
      lessons: true,
      startedAt: -5,
      wish: {},
      care: false,
      endedAt: 500,
    }),
  )
  const state = loadGame()
  assert.deepEqual(state.completed, [0])
  assert.equal(state.active, 1)
  assert.equal(canEnter(state, 2), false)
  assert.equal(state.view, 'map')
  assert.equal(state.phase, 'explore')
  assert.deepEqual(state.discovered, [0])
  assert.equal(state.ritual || state.key || state.circle || state.lessons, false)
  assert.equal(state.endedAt, 0)
  assert.equal(state.wish, '')
})

test('legacy progress migrates from completed chapters, never from the selected stage', () => {
  values.clear()
  values.set(
    'cofre-sombras-v2',
    JSON.stringify({
      v: 2,
      view: 'map',
      stage: 5,
      done: [0, 1, 1, 3],
      started: 100,
      items: ['Chave das Sombras'],
      ritual: true,
    }),
  )
  const migrated = loadGame()
  assert.deepEqual(migrated.completed, [0, 1])
  assert.equal(migrated.active, 2)
  assert.equal(migrated.ritual, false)
  assert.equal(migrated.startedAt, 100)
  assert.equal(canEnter(migrated, 3), false)
  saveGame(fresh())
  assert.deepEqual(loadGame(), initialState)
})

test('legacy revisits retain the furthest completed location and all six artifacts', () => {
  values.clear()
  values.set(
    'cofre-sombras-v2',
    JSON.stringify({
      v: 2,
      view: 'stage',
      stage: 0,
      done: [5, 4, 3, 2, 1, 0],
      started: 100,
      ritual: true,
      key: true,
    }),
  )
  const migrated = loadGame()
  assert.deepEqual(migrated.completed, [0, 1, 2, 3, 4, 5])
  assert.equal(migrated.active, 0)
  assert.equal(migrated.key, true)
  assert.equal(resumeGame(migrated).view, 'vault')
})

test('ending duration remains fixed after a saved ending is reopened', () => {
  values.clear()
  const state = fresh({
    view: 'ending',
    completed: [0, 1, 2, 3, 4, 5],
    active: 5,
    ritual: true,
    key: true,
    circle: true,
    lessons: true,
    startedAt: 100,
    endedAt: 60100,
    wish: 'Construir meu caminho',
    care: 'Com dedicação e respeito.',
  })
  saveGame(state)
  assert.equal(loadGame().endedAt, 60100)
  assert.equal(resumeGame(loadGame()).view, 'ending')
})
