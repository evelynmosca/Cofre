# O Cofre das Sombras

Uma aventura narrativa de mistério pelo bayou da Louisiana. Explore locais inspirados em Nova Orleans, investigue pistas e reúna artefatos para abrir um cofre. O jogo foi desenvolvido com React, TypeScript e Vite.

> Projeto acadêmico independente. A direção artística se inspira na atmosfera de _A Princesa e o Sapo_, no jazz de Nova Orleans e no imaginário do Homem das Sombras. A história e os desafios são originais e não há vínculo oficial com a Disney.

## Comece do zero

### Pré-requisitos

- [Git](https://git-scm.com/downloads), para clonar o repositório.
- [Node.js 22.18 ou superior](https://nodejs.org/), que inclui o npm.

Confira se as ferramentas estão instaladas:

```bash
git --version
node --version
npm --version
```

### Clone e execute

No terminal, clone o repositório e entre na pasta do aplicativo:

```bash
git clone https://github.com/evelynmosca/Cofre.git
cd Cofre/Tesouro
```

Instale as dependências a partir do arquivo de lock e inicie o servidor de desenvolvimento:

```bash
npm ci
npm run dev
```

Abra no navegador o endereço exibido pelo Vite. Normalmente é `http://localhost:5173`; se essa porta estiver ocupada, o Vite informa outra no terminal. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

No Windows, se o PowerShell bloquear a execução de `npm.ps1`, use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run dev
```

## Comandos disponíveis

Execute estes comandos dentro de `Cofre/Tesouro`:

| Comando | Para que serve |
| --- | --- |
| `npm run dev` | Inicia o servidor local para desenvolver e jogar. |
| `npm run build` | Verifica os tipos e gera a versão de produção em `dist/`. |
| `npm run preview` | Abre localmente a versão gerada pelo build. Rode `npm run build` antes. |
| `npm test` | Executa os testes das regras de progressão e salvamento. |
| `npm run test:e2e` | Executa os testes de navegação com Playwright. |
| `npm run test:offline` | Verifica os recursos necessários para o modo offline. Rode `npm run build` antes. |

Para conferir a versão de produção localmente:

```bash
npm run build
npm run preview
```

O Vite mostrará o endereço local para abrir no navegador.

## Sobre o jogo

A jornada reúne seis atividades de memória, interpretação, dedução e observação. O mapa libera novos locais conforme os capítulos são concluídos. O progresso é salvo automaticamente no armazenamento local do navegador; não é necessário criar uma conta.

O projeto também inclui uma versão de produção preparada para instalação e uso offline. Consulte o [guia completo do projeto](Tesouro/README.md) para detalhes sobre os capítulos, acessibilidade, salvamento, modo offline e organização dos arquivos.

## Estrutura do repositório

```text
Cofre/
├── README.md             # Guia inicial exibido na página do GitHub
└── Tesouro/              # Aplicativo React, TypeScript e Vite
    ├── public/            # Ícones, manifesto, fontes e Service Worker
    ├── src/               # Interface, narrativa e regras do jogo
    ├── tests/             # Verificações do modo offline
    ├── package.json       # Comandos e dependências
    └── README.md           # Documentação detalhada do aplicativo
```
