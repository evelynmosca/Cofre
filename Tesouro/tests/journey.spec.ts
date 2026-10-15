import { expect, test, type Page } from '@playwright/test'

const destinations = [
  'Portal das Sombras',
  'Sala das Cartas',
  'Biblioteca do Outro Lado',
  'Galeria dos Espelhos',
  'Câmara dos Espíritos',
  'Árvore das Sombras',
]
const artifacts = [
  'Carta do Destino',
  'Fragmento do Pergaminho',
  'Livro das Sombras',
  'Cristal da Verdade',
  'Máscara dos Espíritos',
  'Chave das Sombras',
]
const truths = [
  'Um preço',
  'A consequência',
  'Aquilo que lhes pertence',
  'O que mostra só o que desejamos',
  'Em compreender o desejo',
  'Conhecer o próprio desejo',
]
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function enterRegion(page: Page, index: number) {
  await page
    .getByRole('button', { name: new RegExp(`^${index + 1}\\. ${escape(destinations[index])}\\.`) })
    .click()
  await page.getByRole('button', { name: 'Explorar região', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: destinations[index], exact: true, level: 1 }),
  ).toBeVisible()
}

async function investigate(page: Page, index: number) {
  await expect(
    page.getByRole('button', { name: 'Investigue os 3 sinais restantes' }),
  ).toBeDisabled()
  for (let clue = 0; clue < 3; clue++) await page.locator('.discovery-card').nth(clue).click()
  await page.getByRole('button', { name: 'Escutar a carta' }).click()
  if (index === 0) {
    await page
      .locator('.quiz-answers button')
      .filter({ hasText: 'Uma recompensa garantida' })
      .click()
    await expect(page.getByRole('status')).toContainText('atalho')
  }
  await page.locator('.quiz-answers button').filter({ hasText: truths[index] }).click()
  await page.getByRole('button', { name: 'Entrar no desafio' }).click()
}

// Solve using only the labels a player receives after revealing a card.
// The deck and React state are never read or changed by this test.
async function solveMemory(page: Page) {
  const cards = page.getByRole('button', { name: /^Carta \d+:/ })
  await expect(cards).toHaveCount(12)
  const remembered = new Map<number, string>()
  const matched = new Set<number>()
  async function reveal(index: number) {
    await cards.nth(index).click()
    const label = await cards.nth(index).getAttribute('aria-label')
    const symbol = label!.replace(/^Carta \d+: /, '').replace(', par encontrado', '')
    expect(symbol).not.toBe('fechada')
    remembered.set(index, symbol)
    return symbol
  }
  while (matched.size < 12) {
    const known = [...remembered.entries()].filter(([index]) => !matched.has(index))
    let pair: [number, number] | undefined
    for (const [index, symbol] of known) {
      const other = known.find(
        ([otherIndex, otherSymbol]) => otherIndex !== index && otherSymbol === symbol,
      )
      if (other) {
        pair = [index, other[0]]
        break
      }
    }
    const first =
      pair?.[0] ??
      Array.from({ length: 12 }, (_, i) => i).find((i) => !matched.has(i) && !remembered.has(i))!
    const firstSymbol = await reveal(first)
    const rememberedMatch = [...remembered.entries()].find(
      ([i, symbol]) => i !== first && !matched.has(i) && symbol === firstSymbol,
    )
    const second =
      pair?.[1] ??
      rememberedMatch?.[0] ??
      Array.from({ length: 12 }, (_, i) => i).find(
        (i) => i !== first && !matched.has(i) && !remembered.has(i),
      )!
    const secondSymbol = await reveal(second)
    if (firstSymbol === secondSymbol) {
      matched.add(first)
      matched.add(second)
      await expect(cards.nth(first)).toBeDisabled()
      await expect(cards.nth(second)).toBeDisabled()
    } else {
      await expect(cards.nth(first)).toHaveAttribute('aria-label', `Carta ${first + 1}: fechada`)
      await expect(cards.nth(second)).toHaveAttribute('aria-label', `Carta ${second + 1}: fechada`)
    }
  }
  await expect(page.locator('.px-progress')).toContainText('6 / 6 pares')
}

const agreements = [
  [
    'Ela deseja abrir o próprio restaurante.',
    'O estranho promete um salão pronto nesta noite.',
    'Ela precisa entregar todas as economias da família.',
    'A família fica sem reserva para uma emergência.',
  ],
  [
    'O músico deseja ter seu talento reconhecido.',
    'A máscara promete fama e aplausos imediatos.',
    'Ele terá que abandonar sua identidade e mentir.',
    'Seus amigos descobrem a mentira e perdem a confiança.',
  ],
  [
    'O viajante deseja voltar para casa.',
    'O barqueiro promete uma travessia segura.',
    'O viajante deve entregar o medalhão da avó.',
    'Ele fica sem a última lembrança de sua avó.',
  ],
]

