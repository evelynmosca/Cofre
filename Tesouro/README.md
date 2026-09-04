# O Cofre das Sombras

Um jogo narrativo para navegador ambientado em um pântano sobrenatural da Louisiana. Explore regiões, responda a quizzes, resolva puzzles e reúna os artefatos necessários para alcançar o Cofre das Sombras.

> Todo desejo tem um preço.

## Sobre o jogo

O jogador percorre uma jornada dividida em seis capítulos. Cada região apresenta ambientação própria, pontos investigáveis, uma pergunta narrativa e um puzzle diferente. Os artefatos e pistas obtidos ao longo da aventura são usados no ritual e nos enigmas finais.

O projeto combina uma interface 2.5D, ilustração panorâmica, animações ambientais e mecânicas acessíveis por mouse, toque ou teclado.

## Funcionalidades

- Introdução narrativa e mapa de progressão;
- seis regiões desbloqueadas sequencialmente;
- exploração de elementos do cenário;
- quizzes integrados à história;
- jogo da memória com 12 cartas e 6 pares;
- puzzle de ordenação do acordo;
- puzzle do livro proibido;
- puzzle das sombras em três rodadas;
- julgamento dos espíritos com oito situações;
- desafio de revisão antes do ritual;
- inventário com seis artefatos;
- coleção de pistas;
- ritual e enigmas finais;
- registro do desejo do jogador;
- salvamento automático no navegador;
- opção **Continuar**;
- suporte básico a teclado e leitores de tela;
- layout responsivo;
- suporte a instalação como PWA;
- funcionamento offline após o primeiro carregamento.

## Tecnologias

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- CSS responsivo
- LocalStorage
- Service Worker e Web App Manifest

## Como executar

### Requisitos

- Node.js 18 ou superior;
- npm.

Clone o repositório e entre na pasta:

```bash
git clone URL_DO_REPOSITORIO
cd Tesouro
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente:

```text
http://localhost:5173
```

No PowerShell do Windows, caso a execução de `npm.ps1` esteja bloqueada, utilize:

```powershell
npm.cmd install
npm.cmd run dev
```

## Build de produção

Gere a versão otimizada:

```bash
npm run build
```

Visualize o build localmente:

```bash
npm run preview
```

Os arquivos finais serão criados na pasta `dist`.

## Estrutura principal

```text
Tesouro/
├── public/
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── assets/
│   │   └── bayou-world-v2.png
│   ├── game/
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Progressão e salvamento

O progresso é salvo automaticamente no `localStorage` do navegador. O save registra, entre outros dados:

- fase atual;
- capítulos concluídos;
- artefatos encontrados;
- pistas descobertas;
- progresso do ritual e do Cofre;
- desejo final.

Para apagar o progresso durante o desenvolvimento, remova a chave `cofre-sombras-v2` pelo painel de armazenamento das ferramentas do navegador.

## Acessibilidade

As principais ações podem ser acessadas com `Tab`, `Enter` e `Espaço`. Informações importantes não dependem exclusivamente de cor ou animação, e a interface respeita a preferência `prefers-reduced-motion` do sistema.

## PWA e modo offline

O projeto inclui manifesto e Service Worker. Em produção, depois da primeira visita, os recursos acessados são armazenados em cache para permitir a execução offline.

Para testar corretamente a instalação e o modo offline, utilize o build de produção em `localhost` ou em uma hospedagem HTTPS.

## Direção artística

A identidade visual combina o pântano noturno da Louisiana com cartas, máscaras, fumaça violeta, madeira envelhecida e magia sobrenatural. A ilustração principal foi criada especificamente para este projeto.

## Aviso

Este é um projeto independente, experimental e sem afiliação oficial com a Disney ou outras detentoras de propriedades intelectuais mencionadas como inspiração. Personagens, marcas e obras de terceiros pertencem aos seus respectivos titulares.

## Licença

Antes de publicar ou redistribuir o projeto, adicione ao repositório uma licença compatível com o uso pretendido e com os direitos dos assets utilizados.
