# 🩸 HORROR MOVIE NIGHT — Caldas & Aninha ("Olhinhos")

Uma experiência interativa de terror em **Pixel Art 2D** feita especialmente para transformar a escolha do filme da noite em um verdadeiro ritual de horror gótico e romance.

---

## 🚀 1. Como Executar o Projeto

No terminal, dentro da pasta `/home/caldas/horror_site_aninha`, execute:

```bash
npm install
npm run dev
```

Depois, abra o link exibido no terminal (geralmente `http://localhost:5173`) no navegador.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

---

## 🎬 2. Como Substituir e Configurar os Filmes

Você tem **duas formas super fáceis** de colocar os filmes reais que você escolher para a Aninha:

### Opção A — Diretamente pelo Arquivo de Configuração (`src/data/movies.ts`)
Abra o arquivo [`src/data/movies.ts`](./src/data/movies.ts) e edite os objetos dentro da lista `INITIAL_MOVIES`:

- **`title`**: Nome do filme (ex: `"Hereditário"`).
- **`year`**: Ano de lançamento (ex: `2018`).
- **`duration`**: Duração (ex: `"2h 07min"`).
- **`subgenre`**: Subgênero exibido no topo do card.
- **`fearLevel`**: Nível de medo de `1` a `5` (controla os crânios amaldiçoados e a reação dos personagens quando passa o mouse).
- **`bpm`**: Batimentos por minuto exibidos no monitor cardíaco do card.
- **`tags`**: Lista de tags (`'Sobrenatural'`, `'Psicológico'`, `'Slasher'`, `'Found Footage'`, `'Religioso'`, `'Mistério'`, `'Paranormal'`, `'Folk Horror'`, `'Gótico'`).
- **`synopsis`**: Sinopse do filme.
- **`whyIChoseIt`**: **Sua nota pessoal** dizendo por que escolheu aquele filme para assistir com ela!
- **`curseWhisper`**: Frase assustadora que aparece quando ela passa o mouse sobre o card.
- **`customPosterUrl`**:
  - Coloque a imagem do pôster na pasta `public/posters/` (ex: `public/posters/filme1.jpg`) e defina `customPosterUrl: '/posters/filme1.jpg'`, **OU**
  - Cole o link direto de uma imagem da internet (`https://...`), **OU**
  - Deixe `''` (vazio) para usar a arte em Pixel Art animada exclusiva daquele card!

### Opção B — Editor Visual Dentro do Próprio Site
1. Clique no botão **"Editar Filmes"** no topo da tela (ou **"Editar Fita"** dentro do modal de qualquer filme).
2. Altere títulos, sinopses, notas românticas e links de pôsteres em tempo real.
3. Clique em **"Copiar Array para src/data/movies.ts"** se quiser colar as alterações definitivamente no código!

---

## 👩‍❤️‍👨 3. Personalização dos Personagens em Pixel Art (Vocês Dois)

Os personagens foram desenhados em Pixel Art 2D baseados na foto de vocês dois:
- **Aninha ("Olhinhos")**: Cabelo longo preto liso com franja reta (`aninha_bangs_long`), brinco prateado na orelha, casaco preto com alça de corrente prateada transversal e detalhe azul na gola.
- **Caldas**: Cabelo escuro levemente ondulado (`wavy_short`), barba curta desenhada (`short_stubble`), jaqueta de couro preta sobre camiseta branca e lampião aceso na mão.

Para personalizar a qualquer momento:
- Clique em **"Personalizar Aninha & Caldas"** no topo do cenário, **OU**
- Edite o arquivo [`src/config/coupleConfig.ts`](./src/config/coupleConfig.ts).

---

## 🕯️ 4. Lista dos 10 Easter Eggs & Segredos Escondidos

1. **Televisão de Tubo no Jardim (`O Chamado`)**: Clique na TV com estática à esquerda para sintonizar o poço amaldiçoado e o coração oculto.
2. **O Vulto Entre os Pinheiros (`A Bruxa / Bruxa de Blair`)**: Uma entidade surge entre as árvores à direita e desaparece quando você aproxima a lanterna/mouse.
3. **A Porta de Carvalho da Mansão (`Resident Evil`)**: Passe o mouse ou clique na porta principal da mansão para abri-la uma fresta e revelar olhos vermelhos na escuridão.
4. **O Retrato que Muda (`Layers of Fear / The Last Door`)**: Abra o Grimório de Segredos no topo e passe o mouse/clique sobre o retrato vitoriano.
5. **O Espelho Oxidado da Varanda (`O Iluminado — REDRUM`)**: Clique no espelho oval pendurado à direita da porta da mansão.
6. **O Telefone Preto de Disco (`O Telefone Preto / Pânico`)**: Atenda o telefone antigo no poste quando a luz vermelha piscar.
7. **A Fita VHS Enterrada (`Fita Secreta #00`)**: Clique no objeto brilhando na lama perto do caminho de pedra para desbloquear o **9º Filme Secreto** no catálogo!
8. **O Relógio Parado às 03:33 (`Invocação do Mal`)**: Clique no relógio antigo à esquerda da mansão.
9. **O Bilhete Selado com Cera Vermelha**: Clique no envelope sobre o banco de pedra à direita para abrir a carta romântica.
10. **De Mãos Dadas na Escuridão**: Clique diretamente nos personagens em pixel art para fazê-los apertar as mãos e soltar corações rubis que afastam a neblina!