async function solveAgreements(page: Page) {
  for (let round = 0; round < 3; round++) {
    if (round === 0) {
      for (const step of [2, 0, 3, 1])
        await page
          .locator('.px-choice-grid button')
          .filter({ hasText: agreements[round][step] })
          .click()
      await page.getByRole('button', { name: 'Revelar o acordo' }).click()
      await expect(page.locator('.px-feedback-error')).toContainText('0 de 4 posições')
      await page.getByRole('button', { name: 'Limpar ordem' }).click()
    }
    for (const step of agreements[round])
      await page.locator('.px-choice-grid button').filter({ hasText: step }).click()
    await page.getByRole('button', { name: 'Revelar o acordo' }).click()
    await expect(page.locator('.px-feedback-success')).toContainText('Acordo decifrado')
    if (round < 2) await page.getByRole('button', { name: 'Examinar o próximo acordo' }).click()
  }
}

async function solveMirrors(page: Page) {
  for (let round = 0; round < 3; round++) {
    const reference = await page
      .getByRole('img', { name: /^Referência:/ })
      .getAttribute('aria-label')
    const target = reference!.replace('Referência: ', '')
    const choices = page.locator('.px-shadow-choice')
    await expect(choices).toHaveCount(4)
    const targetName = new RegExp(`^Espelho [A-D]: ${escape(target)}$`)
    if (round === 0) {
      const labels = await choices.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('aria-label') || ''),
      )
      const wrongIndex = labels.findIndex((label) => !targetName.test(label))
      await choices.nth(wrongIndex).click()
      await expect(page.locator('.px-feedback-error')).toContainText('Há uma diferença')
    }
    await page.getByRole('button', { name: targetName }).click()
    await expect(page.locator('.px-feedback-success')).toContainText('três detalhes correspondem')
    if (round < 2) await page.getByRole('button', { name: 'Atravessar o próximo espelho' }).click()
  }
}

async function solveJudgment(page: Page) {
  const answers = [
    'Desejo',
    'Escolha',
    'Preço',
    'Consequência',
    'Desejo',
    'Escolha',
    'Preço',
    'Consequência',
  ]
  for (let index = 0; index < answers.length; index++) {
    if (index === 0) {
      await page.locator('.px-mask-options button').filter({ hasText: 'Preço' }).click()
      await expect(page.locator('.px-feedback-error')).toContainText('Reconsidere')
    }
    await page.locator('.px-mask-options button').filter({ hasText: answers[index] }).click()
    await expect(page.locator('.px-feedback-success')).toBeVisible()
    if (index < 7) await page.getByRole('button', { name: 'Ouvir a próxima situação' }).click()
  }
}

async function answerReview(page: Page, correct: boolean[]) {
  for (let index = 0; index < 5; index++) {
    const options = page.locator('.px-answers button')
    if (correct[index]) await options.filter({ hasText: truths[index] }).click()
    else await options.filter({ hasNotText: truths[index] }).first().click()
    await expect(options.first()).toBeDisabled()
    await page
      .getByRole('button', { name: index === 4 ? 'Revelar meu resultado' : 'Próxima lembrança' })
      .click()
  }
}

async function chooseSequence(page: Page, labels: string[]) {
  for (const label of labels)
    await page
      .locator('.px-sequence-supply button')
      .filter({ has: page.locator('b', { hasText: new RegExp(`^${escape(label)}$`) }) })
      .click()
}

async function assertNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(widths.content, 'A página deve caber na largura do dispositivo').toBeLessThanOrEqual(
    widths.viewport,
  )
}

