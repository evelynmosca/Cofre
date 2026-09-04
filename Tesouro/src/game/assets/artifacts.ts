export type ArtifactId = 'destiny' | 'scroll' | 'book' | 'crystal' | 'mask' | 'key'
export const artifacts: Record<ArtifactId, { name: string; symbol: string; description: string }> = {
  destiny: { name: 'Carta do Destino', symbol: '✦', description: 'A primeira promessa do outro lado.' },
  scroll: { name: 'Fragmento do Pergaminho', symbol: '⌇', description: 'Todo acordo possui um preço.' },
  book: { name: 'Livro das Sombras', symbol: '☽', description: 'Há verdades que não procuram ser lidas.' },
  crystal: { name: 'Cristal da Verdade', symbol: '◇', description: 'O reflexo não mente.' },
  mask: { name: 'Máscara dos Espíritos', symbol: '◉', description: 'Escute o que a sombra esconde.' },
  key: { name: 'Chave das Sombras', symbol: '⚚', description: 'A porta espera por quem se conhece.' },
}
