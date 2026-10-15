# O Cofre das Sombras

Uma aventura narrativa de mistério pelo bayou da Louisiana. Entre ruas de Nova Orleans, uma botica, uma biblioteca escondida e as raízes de um cipreste ancestral, o jogador investiga pistas e reúne seis artefatos para abrir um cofre. Cada encontro explora uma ideia: desejo, escolha, preço e consequência.

Projeto acadêmico desenvolvido com React, TypeScript e Vite. A direção artística se inspira na atmosfera de _A Princesa e o Sapo_, no jazz de Nova Orleans e no imaginário do Homem das Sombras. A história e os desafios desta experiência são próprios do projeto; não há vínculo oficial com a Disney.

## Executar localmente

Requisitos: Node.js 22.18 ou superior e npm. O projeto também foi verificado com Node.js 26.

No terminal, dentro da pasta `Tesouro`:

```bash
npm ci
npm run dev
```

Abra o endereço que aparecer no terminal. O Vite normalmente usa `http://localhost:5173` e escolhe outra porta se ela estiver ocupada.

No Windows, se o PowerShell bloquear `npm.ps1`, use os mesmos comandos com `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run dev
```

## Jogar e apresentar

1. Inicie uma nova jornada e acompanhe a introdução.
2. Use o mapa para escolher o local disponível. As trilhas seguintes são reveladas conforme os capítulos são concluídos.
3. Investigue os três sinais do local. Os textos trazem as informações necessárias para responder à carta e resolver o desafio.
4. Guarde o artefato e retorne ao mapa. Locais concluídos podem ser revisitados sem perder os artefatos ou bloquear caminhos já abertos.
5. Depois dos seis capítulos, siga pelo mapa até o ritual, abra o cofre e registre seu desejo e como pretende realizá-lo com cuidado.

A jornada tem seis atividades diferentes:

| Local                    | Desafio                                   | Habilidade trabalhada             |
| ------------------------ | ----------------------------------------- | --------------------------------- |
| Portal das Sombras       | Memória com seis pares de cartas          | Atenção e memória visual          |
| Sala das Cartas          | Ordenação de um acordo                    | Sequência e interpretação         |
| Biblioteca do Outro Lado | Identificação de um livro por três pistas | Dedução e observação              |
| Galeria dos Espelhos     | Comparação de silhuetas em três rodadas   | Percepção de detalhes             |
| Câmara dos Espíritos     | Classificação de oito situações           | Leitura e reflexão sobre escolhas |
| Árvore das Sombras       | Revisão dos cinco encontros anteriores    | Compreensão da narrativa          |

O inventário reúne os artefatos e as pistas obtidas. Os enigmas finais retomam a ordem dos encontros e os conceitos apresentados durante o jogo. Os erros permitem uma nova tentativa.

## Build e verificações

```bash
npm run build
npm run preview
```

O build executa a verificação de tipos e gera os arquivos de produção em `dist`. O segundo comando serve essa versão para uma apresentação ou teste local. Para publicar, hospede o conteúdo de `dist` em um serviço de arquivos estáticos com HTTPS.

Os testes de progressão e salvamento usam o executor nativo do Node.js, sem dependência adicional:

```bash
npm test
```

Eles verificam desbloqueios, revisitas, ausência de recompensas duplicadas, retorno ao capítulo zero, migração de dados antigos, armazenamento indisponível e recuperação de dados corrompidos.

Os testes de navegação usam Playwright e percorrem a jornada completa pela interface, além de verificar configurações, salvamento e os seis desafios em uma tela de 390 px:

```bash
npm run test:e2e
```

O navegador usado por padrão é o Google Chrome instalado no computador. Para usar o Chromium do Playwright em outro sistema, execute `npx playwright install chromium`. O relatório navegável fica em `playwright-report/index.html`.

Para conferir o build offline, incluindo cenários, fontes e ícones:

```bash
npm run build
npm run test:offline
```

## Salvamento e privacidade

O progresso é salvo automaticamente no `localStorage` deste navegador, na chave `cofre-sombras-v3`. São guardados o local selecionado, a etapa da atividade, as investigações feitas, os capítulos concluídos, o progresso do cofre e os textos finais. As escolhas internas de um desafio em andamento podem reiniciar ao recarregar a página; a etapa alcançada permanece salva.

O botão **Continuar** recupera a jornada. Uma partida antiga na chave `cofre-sombras-v2` é migrada quando ainda não existe um salvamento da versão atual. A migração considera os capítulos efetivamente concluídos para liberar o mapa.

Os dados ficam neste dispositivo e não são enviados a um servidor. Limpar os dados do site ou usar outro navegador remove o acesso ao progresso local. Se o navegador bloquear o armazenamento, a partida continua durante a sessão.

Para reiniciar manualmente durante o desenvolvimento, remova `cofre-sombras-v3` e, se existir, `cofre-sombras-v2` nas ferramentas do navegador, em **Application → Local Storage**.

## Modo offline e instalação

A versão de produção inclui manifesto, ícones e Service Worker. A primeira abertura com conexão prepara os cenários e as fontes locais para uso offline. O jogo não depende de serviços externos durante a partida. O Service Worker só é registrado no build de produção para evitar versões antigas durante o desenvolvimento.

Para testar:

1. Execute `npm run build` e `npm run preview`.
2. Abra o jogo com conexão e aguarde o carregamento dos cenários.
3. Nas ferramentas do navegador, confirme a ativação do Service Worker em **Application → Service Workers**.
4. Ative **Offline** e recarregue a página.

A opção de instalação depende do navegador e aparece nos ambientes compatíveis. Use `localhost` ou HTTPS; abrir `dist/index.html` diretamente pelo explorador de arquivos não reproduz o funcionamento da aplicação.

## Acessibilidade

As ações principais usam botões e campos nativos, com navegação por `Tab`, `Enter` e `Espaço`. Os desafios oferecem interação por clique ou toque; as silhuetas e os livros também descrevem suas características em texto acessível. Mensagens indicam acertos e erros sem depender somente da cor. A interface respeita a preferência do sistema por movimento reduzido.

## Organização

```text
public/
  icon.svg                 Ícone do projeto
  manifest.webmanifest     Metadados de instalação
  sw.js                    Cache de produção e modo offline
src/
  assets/                  Cenários e imagens da experiência
  game/
    content.ts             Narrativa, perguntas, pistas e artefatos
    state.ts               Progressão, salvamento e migração
    state.test.ts          Testes das regras de progressão
    Puzzles.tsx            Atividades interativas
    WorldMap.tsx           Mapa navegável, rotas, zoom e deslocamento
    audio.ts               Ambientação sonora original
  main.tsx                 Entrada da aplicação
  App.tsx                  Telas e integração do jogo
  experience.css           Direção visual e responsividade
```

O estado separa o capítulo selecionado dos capítulos concluídos. O inventário deriva das conclusões, de modo que revisitar uma atividade não reduz o progresso nem duplica artefatos. O mapa é o centro da navegação, inclusive antes do ritual final.

As fontes Cormorant Garamond e Manrope ficam em `public/fonts/`, com licenças OFL e registro de origem. O script opcional `node scripts/prepare-fonts.mjs` reproduz sua preparação. Não é necessário executá-lo para iniciar ou apresentar o projeto.