test('jornada real: seis capítulos, ritual, selos, desejo e lembrança para download', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /O Cofre.*das Sombras/ })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: 'Iniciar minha jornada' }).click()
  for (let index = 0; index < 2; index++)
    await page.getByRole('button', { name: 'Continuar a história' }).click()
  await page.getByRole('button', { name: 'Abrir o mapa', exact: true }).click()
  await page.getByRole('button', { name: /^2\. Sala das Cartas\./ }).click()
  await expect(page.getByRole('button', { name: 'Explorar região', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Aproximar mapa' }).click()
  const map = page.getByRole('region', { name: /Paisagem interativa/ })
  await expect(map).toHaveAttribute('aria-label', /Ampliação 130%/)
  const position = await page.locator('.wm-world').getAttribute('style')
  await map.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.wm-world')).not.toHaveAttribute('style', position!)
  await page.getByRole('button', { name: 'Restaurar visão completa do mapa' }).click()
  await expect(map).toHaveAttribute('aria-label', /Ampliação 100%/)
  await page.getByRole('button', { name: /^1\. Portal das Sombras\./ }).click()
  await page.screenshot({ path: testInfo.outputPath('map-desktop.png'), fullPage: true })

  for (let chapter = 0; chapter < 6; chapter++) {
    await test.step(`Capítulo ${chapter + 1}: ${destinations[chapter]}`, async () => {
      await enterRegion(page, chapter)
      if (chapter === 0)
        await page.screenshot({ path: testInfo.outputPath('chapter-desktop.png'), fullPage: true })
      await investigate(page, chapter)
      await page.setViewportSize({ width: 390, height: 844 })
      await assertNoHorizontalOverflow(page)
      await page.screenshot({
        path: testInfo.outputPath(`puzzle-${chapter + 1}-mobile.png`),
        fullPage: true,
      })
      await page.setViewportSize({ width: 1440, height: 1000 })
      if (chapter === 0) await solveMemory(page)
      if (chapter === 1) await solveAgreements(page)
      if (chapter === 2) {
        await page.getByRole('button', { name: /^Volume 2,/ }).click()
        await expect(page.locator('.px-feedback-error')).toContainText('2 marcas')
        await page.getByRole('button', { name: /^Volume 8,/ }).click()
        await expect(page.locator('.px-feedback-success')).toContainText('Livro das Sombras')
      }
      if (chapter === 3) await solveMirrors(page)
      if (chapter === 4) await solveJudgment(page)
      if (chapter === 5) {
        await answerReview(page, [true, true, true, true, false])
        await expect(page.locator('.px-score')).toContainText('4/5')
        await expect(page.locator('.px-score-pass')).toBeVisible()
      }
      await page.getByRole('button', { name: 'Recolher artefato' }).click()
      await expect(
        page.getByRole('heading', { name: artifacts[chapter], exact: true }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Guardar e voltar ao mapa' }).click()
      await expect(page.locator('.wm-map-legend')).toContainText(
        `${chapter + 1} de 6 selos encontrados`,
      )
      if (chapter === 0) {
        await page.getByRole('button', { name: /Meu diário/ }).click()
        const journal = page.getByRole('dialog', { name: 'Diário do viajante' })
        await expect(journal.locator('.journal-grid .collected')).toHaveCount(1)
        await expect(journal).toContainText('Carta do Destino')
        await page.screenshot({ path: testInfo.outputPath('journal-desktop.png'), fullPage: true })
        await journal.getByRole('tab', { name: 'Pistas da jornada' }).click()
        await expect(journal.getByRole('tabpanel')).toContainText('Antes de aceitar uma promessa')
        await page.keyboard.press('Escape')
      }
    })
  }

  await page.getByRole('button', { name: 'Abrir o cofre', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirmar sequência' })).toBeDisabled()
  await chooseSequence(page, [artifacts[2]])
  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(page.locator('.px-sequence-slots .px-filled')).toHaveCount(0)
  await chooseSequence(page, [...artifacts.slice(0, 5)].reverse())
  await page.getByRole('button', { name: 'Confirmar sequência' }).click()
  await expect(page.locator('.px-slot-wrong')).toHaveCount(4)
  await page.getByRole('button', { name: 'Limpar', exact: true }).click()
  await chooseSequence(page, artifacts.slice(0, 5))
  await page.getByRole('button', { name: 'Confirmar sequência' }).click()
  await page.getByRole('button', { name: 'Despertar o cofre' }).click()
  await page.getByRole('button', { name: 'Usar a Chave das Sombras' }).click()
  await chooseSequence(page, artifacts)
  await page.getByRole('button', { name: 'Confirmar sequência' }).click()
  await page.getByRole('button', { name: 'Romper o primeiro selo' }).click()
  await chooseSequence(page, ['Desejo', 'Escolha', 'Preço', 'Consequência'])
  await page.getByRole('button', { name: 'Confirmar sequência' }).click()
  await page.getByRole('button', { name: 'Abrir o coração do cofre' }).click()
  const seal = page.getByRole('button', { name: 'Selar meu desejo' })
  await expect(seal).toBeDisabled()
  const wish = 'Concluir meu curso e construir meu próprio caminho.'
  await page.getByLabel('Meu verdadeiro desejo').fill(wish)
  await expect(seal).toBeDisabled()
  await page
    .getByLabel('Como vou realizá-lo com responsabilidade')
    .fill('Vou estudar com constância, pedir ajuda e respeitar as pessoas ao meu redor.')
  await seal.click()
  await expect(page.getByRole('heading', { name: /O verdadeiro tesouro/ })).toBeVisible()
  await expect(page.locator('.wish-keepsake')).toContainText(wish)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Guardar meu desejo' }).click()
  expect((await download).suggestedFilename()).toBe('meu-desejo-cofre-das-sombras.txt')
  await page.screenshot({ path: testInfo.outputPath('ending-desktop.png'), fullPage: true })
  await page.reload()
  await page.getByRole('button', { name: 'Continuar minha jornada' }).click()
  await expect(page.getByRole('heading', { name: /O verdadeiro tesouro/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('preferências reais, música, foco de modal e continuação de uma exploração parcial', async ({
  page,
}) => {
  await page.goto('/')
  const sound = page.getByRole('button', { name: 'Ativar som ambiente', exact: true })
  await sound.click()
  await expect(
    page.getByRole('button', { name: 'Desativar som ambiente', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  const settingsButton = page.getByRole('button', { name: 'Configurações', exact: true })
  await settingsButton.click()
  const settings = page.getByRole('dialog', { name: 'Configurações' })
  await expect(settings.getByRole('button', { name: 'Fechar janela' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(settings.getByRole('checkbox', { name: /Animações de ambiente/ })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(settings.getByRole('button', { name: 'Fechar janela' })).toBeFocused()
  await expect(settings.getByRole('checkbox', { name: /Som ambiente/ })).toBeChecked()
  await settings.getByRole('checkbox', { name: /Efeitos de interação/ }).uncheck()
  await settings.getByRole('checkbox', { name: /Animações de ambiente/ }).uncheck()
  const volume = settings.getByRole('slider')
  await volume.press('Home')
  for (let i = 0; i < 4; i++) await volume.press('ArrowRight')
  await expect(volume).toHaveValue('0.2')
  await expect(settings).toContainText('20%')
  await page.keyboard.press('Escape')
  await expect(settings).toBeHidden()
  await expect(settingsButton).toBeFocused()
  await page.getByRole('button', { name: 'Iniciar minha jornada' }).click()
  await page.getByRole('button', { name: 'Ir direto ao mapa' }).click()
  await enterRegion(page, 0)
  await page.locator('.discovery-card').first().click()
  await expect(page.locator('.panel-kicker')).toContainText('1 / 3 sinais')
  await page.reload()
  await page.getByRole('button', { name: 'Continuar minha jornada' }).click()
  await expect(
    page.getByRole('heading', { name: destinations[0], exact: true, level: 1 }),
  ).toBeVisible()
  await expect(page.locator('.panel-kicker')).toContainText('1 / 3 sinais')
  await expect(page.locator('.discovery-card').first()).toContainText('Investigado')
  await page.getByRole('button', { name: 'Configurações', exact: true }).click()
  await expect(settings.getByRole('checkbox', { name: /Efeitos de interação/ })).not.toBeChecked()
  await expect(settings.getByRole('checkbox', { name: /Animações de ambiente/ })).not.toBeChecked()
  await expect(settings.getByRole('slider')).toHaveValue('0.2')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Meu diário/ }).click()
  const journal = page.getByRole('dialog', { name: 'Diário do viajante' })
  await expect(journal.locator('.journal-grid .collected')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Meu diário/ })).toBeFocused()
})

test('revisão não aprova três acertos e permite estudar e tentar novamente', async ({ page }) => {
  // This separate regression fixture starts at the review. The main journey above
  // earns every unlock through the actual map and activities.
  await page.addInitScript(() =>
    localStorage.setItem(
      'cofre-sombras-v3',
      JSON.stringify({
        version: 3,
        view: 'stage',
        active: 5,
        completed: [0, 1, 2, 3, 4],
        phase: 'puzzle',
        discovered: [0, 1, 2],
        ritual: false,
        key: false,
        circle: false,
        lessons: false,
        wish: '',
        care: '',
        startedAt: Date.now(),
        endedAt: 0,
      }),
    ),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar minha jornada' }).click()
  await answerReview(page, [true, true, true, false, false])
  await expect(page.locator('.px-score')).toContainText('3/5')
  await expect(page.getByRole('button', { name: 'Recolher artefato' })).toHaveCount(0)
  await expect(page.locator('.px-review-notes p')).toHaveCount(2)
  await page.getByRole('button', { name: 'Recomeçar as cinco perguntas' }).click()
  await answerReview(page, [true, true, true, true, true])
  await expect(page.locator('.px-score-pass')).toContainText('5/5')
  await expect(page.getByRole('button', { name: 'Recolher artefato' })).toBeEnabled()
})

test('mobile: início, navegação no mapa e atividade cabem em 390 px', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Iniciar minha jornada' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Iniciar minha jornada' }).click()
  await page.getByRole('button', { name: 'Ir direto ao mapa' }).click()
  await assertNoHorizontalOverflow(page)
  await expect(page.locator('.wm-pin')).toHaveCount(6)
  await page.screenshot({ path: testInfo.outputPath('map-mobile.png'), fullPage: true })
  await enterRegion(page, 0)
  await assertNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('chapter-mobile.png'), fullPage: true })
  await investigate(page, 0)
  await expect(page.getByRole('button', { name: /^Carta \d+:/ })).toHaveCount(12)
  await assertNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('memory-mobile.png'), fullPage: true })
})
